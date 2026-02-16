namespace Trackly.Backend.Features.Tenants;

/// <summary>
/// Contour isochrone stocké en base pour un tenant (siège social).
/// Une ligne par contour (ex. 10, 20, 30 minutes). Coordonnées en JSONB [lng, lat][].
/// </summary>
public sealed class TenantIsochrone
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    /// <summary>Durée du contour en minutes (ex. 10, 20, 30).</summary>
    public int Minutes { get; set; }
    /// <summary>Polygone du contour : tableau de [lng, lat]. Stocké en JSONB.</summary>
    public string CoordinatesJson { get; set; } = "[]";
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
