using Microsoft.EntityFrameworkCore;
using Trackly.Backend.Infrastructure.Data;
using Trackly.Backend.Infrastructure.MultiTenancy;

namespace Trackly.Backend.Features.Drivers;

public static class DriverEndpoints
{
    public static IEndpointRouteBuilder MapDriverEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/drivers");

        group.MapGet("/", GetDrivers);

        return app;
    }

    private static async Task<IResult> GetDrivers(
        TracklyDbContext dbContext,
        TenantContext tenantContext,
        CancellationToken cancellationToken)
    {
        if (tenantContext.TenantId == Guid.Empty)
        {
            return Results.BadRequest("TenantId manquant.");
        }

        var drivers = await dbContext.Drivers
            .AsNoTracking()
            .Where(d => d.TenantId == tenantContext.TenantId)
            .OrderBy(d => d.Name)
            .Select(d => new DriverResponse(d.Id, d.Name, d.Phone))
            .ToListAsync(cancellationToken);

        return Results.Ok(drivers);
    }
}

public sealed record DriverResponse(Guid Id, string Name, string Phone);
