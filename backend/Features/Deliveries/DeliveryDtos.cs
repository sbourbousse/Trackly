namespace Trackly.Backend.Features.Deliveries;

public sealed record CreateDeliveryRequest(Guid OrderId, Guid DriverId);

public sealed record DeliveryResponse(
    Guid Id,
    Guid OrderId,
    Guid DriverId,
    Guid? RouteId,
    DeliveryStatus Status,
    DateTimeOffset CreatedAt,
    DateTimeOffset? CompletedAt);

public sealed record DeliveryTrackingResponse(
    Guid DeliveryId,
    DeliveryStatus Status,
    DateTimeOffset? CompletedAt);

public sealed record CreateDeliveriesBatchRequest(Guid DriverId, List<Guid> OrderIds, string? Name = null);

public sealed record CreateDeliveriesBatchResponse
{
    public int Created { get; init; }
    public List<DeliveryResponse> Deliveries { get; init; } = new();
}

public sealed record DeleteDeliveriesBatchRequest(List<Guid> Ids);

public sealed record DeleteDeliveriesBatchResponse
{
    public int Deleted { get; init; }
    public string Message { get; init; } = string.Empty;
}

public sealed record DeliveryDetailResponse(
    Guid Id,
    Guid OrderId,
    Guid DriverId,
    DeliveryStatus Status,
    DateTimeOffset CreatedAt,
    DateTimeOffset? CompletedAt,
    string CustomerName,
    string Address,
    string DriverName);

/// <summary>
/// Agrégation livraisons pour le graphique : par jour ou par heure selon la plage.
/// </summary>
public sealed record DeliveryStatsResponse
{
    public List<DeliveryCountByDay> ByDay { get; init; } = new();
    public List<DeliveryCountByHour> ByHour { get; init; } = new();
}

public sealed record DeliveryCountByDay(string Date, int Count);

public sealed record DeliveryCountByHour(string Hour, int Count);

// --- Routes (tournées) ---

public sealed record RouteResponse(
    Guid Id,
    Guid DriverId,
    string? Name,
    DateTimeOffset CreatedAt,
    int DeliveryCount,
    string DriverName);

public sealed record RouteListResponse
{
    public List<RouteResponse> Routes { get; init; } = new();
}