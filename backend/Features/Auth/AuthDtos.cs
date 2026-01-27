namespace Trackly.Backend.Features.Auth;

public sealed record RegisterRequest(string CompanyName, string Name, string Email, string Password);

public sealed record LoginRequest(string Email, string Password);

public sealed record AuthResponse(string Token, Guid TenantId, Guid UserId, string Name, string Email);
