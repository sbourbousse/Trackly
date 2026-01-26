namespace Trackly.Backend.Features.Orders;

public sealed record CreateOrderRequest(string CustomerName, string Address);

public sealed record ImportOrdersRequest(List<CreateOrderRequest> Orders);

public sealed record ImportOrdersResponse
{
    public int Created { get; init; }
    public List<string> Errors { get; init; } = new();
    public List<OrderResponse> Orders { get; init; } = new();
}

public sealed record OrderResponse(
    Guid Id,
    string CustomerName,
    string Address,
    OrderStatus Status,
    DateTimeOffset CreatedAt);
