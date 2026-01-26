using Microsoft.EntityFrameworkCore;
using Trackly.Backend.Features.Tenants;
using Trackly.Backend.Infrastructure.Data;

namespace Trackly.Backend.Features.Billing;

public sealed class BillingService(TracklyDbContext dbContext) : IBillingService
{
    private const int StarterMonthlyDeliveryLimit = 25;

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
}
