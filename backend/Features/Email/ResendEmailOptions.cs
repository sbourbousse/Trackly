namespace Trackly.Backend.Features.Email;

/// <summary>
/// Configuration pour l'envoi d'emails via Resend.
/// ApiKey : RESEND_APIKEY ou Resend:ApiKey.
/// From : expéditeur (RESEND_FROM ou Resend:From), ex. "Arrivo &lt;inscription@arrivo.pro&gt;".
/// </summary>
public class ResendEmailOptions
{
    public const string SectionName = "Resend";

    public string ApiKey { get; set; } = "";
    /// <summary>Adresse expéditrice (inscription, notifications). Variable d'environnement : RESEND_FROM.</summary>
    public string From { get; set; } = "";
}
