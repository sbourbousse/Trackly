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

        var driverIds = routes.Select(r => r.DriverId).Distinct().ToList();
        var drivers = await dbContext.Drivers
            .AsNoTracking()
            .Where(d => driverIds.Contains(d.Id))
            .ToDictionaryAsync(d => d.Id, d => d.Name, cancellationToken);

        var responses = routes
            .Select(r => new RouteResponse(
                r.Id,
                r.DriverId,
                r.Name,
                r.CreatedAt,
                counts.TryGetValue(r.Id, out var c) ? c : 0,
                drivers.TryGetValue(r.DriverId, out var name) ? name : "Non assigné"))
            .ToList();

        return Results.Ok(new RouteListResponse { Routes = responses });
    }
}
