using Microsoft.EntityFrameworkCore;
using Trackly.Backend.Features.Deliveries;
using Trackly.Backend.Features.Drivers;
using Trackly.Backend.Features.Orders;
using Trackly.Backend.Features.Tenants;
using Trackly.Backend.Infrastructure.MultiTenancy;

namespace Trackly.Backend.Infrastructure.Data;

public static class SeedData
{
    public static async Task SeedAsync(IServiceProvider services, CancellationToken cancellationToken = default)
    {
        var dbContext = services.GetRequiredService<TracklyDbContext>();
        var tenantContext = services.GetRequiredService<TenantContext>();

        if (await dbContext.Tenants.AnyAsync(cancellationToken))
        {
            return;
        }

        var tenant = new Tenant
        {
            Id = Guid.NewGuid(),
            Name = "Démo Artisan",
            SubscriptionPlan = SubscriptionPlan.Starter,
            CreatedAt = DateTimeOffset.UtcNow
        };

        dbContext.Tenants.Add(tenant);
        await dbContext.SaveChangesAsync(cancellationToken);

        tenantContext.TenantId = tenant.Id;

        var driver = new Driver
        {
            Id = Guid.NewGuid(),
            TenantId = tenant.Id,
            Name = "Alex Dupont",
            Phone = "+33 6 00 00 00 00"
        };

        var order = new Order
        {
            Id = Guid.NewGuid(),
            TenantId = tenant.Id,
            CustomerName = "Client Démo",
            Address = "1 rue de la Paix, Paris",
            Status = OrderStatus.Pending,
            CreatedAt = DateTimeOffset.UtcNow
        };

        var delivery = new Delivery
        {
            Id = Guid.NewGuid(),
            TenantId = tenant.Id,
            OrderId = order.Id,
            DriverId = driver.Id,
            Status = DeliveryStatus.Pending,
            CreatedAt = DateTimeOffset.UtcNow
        };

        dbContext.Drivers.Add(driver);
        dbContext.Orders.Add(order);
        dbContext.Deliveries.Add(delivery);

        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
