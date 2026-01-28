using Microsoft.EntityFrameworkCore;
using Trackly.Backend.Features.Billing;
using Trackly.Backend.Infrastructure.Data;
using Trackly.Backend.Infrastructure.MultiTenancy;

namespace Trackly.Backend.Features.Drivers;

public static class DriverEndpoints
{
    public static IEndpointRouteBuilder MapDriverEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/drivers");

        group.MapGet("/", GetDrivers);
        group.MapPost("/", CreateDriver);

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

    private static async Task<IResult> CreateDriver(
        TracklyDbContext dbContext,
        TenantContext tenantContext,
        IBillingService billingService,
        CreateDriverRequest request,
        CancellationToken cancellationToken)
    {
        if (tenantContext.TenantId == Guid.Empty)
        {
            return Results.BadRequest("TenantId manquant.");
        }

        var name = request.Name?.Trim();
        var phone = request.Phone?.Trim();

        if (string.IsNullOrWhiteSpace(name))
        {
            return Results.BadRequest("Le nom du livreur est requis.");
        }

        if (string.IsNullOrWhiteSpace(phone))
        {
            return Results.BadRequest("Le numéro de téléphone est requis.");
        }

        // Check quota limit
        var canCreate = await billingService.CanCreateDriverAsync(tenantContext.TenantId, cancellationToken);
        if (!canCreate)
        {
            return Results.BadRequest("Limite de livreurs atteinte pour votre plan. Passez au plan Pro pour créer plus de livreurs.");
        }

        var driver = new Driver
        {
            TenantId = tenantContext.TenantId,
            Name = name,
            Phone = phone
        };

        dbContext.Drivers.Add(driver);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.Created($"/api/drivers/{driver.Id}", new DriverResponse(driver.Id, driver.Name, driver.Phone));
    }
}

public sealed record DriverResponse(Guid Id, string Name, string Phone);

public sealed record CreateDriverRequest(string Name, string Phone);
