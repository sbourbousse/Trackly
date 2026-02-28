using Microsoft.EntityFrameworkCore;
using Trackly.Backend.Features.Tenants;
using Trackly.Backend.Infrastructure.Data;

namespace Trackly.Backend.Features.Billing;

public sealed class BillingService(TracklyDbContext dbContext) : IBillingService
{
    private const int StarterMonthlyDeliveryLimit = 25;
    private const int StarterDriverLimit = 3;

    public async Task<bool> CanCreateDeliveryAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        var tenant = await dbContext.Tenants
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == tenantId, cancellationToken);

        if (tenant == null || tenant.SubscriptionPlan == SubscriptionPlan.Pro)
        {
            return true;
        }

        var windowStart = new DateTimeOffset(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, TimeSpan.Zero);
        var windowEnd = windowStart.AddMonths(1);

        var deliveriesThisMonth = await dbContext.Deliveries
            .AsNoTracking()
            .CountAsync(
                delivery => delivery.CreatedAt >= windowStart && delivery.CreatedAt < windowEnd,
                cancellationToken);

        return deliveriesThisMonth < StarterMonthlyDeliveryLimit;
    }

    public async Task<bool> CanCreateDriverAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        var tenant = await dbContext.Tenants
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == tenantId, cancellationToken);

        if (tenant == null || tenant.SubscriptionPlan == SubscriptionPlan.Pro)
        {
            return true;
        }

        var driverCount = await dbContext.Drivers
            .AsNoTracking()
            .CountAsync(d => d.TenantId == tenantId, cancellationToken);

        return driverCount < StarterDriverLimit;
    }

    public async Task<DeliveryQuotaResult> GetDeliveryQuotaAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        var tenant = await dbContext.Tenants
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == tenantId, cancellationToken);

        var windowStart = new DateTimeOffset(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, TimeSpan.Zero);
        var windowEnd = windowStart.AddMonths(1);

        var usedThisMonth = await dbContext.Deliveries
            .AsNoTracking()
            .CountAsync(
                d => d.CreatedAt >= windowStart && d.CreatedAt < windowEnd,
                cancellationToken);

        if (tenant == null || tenant.SubscriptionPlan == SubscriptionPlan.Pro)
        {
            return new DeliveryQuotaResult("Pro", null, usedThisMonth, null);
        }

        var remaining = Math.Max(0, StarterMonthlyDeliveryLimit - usedThisMonth);
        return new DeliveryQuotaResult("Starter", StarterMonthlyDeliveryLimit, usedThisMonth, remaining);
    }
}
