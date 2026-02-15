using System.Globalization;
using System.Text.Json;

namespace Trackly.Backend.Features.Mapbox;

public sealed class MapboxService : IMapboxService
{
    private readonly HttpClient _httpClient;
    private readonly string? _accessToken;

    public MapboxService(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _accessToken = configuration["MAPBOX_ACCESS_TOKEN"]
            ?? Environment.GetEnvironmentVariable("MAPBOX_ACCESS_TOKEN");
    }

    public bool IsConfigured => !string.IsNullOrWhiteSpace(_accessToken);

    public async Task<MapboxMatrixResult?> GetMatrixAsync(
        IReadOnlyList<(double Lng, double Lat)> coordinates,
        string profile = "mapbox/driving",
        CancellationToken cancellationToken = default)
    {
        if (!IsConfigured || coordinates.Count < 2)
            return null;

        var maxPoints = profile == "mapbox/driving-traffic" ? 10 : 25;
        var coords = coordinates.Count > maxPoints
            ? coordinates.Take(maxPoints).ToList()
            : coordinates.ToList();

        var coordsStr = string.Join(";", coords.Select(c => FormatLngLat(c.Lng, c.Lat)));
        var url = $"directions-matrix/v1/{profile}/{coordsStr}?annotations=duration,distance&access_token={_accessToken}";

        try
        {
            var response = await _httpClient.GetAsync(url, cancellationToken).ConfigureAwait(false);
            if (!response.IsSuccessStatusCode)
                return null;

            var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;
            if (root.TryGetProperty("code", out var code) && code.GetString() != "Ok")
                return null;

            if (!root.TryGetProperty("durations", out var durationsEl))
                return null;

            var durations = ParseMatrix(durationsEl);
            var distances = root.TryGetProperty("distances", out var distEl) ? ParseMatrix(distEl) : null;
            return new MapboxMatrixResult(durations, distances);
        }
        catch
        {
            return null;
        }
    }

    public async Task<MapboxRouteResult?> GetRouteAsync(
        IReadOnlyList<(double Lng, double Lat)> coordinates,
        string profile = "mapbox/driving",
        CancellationToken cancellationToken = default)
    {
        if (!IsConfigured || coordinates.Count < 2)
            return null;

        var coordsStr = string.Join(";", coordinates.Select(c => FormatLngLat(c.Lng, c.Lat)));
        var url = $"directions/v5/{profile}/{coordsStr}?overview=full&geometries=geojson&steps=true&access_token={_accessToken}";

        try
        {
            var response = await _httpClient.GetAsync(url, cancellationToken).ConfigureAwait(false);
            if (!response.IsSuccessStatusCode)
                return null;

            var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;
            if (!root.TryGetProperty("routes", out var routes) || routes.GetArrayLength() == 0)
                return null;

            var route = routes[0];
            var duration = route.TryGetProperty("duration", out var durEl) ? durEl.GetDouble() : 0d;
            var distance = route.TryGetProperty("distance", out var distEl) ? distEl.GetDouble() : 0d;
            if (!route.TryGetProperty("geometry", out var geom) || !geom.TryGetProperty("coordinates", out var coordsEl))
                return null;

            var coords = new List<IReadOnlyList<double>>();
            foreach (var point in coordsEl.EnumerateArray())
            {
                if (point.ValueKind == JsonValueKind.Array && point.GetArrayLength() >= 2)
                {
                    var lng = point[0].GetDouble();
                    var lat = point[1].GetDouble();
                    coords.Add(new[] { lng, lat });
                }
            }

            if (coords.Count == 0)
                return null;

            var legs = new List<MapboxRouteLeg>();
            if (route.TryGetProperty("legs", out var legsEl))
            {
                var idx = 0;
                foreach (var leg in legsEl.EnumerateArray())
                {
                    var legDuration = leg.TryGetProperty("duration", out var ld) ? ld.GetDouble() : 0d;
                    var legDistance = leg.TryGetProperty("distance", out var ldist) ? ldist.GetDouble() : 0d;
                    var legCoords = ParseLegCoordinates(leg);
                    legs.Add(new MapboxRouteLeg(idx, idx + 1, legDuration, legDistance, legCoords));
                    idx++;
                }
            }

            return new MapboxRouteResult(coords, duration, distance, legs);
        }
        catch
        {
            return null;
        }
    }

    public async Task<MapboxIsochroneResult?> GetIsochronesAsync(
        double lng,
        double lat,
        IReadOnlyList<int> contoursMinutes,
        string profile = "mapbox/driving",
        CancellationToken cancellationToken = default)
    {
        if (!IsConfigured || contoursMinutes.Count == 0)
            return null;

        var contoursStr = string.Join(",", contoursMinutes.OrderBy(x => x).Take(4));
        var url = $"isochrone/v1/{profile}/{FormatLngLat(lng, lat)}?contours_minutes={contoursStr}&polygons=true&access_token={_accessToken}";

        try
        {
            var response = await _httpClient.GetAsync(url, cancellationToken).ConfigureAwait(false);
            if (!response.IsSuccessStatusCode)
                return null;

            var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;
            if (!root.TryGetProperty("features", out var features))
                return null;

            var contours = new List<MapboxIsochroneContour>();
            foreach (var feature in features.EnumerateArray())
            {
                var minutes = 0;
                if (feature.TryGetProperty("properties", out var props) && props.TryGetProperty("contour", out var contourEl))
                    minutes = contourEl.GetInt32();

                if (!feature.TryGetProperty("geometry", out var geom) || !geom.TryGetProperty("coordinates", out var coordsEl))
                    continue;

                var coords = ParsePolygonCoordinates(coordsEl);
                if (coords.Count > 0)
                    contours.Add(new MapboxIsochroneContour(minutes, coords));
            }

            return new MapboxIsochroneResult(contours);
        }
        catch
        {
            return null;
        }
    }

    /// <summary>Format lng,lat avec point décimal (InvariantCulture) pour les URLs Mapbox.</summary>
    private static string FormatLngLat(double lng, double lat) =>
        $"{lng.ToString("F5", CultureInfo.InvariantCulture)},{lat.ToString("F5", CultureInfo.InvariantCulture)}";

    private static IReadOnlyList<IReadOnlyList<double?>> ParseMatrix(JsonElement matrixEl)
    {
        var rows = new List<IReadOnlyList<double?>>();
        foreach (var rowEl in matrixEl.EnumerateArray())
        {
            var row = new List<double?>();
            foreach (var cell in rowEl.EnumerateArray())
            {
                if (cell.ValueKind == JsonValueKind.Null || cell.ValueKind == JsonValueKind.Undefined)
                    row.Add(null);
                else if (cell.TryGetDouble(out var d))
                    row.Add(d);
                else
                    row.Add(null);
            }
            rows.Add(row);
        }
        return rows;
    }

    private static IReadOnlyList<IReadOnlyList<double>> ParsePolygonCoordinates(JsonElement coordsEl)
    {
        var result = new List<IReadOnlyList<double>>();
        // GeoJSON Polygon: coordinates[0] is exterior ring (array of [lng, lat])
        if (coordsEl.ValueKind != JsonValueKind.Array)
            return result;
        var ring = coordsEl[0];
        foreach (var point in ring.EnumerateArray())
        {
            if (point.ValueKind == JsonValueKind.Array && point.GetArrayLength() >= 2)
                result.Add(new[] { point[0].GetDouble(), point[1].GetDouble() });
        }
        return result;
    }

    /// <summary>Extrait la géométrie d'un leg en concaténant les coordinates de chaque step.</summary>
    private static IReadOnlyList<IReadOnlyList<double>>? ParseLegCoordinates(JsonElement legEl)
    {
        if (!legEl.TryGetProperty("steps", out var stepsEl))
            return null;
        var result = new List<IReadOnlyList<double>>();
        foreach (var step in stepsEl.EnumerateArray())
        {
            if (!step.TryGetProperty("geometry", out var geom) || !geom.TryGetProperty("coordinates", out var coordsEl))
                continue;
            foreach (var point in coordsEl.EnumerateArray())
            {
                if (point.ValueKind == JsonValueKind.Array && point.GetArrayLength() >= 2)
                    result.Add(new[] { point[0].GetDouble(), point[1].GetDouble() });
            }
        }
        return result.Count > 0 ? result : null;
    }
}
