using Microsoft.EntityFrameworkCore;
using Trackly.Backend.Features.Billing;
using Trackly.Backend.Infrastructure.Data;
using Trackly.Backend.Infrastructure.MultiTenancy;

namespace Trackly.Backend.Features.Orders;

public static class OrderEndpoints
{
    public static IEndpointRouteBuilder MapOrderEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/orders");

        group.MapPost("/", CreateOrder);
        group.MapPost("/import", ImportOrders);
        group.MapGet("/", GetOrders);

        return app;
    }

    private static async Task<IResult> CreateOrder(
        CreateOrderRequest request,
        TracklyDbContext dbContext,
        TenantContext tenantContext,
        IBillingService billingService,
        CancellationToken cancellationToken)
    {
        if (tenantContext.TenantId == Guid.Empty)
        {
            return Results.BadRequest("TenantId manquant.");
        }

        if (string.IsNullOrWhiteSpace(request.CustomerName) || string.IsNullOrWhiteSpace(request.Address))
        {
            return Results.BadRequest("CustomerName et Address sont obligatoires.");
        }

        var canCreate = await billingService.CanCreateDeliveryAsync(tenantContext.TenantId, cancellationToken);
        if (!canCreate)
        {
            return Results.Problem(
                "Quota mensuel dépassé pour le plan Starter.",
                statusCode: StatusCodes.Status403Forbidden);
        }

        var order = new Order
        {
            Id = Guid.NewGuid(),
            TenantId = tenantContext.TenantId,
            CustomerName = request.CustomerName.Trim(),
            Address = request.Address.Trim(),
            Status = OrderStatus.Pending,
            CreatedAt = DateTimeOffset.UtcNow
        };

        dbContext.Orders.Add(order);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.Created($"/api/orders/{order.Id}", ToResponse(order));
    }

    private static async Task<IResult> ImportOrders(
        ImportOrdersRequest request,
        TracklyDbContext dbContext,
        TenantContext tenantContext,
        IBillingService billingService,
        CancellationToken cancellationToken)
    {
        if (tenantContext.TenantId == Guid.Empty)
        {
            return Results.BadRequest("TenantId manquant.");
        }

        if (request.Orders == null || request.Orders.Count == 0)
        {
            return Results.BadRequest("Aucune commande à importer.");
        }

        // Vérifier le quota global avant l'import
        var canCreate = await billingService.CanCreateDeliveryAsync(tenantContext.TenantId, cancellationToken);
        if (!canCreate)
        {
            return Results.Problem(
                "Quota mensuel dépassé pour le plan Starter.",
                statusCode: StatusCodes.Status403Forbidden);
        }

        var createdOrders = new List<OrderResponse>();
        var errors = new List<string>();

        foreach (var orderRequest in request.Orders)
        {
            if (string.IsNullOrWhiteSpace(orderRequest.CustomerName) || string.IsNullOrWhiteSpace(orderRequest.Address))
            {
                errors.Add($"Commande ignorée : CustomerName et Address sont obligatoires.");
                continue;
            }

            // Vérifier le quota pour chaque commande (car chaque commande peut devenir une livraison)
            var canCreateOrder = await billingService.CanCreateDeliveryAsync(tenantContext.TenantId, cancellationToken);
            if (!canCreateOrder)
            {
                errors.Add($"Quota dépassé : impossible de créer la commande pour {orderRequest.CustomerName}");
                continue;
            }

            var order = new Order
            {
                Id = Guid.NewGuid(),
                TenantId = tenantContext.TenantId,
                CustomerName = orderRequest.CustomerName.Trim(),
                Address = orderRequest.Address.Trim(),
                Status = OrderStatus.Pending,
                CreatedAt = DateTimeOffset.UtcNow
            };

            dbContext.Orders.Add(order);
            createdOrders.Add(ToResponse(order));
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.Ok(new ImportOrdersResponse
        {
            Created = createdOrders.Count,
            Errors = errors,
            Orders = createdOrders
        });
    }

    private static async Task<IResult> GetOrders(
        TracklyDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var orders = await dbContext.Orders
            .AsNoTracking()
            .OrderByDescending(order => order.CreatedAt)
            .Select(order => ToResponse(order))
            .ToListAsync(cancellationToken);

        return Results.Ok(orders);
    }

    private static OrderResponse ToResponse(Order order) =>
        new(order.Id, order.CustomerName, order.Address, order.Status, order.CreatedAt);
}
