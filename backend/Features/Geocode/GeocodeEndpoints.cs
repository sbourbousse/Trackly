using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Trackly.Backend.Features.Geocode;

public static class GeocodeEndpoints
{
    private const string NominatimBase = "https://nominatim.openstreetmap.org";

    public static IEndpointRouteBuilder MapGeocodeEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/geocode");
        group.MapGet("/", GeocodeAddress);
        return app;
    }

    /// <summary>
    /// Géocodage d'une adresse via Nominatim (OpenStreetMap). Retourne lat, lng et displayName pour afficher un marqueur sur la carte.
    /// </summary>
    private static async Task<IResult> GeocodeAddress(
        string? address,
        [FromServices] IHttpClientFactory httpClientFactory,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(address))
        {
            return Results.BadRequest("Le paramètre 'address' est requis.");
        }

        var query = address.Trim();
        if (query.Length < 3)
        {
            return Results.BadRequest("L'adresse doit contenir au moins 3 caractères.");
        }

        var client = httpClientFactory.CreateClient("Nominatim");
        var encoded = Uri.EscapeDataString(query);
        var url = $"{NominatimBase}/search?q={encoded}&format=json&limit=1";

        try
        {
            var response = await client.GetAsync(url, cancellationToken);
            response.EnsureSuccessStatusCode();
            var json = await response.Content.ReadAsStringAsync(cancellationToken);
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            var results = JsonSerializer.Deserialize<NominatimResult[]>(json, options);

            if (results == null || results.Length == 0)
            {
                return Results.Ok(new GeocodeResponse(null, null, null));
            }

            var first = results[0];
            var lat = double.TryParse(first.Lat, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var la) ? la : (double?)null;
            var lon = double.TryParse(first.Lon, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var lo) ? lo : (double?)null;
            return Results.Ok(new GeocodeResponse(lat, lon, first.DisplayName));
        }
        catch (HttpRequestException)
        {
            return Results.Problem("Service de géocodage indisponible.", statusCode: StatusCodes.Status502BadGateway);
        }
    }

    private sealed class NominatimResult
    {
        [JsonPropertyName("lat")]
        public string? Lat { get; set; }
        [JsonPropertyName("lon")]
        public string? Lon { get; set; }
        [JsonPropertyName("display_name")]
        public string? DisplayName { get; set; }
    }

    public sealed record GeocodeResponse(double? Lat, double? Lng, string? DisplayName);
}
