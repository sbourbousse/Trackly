namespace Trackly.Backend.Features.Mapbox;

/// <summary>
/// Service d'appel aux APIs Mapbox (Directions, Matrix, Isochrone).
/// Le token est lu depuis MAPBOX_ACCESS_TOKEN (env ou config).
/// </summary>
public interface IMapboxService
{
    /// <summary>
    /// Indique si le service est configuré (token présent).
    /// </summary>
    bool IsConfigured { get; }

    /// <summary>
    /// Récupère la matrice des durées (et distances) entre les points.
    /// Coordonnées au format [lng, lat]. Max 25 points (10 pour driving-traffic).
    /// </summary>
    /// <param name="coordinates">Liste de coordonnées [lng, lat].</param>
    /// <param name="profile">Profil Mapbox (ex. mapbox/driving).</param>
    /// <param name="cancellationToken">Token d'annulation.</param>
    /// <returns>Matrice des durées (secondes) et distances (mètres), ou null si non configuré/erreur.</returns>
    Task<MapboxMatrixResult?> GetMatrixAsync(
        IReadOnlyList<(double Lng, double Lat)> coordinates,
        string profile = "mapbox/driving",
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Récupère l'itinéraire (géométrie + durée + distance) entre les points dans l'ordre.
    /// Coordonnées au format [lng, lat]. Entre 2 et 25 points.
    /// </summary>
    /// <param name="coordinates">Liste ordonnée de coordonnées [lng, lat].</param>
    /// <param name="profile">Profil Mapbox (ex. mapbox/driving).</param>
    /// <param name="cancellationToken">Token d'annulation.</param>
    /// <returns>Géométrie (coordonnées pour polyligne), durée totale (s), distance (m), ou null.</returns>
    Task<MapboxRouteResult?> GetRouteAsync(
        IReadOnlyList<(double Lng, double Lat)> coordinates,
        string profile = "mapbox/driving",
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Récupère les isochrones (polygones) depuis un point pour les durées données.
    /// </summary>
    /// <param name="lng">Longitude du centre.</param>
    /// <param name="lat">Latitude du centre.</param>
    /// <param name="contoursMinutes">Durées en minutes (ex. 10, 20, 30). Max 4, max 60 min chacune.</param>
    /// <param name="profile">Profil Mapbox (ex. mapbox/driving).</param>
    /// <param name="cancellationToken">Token d'annulation.</param>
    /// <returns>Liste de polygones GeoJSON (coordinates par contour), ou null.</returns>
    Task<MapboxIsochroneResult?> GetIsochronesAsync(
        double lng,
        double lat,
        IReadOnlyList<int> contoursMinutes,
        string profile = "mapbox/driving",
        CancellationToken cancellationToken = default);
}
