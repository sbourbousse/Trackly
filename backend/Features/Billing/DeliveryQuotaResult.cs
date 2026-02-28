namespace Trackly.Backend.Features.Billing;

/// <summary>Quota de livraisons pour l'affichage dashboard (plan, utilisé ce mois, restant).</summary>
public sealed record DeliveryQuotaResult(
    string Plan,
    int? MonthlyLimit,
    int UsedThisMonth,
    int? Remaining
);
