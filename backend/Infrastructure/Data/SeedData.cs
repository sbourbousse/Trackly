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

        // Crée un tenant de démo minimal
        var tenant = new Tenant
        {
            Id = Guid.NewGuid(),
            Name = "Demo Tenant",
            SubscriptionPlan = SubscriptionPlan.Starter,
            CreatedAt = DateTimeOffset.UtcNow.AddDays(-30)
        };

        dbContext.Tenants.Add(tenant);
        await dbContext.SaveChangesAsync(cancellationToken);
        
        tenantContext.TenantId = tenant.Id;

        // Crée 2 drivers
        var driver1 = new Driver
        {
            Id = Guid.NewGuid(),
            TenantId = tenant.Id,
            Name = "Pierre Martin",
            Phone = "+33 6 12 34 56 78"
        };
        var driver2 = new Driver
        {
            Id = Guid.NewGuid(),
            TenantId = tenant.Id,
            Name = "Sophie Bernard",
            Phone = "+33 6 23 45 67 89"
        };
        dbContext.Drivers.AddRange(driver1, driver2);
        await dbContext.SaveChangesAsync(cancellationToken);

        // Crée 3 commandes simples
        var order1 = new Order
        {
            Id = Guid.NewGuid(),
            TenantId = tenant.Id,
            CustomerName = "Jean Dupont",
            Address = "1 Rue de la Paix, 34000 Montpellier",
            PhoneNumber = "+33 6 11 22 33 44",
            OrderDate = DateTimeOffset.UtcNow.AddDays(-1),
            Status = OrderStatus.Delivered,
            CreatedAt = DateTimeOffset.UtcNow.AddDays(-1)
        };
        var order2 = new Order
        {
            Id = Guid.NewGuid(),
            TenantId = tenant.Id,
            CustomerName = "Marie Dubois",
            Address = "2 Rue de la Liberté, 34000 Montpellier",
            PhoneNumber = "+33 6 22 33 44 55",
            OrderDate = DateTimeOffset.UtcNow,
            Status = OrderStatus.InTransit,
            CreatedAt = DateTimeOffset.UtcNow
        };
        var order3 = new Order
        {
            Id = Guid.NewGuid(),
            TenantId = tenant.Id,
            CustomerName = "Pierre Leroy",
            Address = "3 Avenue des Champs, 34000 Montpellier",
            PhoneNumber = "+33 6 33 44 55 66",
            OrderDate = DateTimeOffset.UtcNow.AddDays(1),
            Status = OrderStatus.Planned,
            CreatedAt = DateTimeOffset.UtcNow
        };

        dbContext.Orders.AddRange(order1, order2, order3);
        await dbContext.SaveChangesAsync(cancellationToken);

        // Crée les livraisons associées
        var delivery1 = new Delivery
        {
            Id = Guid.NewGuid(),
            TenantId = tenant.Id,
            OrderId = order1.Id,
            DriverId = driver1.Id,
            Status = DeliveryStatus.Completed,
            CreatedAt = order1.OrderDate,
            CompletedAt = order1.OrderDate.AddHours(2)
        };
        var delivery2 = new Delivery
        {
            Id = Guid.NewGuid(),
            TenantId = tenant.Id,
            OrderId = order2.Id,
            DriverId = driver1.Id,
            Status = DeliveryStatus.InProgress,
            CreatedAt = order2.OrderDate
        };
        var delivery3 = new Delivery
        {
            Id = Guid.NewGuid(),
            TenantId = tenant.Id,
            OrderId = order3.Id,
            DriverId = driver2.Id,
            Status = DeliveryStatus.Pending,
            CreatedAt = order3.OrderDate
        };

        dbContext.Deliveries.AddRange(delivery1, delivery2, delivery3);
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}