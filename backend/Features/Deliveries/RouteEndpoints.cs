using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Trackly.Backend.Features.Mapbox;
using Trackly.Backend.Features.Orders;
using Trackly.Backend.Infrastructure.Data;
using Trackly.Backend.Infrastructure.MultiTenancy;

namespace Trackly.Backend.Features.Deliveries;

public static class RouteEndpoints
{
    public static IEndpointRouteBuilder MapRouteEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/routes");
        group.MapGet("/", GetRoutes);
        group.MapGet("/{id:guid}", GetRoute);
        group.MapGet("/{routeId:guid}/travel-times", GetRouteTravelTimes);
        group.MapGet("/{routeId:guid}/travel-times-matrix", GetRouteTravelTimesMatrix);
        group.MapGet("/{routeId:guid}/route-geometry", GetRouteGeometry);
        group.MapPatch("/{routeId:guid}", UpdateRoute);
        group.MapPatch("/{routeId:guid}/deliveries/order", ReorderDeliveries);
        return app;
    }

    /// <summary>
    /// Liste des tournées. Filtres optionnels : dateFrom, dateTo (ISO 8601), driverId.
    /// </summary>
    private static async Task<IResult> GetRoutes(
        TracklyDbContext dbContext,
        TenantContext tenantContext,
        DateTimeOffset? dateFrom,
        DateTimeOffset? dateTo,
        Guid? driverId,
        CancellationToken cancellationToken)
    {
        if (tenantContext.TenantId == Guid.Empty)
        {
            return Results.BadRequest("TenantId manquant.");
        }

        var query = dbContext.Routes
            .AsNoTracking()
            .Where(r => r.TenantId == tenantContext.TenantId && r.DeletedAt == null);

        if (dateFrom.HasValue)
            query = query.Where(r => r.CreatedAt >= dateFrom.Value);
        if (dateTo.HasValue)
            query = query.Where(r => r.CreatedAt <= dateTo.Value);
        if (driverId.HasValue && driverId.Value != Guid.Empty)
            query = query.Where(r => r.DriverId == driverId.Value);

        var routes = await query
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(cancellationToken);

        if (routes.Count == 0)
        {
            return Results.Ok(new RouteListResponse());
        }

        var routeIds = routes.Select(r => r.Id).ToList();
        var counts = await dbContext.Deliveries
            .AsNoTracking()
            .Where(d => d.RouteId != null && routeIds.Contains(d.RouteId.Value) && d.DeletedAt == null)
            .GroupBy(d => d.RouteId!.Value)
            .Select(g => new { RouteId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.RouteId, x => x.Count, cancellationToken);

        // Récupérer les statuts des livraisons par tournée
        var deliveriesByRoute = await dbContext.Deliveries
            .AsNoTracking()
            .Where(d => d.RouteId != null && routeIds.Contains(d.RouteId.Value) && d.DeletedAt == null)
            .GroupBy(d => d.RouteId!.Value)
            .Select(g => new
            {
                RouteId = g.Key,
                Pending = g.Count(d => d.Status == DeliveryStatus.Pending),
                InProgress = g.Count(d => d.Status == DeliveryStatus.InProgress),
                Completed = g.Count(d => d.Status == DeliveryStatus.Completed),
                Failed = g.Count(d => d.Status == DeliveryStatus.Failed)
            })
            .ToDictionaryAsync(x => x.RouteId, cancellationToken);

        var driverIds = routes.Select(r => r.DriverId).Distinct().ToList();
        var drivers = await dbContext.Drivers
            .AsNoTracking()
            .Where(d => driverIds.Contains(d.Id))
            .ToDictionaryAsync(d => d.Id, d => d.Name, cancellationToken);

        var responses = routes
            .Select(r =>
            {
                var summary = deliveriesByRoute.TryGetValue(r.Id, out var statusCounts)
                    ? new DeliveryStatusSummary(statusCounts.Pending, statusCounts.InProgress, statusCounts.Completed, statusCounts.Failed)
                    : new DeliveryStatusSummary(0, 0, 0, 0);
                
                return new RouteResponse(
                    r.Id,
                    r.DriverId,
                    r.Name,
                    r.CreatedAt,
                    r.PlannedStartAt,
                    counts.TryGetValue(r.Id, out var c) ? c : 0,
                    drivers.TryGetValue(r.DriverId, out var name) ? name : "Non assigné",
                    summary);
            })
            .ToList();

        return Results.Ok(new RouteListResponse { Routes = responses });
    }

    /// <summary>
    /// Détail d'une tournée avec ses livraisons ordonnées par Sequence.
    /// </summary>
    private static async Task<IResult> GetRoute(
        Guid id,
        TracklyDbContext dbContext,
        TenantContext tenantContext,
        CancellationToken cancellationToken)
    {
        if (tenantContext.TenantId == Guid.Empty)
        {
            return Results.BadRequest("TenantId manquant.");
        }

        var route = await dbContext.Routes
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == id && r.TenantId == tenantContext.TenantId && r.DeletedAt == null, cancellationToken);

        if (route == null)
        {
            return Results.NotFound("Tournée introuvable.");
        }

        var driver = await dbContext.Drivers
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.Id == route.DriverId, cancellationToken);
        var driverName = driver?.Name ?? "Non assigné";

        var deliveries = await dbContext.Deliveries
            .AsNoTracking()
            .Where(d => d.RouteId == route.Id && d.DeletedAt == null)
            .OrderBy(d => d.Sequence ?? int.MaxValue)
            .ThenBy(d => d.CreatedAt)
            .ToListAsync(cancellationToken);

        var orderIds = deliveries.Select(d => d.OrderId).Distinct().ToList();
        var orders = await dbContext.Orders
            .AsNoTracking()
            .Where(o => orderIds.Contains(o.Id) && o.DeletedAt == null)
            .ToDictionaryAsync(o => o.Id, o => new { o.CustomerName, o.Address }, cancellationToken);

        var deliveryResponses = deliveries
            .Select(d =>
            {
                string customerName = "Inconnu";
                string address = "Adresse inconnue";
                if (orders.TryGetValue(d.OrderId, out var o))
                {
                    customerName = o.CustomerName ?? customerName;
                    address = o.Address ?? address;
                }
                return new DeliveryInRouteResponse(
                    d.Id,
                    d.OrderId,
                    d.Sequence,
                    d.Status,
                    d.CreatedAt,
                    d.CompletedAt,
                    customerName,
                    address);
            })
            .ToList();

        return Results.Ok(new RouteDetailResponse(
            route.Id,
            route.DriverId,
            route.Name,
            route.CreatedAt,
            route.PlannedStartAt,
            driverName,
            deliveryResponses));
    }

    /// <summary>
    /// Met à jour une tournée (nom, heure de début prévue). Body : { "name": "...", "plannedStartAt": "ISO8601" }.
    /// </summary>
    private static async Task<IResult> UpdateRoute(
        Guid routeId,
        UpdateRouteRequest request,
        TracklyDbContext dbContext,
        TenantContext tenantContext,
        CancellationToken cancellationToken)
    {
        if (tenantContext.TenantId == Guid.Empty)
            return Results.BadRequest("TenantId manquant.");

        var route = await dbContext.Routes
            .FirstOrDefaultAsync(r => r.Id == routeId && r.TenantId == tenantContext.TenantId && r.DeletedAt == null, cancellationToken);
        if (route == null)
            return Results.NotFound("Tournée introuvable.");

        if (request.Name != null)
            route.Name = request.Name.Trim().Length > 0 ? request.Name.Trim() : null;
        if (request.PlannedStartAt.HasValue)
            route.PlannedStartAt = request.PlannedStartAt;

        await dbContext.SaveChangesAsync(cancellationToken);
        return Results.Ok(new { message = "Tournée mise à jour." });
    }

    /// <summary>
    /// Réordonne les livraisons d'une tournée. Body : { "deliveryIds": ["guid", ...] }.
    /// </summary>
    private static async Task<IResult> ReorderDeliveries(
        Guid routeId,
        ReorderRouteDeliveriesRequest request,
        TracklyDbContext dbContext,
        TenantContext tenantContext,
        CancellationToken cancellationToken)
    {
        if (tenantContext.TenantId == Guid.Empty)
        {
            return Results.BadRequest("TenantId manquant.");
        }

        if (request.DeliveryIds == null || request.DeliveryIds.Count == 0)
        {
            return Results.BadRequest("Aucune livraison fournie.");
        }

        var route = await dbContext.Routes
            .FirstOrDefaultAsync(r => r.Id == routeId && r.TenantId == tenantContext.TenantId && r.DeletedAt == null, cancellationToken);

        if (route == null)
        {
            return Results.NotFound("Tournée introuvable.");
        }

        var deliveries = await dbContext.Deliveries
            .Where(d => d.RouteId == routeId && d.TenantId == tenantContext.TenantId && d.DeletedAt == null)
            .ToListAsync(cancellationToken);

        var deliveryIdsSet = deliveries.Select(d => d.Id).ToHashSet();
        if (request.DeliveryIds.Count != deliveryIdsSet.Count || request.DeliveryIds.Any(id => !deliveryIdsSet.Contains(id)))
        {
            return Results.BadRequest("La liste des livraisons doit contenir exactement les livraisons de cette tournée.");
        }

        for (var i = 0; i < request.DeliveryIds.Count; i++)
        {
            var delivery = deliveries.First(d => d.Id == request.DeliveryIds[i]);
            delivery.Sequence = i;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return Results.Ok(new { message = "Ordre mis à jour." });
    }

    /// <summary>
    /// Résout les coordonnées pour une tournée : siège (si configuré) puis livraisons par Sequence.
    /// Utilise Order.Lat/Lng si présents, sinon géocode l'adresse via Nominatim à la volée (résultat mis en cache).
    /// </summary>
    private static async Task<(List<(double Lng, double Lat)>? Coords, string? Error)> ResolveRouteCoordinatesAsync(
        Guid routeId,
        TracklyDbContext dbContext,
        TenantContext tenantContext,
        IHttpClientFactory httpClientFactory,
        IMemoryCache cache,
        CancellationToken cancellationToken)
    {
        var route = await dbContext.Routes
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == routeId && r.TenantId == tenantContext.TenantId && r.DeletedAt == null, cancellationToken);
        if (route == null)
            return (null, "Tournée introuvable.");

        var tenant = await dbContext.Tenants
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == tenantContext.TenantId, cancellationToken);
        if (tenant == null)
            return (null, "Tenant introuvable.");

        var deliveries = await dbContext.Deliveries
            .AsNoTracking()
            .Where(d => d.RouteId == route.Id && d.DeletedAt == null)
            .OrderBy(d => d.Sequence ?? int.MaxValue)
            .ThenBy(d => d.CreatedAt)
            .ToListAsync(cancellationToken);

        var orderIds = deliveries.Select(d => d.OrderId).Distinct().ToList();
        var orders = await dbContext.Orders
            .AsNoTracking()
            .Where(o => orderIds.Contains(o.Id) && o.DeletedAt == null)
            .ToDictionaryAsync(o => o.Id, cancellationToken);

        var coords = new List<(double Lng, double Lat)>();

        if (tenant.HeadquartersLat.HasValue && tenant.HeadquartersLng.HasValue)
        {
            coords.Add((tenant.HeadquartersLng.Value, tenant.HeadquartersLat.Value));
        }

        var nominatim = httpClientFactory.CreateClient("Nominatim");
        foreach (var d in deliveries)
        {
            if (!orders.TryGetValue(d.OrderId, out var order))
                return (null, "Commande introuvable pour une livraison.");
            double lat, lng;
            if (order.Lat.HasValue && order.Lng.HasValue)
            {
                lat = order.Lat.Value;
                lng = order.Lng.Value;
            }
            else
            {
                if (string.IsNullOrWhiteSpace(order.Address))
                    return (null, "Coordonnées manquantes pour une ou plusieurs adresses. Vérifiez le siège social et le géocodage des commandes.");
                var (geocoded, fromCache) = await GeocodeAddressWithNominatimAsync(nominatim, order.Address, cache, cancellationToken);
                if (geocoded == null)
                    return (null, $"Adresse introuvable pour le géocodage : \"{order.Address.Trim()}\". Vérifiez l'adresse ou renseignez lat/lng sur la commande.");
                (lat, lng) = geocoded.Value;
                if (!fromCache)
                    await Task.Delay(1100, cancellationToken);
            }
            coords.Add((lng, lat));
        }

        if (coords.Count < 2)
            return (null, "Au moins deux points sont nécessaires (siège + une livraison, ou deux livraisons).");

        // Ajouter le retour au siège pour que l'itinéraire et les temps incluent le trajet retour sur les cartes
        if (tenant.HeadquartersLat.HasValue && tenant.HeadquartersLng.HasValue && deliveries.Count > 0)
            coords.Add((tenant.HeadquartersLng.Value, tenant.HeadquartersLat.Value));

        return (coords, null);
    }

    /// <summary>
    /// Résout les coordonnées pour la matrice : siège puis livraisons triées par Id (ordre canonique).
    /// Retourne (coords, pointIds) avec pointIds[0] = "depot" et pointIds[1..n] = delivery Id.
    /// </summary>
    private static async Task<(List<(double Lng, double Lat)>? Coords, List<string>? PointIds, string? Error)> ResolveRouteCoordinatesForMatrixAsync(
        Guid routeId,
        TracklyDbContext dbContext,
        TenantContext tenantContext,
        IHttpClientFactory httpClientFactory,
        IMemoryCache cache,
        CancellationToken cancellationToken)
    {
        var route = await dbContext.Routes
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == routeId && r.TenantId == tenantContext.TenantId && r.DeletedAt == null, cancellationToken);
        if (route == null)
            return (null, null, "Tournée introuvable.");

        var tenant = await dbContext.Tenants
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == tenantContext.TenantId, cancellationToken);
        if (tenant == null)
            return (null, null, "Tenant introuvable.");

        var deliveries = await dbContext.Deliveries
            .AsNoTracking()
            .Where(d => d.RouteId == route.Id && d.DeletedAt == null)
            .OrderBy(d => d.Id)
            .ToListAsync(cancellationToken);

        var orderIds = deliveries.Select(d => d.OrderId).Distinct().ToList();
        var orders = await dbContext.Orders
            .AsNoTracking()
            .Where(o => orderIds.Contains(o.Id) && o.DeletedAt == null)
            .ToDictionaryAsync(o => o.Id, cancellationToken);

        var coords = new List<(double Lng, double Lat)>();
        var pointIds = new List<string> { "depot" };

        if (tenant.HeadquartersLat.HasValue && tenant.HeadquartersLng.HasValue)
            coords.Add((tenant.HeadquartersLng.Value, tenant.HeadquartersLat.Value));
        else
            return (null, null, "Siège social requis pour la matrice des temps.");

        var nominatim = httpClientFactory.CreateClient("Nominatim");
        foreach (var d in deliveries)
        {
            if (!orders.TryGetValue(d.OrderId, out var order))
                return (null, null, "Commande introuvable pour une livraison.");
            double lat, lng;
            if (order.Lat.HasValue && order.Lng.HasValue)
            {
                lat = order.Lat.Value;
                lng = order.Lng.Value;
            }
            else
            {
                if (string.IsNullOrWhiteSpace(order.Address))
                    return (null, null, "Coordonnées manquantes pour une ou plusieurs adresses. Vérifiez le siège social et le géocodage des commandes.");
                var (geocoded, fromCache) = await GeocodeAddressWithNominatimAsync(nominatim, order.Address, cache, cancellationToken);
                if (geocoded == null)
                    return (null, null, $"Adresse introuvable pour le géocodage : \"{order.Address.Trim()}\".");
                (lat, lng) = geocoded.Value;
                if (!fromCache)
                    await Task.Delay(1100, cancellationToken);
            }
            coords.Add((lng, lat));
            pointIds.Add(d.Id.ToString());
        }

        if (coords.Count < 2)
            return (null, null, "Au moins deux points sont nécessaires (siège + une livraison).");

        return (coords, pointIds, null);
    }

    private static readonly TimeSpan NominatimCacheTtl = TimeSpan.FromHours(24);

    private static string BuildNominatimCacheKey(string address)
    {
        var normalized = address.Trim();
        if (normalized.Length == 0) return "nominatim:geocode:empty";
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(normalized));
        return "nominatim:geocode:" + Convert.ToHexString(hash).AsSpan(0, 32).ToString();
    }

    /// <summary>
    /// Géocode une adresse via Nominatim. Si cache est fourni, le résultat est mis en cache (TTL 24 h).
    /// Retourne (résultat, fromCache) pour permettre d'éviter le délai 1 req/s quand le résultat vient du cache.
    /// </summary>
    private static async Task<((double Lat, double Lng)? Result, bool FromCache)> GeocodeAddressWithNominatimAsync(
        HttpClient nominatim,
        string address,
        IMemoryCache? cache,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(address) || address.Trim().Length < 3)
            return (null, false);
        var key = BuildNominatimCacheKey(address);
        if (cache != null && cache.TryGetValue<(double Lat, double Lng)>(key, out var cached))
            return (cached, true);
        var encoded = Uri.EscapeDataString(address.Trim());
        var url = $"search?q={encoded}&format=json&limit=1";
        try
        {
            var response = await nominatim.GetAsync(url, cancellationToken).ConfigureAwait(false);
            if (!response.IsSuccessStatusCode) return (null, false);
            var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            var results = JsonSerializer.Deserialize<NominatimResult[]>(json, options);
            if (results == null || results.Length == 0) return (null, false);
            var first = results[0];
            if (double.TryParse(first.Lat, NumberStyles.Any, CultureInfo.InvariantCulture, out var lat) &&
                double.TryParse(first.Lon, NumberStyles.Any, CultureInfo.InvariantCulture, out var lon))
            {
                var coords = (lat, lon);
                if (cache != null)
                    cache.Set(key, coords, new MemoryCacheEntryOptions { AbsoluteExpirationRelativeToNow = NominatimCacheTtl });
                return (coords, false);
            }
            return (null, false);
        }
        catch
        {
            return (null, false);
        }
    }

    private sealed class NominatimResult
    {
        [JsonPropertyName("lat")]
        public string? Lat { get; set; }
        [JsonPropertyName("lon")]
        public string? Lon { get; set; }
    }

    private static string BuildRouteCacheKey(IReadOnlyList<(double Lng, double Lat)> coords)
    {
        var sb = new StringBuilder();
        foreach (var c in coords)
            sb.AppendFormat(CultureInfo.InvariantCulture, "{0:F5},{1:F5}|", c.Lng, c.Lat);
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(sb.ToString()));
        return "mapbox:route:" + Convert.ToHexString(hash).AsSpan(0, 32).ToString();
    }

    private static readonly TimeSpan MapboxRouteCacheTtl = TimeSpan.FromHours(1);
    private static readonly TimeSpan MapboxMatrixCacheTtl = TimeSpan.FromHours(1);

    /// <summary>
    /// GET /api/routes/{routeId}/travel-times-matrix — Matrice des temps entre tous les points (siège + livraisons).
    /// Un seul appel Mapbox Matrix ; le front peut dériver les temps pour tout ordre de passage sans rappel API.
    /// </summary>
    private static async Task<IResult> GetRouteTravelTimesMatrix(
        Guid routeId,
        TracklyDbContext dbContext,
        TenantContext tenantContext,
        IHttpClientFactory httpClientFactory,
        IMemoryCache cache,
        IMapboxService mapboxService,
        CancellationToken cancellationToken)
    {
        if (tenantContext.TenantId == Guid.Empty)
            return Results.BadRequest("TenantId manquant.");

        var (coords, pointIds, error) = await ResolveRouteCoordinatesForMatrixAsync(routeId, dbContext, tenantContext, httpClientFactory, cache, cancellationToken);
        if (error != null || coords == null || pointIds == null)
            return Results.NotFound(error ?? "Coordonnées indisponibles.");

        if (!mapboxService.IsConfigured)
            return Results.Json(new { pointIds, durations = Array.Empty<object>(), distances = (object?)null, message = "Mapbox non configuré." });

        var matrixCacheKey = "mapbox:matrix:" + BuildRouteCacheKey(coords);
        var matrixResult = await cache.GetOrCreateAsync(matrixCacheKey, async entry =>
        {
            entry!.AbsoluteExpirationRelativeToNow = MapboxMatrixCacheTtl;
            return await mapboxService.GetMatrixAsync(coords, "mapbox/driving", cancellationToken);
        });
        if (matrixResult == null)
            return Results.NotFound("Impossible de calculer la matrice des temps.");

        var n = pointIds.Count;
        var durations = new double[n][];
        for (var i = 0; i < n && i < matrixResult.Durations.Count; i++)
        {
            var row = matrixResult.Durations[i];
            durations[i] = new double[n];
            for (var j = 0; j < n && j < row.Count; j++)
                durations[i][j] = row[j] ?? 0;
        }
        double[][]? distances = null;
        if (matrixResult.Distances != null)
        {
            distances = new double[n][];
            for (var i = 0; i < n && i < matrixResult.Distances.Count; i++)
            {
                var row = matrixResult.Distances[i];
                distances[i] = new double[n];
                for (var j = 0; j < n && j < row.Count; j++)
                    distances[i][j] = row[j] ?? 0;
            }
        }
        return Results.Ok(new { pointIds, durations, distances });
    }

    /// <summary>
    /// GET /api/routes/{routeId}/travel-times — Temps de trajet entre chaque paire consécutive + durée totale.
    /// </summary>
    private static async Task<IResult> GetRouteTravelTimes(
        Guid routeId,
        TracklyDbContext dbContext,
        TenantContext tenantContext,
        IHttpClientFactory httpClientFactory,
        IMemoryCache cache,
        IMapboxService mapboxService,
        CancellationToken cancellationToken)
    {
        if (tenantContext.TenantId == Guid.Empty)
            return Results.BadRequest("TenantId manquant.");

        var (coords, error) = await ResolveRouteCoordinatesAsync(routeId, dbContext, tenantContext, httpClientFactory, cache, cancellationToken);
        if (error != null || coords == null)
            return Results.NotFound(error ?? "Coordonnées indisponibles.");

        if (!mapboxService.IsConfigured)
            return Results.Json(new { legs = Array.Empty<object>(), totalDurationSeconds = 0d, message = "Mapbox non configuré." });

        var routeCacheKey = BuildRouteCacheKey(coords);
        var routeResult = await cache.GetOrCreateAsync(routeCacheKey, async entry =>
        {
            entry!.AbsoluteExpirationRelativeToNow = MapboxRouteCacheTtl;
            return await mapboxService.GetRouteAsync(coords, "mapbox/driving", cancellationToken);
        });
        if (routeResult == null)
            return Results.Json(new { legs = Array.Empty<object>(), totalDurationSeconds = 0d, message = "Impossible de calculer l'itinéraire." });

        var legs = routeResult.Legs.Select(l => new
        {
            fromIndex = l.FromIndex,
            toIndex = l.ToIndex,
            durationSeconds = l.DurationSeconds,
            distanceMeters = l.DistanceMeters
        }).ToList();

        return Results.Ok(new
        {
            legs,
            totalDurationSeconds = routeResult.DurationSeconds,
            totalDistanceMeters = routeResult.DistanceMeters
        });
    }

    /// <summary>
    /// GET /api/routes/{routeId}/route-geometry — Géométrie (polyligne) pour afficher l'itinéraire sur la carte.
    /// </summary>
    private static async Task<IResult> GetRouteGeometry(
        Guid routeId,
        TracklyDbContext dbContext,
        TenantContext tenantContext,
        IHttpClientFactory httpClientFactory,
        IMemoryCache cache,
        IMapboxService mapboxService,
        CancellationToken cancellationToken)
    {
        if (tenantContext.TenantId == Guid.Empty)
            return Results.BadRequest("TenantId manquant.");

        var (coords, error) = await ResolveRouteCoordinatesAsync(routeId, dbContext, tenantContext, httpClientFactory, cache, cancellationToken);
        if (error != null || coords == null)
            return Results.NotFound(error ?? "Coordonnées indisponibles.");

        if (!mapboxService.IsConfigured)
            return Results.NotFound("Mapbox non configuré.");

        var routeCacheKey = BuildRouteCacheKey(coords);
        var routeResult = await cache.GetOrCreateAsync(routeCacheKey, async entry =>
        {
            entry!.AbsoluteExpirationRelativeToNow = MapboxRouteCacheTtl;
            return await mapboxService.GetRouteAsync(coords, "mapbox/driving", cancellationToken);
        });
        if (routeResult == null || routeResult.Coordinates.Count == 0)
            return Results.NotFound("Impossible de calculer l'itinéraire.");

        var legsWithCoords = routeResult.Legs
            .Where(l => l.LegCoordinates != null && l.LegCoordinates.Count > 0)
            .Select(l => new { coordinates = l.LegCoordinates })
            .ToList();

        return Results.Ok(new
        {
            coordinates = routeResult.Coordinates,
            durationSeconds = routeResult.DurationSeconds,
            distanceMeters = routeResult.DistanceMeters,
            legs = legsWithCoords
        });
    }
}
