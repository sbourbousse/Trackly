using Trackly.Backend.Features.Deliveries;
using Trackly.Backend.Features.Drivers;
using Trackly.Backend.Features.Orders;
using Trackly.Backend.Features.Tenants;
using RouteEntity = Trackly.Backend.Features.Deliveries.Route;

namespace Trackly.Backend.Infrastructure.Data;

/// <summary>
/// Dataset de démo réaliste pour Montpellier
/// Contient des adresses réelles avec coordonnées GPS authentiques
/// </summary>
public static class DemoData
{
    // ============================================================================
    // ADRESSES RÉELLES DE MONTPELLIER AVEC COORDONNÉES GPS
    // ============================================================================
    
    public static readonly List<MontpellierAddress> Addresses = new()
    {
        // Centre-ville historique
        new("Place de la Comédie", "34000", "Montpellier", 43.6086, 3.8796, "Centre-ville"),
        new("1 Rue de la Loge", "34000", "Montpellier", 43.6082, 3.8789, "Centre-ville"),
        new("15 Rue Foch", "34000", "Montpellier", 43.6101, 3.8764, "Centre-ville"),
        new("8 Rue de l'Ancien Courrier", "34000", "Montpellier", 43.6075, 3.8775, "Centre-ville"),
        
        // Quartier administratif
        new("50 Allée de la Cité Administrative", "34000", "Montpellier", 43.6142, 3.8845, "Antigone"),
        new("25 Avenue de la République", "34000", "Montpellier", 43.6058, 3.8830, "Antigone"),
        
        // Port Marianne
        new("50 Rue de la République", "34000", "Montpellier", 43.6036, 3.8967, "Port Marianne"),
        new("120 Avenue de la Liberté", "34000", "Montpellier", 43.5998, 3.8985, "Port Marianne"),
        new("25 Quai du Levant", "34000", "Montpellier", 43.6012, 3.8954, "Port Marianne"),
        
        // Odysseum
        new("2 Place de l'Europe", "34000", "Montpellier", 43.6030, 3.9200, "Odysseum"),
        new("150 Allée de la Grande Borne", "34000", "Montpellier", 43.6045, 3.9175, "Odysseum"),
        
        // Quartiers résidentiels
        new("100 Rue de la Croix de Figuerolles", "34070", "Montpellier", 43.6115, 3.8612, "Figuerolles"),
        new("45 Rue de Verdun", "34000", "Montpellier", 43.6128, 3.8745, "Beaux-Arts"),
        new("78 Avenue de Toulouse", "34070", "Montpellier", 43.5875, 3.8834, "Celleneuve"),
        
        // Castelnau-le-Lez (périphérie)
        new("125 Avenue de la Colombie", "34170", "Castelnau-le-Lez", 43.6365, 3.9025, "Castelnau-le-Lez"),
        new("15 Rue du Faubourg", "34170", "Castelnau-le-Lez", 43.6380, 3.9060, "Castelnau-le-Lez"),
        
        // Zones commerciales
        new("500 Rue Auguste Broussonnet", "34090", "Montpellier", 43.6150, 3.8550, "Polygone"),
        new("65 Avenue de la Justice", "34000", "Montpellier", 43.6090, 3.8900, "Gambetta"),
    };

    // ============================================================================
    // TENANTS (COMMERÇANTS FICTIONS)
    // ============================================================================
    
    public static readonly List<DemoTenant> Tenants = new()
    {
        new(
            "Boulangerie Dupont",
            SubscriptionPlan.Starter,
            new List<DemoDriver>
            {
                new("Pierre Martin", "+33 6 12 34 56 78"),
                new("Sophie Bernard", "+33 6 23 45 67 89")
            },
            new List<(TimeSpan Start, TimeSpan End, string Zone)>
            {
                (TimeSpan.FromHours(6), TimeSpan.FromHours(10), "Centre-ville"),
                (TimeSpan.FromHours(7), TimeSpan.FromHours(11), "Antigone")
            }
        ),
        new(
            "Fleuriste Martin",
            SubscriptionPlan.Pro,
            new List<DemoDriver>
            {
                new("Julie Petit", "+33 6 34 56 78 90"),
                new("Thomas Richard", "+33 6 45 67 89 01"),
                new("Marie Moreau", "+33 6 56 78 90 12")
            },
            new List<(TimeSpan Start, TimeSpan End, string Zone)>
            {
                (TimeSpan.FromHours(9), TimeSpan.FromHours(13), "Port Marianne"),
                (TimeSpan.FromHours(14), TimeSpan.FromHours(18), "Centre-ville"),
                (TimeSpan.FromHours(10), TimeSpan.FromHours(16), "Castelnau-le-Lez")
            }
        ),
        new(
            "Cave à Vin Languedoc",
            SubscriptionPlan.Pro,
            new List<DemoDriver>
            {
                new("Nicolas Roux", "+33 6 67 89 01 23"),
                new("Camille Dubois", "+33 6 78 90 12 34")
            },
            new List<(TimeSpan Start, TimeSpan End, string Zone)>
            {
                (TimeSpan.FromHours(14), TimeSpan.FromHours(19), "Centre-ville"),
                (TimeSpan.FromHours(15), TimeSpan.FromHours(20), "Odysseum")
            }
        ),
        new(
            "Librairie Centre-Ville",
            SubscriptionPlan.Starter,
            new List<DemoDriver>
            {
                new("Alexandre Leroy", "+33 6 89 01 23 45")
            },
            new List<(TimeSpan Start, TimeSpan End, string Zone)>
            {
                (TimeSpan.FromHours(8), TimeSpan.FromHours(12), "Centre-ville"),
                (TimeSpan.FromHours(13), TimeSpan.FromHours(17), "Antigone"),
                (TimeSpan.FromHours(10), TimeSpan.FromHours(15), "Polygone")
            }
        )
    };

    // ============================================================================
    // NOMS DE CLIENTS POUR LES COMMANDES
    // ============================================================================
    
    public static readonly List<string> CustomerNames = new()
    {
        "Jean Dupuis",
        "Marie Laurent",
        "Philippe Garcia",
        "Sandrine Michel",
        "François Lefebvre",
        "Isabelle Durand",
        "Christophe Simon",
        "Nathalie Rousseau",
        "Éric Fontaine",
        "Valérie Chevalier",
        "Stéphane Mercier",
        "Céline Garnier",
        "Laurent Brun",
        "Audrey Henry",
        "Sébastien Faure",
        "Caroline Perrin",
        "David Cohen",
        "Sophie Masson",
        "Nicolas Fabre",
        "Emma Lemoine",
        "Antoine Rey",
        "Marion Aubert",
        "Romain Collet",
        "Julie Perrot",
        "Maxime Chauvet"
    };

    // ============================================================================
    // MÉTHODES UTILITAIRES
    // ============================================================================

    /// <summary>
    /// Récupère les adresses d'une zone géographique spécifique
    /// </summary>
    public static List<MontpellierAddress> GetAddressesByZone(string zone)
    {
        return Addresses.Where(a => a.Zone.Equals(zone, StringComparison.OrdinalIgnoreCase)).ToList();
    }

    /// <summary>
    /// Récupère les adresses proches d'une coordonnée (pour créer des tournées logiques)
    /// </summary>
    public static List<MontpellierAddress> GetNearbyAddresses(double lat, double lon, double maxDistanceKm = 2.0)
    {
        return Addresses
            .Where(a => CalculateDistance(lat, lon, a.Latitude, a.Longitude) <= maxDistanceKm)
            .OrderBy(a => CalculateDistance(lat, lon, a.Latitude, a.Longitude))
            .ToList();
    }

    /// <summary>
    /// Calcule la distance entre deux points GPS (formule de Haversine)
    /// </summary>
    public static double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
    {
        const double R = 6371; // Rayon de la Terre en km
        var dLat = ToRad(lat2 - lat1);
        var dLon = ToRad(lon2 - lon1);
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(ToRad(lat1)) * Math.Cos(ToRad(lat2)) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return R * c;
    }

    private static double ToRad(double degrees) => degrees * Math.PI / 180;

    /// <summary>
    /// Génère une date de commande cohérente avec le créneau horaire du commerçant
    /// </summary>
    public static DateTimeOffset GenerateOrderDateTime(DateTime baseDate, TimeSpan deliveryStart, TimeSpan deliveryEnd)
    {
        // La commande est passée entre 1h et 3h avant le début de la livraison
        var random = new Random();
        var hoursBefore = random.Next(1, 4);
        var minutesVariation = random.Next(0, 60);
        
        var orderTime = deliveryStart.Subtract(TimeSpan.FromHours(hoursBefore)).Subtract(TimeSpan.FromMinutes(minutesVariation));
        
        // Si c'est avant 6h, on remet à la veille
        if (orderTime.Hours < 6)
        {
            baseDate = baseDate.AddDays(-1);
            orderTime = TimeSpan.FromHours(18 + random.Next(0, 6));
        }
        
        return new DateTimeOffset(baseDate.Date.Add(orderTime), TimeSpan.FromHours(1)); // UTC+1 pour Paris
    }
}

// ============================================================================
// CLASSES DE DONNÉES
// ============================================================================

public record MontpellierAddress(
    string Street,
    string PostalCode,
    string City,
    double Latitude,
    double Longitude,
    string Zone
)
{
    public string FullAddress => $"{Street}, {PostalCode} {City}";
}

public record DemoDriver(string Name, string Phone);

public record DemoTenant(
    string Name,
    SubscriptionPlan Plan,
    List<DemoDriver> Drivers,
    List<(TimeSpan Start, TimeSpan End, string Zone)> DeliverySlots
);
