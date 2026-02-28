namespace Trackly.Backend.Features.Billing;

public interface IBillingService
{
    Task<bool> CanCreateDeliveryAsync(Guid tenantId, CancellationToken cancellationToken);
    Task<bool> CanCreateDriverAsync(Guid tenantId, CancellationToken cancellationToken);
    Task<DeliveryQuotaResult> GetDeliveryQuotaAsync(Guid tenantId, CancellationToken cancellationToken);
}
