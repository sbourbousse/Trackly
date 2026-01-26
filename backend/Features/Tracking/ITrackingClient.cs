namespace Trackly.Backend.Features.Tracking;

/// <summary>
/// Interface fortement typée pour les clients SignalR du tracking
/// </summary>
public interface ITrackingClient
{
    /// <summary>
    /// Reçoit une mise à jour de position GPS pour une livraison
    /// </summary>
    Task LocationUpdated(Guid deliveryId, double latitude, double longitude, DateTimeOffset timestamp);

    /// <summary>
    /// Reçoit une notification de changement de statut de livraison
    /// </summary>
    Task DeliveryStatusChanged(Guid deliveryId, string status, DateTimeOffset? completedAt);
}
