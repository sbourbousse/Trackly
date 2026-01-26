using Trackly.Backend.Infrastructure.MultiTenancy;

namespace Trackly.Backend.Features.Drivers;

public sealed class Driver : ITenantIsolated
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
}
