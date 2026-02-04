using Trackly.Backend.Infrastructure.MultiTenancy;

namespace Trackly.Backend.Features.Deliveries;

public sealed class Delivery : ITenantIsolated
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid OrderId { get; set; }
    public Guid DriverId { get; set; }
    /// <summary>Tournée à laquelle appartient cette livraison (créée avec le batch).</summary>
    public Guid? RouteId { get; set; }
    public DeliveryStatus Status { get; set; } = DeliveryStatus.Pending;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? CompletedAt { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }
}

public enum DeliveryStatus
{
    Pending = 0,
    InProgress = 1,
    Completed = 2,
    Failed = 3
}
