namespace Trackly.Backend.Features.Email;

/// <summary>
/// Service d'envoi d'emails (Resend). Utilisé pour la vérification d'inscription et tout autre email.
/// </summary>
public interface IEmailService
{
    /// <summary>
    /// Envoie l'email contenant le code de vérification à 6 chiffres après inscription.
    /// </summary>
    Task SendVerificationCodeAsync(string toEmail, string code, CancellationToken cancellationToken = default);
}
