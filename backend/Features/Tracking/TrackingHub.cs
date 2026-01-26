using Microsoft.AspNetCore.SignalR;
using Trackly.Backend.Infrastructure.MultiTenancy;

namespace Trackly.Backend.Features.Tracking;

/// <summary>
/// Hub SignalR pour le tracking en temps réel des livraisons
/// </summary>
public sealed class TrackingHub : Hub<ITrackingClient>
{
    public override async Task OnConnectedAsync()
    {
        // En développement, on peut se connecter sans TenantId
        // En production, il faudra extraire le TenantId depuis le token JWT
        // Pour l'instant, on accepte toutes les connexions
        await base.OnConnectedAsync();
    }

    /// <summary>
    /// Permet à un driver de rejoindre le groupe de tracking pour une livraison
    /// </summary>
    public async Task JoinDeliveryGroup(Guid deliveryId)
    {
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
