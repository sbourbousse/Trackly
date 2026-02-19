using Trackly.Backend.Features.Deliveries;

namespace Trackly.Backend.Features.Orders;

public sealed record CreateOrderRequest(
    string CustomerName,
    string Address,
    double? Lat = null,
    double? Lng = null,
    string? PhoneNumber = null,
    string? InternalComment = null,
    string? OrderDate = null);

public sealed record ImportOrdersRequest(List<CreateOrderRequest> Orders);

public sealed record ImportOrdersResponse
{
    public int Created { get; init; }
    public List<string> Errors { get; init; } = new();
    public List<OrderResponse> Orders { get; init; } = new();
}

public sealed record DeleteOrdersBatchRequest(List<Guid> Ids, bool ForceDeleteDeliveries = false);

public sealed record DeleteOrdersBatchResponse
{
    public int Deleted { get; init; }
    public int DeletedDeliveries { get; init; }
    public int Skipped { get; init; }
    public string Message { get; init; } = string.Empty;
}

public sealed record OrderResponse(
    Guid Id,
    string CustomerName,
    string Address,
    double? Lat,
    double? Lng,
    string? PhoneNumber,
    string? InternalComment,
    DateTimeOffset? OrderDate,
    OrderStatus Status,
    DateTimeOffset CreatedAt,
    int DeliveryCount);

public sealed record OrderDeliveryInfo(
    Guid Id,
    Guid DriverId,
    DeliveryStatus Status,
    DateTimeOffset CreatedAt,
    DateTimeOffset? CompletedAt,
    string? DriverName = null);

public sealed record OrderDetailResponse(
    Guid Id,
    string CustomerName,
    string Address,
    double? Lat,
    double? Lng,
    string? PhoneNumber,
    string? InternalComment,
    DateTimeOffset? OrderDate,
    OrderStatus Status,
    DateTimeOffset CreatedAt,
    List<OrderDeliveryInfo> Deliveries);

/// <summary>
/// Agrégation commandes pour le graphique : par jour ou par heure selon la plage.
/// </summary>
public sealed record OrderStatsResponse
{
    public List<OrderCountByDay> ByDay { get; init; } = new();
    public List<OrderCountByHour> ByHour { get; init; } = new();
}

public sealed record OrderCountByDay(string Date, int Count);

public sealed record OrderCountByHour(string Hour, int Count);
