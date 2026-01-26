using Microsoft.EntityFrameworkCore;
using Trackly.Backend.Features.Deliveries;
using Trackly.Backend.Infrastructure.Data;

namespace Trackly.Backend.Features.Orders;

/// <summary>
/// Service pour gérer la mise à jour automatique du statut des commandes
/// en fonction de l'état de leurs livraisons associées.
/// </summary>
public static class OrderStatusService
{
    /// <summary>
    /// Met à jour automatiquement le statut d'une commande en fonction de ses livraisons actives.
    /// </summary>
    /// <param name="orderId">ID de la commande à mettre à jour</param>
    /// <param name="dbContext">Contexte de base de données</param>
    /// <param name="cancellationToken">Token d'annulation</param>
    public static async Task UpdateOrderStatusAsync(
        Guid orderId,
        TracklyDbContext dbContext,
        CancellationToken cancellationToken = default)
    {
        var order = await dbContext.Orders
            .FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken);

        if (order == null || order.DeletedAt != null)
        {
            return; // Commande introuvable ou supprimée
        }

        // Récupérer toutes les livraisons actives (non supprimées) de cette commande
        var deliveries = await dbContext.Deliveries
            .Where(d => d.OrderId == orderId && d.DeletedAt == null)
            .ToListAsync(cancellationToken);

        // Si aucune livraison active → Pending
        if (deliveries.Count == 0)
        {
            if (order.Status != OrderStatus.Pending)
            {
                order.Status = OrderStatus.Pending;
                await dbContext.SaveChangesAsync(cancellationToken);
            }
            return;
        }

        // Compter les livraisons par statut
        var completedCount = deliveries.Count(d => d.Status == DeliveryStatus.Completed);
        var inProgressCount = deliveries.Count(d => d.Status == DeliveryStatus.InProgress);
        var pendingCount = deliveries.Count(d => d.Status == DeliveryStatus.Pending);
        var failedCount = deliveries.Count(d => d.Status == DeliveryStatus.Failed);

        OrderStatus newStatus;

        // Si toutes les livraisons sont complétées → Delivered
        if (completedCount == deliveries.Count)
        {
            newStatus = OrderStatus.Delivered;
        }
        // Si au moins une livraison est en cours → InTransit
        else if (inProgressCount > 0)
        {
            newStatus = OrderStatus.InTransit;
        }
        // Si au moins une livraison existe mais toutes sont en attente → Planned
        else if (pendingCount > 0 || failedCount > 0)
        {
            newStatus = OrderStatus.Planned;
        }
        // Cas par défaut (ne devrait pas arriver)
        else
        {
            newStatus = OrderStatus.Pending;
        }

        // Mettre à jour seulement si le statut a changé
        if (order.Status != newStatus)
        {
            order.Status = newStatus;
            await dbContext.SaveChangesAsync(cancellationToken);
        }
    }

    /// <summary>
    /// Met à jour le statut d'une commande lors de la création d'une livraison.
    /// Si la commande est Delivered, elle repasse à Planned (réouverture).
    /// Si la commande est Pending, elle passe à Planned.
    /// </summary>
    public static async Task UpdateOrderStatusOnDeliveryCreatedAsync(
        Guid orderId,
        TracklyDbContext dbContext,
        CancellationToken cancellationToken = default)
    {
        var order = await dbContext.Orders
            .FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken);

        if (order == null || order.DeletedAt != null)
        {
            return;
        }

        // Si la commande est Delivered, la rouvrir en Planned
        if (order.Status == OrderStatus.Delivered)
        {
            order.Status = OrderStatus.Planned;
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        // Si la commande est Pending, la passer à Planned
        else if (order.Status == OrderStatus.Pending)
        {
            order.Status = OrderStatus.Planned;
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        // Sinon, réévaluer le statut complet
        else
        {
            await UpdateOrderStatusAsync(orderId, dbContext, cancellationToken);
        }
    }
}
