using Trackly.Backend.Infrastructure.MultiTenancy;

namespace Trackly.Backend.Features.Deliveries;

/// <summary>
/// Tournée : regroupement explicite de livraisons pour un chauffeur.
/// Permet plusieurs tournées le même jour et gère correctement les tournées de nuit.
/// </summary>
public sealed class Route : ITenantIsolated
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid DriverId { get; set; }
    /// <summary>Nom optionnel (ex. "Est - Matin", "Nuit 22h-6h").</summary>
    public string? Name { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? DeletedAt { get; set; }
}
