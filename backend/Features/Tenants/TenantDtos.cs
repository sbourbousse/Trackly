namespace Trackly.Backend.Features.Tenants;

public sealed record TenantRegistrationRequest(string Name, string? Email);
