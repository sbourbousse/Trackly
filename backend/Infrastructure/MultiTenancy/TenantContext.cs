namespace Trackly.Backend.Infrastructure.MultiTenancy;

public sealed class TenantContext
{
    public Guid TenantId { get; set; } = Guid.Empty;
}
