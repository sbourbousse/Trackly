namespace Trackly.Backend.Features.Email;

/// <summary>
/// Configuration pour l'envoi d'emails via Resend.
/// ApiKey : clé API Resend (variable d'environnement RESEND_APIKEY ou config Resend:ApiKey).
/// From : adresse expéditrice (ex. "Arrivo &lt;contact@arrivo.pro&gt;" ou "Arrivo &lt;onboarding@resend.dev&gt;" pour les tests).
/// </summary>
public class ResendEmailOptions
{
    public const string SectionName = "Resend";

    public string ApiKey { get; set; } = "";
    public string From { get; set; } = "";
}
