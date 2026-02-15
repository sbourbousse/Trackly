namespace Trackly.Backend.Features.Mapbox;

/// <summary>
/// Résultat de l'API Matrix Mapbox : durées (s) et distances (m) entre paires de points.
/// </summary>
public sealed record MapboxMatrixResult(
    IReadOnlyList<IReadOnlyList<double?>> Durations,
    IReadOnlyList<IReadOnlyList<double?>>? Distances);

/// <summary>
/// Un segment (leg) entre deux waypoints, avec géométrie optionnelle pour affichage par tronçon.
/// </summary>
public sealed record MapboxRouteLeg(
    int FromIndex,
    int ToIndex,
    double DurationSeconds,
    double DistanceMeters,
    IReadOnlyList<IReadOnlyList<double>>? LegCoordinates = null);

/// <summary>
/// Résultat de l'API Directions Mapbox : géométrie pour polyligne + durée totale + distance + legs.
/// </summary>
public sealed record MapboxRouteResult(
    IReadOnlyList<IReadOnlyList<double>> Coordinates,
    double DurationSeconds,
    double DistanceMeters,
    IReadOnlyList<MapboxRouteLeg> Legs);

/// <summary>
/// Un polygone isochrone (contour en minutes + coordonnées).
/// </summary>
public sealed record MapboxIsochroneContour(
    int Minutes,
    IReadOnlyList<IReadOnlyList<double>> Coordinates);

/// <summary>
/// Résultat de l'API Isochrone Mapbox : liste de polygones par contour.
/// </summary>
public sealed record MapboxIsochroneResult(
    IReadOnlyList<MapboxIsochroneContour> Contours);
