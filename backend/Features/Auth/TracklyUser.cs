using Trackly.Backend.Infrastructure.MultiTenancy;

namespace Trackly.Backend.Features.Auth;

public sealed class TracklyUser : ITenantIsolated
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    /// <summary>Code à 6 chiffres envoyé par email pour confirmer l'inscription. Null une fois vérifié.</summary>
    public string? EmailVerificationCode { get; set; }
    public DateTimeOffset? EmailVerificationSentAt { get; set; }
}
