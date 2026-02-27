namespace Trackly.Backend.Features.Auth;

public sealed record RegisterRequest(string CompanyName, string Name, string Email, string Password);

/// <summary>Réponse après inscription : l'utilisateur doit confirmer son email avec le code envoyé.</summary>
public sealed record RegisterPendingResponse(string Email, string Message);

public sealed record VerifyEmailRequest(string Email, string Code);

public sealed record LoginRequest(string Email, string Password);

public sealed record AuthResponse(string Token, Guid TenantId, Guid UserId, string Name, string Email);
