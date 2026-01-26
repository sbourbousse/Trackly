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
        group.MapPost("/", CreateDelivery);
        group.MapPatch("/{id:guid}/complete", CompleteDelivery);
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
            .Where(d => d.TenantId == tenantContext.TenantId)
            .OrderByDescending(d => d.CreatedAt)
            .Select(d => ToResponse(d))
            .ToListAsync(cancellationToken);

        return Results.Ok(deliveries);
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

    private static async Task<IResult> CompleteDelivery(
        Guid id,
        TracklyDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var delivery = await dbContext.Deliveries
            .FirstOrDefaultAsync(current => current.Id == id, cancellationToken);

        if (delivery == null)
        {
            return Results.NotFound("Livraison introuvable.");
        }

        delivery.Status = DeliveryStatus.Completed;
        delivery.CompletedAt = DateTimeOffset.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.Ok(ToResponse(delivery));
    }

    private static async Task<IResult> GetTracking(
        Guid id,
        TracklyDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var delivery = await dbContext.Deliveries
            .AsNoTracking()
            .FirstOrDefaultAsync(current => current.Id == id, cancellationToken);

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
