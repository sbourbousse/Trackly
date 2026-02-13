using Microsoft.EntityFrameworkCore;
using Trackly.Backend.Infrastructure.Data;
using Trackly.Backend.Infrastructure.MultiTenancy;

namespace Trackly.Backend.Features.Deliveries;

public static class RouteEndpoints
{
    public static IEndpointRouteBuilder MapRouteEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/routes");
        group.MapGet("/", GetRoutes);
        group.MapGet("/{id:guid}", GetRoute);
        group.MapPatch("/{routeId:guid}/deliveries/order", ReorderDeliveries);
        return app;
    }

    /// <summary>
    /// Liste des tournées. Filtres optionnels : dateFrom, dateTo (ISO 8601), driverId.
    /// </summary>
    private static async Task<IResult> GetRoutes(
        TracklyDbContext dbContext,
        TenantContext tenantContext,
        DateTimeOffset? dateFrom,
        DateTimeOffset? dateTo,
        Guid? driverId,
        CancellationToken cancellationToken)
    {
        if (tenantContext.TenantId == Guid.Empty)
        {
            return Results.BadRequest("TenantId manquant.");
        }

        var query = dbContext.Routes
            .AsNoTracking()
            .Where(r => r.TenantId == tenantContext.TenantId && r.DeletedAt == null);

        if (dateFrom.HasValue)
            query = query.Where(r => r.CreatedAt >= dateFrom.Value);
        if (dateTo.HasValue)
            query = query.Where(r => r.CreatedAt <= dateTo.Value);
        if (driverId.HasValue && driverId.Value != Guid.Empty)
            query = query.Where(r => r.DriverId == driverId.Value);

        var routes = await query
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(cancellationToken);

        if (routes.Count == 0)
        {
            return Results.Ok(new RouteListResponse());
        }

        var routeIds = routes.Select(r => r.Id).ToList();
        var counts = await dbContext.Deliveries
            .AsNoTracking()
            .Where(d => d.RouteId != null && routeIds.Contains(d.RouteId.Value) && d.DeletedAt == null)
            .GroupBy(d => d.RouteId!.Value)
            .Select(g => new { RouteId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.RouteId, x => x.Count, cancellationToken);

        // Récupérer les statuts des livraisons par tournée
        var deliveriesByRoute = await dbContext.Deliveries
            .AsNoTracking()
            .Where(d => d.RouteId != null && routeIds.Contains(d.RouteId.Value) && d.DeletedAt == null)
            .GroupBy(d => d.RouteId!.Value)
            .Select(g => new
            {
                RouteId = g.Key,
                Pending = g.Count(d => d.Status == DeliveryStatus.Pending),
                InProgress = g.Count(d => d.Status == DeliveryStatus.InProgress),
                Completed = g.Count(d => d.Status == DeliveryStatus.Completed),
                Failed = g.Count(d => d.Status == DeliveryStatus.Failed)
            })
            .ToDictionaryAsync(x => x.RouteId, cancellationToken);

        var driverIds = routes.Select(r => r.DriverId).Distinct().ToList();
        var drivers = await dbContext.Drivers
            .AsNoTracking()
            .Where(d => driverIds.Contains(d.Id))
            .ToDictionaryAsync(d => d.Id, d => d.Name, cancellationToken);

        var responses = routes
            .Select(r =>
            {
                var summary = deliveriesByRoute.TryGetValue(r.Id, out var statusCounts)
                    ? new DeliveryStatusSummary(statusCounts.Pending, statusCounts.InProgress, statusCounts.Completed, statusCounts.Failed)
                    : new DeliveryStatusSummary(0, 0, 0, 0);
                
                return new RouteResponse(
                    r.Id,
                    r.DriverId,
                    r.Name,
                    r.CreatedAt,
                    counts.TryGetValue(r.Id, out var c) ? c : 0,
                    drivers.TryGetValue(r.DriverId, out var name) ? name : "Non assigné",
                    summary);
            })
            .ToList();

        return Results.Ok(new RouteListResponse { Routes = responses });
    }

    /// <summary>
    /// Détail d'une tournée avec ses livraisons ordonnées par Sequence.
    /// </summary>
    private static async Task<IResult> GetRoute(
        Guid id,
        TracklyDbContext dbContext,
        TenantContext tenantContext,
        CancellationToken cancellationToken)
    {
        if (tenantContext.TenantId == Guid.Empty)
        {
            return Results.BadRequest("TenantId manquant.");
        }

        var route = await dbContext.Routes
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == id && r.TenantId == tenantContext.TenantId && r.DeletedAt == null, cancellationToken);

        if (route == null)
        {
            return Results.NotFound("Tournée introuvable.");
        }

        var driver = await dbContext.Drivers
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.Id == route.DriverId, cancellationToken);
        var driverName = driver?.Name ?? "Non assigné";

        var deliveries = await dbContext.Deliveries
            .AsNoTracking()
            .Where(d => d.RouteId == route.Id && d.DeletedAt == null)
            .OrderBy(d => d.Sequence ?? int.MaxValue)
            .ThenBy(d => d.CreatedAt)
            .ToListAsync(cancellationToken);

        var orderIds = deliveries.Select(d => d.OrderId).Distinct().ToList();
        var orders = await dbContext.Orders
            .AsNoTracking()
            .Where(o => orderIds.Contains(o.Id) && o.DeletedAt == null)
            .ToDictionaryAsync(o => o.Id, o => new { o.CustomerName, o.Address }, cancellationToken);

        var deliveryResponses = deliveries
            .Select(d =>
            {
                string customerName = "Inconnu";
                string address = "Adresse inconnue";
                if (orders.TryGetValue(d.OrderId, out var o))
                {
                    customerName = o.CustomerName ?? customerName;
                    address = o.Address ?? address;
                }
                return new DeliveryInRouteResponse(
                    d.Id,
                    d.OrderId,
                    d.Sequence,
                    d.Status,
                    d.CreatedAt,
                    d.CompletedAt,
                    customerName,
                    address);
            })
            .ToList();

        return Results.Ok(new RouteDetailResponse(
            route.Id,
            route.DriverId,
            route.Name,
            route.CreatedAt,
            driverName,
            deliveryResponses));
    }

    /// <summary>
    /// Réordonne les livraisons d'une tournée. Body : { "deliveryIds": ["guid", ...] }.
    /// </summary>
    private static async Task<IResult> ReorderDeliveries(
        Guid routeId,
        ReorderRouteDeliveriesRequest request,
        TracklyDbContext dbContext,
        TenantContext tenantContext,
        CancellationToken cancellationToken)
    {
        if (tenantContext.TenantId == Guid.Empty)
        {
            return Results.BadRequest("TenantId manquant.");
        }

        if (request.DeliveryIds == null || request.DeliveryIds.Count == 0)
        {
            return Results.BadRequest("Aucune livraison fournie.");
        }

        var route = await dbContext.Routes
            .FirstOrDefaultAsync(r => r.Id == routeId && r.TenantId == tenantContext.TenantId && r.DeletedAt == null, cancellationToken);

        if (route == null)
        {
            return Results.NotFound("Tournée introuvable.");
        }

        var deliveries = await dbContext.Deliveries
            .Where(d => d.RouteId == routeId && d.TenantId == tenantContext.TenantId && d.DeletedAt == null)
            .ToListAsync(cancellationToken);

        var deliveryIdsSet = deliveries.Select(d => d.Id).ToHashSet();
        if (request.DeliveryIds.Count != deliveryIdsSet.Count || request.DeliveryIds.Any(id => !deliveryIdsSet.Contains(id)))
        {
            return Results.BadRequest("La liste des livraisons doit contenir exactement les livraisons de cette tournée.");
        }

        for (var i = 0; i < request.DeliveryIds.Count; i++)
        {
            var delivery = deliveries.First(d => d.Id == request.DeliveryIds[i]);
            delivery.Sequence = i;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return Results.Ok(new { message = "Ordre mis à jour." });
    }
}
