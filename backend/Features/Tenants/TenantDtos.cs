namespace Trackly.Backend.Features.Tenants;

public sealed record TenantRegistrationRequest(string Name, string? Email);

/// <summary>Mise à jour du siège social (adresse et/ou coordonnées).</summary>
public sealed record HeadquartersRequest(string? Address, double? Lat, double? Lng);
