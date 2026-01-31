using Microsoft.EntityFrameworkCore;
using Trackly.Backend.Features.Billing;
using Trackly.Backend.Features.Deliveries;
using Trackly.Backend.Infrastructure.Data;
using Trackly.Backend.Infrastructure.MultiTenancy;

namespace Trackly.Backend.Features.Orders;

public static class OrderEndpoints
{
    public static IEndpointRouteBuilder MapOrderEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/orders");

        group.MapPost("/", CreateOrder);
        group.MapPost("/import", ImportOrders);
        group.MapGet("/", GetOrders);
        group.MapGet("/stats", GetOrdersStats);
        group.MapGet("/{id:guid}", GetOrder);
        group.MapDelete("/{id:guid}", DeleteOrder);
        group.MapPost("/batch/delete", DeleteOrdersBatch);

        return app;
    }

    private static async Task<IResult> CreateOrder(
        CreateOrderRequest request,
        TracklyDbContext dbContext,
        TenantContext tenantContext,
        IBillingService billingService,
        CancellationToken cancellationToken)
    {
        if (tenantContext.TenantId == Guid.Empty)
        {
            return Results.BadRequest("TenantId manquant.");
        }

        if (string.IsNullOrWhiteSpace(request.CustomerName) || string.IsNullOrWhiteSpace(request.Address))
        {
            return Results.BadRequest("CustomerName et Address sont obligatoires.");
        }

        var canCreate = await billingService.CanCreateDeliveryAsync(tenantContext.TenantId, cancellationToken);
        if (!canCreate)
        {
            return Results.Problem(
                "Quota mensuel dépassé pour le plan Starter.",
                statusCode: StatusCodes.Status403Forbidden);
        }

        var orderDate = ParseOrderDate(request.OrderDate);
        var order = new Order
        {
            Id = Guid.NewGuid(),
            TenantId = tenantContext.TenantId,
            CustomerName = request.CustomerName.Trim(),
            Address = request.Address.Trim(),
            PhoneNumber = string.IsNullOrWhiteSpace(request.PhoneNumber) ? null : request.PhoneNumber.Trim(),
            InternalComment = string.IsNullOrWhiteSpace(request.InternalComment) ? null : request.InternalComment.Trim(),
            OrderDate = orderDate,
            Status = OrderStatus.Pending,
            CreatedAt = DateTimeOffset.UtcNow
        };

        dbContext.Orders.Add(order);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.Created($"/api/orders/{order.Id}", ToResponse(order));
    }

    private static async Task<IResult> ImportOrders(
        ImportOrdersRequest request,
        TracklyDbContext dbContext,
        TenantContext tenantContext,
        IBillingService billingService,
        CancellationToken cancellationToken)
    {
        if (tenantContext.TenantId == Guid.Empty)
        {
            return Results.BadRequest("TenantId manquant.");
        }

        if (request.Orders == null || request.Orders.Count == 0)
        {
            return Results.BadRequest("Aucune commande à importer.");
        }

        // Vérifier le quota global avant l'import
        var canCreate = await billingService.CanCreateDeliveryAsync(tenantContext.TenantId, cancellationToken);
        if (!canCreate)
        {
            return Results.Problem(
                "Quota mensuel dépassé pour le plan Starter.",
                statusCode: StatusCodes.Status403Forbidden);
        }

        var createdOrders = new List<OrderResponse>();
        var errors = new List<string>();

        foreach (var orderRequest in request.Orders)
        {
            if (string.IsNullOrWhiteSpace(orderRequest.CustomerName) || string.IsNullOrWhiteSpace(orderRequest.Address))
            {
                errors.Add($"Commande ignorée : CustomerName et Address sont obligatoires.");
                continue;
            }

            // Vérifier le quota pour chaque commande (car chaque commande peut devenir une livraison)
            var canCreateOrder = await billingService.CanCreateDeliveryAsync(tenantContext.TenantId, cancellationToken);
            if (!canCreateOrder)
            {
                errors.Add($"Quota dépassé : impossible de créer la commande pour {orderRequest.CustomerName}");
                continue;
            }

            var orderDate = ParseOrderDate(orderRequest.OrderDate);
            var order = new Order
            {
                Id = Guid.NewGuid(),
                TenantId = tenantContext.TenantId,
                CustomerName = orderRequest.CustomerName.Trim(),
                Address = orderRequest.Address.Trim(),
                PhoneNumber = string.IsNullOrWhiteSpace(orderRequest.PhoneNumber) ? null : orderRequest.PhoneNumber.Trim(),
                InternalComment = string.IsNullOrWhiteSpace(orderRequest.InternalComment) ? null : orderRequest.InternalComment.Trim(),
                OrderDate = orderDate,
                Status = OrderStatus.Pending,
                CreatedAt = DateTimeOffset.UtcNow
            };

            dbContext.Orders.Add(order);
            createdOrders.Add(ToResponse(order));
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.Ok(new ImportOrdersResponse
        {
            Created = createdOrders.Count,
            Errors = errors,
            Orders = createdOrders
        });
    }

    /// <summary>
    /// Filtres optionnels : dateFrom, dateTo (ISO 8601), dateFilter = "CreatedAt" | "OrderDate", search = texte (client, adresse, téléphone, commentaire).
    /// </summary>
    private static async Task<IResult> GetOrders(
        TracklyDbContext dbContext,
        TenantContext tenantContext,
        DateTimeOffset? dateFrom,
        DateTimeOffset? dateTo,
        string? dateFilter,
        string? search,
        CancellationToken cancellationToken)
    {
        if (tenantContext.TenantId == Guid.Empty)
        {
            return Results.BadRequest("TenantId manquant.");
        }

        var query = dbContext.Orders
            .AsNoTracking()
            .Where(o => o.TenantId == tenantContext.TenantId && o.DeletedAt == null);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLowerInvariant();
            query = query.Where(o =>
                (o.CustomerName != null && o.CustomerName.ToLower().Contains(term)) ||
                (o.Address != null && o.Address.ToLower().Contains(term)) ||
                (o.PhoneNumber != null && o.PhoneNumber.ToLower().Contains(term)) ||
                (o.InternalComment != null && o.InternalComment.ToLower().Contains(term)));
        }

        var useOrderDate = string.Equals(dateFilter, "OrderDate", StringComparison.OrdinalIgnoreCase);

        if (dateFrom.HasValue)
        {
            if (useOrderDate)
                query = query.Where(o => o.OrderDate != null && o.OrderDate.Value >= dateFrom.Value);
            else
                query = query.Where(o => o.CreatedAt >= dateFrom.Value);
        }

        if (dateTo.HasValue)
        {
            if (useOrderDate)
                query = query.Where(o => o.OrderDate != null && o.OrderDate.Value <= dateTo.Value);
            else
                query = query.Where(o => o.CreatedAt <= dateTo.Value);
        }

        var orders = await query
            .OrderByDescending(order => order.CreatedAt)
            .Select(order => ToResponse(order))
            .ToListAsync(cancellationToken);

        return Results.Ok(orders);
    }

    /// <summary>
    /// Stats pour le graphique : ByDay si plage multi-jours, ByHour si un seul jour.
    /// Filtres : dateFrom, dateTo (ISO 8601), dateFilter = "CreatedAt" | "OrderDate".
    /// </summary>
    private static async Task<IResult> GetOrdersStats(
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

        var query = dbContext.Orders
            .AsNoTracking()
            .Where(o => o.TenantId == tenantContext.TenantId && o.DeletedAt == null);

        var useOrderDate = string.Equals(dateFilter, "OrderDate", StringComparison.OrdinalIgnoreCase);

        if (dateFrom.HasValue)
        {
            if (useOrderDate)
                query = query.Where(o => o.OrderDate != null && o.OrderDate.Value >= dateFrom.Value);
            else
                query = query.Where(o => o.CreatedAt >= dateFrom.Value);
        }

        if (dateTo.HasValue)
        {
            if (useOrderDate)
                query = query.Where(o => o.OrderDate != null && o.OrderDate.Value <= dateTo.Value);
            else
                query = query.Where(o => o.CreatedAt <= dateTo.Value);
        }

        if (!dateFrom.HasValue || !dateTo.HasValue)
        {
            return Results.Ok(new OrderStatsResponse());
        }

        var singleDay = dateFrom.Value.UtcDateTime.Date == dateTo.Value.UtcDateTime.Date;

        if (singleDay)
        {
            var byHour = await query
                .Select(o => useOrderDate ? o.OrderDate!.Value.Hour : o.CreatedAt.Hour)
                .ToListAsync(cancellationToken);
            var hourCounts = Enumerable.Range(0, 24)
                .Select(h => new OrderCountByHour($"{h:D2}:00", byHour.Count(x => x == h)))
                .ToList();
            return Results.Ok(new OrderStatsResponse { ByHour = hourCounts });
        }

        var ordersForDay = await query
            .Select(o => useOrderDate ? o.OrderDate!.Value.Date : o.CreatedAt.Date)
            .ToListAsync(cancellationToken);
        var countByDate = ordersForDay
            .GroupBy(d => d)
            .ToDictionary(g => g.Key, g => g.Count());
        var start = dateFrom!.Value.UtcDateTime.Date;
        var end = dateTo!.Value.UtcDateTime.Date;
        var byDay = new List<OrderCountByDay>();
        for (var d = start; d <= end; d = d.AddDays(1))
        {
            var key = d.ToString("yyyy-MM-dd");
            var count = countByDate.TryGetValue(d, out var c) ? c : 0;
            byDay.Add(new OrderCountByDay(key, count));
        }
        return Results.Ok(new OrderStatsResponse { ByDay = byDay });
    }

    private static async Task<IResult> GetOrder(
        Guid id,
        TracklyDbContext dbContext,
        TenantContext tenantContext,
        CancellationToken cancellationToken)
    {
        if (tenantContext.TenantId == Guid.Empty)
        {
            return Results.BadRequest("TenantId manquant.");
        }

        var order = await dbContext.Orders
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.Id == id && o.TenantId == tenantContext.TenantId && o.DeletedAt == null, cancellationToken);

        if (order == null)
        {
            return Results.NotFound("Commande introuvable.");
        }

        // Récupérer les livraisons associées
        var deliveries = await dbContext.Deliveries
            .AsNoTracking()
            .Where(d => d.OrderId == id && d.DeletedAt == null)
            .OrderByDescending(d => d.CreatedAt)
            .Select(d => new
            {
                d.Id,
                d.DriverId,
                d.Status,
                d.CreatedAt,
                d.CompletedAt
            })
            .ToListAsync(cancellationToken);

        // Récupérer les informations des drivers
        var driverIds = deliveries.Select(d => d.DriverId).Distinct().ToList();
        var drivers = driverIds.Count > 0
            ? await dbContext.Drivers
                .AsNoTracking()
                .Where(d => driverIds.Contains(d.Id))
                .ToDictionaryAsync(d => d.Id, d => d.Name, cancellationToken)
            : new Dictionary<Guid, string>();

        var deliveriesWithDriver = deliveries.Select(d => new OrderDeliveryInfo(
            d.Id,
            d.DriverId,
            d.Status,
            d.CreatedAt,
            d.CompletedAt,
            drivers.GetValueOrDefault(d.DriverId, "Inconnu"))).ToList();

        return Results.Ok(new OrderDetailResponse(
            order.Id,
            order.CustomerName,
            order.Address,
            order.PhoneNumber,
            order.InternalComment,
            order.OrderDate,
            order.Status,
            order.CreatedAt,
            deliveriesWithDriver));
    }

    private static async Task<IResult> DeleteOrder(
        Guid id,
        TracklyDbContext dbContext,
        TenantContext tenantContext,
        CancellationToken cancellationToken)
    {
        if (tenantContext.TenantId == Guid.Empty)
        {
            return Results.BadRequest("TenantId manquant.");
        }

        var order = await dbContext.Orders
            .FirstOrDefaultAsync(o => o.Id == id && o.TenantId == tenantContext.TenantId, cancellationToken);

        if (order == null)
        {
            return Results.NotFound("Commande introuvable.");
        }

        if (order.DeletedAt != null)
        {
            return Results.BadRequest("Cette commande est déjà supprimée.");
        }

        // Vérifier les livraisons actives
        var activeDeliveries = await dbContext.Deliveries
            .AsNoTracking()
            .Where(d => d.OrderId == id && d.DeletedAt == null)
            .CountAsync(cancellationToken);

        if (activeDeliveries > 0)
        {
            return Results.Problem(
                $"Impossible de supprimer cette commande : {activeDeliveries} livraison(s) active(s) associée(s). Supprimez d'abord les livraisons ou utilisez la suppression en cascade.",
                statusCode: StatusCodes.Status409Conflict);
        }

        // Soft delete
        order.DeletedAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.Ok(new { message = "Commande supprimée avec succès." });
    }

    private static async Task<IResult> DeleteOrdersBatch(
        DeleteOrdersBatchRequest request,
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
            return Results.BadRequest("Aucune commande sélectionnée.");
        }

        var orders = await dbContext.Orders
            .Where(o => request.Ids.Contains(o.Id) && o.TenantId == tenantContext.TenantId && o.DeletedAt == null)
            .ToListAsync(cancellationToken);

        if (orders.Count == 0)
        {
            return Results.NotFound("Aucune commande trouvée à supprimer.");
        }

        // Vérifier les livraisons actives pour chaque commande
        var ordersWithDeliveries = new List<Guid>();
        var ordersToDelete = new List<Order>();

        foreach (var order in orders)
        {
            var activeDeliveries = await dbContext.Deliveries
                .AsNoTracking()
                .Where(d => d.OrderId == order.Id && d.DeletedAt == null)
                .CountAsync(cancellationToken);

            if (activeDeliveries > 0)
            {
                ordersWithDeliveries.Add(order.Id);
            }
            else
            {
                ordersToDelete.Add(order);
            }
        }

        // Si certaines commandes ont des livraisons actives
        if (ordersWithDeliveries.Count > 0 && !request.ForceDeleteDeliveries)
        {
            return Results.Problem(
                $"{ordersWithDeliveries.Count} commande(s) ont des livraisons actives. Utilisez 'forceDeleteDeliveries: true' pour supprimer aussi les livraisons.",
                statusCode: StatusCodes.Status409Conflict,
                extensions: new Dictionary<string, object?>
                {
                    ["ordersWithDeliveries"] = ordersWithDeliveries
                });
        }

        var now = DateTimeOffset.UtcNow;
        var deletedDeliveriesCount = 0;

        // Supprimer les commandes
        foreach (var order in ordersToDelete)
        {
            order.DeletedAt = now;
        }

        // Si forceDeleteDeliveries est activé, supprimer aussi les livraisons
        if (request.ForceDeleteDeliveries && ordersWithDeliveries.Count > 0)
        {
            var deliveriesToDelete = await dbContext.Deliveries
                .Where(d => ordersWithDeliveries.Contains(d.OrderId) && d.DeletedAt == null)
                .ToListAsync(cancellationToken);

            foreach (var delivery in deliveriesToDelete)
            {
                delivery.DeletedAt = now;
            }

            deletedDeliveriesCount = deliveriesToDelete.Count;

            // Supprimer aussi les commandes avec livraisons
            foreach (var orderId in ordersWithDeliveries)
            {
                var order = orders.First(o => o.Id == orderId);
                order.DeletedAt = now;
            }
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.Ok(new DeleteOrdersBatchResponse
        {
            Deleted = ordersToDelete.Count + (request.ForceDeleteDeliveries ? ordersWithDeliveries.Count : 0),
            DeletedDeliveries = deletedDeliveriesCount,
            Skipped = request.ForceDeleteDeliveries ? 0 : ordersWithDeliveries.Count,
            Message = $"{(ordersToDelete.Count + (request.ForceDeleteDeliveries ? ordersWithDeliveries.Count : 0))} commande(s) supprimée(s)." +
                     (deletedDeliveriesCount > 0 ? $" {deletedDeliveriesCount} livraison(s) supprimée(s) en cascade." : "")
        });
    }

    private static OrderResponse ToResponse(Order order) =>
        new(order.Id, order.CustomerName, order.Address, order.PhoneNumber, order.InternalComment, order.OrderDate, order.Status, order.CreatedAt);

    /// <summary>
    /// Parse la date/heure et retourne toujours un DateTimeOffset en UTC (requis par Npgsql).
    /// </summary>
    private static DateTimeOffset? ParseOrderDate(string? orderDateStr)
    {
        if (string.IsNullOrWhiteSpace(orderDateStr)) return null;
        if (DateTimeOffset.TryParse(orderDateStr, null, System.Globalization.DateTimeStyles.AssumeUniversal | System.Globalization.DateTimeStyles.AdjustToUniversal, out var dt))
            return ToUtc(dt);
        if (DateTimeOffset.TryParse(orderDateStr, out var dtLocal))
            return ToUtc(dtLocal);
        if (DateOnly.TryParse(orderDateStr, out var d))
            return new DateTimeOffset(d.ToDateTime(TimeOnly.MinValue), TimeSpan.Zero);
        return null;
    }

    private static DateTimeOffset ToUtc(DateTimeOffset value)
    {
        var utc = value.UtcDateTime;
        return new DateTimeOffset(utc.Ticks, TimeSpan.Zero);
    }
}
