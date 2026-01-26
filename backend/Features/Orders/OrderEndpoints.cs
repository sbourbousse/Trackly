using Microsoft.EntityFrameworkCore;
using Trackly.Backend.Features.Billing;
using Trackly.Backend.Features.Deliveries;
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
        group.MapGet("/{id:guid}", GetOrder);
        group.MapDelete("/{id:guid}", DeleteOrder);
        group.MapPost("/batch/delete", DeleteOrdersBatch);

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
        TenantContext tenantContext,
        CancellationToken cancellationToken)
    {
        if (tenantContext.TenantId == Guid.Empty)
        {
            return Results.BadRequest("TenantId manquant.");
        }

        var orders = await dbContext.Orders
            .AsNoTracking()
            .Where(o => o.DeletedAt == null)
            .OrderByDescending(order => order.CreatedAt)
            .Select(order => ToResponse(order))
            .ToListAsync(cancellationToken);

        return Results.Ok(orders);
    }

    private static async Task<IResult> GetOrder(
        Guid id,
        TracklyDbContext dbContext,
        TenantContext tenantContext,
        CancellationToken cancellationToken)
    {
        if (tenantContext.TenantId == Guid.Empty)
        {
            return Results.BadRequest("TenantId manquant.");
        }

        var order = await dbContext.Orders
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.Id == id && o.TenantId == tenantContext.TenantId && o.DeletedAt == null, cancellationToken);

        if (order == null)
        {
            return Results.NotFound("Commande introuvable.");
        }

        // Récupérer les livraisons associées
        var deliveries = await dbContext.Deliveries
            .AsNoTracking()
            .Where(d => d.OrderId == id && d.DeletedAt == null)
            .OrderByDescending(d => d.CreatedAt)
            .Select(d => new
            {
                d.Id,
                d.DriverId,
                d.Status,
                d.CreatedAt,
                d.CompletedAt
            })
            .ToListAsync(cancellationToken);

        // Récupérer les informations des drivers
        var driverIds = deliveries.Select(d => d.DriverId).Distinct().ToList();
        var drivers = driverIds.Count > 0
            ? await dbContext.Drivers
                .AsNoTracking()
                .Where(d => driverIds.Contains(d.Id))
                .ToDictionaryAsync(d => d.Id, d => d.Name, cancellationToken)
            : new Dictionary<Guid, string>();

        var deliveriesWithDriver = deliveries.Select(d => new OrderDeliveryInfo(
            d.Id,
            d.DriverId,
            d.Status,
            d.CreatedAt,
            d.CompletedAt,
            drivers.GetValueOrDefault(d.DriverId, "Inconnu"))).ToList();

        return Results.Ok(new OrderDetailResponse(
            order.Id,
            order.CustomerName,
            order.Address,
            order.Status,
            order.CreatedAt,
            deliveriesWithDriver));
    }

    private static async Task<IResult> DeleteOrder(
        Guid id,
        TracklyDbContext dbContext,
        TenantContext tenantContext,
        CancellationToken cancellationToken)
    {
        if (tenantContext.TenantId == Guid.Empty)
        {
            return Results.BadRequest("TenantId manquant.");
        }

        var order = await dbContext.Orders
            .FirstOrDefaultAsync(o => o.Id == id && o.TenantId == tenantContext.TenantId, cancellationToken);

        if (order == null)
        {
            return Results.NotFound("Commande introuvable.");
        }

        if (order.DeletedAt != null)
        {
            return Results.BadRequest("Cette commande est déjà supprimée.");
        }

        // Vérifier les livraisons actives
        var activeDeliveries = await dbContext.Deliveries
            .AsNoTracking()
            .Where(d => d.OrderId == id && d.DeletedAt == null)
            .CountAsync(cancellationToken);

        if (activeDeliveries > 0)
        {
            return Results.Problem(
                $"Impossible de supprimer cette commande : {activeDeliveries} livraison(s) active(s) associée(s). Supprimez d'abord les livraisons ou utilisez la suppression en cascade.",
                statusCode: StatusCodes.Status409Conflict);
        }

        // Soft delete
        order.DeletedAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.Ok(new { message = "Commande supprimée avec succès." });
    }

    private static async Task<IResult> DeleteOrdersBatch(
        DeleteOrdersBatchRequest request,
        TracklyDbContext dbContext,
        TenantContext tenantContext,
        CancellationToken cancellationToken)
    {
        if (tenantContext.TenantId == Guid.Empty)
        {
            return Results.BadRequest("TenantId manquant.");
        }

        if (request.Ids == null || request.Ids.Count == 0)
        {
            return Results.BadRequest("Aucune commande sélectionnée.");
        }

        var orders = await dbContext.Orders
            .Where(o => request.Ids.Contains(o.Id) && o.TenantId == tenantContext.TenantId && o.DeletedAt == null)
            .ToListAsync(cancellationToken);

        if (orders.Count == 0)
        {
            return Results.NotFound("Aucune commande trouvée à supprimer.");
        }

        // Vérifier les livraisons actives pour chaque commande
        var ordersWithDeliveries = new List<Guid>();
        var ordersToDelete = new List<Order>();

        foreach (var order in orders)
        {
            var activeDeliveries = await dbContext.Deliveries
                .AsNoTracking()
                .Where(d => d.OrderId == order.Id && d.DeletedAt == null)
                .CountAsync(cancellationToken);

            if (activeDeliveries > 0)
            {
                ordersWithDeliveries.Add(order.Id);
            }
            else
            {
                ordersToDelete.Add(order);
            }
        }

        // Si certaines commandes ont des livraisons actives
        if (ordersWithDeliveries.Count > 0 && !request.ForceDeleteDeliveries)
        {
            return Results.Problem(
                $"{ordersWithDeliveries.Count} commande(s) ont des livraisons actives. Utilisez 'forceDeleteDeliveries: true' pour supprimer aussi les livraisons.",
                statusCode: StatusCodes.Status409Conflict,
                extensions: new Dictionary<string, object?>
                {
                    ["ordersWithDeliveries"] = ordersWithDeliveries
                });
        }

        var now = DateTimeOffset.UtcNow;
        var deletedDeliveriesCount = 0;

        // Supprimer les commandes
        foreach (var order in ordersToDelete)
        {
            order.DeletedAt = now;
        }

        // Si forceDeleteDeliveries est activé, supprimer aussi les livraisons
        if (request.ForceDeleteDeliveries && ordersWithDeliveries.Count > 0)
        {
            var deliveriesToDelete = await dbContext.Deliveries
                .Where(d => ordersWithDeliveries.Contains(d.OrderId) && d.DeletedAt == null)
                .ToListAsync(cancellationToken);

            foreach (var delivery in deliveriesToDelete)
            {
                delivery.DeletedAt = now;
            }

            deletedDeliveriesCount = deliveriesToDelete.Count;

            // Supprimer aussi les commandes avec livraisons
            foreach (var orderId in ordersWithDeliveries)
            {
                var order = orders.First(o => o.Id == orderId);
                order.DeletedAt = now;
            }
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        return Results.Ok(new DeleteOrdersBatchResponse
        {
            Deleted = ordersToDelete.Count + (request.ForceDeleteDeliveries ? ordersWithDeliveries.Count : 0),
            DeletedDeliveries = deletedDeliveriesCount,
            Skipped = request.ForceDeleteDeliveries ? 0 : ordersWithDeliveries.Count,
            Message = $"{(ordersToDelete.Count + (request.ForceDeleteDeliveries ? ordersWithDeliveries.Count : 0))} commande(s) supprimée(s)." +
                     (deletedDeliveriesCount > 0 ? $" {deletedDeliveriesCount} livraison(s) supprimée(s) en cascade." : "")
        });
    }

    private static OrderResponse ToResponse(Order order) =>
        new(order.Id, order.CustomerName, order.Address, order.Status, order.CreatedAt);
}
