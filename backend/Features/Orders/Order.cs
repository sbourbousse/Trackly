using Trackly.Backend.Infrastructure.MultiTenancy;

namespace Trackly.Backend.Features.Orders;

public sealed class Order : ITenantIsolated
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    /// <summary>Latitude (géocodage) pour carte et calculs Mapbox.</summary>
    public double? Lat { get; set; }
    /// <summary>Longitude (géocodage) pour carte et calculs Mapbox.</summary>
    public double? Lng { get; set; }
    public string? PhoneNumber { get; set; }
    public string? InternalComment { get; set; }
    public DateTimeOffset? OrderDate { get; set; }
    public OrderStatus Status { get; set; } = OrderStatus.Pending;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? DeletedAt { get; set; }
}

public enum OrderStatus
{
    Pending = 0,
    Planned = 1,
    InTransit = 2,
    Delivered = 3,
    Cancelled = 4
}
