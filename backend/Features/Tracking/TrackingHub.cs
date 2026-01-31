using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Trackly.Backend.Features.Deliveries;
using Trackly.Backend.Features.Orders;
using Trackly.Backend.Infrastructure.Data;

namespace Trackly.Backend.Features.Tracking;

/// <summary>
/// Hub SignalR pour le tracking en temps réel des livraisons
/// </summary>
public sealed class TrackingHub : Hub<ITrackingClient>
{
    private readonly IServiceScopeFactory _scopeFactory;

    public TrackingHub(IServiceScopeFactory scopeFactory)
    {
        _scopeFactory = scopeFactory;
    }

    public override async Task OnConnectedAsync()
    {
        // Extrait le TenantId depuis les query parameters de l'URL
        // Format: /hubs/tracking?tenantId=xxx
        if (Context.GetHttpContext()?.Request.Query.TryGetValue("tenantId", out var tenantIdValue) == true)
        {
            if (Guid.TryParse(tenantIdValue, out var tenantId))
            {
                // Stocke le TenantId dans le contexte de la connexion (dispo dans JoinDeliveryGroup, etc.)
                Context.Items["TenantId"] = tenantId;
            }
        }

        await base.OnConnectedAsync();
    }

    /// <summary>
    /// Permet à un driver de rejoindre le groupe de tracking pour une livraison.
    /// Passe la livraison en statut InProgress si elle est encore Pending (pour que la carte business affiche la tournée).
    /// </summary>
    public async Task JoinDeliveryGroup(Guid deliveryId)
    {
        var tenantId = Context.Items["TenantId"] as Guid?;
        if (tenantId.HasValue)
        {
            using (var scope = _scopeFactory.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<TracklyDbContext>();
                var delivery = await db.Deliveries
                    .FirstOrDefaultAsync(d => d.Id == deliveryId && d.TenantId == tenantId.Value && d.DeletedAt == null);
                if (delivery != null && delivery.Status == DeliveryStatus.Pending)
                {
                    delivery.Status = DeliveryStatus.InProgress;
                    await db.SaveChangesAsync();
                    await OrderStatusService.UpdateOrderStatusAsync(delivery.OrderId, db);
                }
            }
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, $"delivery-{deliveryId}");
    }

    /// <summary>
    /// Permet de quitter le groupe de tracking pour une livraison
    /// </summary>
    public async Task LeaveDeliveryGroup(Guid deliveryId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"delivery-{deliveryId}");
    }

    /// <summary>
    /// Méthode appelée par le driver pour mettre à jour sa position GPS
    /// </summary>
    public async Task UpdateLocation(Guid deliveryId, double latitude, double longitude)
    {
        // Valider les coordonnées
        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180)
        {
            throw new HubException("Coordonnées GPS invalides");
        }

        var timestamp = DateTimeOffset.UtcNow;

        // Broadcast la position à tous les clients connectés au groupe de cette livraison
        await Clients.Group($"delivery-{deliveryId}")
            .LocationUpdated(deliveryId, latitude, longitude, timestamp);
    }

    /// <summary>
    /// Notifie un changement de statut de livraison
    /// </summary>
    public async Task NotifyStatusChange(Guid deliveryId, string status, DateTimeOffset? completedAt)
    {
        await Clients.Group($"delivery-{deliveryId}")
            .DeliveryStatusChanged(deliveryId, status, completedAt);
    }
}
