namespace Trackly.Backend.Features.Deliveries;

public sealed record CreateDeliveryRequest(Guid OrderId, Guid DriverId);

public sealed record DeliveryResponse(
    Guid Id,
    Guid OrderId,
    Guid DriverId,
    DeliveryStatus Status,
    DateTimeOffset CreatedAt,
    DateTimeOffset? CompletedAt);

public sealed record DeliveryTrackingResponse(
    Guid DeliveryId,
    DeliveryStatus Status,
    DateTimeOffset? CompletedAt);

public sealed record CreateDeliveriesBatchRequest(Guid DriverId, List<Guid> OrderIds);

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