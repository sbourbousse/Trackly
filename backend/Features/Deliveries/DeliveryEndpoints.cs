using Microsoft.EntityFrameworkCore;
using Trackly.Backend.Features.Billing;
using Trackly.Backend.Features.Orders;
using Trackly.Backend.Infrastructure.Data;
using Trackly.Backend.Infrastructure.MultiTenancy;

namespace Trackly.Backend.Features.Deliveries;

public static class DeliveryEndpoints
{
    public static IEndpointRouteBuilder MapDeliveryEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/deliveries");

        group.MapGet("/", GetDeliveries);
        group.MapGet("/stats", GetDeliveriesStats);
        group.MapGet("/{id:guid}", GetDelivery);
        group.MapPost("/", CreateDelivery);
        group.MapPost("/batch", CreateDeliveriesBatch);
        group.MapPatch("/{id:guid}/start", StartDelivery);
        group.MapPatch("/{id:guid}/complete", CompleteDelivery);
        group.MapDelete("/{id:guid}", DeleteDelivery);
        group.MapPost("/batch/delete", DeleteDeliveriesBatch);
        group.MapGet("/{id:guid}/tracking", GetTracking);

        return app;
    }

    /// <summary>
    /// Filtres optionnels : dateFrom, dateTo (ISO 8601), dateFilter = "CreatedAt" | "OrderDate", routeId (tournée), driverId (chauffeur).
    /// OrderDate filtre sur la date de la commande associée. driverId utilisé par l'app chauffeur.
    /// </summary>
    private static async Task<IResult> GetDeliveries(
        TracklyDbContext dbContext,
        TenantContext tenantContext,
        DateTimeOffset? dateFrom,
        DateTimeOffset? dateTo,
        string? dateFilter,
        Guid? routeId,
        Guid? driverId,
        CancellationToken cancellationToken)
    {
        if (tenantContext.TenantId == Guid.Empty)
        {
            return Results.BadRequest("TenantId manquant.");
        }

        var useOrderDate = string.Equals(dateFilter, "OrderDate", StringComparison.OrdinalIgnoreCase);

        IQueryable<Delivery> query = dbContext.Deliveries
            .AsNoTracking()
            .Where(d => d.TenantId == tenantContext.TenantId && d.DeletedAt == null);

        if (routeId.HasValue && routeId.Value != Guid.Empty)
            query = query.Where(d => d.RouteId == routeId.Value);
        if (driverId.HasValue && driverId.Value != Guid.Empty)
            query = query.Where(d => d.DriverId == driverId.Value);

        if (useOrderDate && (dateFrom.HasValue || dateTo.HasValue))
        {
            query = query.Join(
                dbContext.Orders,
                d => d.OrderId,
                o => o.Id,
                (d, o) => new { Delivery = d, Order = o })
                .Where(x => x.Order.DeletedAt == null)
                .Where(x => x.Order.OrderDate != null
                    && (!dateFrom.HasValue || x.Order.OrderDate.Value >= dateFrom.Value)
                    && (!dateTo.HasValue || x.Order.OrderDate.Value <= dateTo.Value))
                .Select(x => x.Delivery);
        }
        else if (!useOrderDate)
        {
            if (dateFrom.HasValue)
                query = query.Where(d => d.CreatedAt >= dateFrom.Value);
            if (dateTo.HasValue)
                query = query.Where(d => d.CreatedAt <= dateTo.Value);
        }

        // Ordre par tournée puis sequence (app chauffeur ou détail tournée) ; sinon par date
        var orderedQuery = (routeId.HasValue && routeId.Value != Guid.Empty) || (driverId.HasValue && driverId.Value != Guid.Empty)
            ? query.OrderBy(d => d.RouteId ?? Guid.Empty).ThenBy(d => d.Sequence ?? int.MaxValue).ThenBy(d => d.CreatedAt)
            : query.OrderByDescending(d => d.CreatedAt);

        var deliveries = await orderedQuery
            .Select(d => ToResponse(d))
            .ToListAsync(cancellationToken);

        return Results.Ok(deliveries);
    }

    /// <summary>
    /// Stats pour le graphique : ByDay si plage multi-jours, ByHour si un seul jour.
    /// Filtres : dateFrom, dateTo (ISO 8601), dateFilter = "CreatedAt" | "OrderDate".
    /// OrderDate filtre sur la date de la commande associée.
    /// </summary>
    private static async Task<IResult> GetDeliveriesStats(
        TracklyDbContext dbContext,
        TenantContext tenantContext,
        DateTimeOffset? dateFrom,
        DateTimeOffset? dateTo,
        string? dateFilter,
        CancellationToken cancellationToken)
    {
        if (tenantContext.TenantId == Guid.Empty)
        {
            return Results.BadRequest("TenantId manquant.");
        }

        var useOrderDate = string.Equals(dateFilter, "OrderDate", StringComparison.OrdinalIgnoreCase);

        if (!dateFrom.HasValue || !dateTo.HasValue)
        {
            return Results.Ok(new DeliveryStatsResponse());
        }

        var singleDay = dateFrom.Value.UtcDateTime.Date == dateTo.Value.UtcDateTime.Date;

        if (useOrderDate)
        {
            // Filtrer sur Order.OrderDate : join avec Orders
            var query = dbContext.Deliveries
                .AsNoTracking()
                .Where(d => d.TenantId == tenantContext.TenantId && d.DeletedAt == null)
                .Join(
                    dbContext.Orders,
                    d => d.OrderId,
                    o => o.Id,
                    (d, o) => new { Delivery = d, Order = o })
                .Where(x => x.Order.DeletedAt == null)
                .Where(x => x.Order.OrderDate != null
                    && x.Order.OrderDate.Value >= dateFrom.Value
                    && x.Order.OrderDate.Value <= dateTo.Value);

            if (singleDay)
            {
                var byHour = await query
                    .Select(x => x.Order.OrderDate!.Value.Hour)
                    .ToListAsync(cancellationToken);
                var hourCounts = Enumerable.Range(0, 24)
                    .Select(h => new DeliveryCountByHour($"{h:D2}:00", byHour.Count(x => x == h)))
                    .ToList();
                return Results.Ok(new DeliveryStatsResponse { ByHour = hourCounts });
            }

            var deliveriesForDay = await query
                .Select(x => x.Order.OrderDate!.Value.Date)
                .ToListAsync(cancellationToken);
            var countByDate = deliveriesForDay
                .GroupBy(d => d)
                .ToDictionary(g => g.Key, g => g.Count());
            var start = dateFrom.Value.UtcDateTime.Date;
            var end = dateTo.Value.UtcDateTime.Date;
            var byDay = new List<DeliveryCountByDay>();
            for (var d = start; d <= end; d = d.AddDays(1))
            {
                var key = d.ToString("yyyy-MM-dd");
                var count = countByDate.TryGetValue(d, out var c) ? c : 0;
                byDay.Add(new DeliveryCountByDay(key, count));
            }
            return Results.Ok(new DeliveryStatsResponse { ByDay = byDay });
        }
        else
        {
            // Filtrer sur Delivery.CreatedAt
            var query = dbContext.Deliveries
                .AsNoTracking()
                .Where(d => d.TenantId == tenantContext.TenantId && d.DeletedAt == null)
                .Where(d => d.CreatedAt >= dateFrom.Value && d.CreatedAt <= dateTo.Value);

            if (singleDay)
            {
                var byHour = await query
                    .Select(d => d.CreatedAt.Hour)
                    .ToListAsync(cancellationToken);
                var hourCounts = Enumerable.Range(0, 24)
                    .Select(h => new DeliveryCountByHour($"{h:D2}:00", byHour.Count(x => x == h)))
                    .ToList();
                return Results.Ok(new DeliveryStatsResponse { ByHour = hourCounts });
            }

            var deliveriesForDay = await query
                .Select(d => d.CreatedAt.Date)
                .ToListAsync(cancellationToken);
            var countByDate = deliveriesForDay
                .GroupBy(d => d)
                .ToDictionary(g => g.Key, g => g.Count());
            var start = dateFrom.Value.UtcDateTime.Date;
            var end = dateTo.Value.UtcDateTime.Date;
            var byDay = new List<DeliveryCountByDay>();
            for (var d = start; d <= end; d = d.AddDays(1))
            {
                var key = d.ToString("yyyy-MM-dd");
                var count = countByDate.TryGetValue(d, out var c) ? c : 0;
                byDay.Add(new DeliveryCountByDay(key, count));
            }
            return Results.Ok(new DeliveryStatsResponse { ByDay = byDay });
        }
    }

    private static async Task<IResult> GetDelivery(
        Guid id,
        TracklyDbContext dbContext,
        TenantContext tenantContext,
        CancellationToken cancellationToken)
    {
        if (tenantContext.TenantId == Guid.Empty)
        {
            return Results.BadRequest("TenantId manquant.");
        }

        var delivery = await dbContext.Deliveries
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.Id == id && d.TenantId == tenantContext.TenantId && d.DeletedAt == null, cancellationToken);

        if (delivery == null)
        {
            return Results.NotFound("Livraison introuvable.");
        }

        // Récupérer l'ordre associé
        var order = await dbContext.Orders
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.Id == delivery.OrderId && o.DeletedAt == null, cancellationToken);

        // Récupérer le driver
        var driver = await dbContext.Drivers
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.Id == delivery.DriverId, cancellationToken);

        return Results.Ok(new DeliveryDetailResponse(
            delivery.Id,
            delivery.OrderId,
            delivery.DriverId,
            delivery.RouteId,
            delivery.Sequence,
            delivery.Status,
            delivery.CreatedAt,
            delivery.CompletedAt,
            order?.CustomerName ?? "Inconnu",
            order?.Address ?? "Adresse inconnue",
            driver?.Name ?? "Non assigné"
        ));
    }

    private static async Task<IResult> CreateDelivery(
        CreateDeliveryRequest request,
        TracklyDbContext dbContext,
        TenantContext tenantContext,
        IBillingService billingService,
        CancellationToken cancellationToken)
    {
        if (tenantContext.TenantId == Guid.Empty)
        {
            return Results.BadRequest("TenantId manquant.");
        }

        var canCreate = await billingService.CanCreateDeliveryAsync(tenantContext.TenantId, cancellationToken);
        if (!canCreate)
        {
            return Results.Problem(
                "Quota mensuel dépassé pour le plan Starter.",
                statusCode: StatusCodes.Status403Forbidden);
        }

        var orderExists = await dbContext.Orders
            .AsNoTracking()
            .AnyAsync(order => order.Id == request.OrderId, cancellationToken);

        if (!orderExists)
        {
            return Results.NotFound("Commande introuvable.");
        }

        var driverExists = await dbContext.Drivers
            .AsNoTracking()
            .AnyAsync(driver => driver.Id == request.DriverId, cancellationToken);

        if (!driverExists)
        {
            return Results.NotFound("Livreur introuvable.");
        }

        var delivery = new Delivery
        {
            Id = Guid.NewGuid(),
            TenantId = tenantContext.TenantId,
            OrderId = request.OrderId,
            DriverId = request.DriverId,
            Status = DeliveryStatus.Pending,
            CreatedAt = DateTimeOffset.UtcNow
        };

        dbContext.Deliveries.Add(delivery);
        await dbContext.SaveChangesAsync(cancellationToken);

        // Mettre à jour le statut de la commande associée
        await OrderStatusService.UpdateOrderStatusOnDeliveryCreatedAsync(
            request.OrderId,
            dbContext,
            cancellationToken);

        return Results.Created($"/api/deliveries/{delivery.Id}", ToResponse(delivery));
    }

    private static async Task<IResult> CreateDeliveriesBatch(
        CreateDeliveriesBatchRequest request,
        TracklyDbContext dbContext,
        TenantContext tenantContext,
        IBillingService billingService,
        CancellationToken cancellationToken)
    {
        if (tenantContext.TenantId == Guid.Empty)
        {
            return Results.BadRequest("TenantId manquant.");
        }

        if (request.OrderIds == null || request.OrderIds.Count == 0)
        {
            return Results.BadRequest("Aucune commande sélectionnée.");
        }

        if (request.DriverId == Guid.Empty)
        {
            return Results.BadRequest("DriverId manquant.");
        }

        // Vérifier que le driver existe
        var driverExists = await dbContext.Drivers
            .AsNoTracking()
            .AnyAsync(driver => driver.Id == request.DriverId, cancellationToken);

        if (!driverExists)
        {
            return Results.NotFound("Livreur introuvable.");
        }

        // Vérifier que toutes les commandes existent et sont en attente
        var orders = await dbContext.Orders
            .AsNoTracking()
            .Where(o => request.OrderIds.Contains(o.Id) && o.TenantId == tenantContext.TenantId)
            .ToListAsync(cancellationToken);

        if (orders.Count != request.OrderIds.Count)
        {
            return Results.BadRequest("Certaines commandes sont introuvables ou n'appartiennent pas à ce tenant.");
        }

        // Vérifier le quota global
        var canCreate = await billingService.CanCreateDeliveryAsync(tenantContext.TenantId, cancellationToken);
        if (!canCreate)
        {
            return Results.Problem(
                "Quota mensuel dépassé pour le plan Starter.",
                statusCode: StatusCodes.Status403Forbidden);
        }

        // Créer une tournée (Route) pour ce batch
        var route = new Route
        {
            Id = Guid.NewGuid(),
            TenantId = tenantContext.TenantId,
            DriverId = request.DriverId,
            Name = string.IsNullOrWhiteSpace(request.Name) ? null : request.Name.Trim(),
            CreatedAt = DateTimeOffset.UtcNow
        };
        dbContext.Routes.Add(route);

        var deliveries = new List<Delivery>();
        var createdDeliveries = new List<DeliveryResponse>();
        var sequence = 0;

        foreach (var orderId in request.OrderIds)
        {
            // Vérifier le quota pour chaque livraison
            var canCreateDelivery = await billingService.CanCreateDeliveryAsync(tenantContext.TenantId, cancellationToken);
            if (!canCreateDelivery)
            {
                continue; // Skip cette livraison si quota dépassé
            }

            var delivery = new Delivery
            {
                Id = Guid.NewGuid(),
                TenantId = tenantContext.TenantId,
                OrderId = orderId,
                DriverId = request.DriverId,
                RouteId = route.Id,
                Sequence = sequence++,
                Status = DeliveryStatus.Pending,
                CreatedAt = DateTimeOffset.UtcNow
            };

            deliveries.Add(delivery);
        }

        if (deliveries.Count == 0)
        {
            return Results.Problem(
                "Aucune livraison créée. Quota mensuel dépassé.",
                statusCode: StatusCodes.Status403Forbidden);
        }

        dbContext.Deliveries.AddRange(deliveries);
        await dbContext.SaveChangesAsync(cancellationToken);

        // Mettre à jour le statut de chaque commande concernée
        var orderIds = request.OrderIds.Distinct().ToList();
        foreach (var orderId in orderIds)
        {
            await OrderStatusService.UpdateOrderStatusOnDeliveryCreatedAsync(
                orderId,
                dbContext,
                cancellationToken);
        }

        createdDeliveries = deliveries.Select(ToResponse).ToList();

        return Results.Ok(new CreateDeliveriesBatchResponse
        {
            Created = createdDeliveries.Count,
            Deliveries = createdDeliveries
        });
    }

    /// <summary>
    /// Passe une livraison en "en cours" (InProgress). Appelé par l'app chauffeur au clic sur "Démarrer suivi".
    /// </summary>
    private static async Task<IResult> StartDelivery(
        Guid id,
        TracklyDbContext dbContext,
        TenantContext tenantContext,
        CancellationToken cancellationToken)
    {
        if (tenantContext.TenantId == Guid.Empty)
        {
            return Results.BadRequest("TenantId manquant.");
        }

        var delivery = await dbContext.Deliveries
            .FirstOrDefaultAsync(d => d.Id == id && d.TenantId == tenantContext.TenantId && d.DeletedAt == null, cancellationToken);

        if (delivery == null)
        {
            return Results.NotFound("Livraison introuvable.");
        }

        if (delivery.Status == DeliveryStatus.Pending)
        {
            delivery.Status = DeliveryStatus.InProgress;
            await dbContext.SaveChangesAsync(cancellationToken);
            await OrderStatusService.UpdateOrderStatusAsync(delivery.OrderId, dbContext, cancellationToken);
        }

        return Results.Ok(ToResponse(delivery));
    }

    private static async Task<IResult> CompleteDelivery(
        Guid id,
        TracklyDbContext dbContext,
        TenantContext tenantContext,
        CancellationToken cancellationToken)
    {
        if (tenantContext.TenantId == Guid.Empty)
        {
            return Results.BadRequest("TenantId manquant.");
        }

        var delivery = await dbContext.Deliveries
            .FirstOrDefaultAsync(current => current.Id == id && current.TenantId == tenantContext.TenantId && current.DeletedAt == null, cancellationToken);

        if (delivery == null)
        {
            return Results.NotFound("Livraison introuvable.");
        }

        delivery.Status = DeliveryStatus.Completed;
        delivery.CompletedAt = DateTimeOffset.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);

        // Mettre à jour automatiquement le statut de la commande associée
        await OrderStatusService.UpdateOrderStatusAsync(
            delivery.OrderId,
            dbContext,
            cancellationToken);

        return Results.Ok(ToResponse(delivery));
    }

    private static async Task<IResult> DeleteDelivery(
        Guid id,
        TracklyDbContext dbContext,
        TenantContext tenantContext,
        CancellationToken cancellationToken)
    {
        if (tenantContext.TenantId == Guid.Empty)
        {
            return Results.BadRequest("TenantId manquant.");
        }

        var delivery = await dbContext.Deliveries
            .FirstOrDefaultAsync(d => d.Id == id && d.TenantId == tenantContext.TenantId, cancellationToken);

        if (delivery == null)
        {
            return Results.NotFound("Livraison introuvable.");
        }

        if (delivery.DeletedAt != null)
        {
            return Results.BadRequest("Cette livraison est déjà supprimée.");
        }

        var orderId = delivery.OrderId;
        // Soft delete
        delivery.DeletedAt = DateTimeOffset.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);

        // Réévaluer le statut de la commande après suppression de la livraison
        await OrderStatusService.UpdateOrderStatusAsync(
            orderId,
            dbContext,
            cancellationToken);

        return Results.Ok(new { message = "Livraison supprimée avec succès." });
    }

    private static async Task<IResult> DeleteDeliveriesBatch(
        DeleteDeliveriesBatchRequest request,
        TracklyDbContext dbContext,
        TenantContext tenantContext,
        CancellationToken cancellationToken)
    {
        if (tenantContext.TenantId == Guid.Empty)
        {
            return Results.BadRequest("TenantId manquant.");
        }

        if (request.Ids == null || request.Ids.Count == 0)
        {
            return Results.BadRequest("Aucune livraison sélectionnée.");
        }

        var deliveries = await dbContext.Deliveries
            .Where(d => request.Ids.Contains(d.Id) && d.TenantId == tenantContext.TenantId && d.DeletedAt == null)
            .ToListAsync(cancellationToken);

        if (deliveries.Count == 0)
        {
            return Results.NotFound("Aucune livraison trouvée à supprimer.");
        }

        // Récupérer les IDs des commandes concernées avant suppression
        var orderIds = deliveries.Select(d => d.OrderId).Distinct().ToList();

        var now = DateTimeOffset.UtcNow;
        foreach (var delivery in deliveries)
        {
            delivery.DeletedAt = now;
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        // Réévaluer le statut de chaque commande concernée
        foreach (var orderId in orderIds)
        {
            await OrderStatusService.UpdateOrderStatusAsync(
                orderId,
                dbContext,
                cancellationToken);
        }

        return Results.Ok(new DeleteDeliveriesBatchResponse
        {
            Deleted = deliveries.Count,
            Message = $"{deliveries.Count} livraison(s) supprimée(s) avec succès."
        });
    }

    private static async Task<IResult> GetTracking(
        Guid id,
        TracklyDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var delivery = await dbContext.Deliveries
            .AsNoTracking()
            .FirstOrDefaultAsync(current => current.Id == id && current.DeletedAt == null, cancellationToken);

        if (delivery == null)
        {
            return Results.NotFound("Livraison introuvable.");
        }

        return Results.Ok(new DeliveryTrackingResponse(delivery.Id, delivery.Status, delivery.CompletedAt));
    }

    private static DeliveryResponse ToResponse(Delivery delivery) =>
        new(
            delivery.Id,
            delivery.OrderId,
            delivery.DriverId,
            delivery.RouteId,
            delivery.Sequence,
            delivery.Status,
            delivery.CreatedAt,
            delivery.CompletedAt);

    /// <summary>
    /// Endpoint PUBLIC pour le tracking client (sans authentification tenant).
    /// Utilisé par l'application frontend-tracking pour les clients finaux.
    /// </summary>
    public static async Task<IResult> GetPublicTracking(
        Guid id,
        TracklyDbContext dbContext,
        CancellationToken cancellationToken)
    {
        // IgnoreQueryFilters() pour accéder aux livraisons sans filtre de tenant (endpoint public)
        var delivery = await dbContext.Deliveries
            .IgnoreQueryFilters()
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.Id == id && d.DeletedAt == null, cancellationToken);

        if (delivery == null)
        {
            return Results.NotFound(new { error = "Livraison introuvable." });
        }

        // Récupérer l'ordre et le driver séparément
        var order = await dbContext.Orders
            .IgnoreQueryFilters()
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.Id == delivery.OrderId && o.DeletedAt == null, cancellationToken);

        var driver = await dbContext.Drivers
            .IgnoreQueryFilters()
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.Id == delivery.DriverId, cancellationToken);

        // Retourne les informations nécessaires pour le client final
        return Results.Ok(new
        {
            id = delivery.Id,
            status = delivery.Status.ToString(),
            completedAt = delivery.CompletedAt,
            customerName = order?.CustomerName ?? "Client",
            address = order?.Address ?? "Adresse non disponible",
            driverName = driver?.Name ?? "Livreur",
            driverPhone = driver?.Phone,
            sequence = delivery.Sequence,
            createdAt = delivery.CreatedAt
        });
    }
}
