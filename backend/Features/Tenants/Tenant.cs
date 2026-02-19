namespace Trackly.Backend.Features.Tenants;

public sealed class Tenant
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public SubscriptionPlan SubscriptionPlan { get; set; } = SubscriptionPlan.Starter;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    /// <summary>Adresse du siège social (affichage et recherche).</summary>
    public string? HeadquartersAddress { get; set; }
    /// <summary>Latitude du siège social (pour la carte et isochrones).</summary>
    public double? HeadquartersLat { get; set; }
    /// <summary>Longitude du siège social.</summary>
    public double? HeadquartersLng { get; set; }
}

public enum SubscriptionPlan
{
    Starter = 0,
    Pro = 1
}
