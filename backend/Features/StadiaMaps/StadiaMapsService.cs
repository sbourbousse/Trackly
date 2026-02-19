using System.Globalization;
using System.Text;
using System.Text.Json;
using Trackly.Backend.Features.Mapbox;

namespace Trackly.Backend.Features.StadiaMaps;

/// <summary>
/// Implémentation du service de routing (Directions, Matrix, Isochrones) via l'API Stadia Maps.
/// Clé API : STADIA_MAPS_API_KEY (env ou config).
/// </summary>
public sealed class StadiaMapsService : IMapboxService
{
    private readonly HttpClient _httpClient;
    private readonly string? _apiKey;

    public StadiaMapsService(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _apiKey = configuration["STADIA_MAPS_API_KEY"]
            ?? Environment.GetEnvironmentVariable("STADIA_MAPS_API_KEY");
    }

    public bool IsConfigured => !string.IsNullOrWhiteSpace(_apiKey);

    public async Task<MapboxMatrixResult?> GetMatrixAsync(
        IReadOnlyList<(double Lng, double Lat)> coordinates,
        string profile = "mapbox/driving",
        CancellationToken cancellationToken = default)
    {
        if (!IsConfigured || coordinates.Count < 2)
            return null;

        var points = coordinates.Select(c => new { lat = c.Lat, lon = c.Lng }).ToList();
        var body = new
        {
            id = "matrix",
            sources = points,
            targets = points,
            costing = "auto",
            verbose = false
        };
        var json = JsonSerializer.Serialize(body);
        var url = $"matrix/v1?api_key={Uri.EscapeDataString(_apiKey!)}";
        using var content = new StringContent(json, Encoding.UTF8, "application/json");

        try
        {
            var response = await _httpClient.PostAsync(url, content, cancellationToken).ConfigureAwait(false);
            if (!response.IsSuccessStatusCode)
                return null;

            var responseJson = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
            using var doc = JsonDocument.Parse(responseJson);
            var root = doc.RootElement;

            if (!root.TryGetProperty("sources_to_targets", out var stEl))
                return null;

            IReadOnlyList<IReadOnlyList<double?>> durations;
            IReadOnlyList<IReadOnlyList<double?>>? distances = null;
            if (stEl.ValueKind == JsonValueKind.Object)
            {
                if (!stEl.TryGetProperty("durations", out var durEl))
                    return null;
                durations = ParseMatrixResponse(durEl);
                if (stEl.TryGetProperty("distances", out var distEl))
                    distances = ParseMatrixResponse(distEl);
            }
            else
            {
                (durations, distances) = ParseMatrixVerbose(stEl);
            }

            return new MapboxMatrixResult(durations, distances);
        }
        catch
        {
            return null;
        }
    }

    private static IReadOnlyList<IReadOnlyList<double?>> ParseMatrixResponse(JsonElement el)
    {
        var rows = new List<IReadOnlyList<double?>>();
        foreach (var rowEl in el.EnumerateArray())
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

    private static (IReadOnlyList<IReadOnlyList<double?>> durations, IReadOnlyList<IReadOnlyList<double?>>? distances) ParseMatrixVerbose(JsonElement stEl)
    {
        var durations = new List<IReadOnlyList<double?>>();
        var distances = new List<IReadOnlyList<double?>>();
        foreach (var rowEl in stEl.EnumerateArray())
        {
            var durRow = new List<double?>();
            var distRow = new List<double?>();
            foreach (var cell in rowEl.EnumerateArray())
            {
                if (cell.ValueKind != JsonValueKind.Object)
                {
                    durRow.Add(null);
                    distRow.Add(null);
                    continue;
                }
                durRow.Add(cell.TryGetProperty("time", out var t) && t.TryGetDouble(out var tv) ? tv : (double?)null);
                distRow.Add(cell.TryGetProperty("distance", out var d) && d.TryGetDouble(out var dv) ? dv : (double?)null);
            }
            durations.Add(durRow);
            distances.Add(distRow);
        }
        return (durations, distances);
    }

    public async Task<MapboxRouteResult?> GetRouteAsync(
        IReadOnlyList<(double Lng, double Lat)> coordinates,
        string profile = "mapbox/driving",
        CancellationToken cancellationToken = default)
    {
        if (!IsConfigured || coordinates.Count < 2)
            return null;

        var locations = coordinates.Select(c => new
        {
            lat = c.Lat,
            lon = c.Lng,
            type = "break"
        }).ToList();
        var body = new
        {
            id = "route",
            locations,
            costing = "auto",
            units = "kilometers"
        };
        var json = JsonSerializer.Serialize(body);
        var url = $"route/v1?api_key={Uri.EscapeDataString(_apiKey!)}";
        using var content = new StringContent(json, Encoding.UTF8, "application/json");

        try
        {
            var response = await _httpClient.PostAsync(url, content, cancellationToken).ConfigureAwait(false);
            if (!response.IsSuccessStatusCode)
                return null;

            var responseJson = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
            using var doc = JsonDocument.Parse(responseJson);
            var root = doc.RootElement;

            if (!root.TryGetProperty("trip", out var trip))
                return null;

            var (totalDuration, totalDistance, allCoords, legs) = ParseTripLegs(trip);
            if (allCoords.Count == 0)
                return null;

            return new MapboxRouteResult(
                allCoords.Select(c => (IReadOnlyList<double>)c).ToList(),
                totalDuration,
                totalDistance,
                legs);
        }
        catch
        {
            return null;
        }
    }

    private static (double duration, double distance, List<double[]>, List<MapboxRouteLeg>) ParseTripLegs(JsonElement trip)
    {
        double totalDuration = 0;
        double totalDistance = 0;
        var allCoords = new List<double[]>();
        var legs = new List<MapboxRouteLeg>();
        int idx = 0;

        if (trip.TryGetProperty("summary", out var summary))
        {
            totalDuration = summary.TryGetProperty("time", out var t) ? t.GetDouble() : 0;
            totalDistance = summary.TryGetProperty("length", out var l) ? l.GetDouble() * 1000 : 0; // km -> m
        }

        if (!trip.TryGetProperty("legs", out var legsEl))
            return (totalDuration, totalDistance, allCoords, legs);

        foreach (var legEl in legsEl.EnumerateArray())
        {
            var legDuration = legEl.TryGetProperty("summary", out var legSum) && legSum.TryGetProperty("time", out var lt)
                ? lt.GetDouble()
                : 0;
            var legDistance = legEl.TryGetProperty("summary", out var ls) && ls.TryGetProperty("length", out var ll)
                ? ll.GetDouble() * 1000
                : 0;

            IReadOnlyList<IReadOnlyList<double>>? legCoords = null;
            if (legEl.TryGetProperty("shape", out var shapeEl))
            {
                var encoded = shapeEl.GetString();
                var decoded = PolylineDecoder.Decode(encoded ?? "");
                if (decoded.Count > 0)
                {
                    legCoords = decoded.Select(c => (IReadOnlyList<double>)c.ToList()).ToList();
                    foreach (var pt in decoded)
                        allCoords.Add(pt);
                }
            }

            legs.Add(new MapboxRouteLeg(idx, idx + 1, legDuration, legDistance, legCoords));
            idx++;
        }

        if (totalDuration == 0 && legs.Count > 0)
            totalDuration = legs.Sum(l => l.DurationSeconds);
        if (totalDistance == 0 && legs.Count > 0)
            totalDistance = legs.Sum(l => l.DistanceMeters);

        return (totalDuration, totalDistance, allCoords, legs);
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

        var contours = contoursMinutes.OrderBy(x => x).Take(4)
            .Select(m => new { time = m, color = "3366cc" }).ToList();
        var body = new
        {
            id = "isochrone",
            locations = new[] { new { lat, lon = lng } },
            costing = "auto",
            contours,
            polygons = true
        };
        var json = JsonSerializer.Serialize(body);
        var url = $"isochrone/v1?api_key={Uri.EscapeDataString(_apiKey!)}";
        using var content = new StringContent(json, Encoding.UTF8, "application/json");

        try
        {
            var response = await _httpClient.PostAsync(url, content, cancellationToken).ConfigureAwait(false);
            if (!response.IsSuccessStatusCode)
                return null;

            var responseJson = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
            using var doc = JsonDocument.Parse(responseJson);
            var root = doc.RootElement;

            if (!root.TryGetProperty("features", out var features))
                return null;

            var result = new List<MapboxIsochroneContour>();
            foreach (var feature in features.EnumerateArray())
            {
                var minutes = 0;
                if (feature.TryGetProperty("properties", out var props) && props.TryGetProperty("contour", out var cEl))
                    minutes = cEl.ValueKind == JsonValueKind.Number ? cEl.GetInt32() : 0;

                if (!feature.TryGetProperty("geometry", out var geom) || !geom.TryGetProperty("coordinates", out var coordsEl))
                    continue;

                var coords = ParsePolygonCoordinates(coordsEl);
                if (coords.Count > 0)
                    result.Add(new MapboxIsochroneContour(minutes, coords));
            }

            return new MapboxIsochroneResult(result);
        }
        catch
        {
            return null;
        }
    }

    private static IReadOnlyList<IReadOnlyList<double>> ParsePolygonCoordinates(JsonElement coordsEl)
    {
        var result = new List<IReadOnlyList<double>>();
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
}
