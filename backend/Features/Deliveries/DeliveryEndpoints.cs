using Microsoft.EntityFrameworkCore;
using Trackly.Backend.Features.Billing;
using Trackly.Backend.Infrastructure.Data;
using Trackly.Backend.Infrastructure.MultiTenancy;

namespace Trackly.Backend.Features.Deliveries;

public static class DeliveryEndpoints
{
    public static IEndpointRouteBuilder MapDeliveryEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/deliveries");

        group.MapGet("/", GetDeliveries);
        group.MapGet("/{id:guid}", GetDelivery);
        group.MapPost("/", CreateDelivery);
        group.MapPost("/batch", CreateDeliveriesBatch);
        group.MapPatch("/{id:guid}/complete", CompleteDelivery);
        group.MapDelete("/{id:guid}", DeleteDelivery);
        group.MapPost("/batch/delete", DeleteDeliveriesBatch);
        group.MapGet("/{id:guid}/tracking", GetTracking);

        return app;
    }

    private static async Task<IResult> GetDeliveries(
        TracklyDbContext dbContext,
        TenantContext tenantContext,
        CancellationToken cancellationToken)
    {
        if (tenantContext.TenantId == Guid.Empty)
        {
            return Results.BadRequest("TenantId manquant.");
        }

        var deliveries = await dbContext.Deliveries
            .AsNoTracking()
            .Where(d => d.TenantId == tenantContext.TenantId && d.DeletedAt == null)
            .OrderByDescending(d => d.CreatedAt)
            .Select(d => ToResponse(d))
            .ToListAsync(cancellationToken);

        return Results.Ok(deliveries);
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

        var deliveries = new List<Delivery>();
        var createdDeliveries = new List<DeliveryResponse>();

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

        createdDeliveries = deliveries.Select(ToResponse).ToList();

        return Results.Ok(new CreateDeliveriesBatchResponse
        {
            Created = createdDeliveries.Count,
            Deliveries = createdDeliveries
        });
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

        // Soft delete
        delivery.DeletedAt = DateTimeOffset.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);

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

        var now = DateTimeOffset.UtcNow;
        foreach (var delivery in deliveries)
        {
            delivery.DeletedAt = now;
        }

        await dbContext.SaveChangesAsync(cancellationToken);

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
            delivery.Status,
            delivery.CreatedAt,
            delivery.CompletedAt);
}
