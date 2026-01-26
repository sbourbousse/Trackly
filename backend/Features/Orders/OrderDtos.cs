namespace Trackly.Backend.Features.Orders;

public sealed record CreateOrderRequest(string CustomerName, string Address);

public sealed record OrderResponse(
    Guid Id,
    string CustomerName,
    string Address,
    OrderStatus Status,
    DateTimeOffset CreatedAt);
