namespace Trackly.Backend.Infrastructure.MultiTenancy;

public interface ITenantIsolated
{
    Guid TenantId { get; set; }
}
