namespace Trackly.Backend.Services;

/// <summary>
/// Service de simulation GPS pour les démonstrations produit.
/// Génère des trajectoires réalistes entre points de livraison.
/// </summary>
public interface IGpsSimulationService
{
    /// <summary>
    /// Démarre une simulation de trajet entre deux points
    /// </summary>
    Task<Guid> StartSimulationAsync(SimulationRequest request, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Arrête une simulation en cours
    /// </summary>
    Task StopSimulationAsync(Guid simulationId);
    
    /// <summary>
    /// Récupère la position actuelle d'une simulation
    /// </summary>
    GpsPosition? GetCurrentPosition(Guid simulationId);
    
    /// <summary>
    /// Liste toutes les simulations actives
    /// </summary>
    IReadOnlyList<ActiveSimulation> GetActiveSimulations();
}

/// <summary>
/// Requête de démarrage d'une simulation GPS
/// </summary>
public class SimulationRequest
{
    /// <summary>Point de départ (latitude)</summary>
    public double StartLatitude { get; set; }
    
    /// <summary>Point de départ (longitude)</summary>
    public double StartLongitude { get; set; }
    
    /// <summary>Point d'arrivée (latitude)</summary>
    public double EndLatitude { get; set; }
    
    /// <summary>Point d'arrivée (longitude)</summary>
    public double EndLongitude { get; set; }
    
    /// <summary>Vitesse moyenne en km/h (défaut: 30)</summary>
    public double AverageSpeedKmh { get; set; } = 30;
    
    /// <summary>Intervalle entre les mises à jour en secondes (défaut: 5)</summary>
    public int UpdateIntervalSeconds { get; set; } = 5;
    
    /// <summary>ID de la livraison associée (pour le callback)</summary>
    public Guid? DeliveryId { get; set; }
    
    /// <summary>Tenant ID pour le contexte multi-tenant</summary>
    public Guid? TenantId { get; set; }
    
    /// <summary>Callback appelé à chaque mise à jour de position</summary>
    public Func<GpsPosition, CancellationToken, Task>? OnPositionUpdate { get; set; }
    
    /// <summary>Callback appelé à l'arrivée</summary>
    public Func<CancellationToken, Task>? OnArrival { get; set; }
}

/// <summary>
/// Position GPS avec métadonnées
/// </summary>
public class GpsPosition
{
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public DateTimeOffset Timestamp { get; set; }
    public double SpeedKmh { get; set; }
    public double Heading { get; set; }
    public double DistanceRemainingKm { get; set; }
    public double ProgressPercent { get; set; }
}

/// <summary>
/// Informations sur une simulation active
/// </summary>
public class ActiveSimulation
{
    public Guid Id { get; set; }
    public DateTimeOffset StartedAt { get; set; }
    public GpsPosition CurrentPosition { get; set; } = null!;
    public GpsPosition Destination { get; set; } = null!;
    public double AverageSpeedKmh { get; set; }
    public TimeSpan EstimatedTimeRemaining { get; set; }
}

/// <summary>
/// Implémentation du service de simulation GPS
/// </summary>
public class GpsSimulationService : IGpsSimulationService, IDisposable
{
    private readonly Dictionary<Guid, SimulationState> _activeSimulations = new();
    private readonly ILogger<GpsSimulationService> _logger;
    private readonly Timer _cleanupTimer;
    private readonly object _lock = new();

    public GpsSimulationService(ILogger<GpsSimulationService> logger)
    {
        _logger = logger;
        // Nettoyage périodique des simulations terminées
        _cleanupTimer = new Timer(CleanupCompletedSimulations, null, TimeSpan.FromMinutes(5), TimeSpan.FromMinutes(5));
    }

    public Task<Guid> StartSimulationAsync(SimulationRequest request, CancellationToken cancellationToken = default)
    {
        var simulationId = Guid.NewGuid();
        
        var state = new SimulationState
        {
            Id = simulationId,
            Request = request,
            CurrentPosition = new GpsPosition
            {
                Latitude = request.StartLatitude,
                Longitude = request.StartLongitude,
                Timestamp = DateTimeOffset.UtcNow,
                SpeedKmh = 0,
                Heading = CalculateBearing(request.StartLatitude, request.StartLongitude, request.EndLatitude, request.EndLongitude),
                DistanceRemainingKm = CalculateDistance(request.StartLatitude, request.StartLongitude, request.EndLatitude, request.EndLongitude),
                ProgressPercent = 0
            },
            StartTime = DateTimeOffset.UtcNow,
            CancellationTokenSource = new CancellationTokenSource()
        };

        lock (_lock)
        {
            _activeSimulations[simulationId] = state;
        }

        // Démarre la simulation en arrière-plan
        _ = RunSimulationAsync(state, cancellationToken);

        _logger.LogInformation(
            "Simulation GPS démarrée: {SimulationId} de ({StartLat}, {StartLon}) vers ({EndLat}, {EndLon}) - Distance: {Distance:F2}km",
            simulationId,
            request.StartLatitude, request.StartLongitude,
            request.EndLatitude, request.EndLongitude,
            state.CurrentPosition.DistanceRemainingKm);

        return Task.FromResult(simulationId);
    }

    public Task StopSimulationAsync(Guid simulationId)
    {
        lock (_lock)
        {
            if (_activeSimulations.TryGetValue(simulationId, out var state))
            {
                state.CancellationTokenSource.Cancel();
                state.IsCompleted = true;
                _activeSimulations.Remove(simulationId);
                _logger.LogInformation("Simulation GPS arrêtée: {SimulationId}", simulationId);
            }
        }
        return Task.CompletedTask;
    }

    public GpsPosition? GetCurrentPosition(Guid simulationId)
    {
        lock (_lock)
        {
            return _activeSimulations.TryGetValue(simulationId, out var state) 
                ? state.CurrentPosition 
                : null;
        }
    }

    public IReadOnlyList<ActiveSimulation> GetActiveSimulations()
    {
        lock (_lock)
        {
            return _activeSimulations.Values
                .Where(s => !s.IsCompleted)
                .Select(s => new ActiveSimulation
                {
                    Id = s.Id,
                    StartedAt = s.StartTime,
                    CurrentPosition = s.CurrentPosition,
                    Destination = new GpsPosition
                    {
                        Latitude = s.Request.EndLatitude,
                        Longitude = s.Request.EndLongitude
                    },
                    AverageSpeedKmh = s.Request.AverageSpeedKmh,
                    EstimatedTimeRemaining = TimeSpan.FromHours(s.CurrentPosition.DistanceRemainingKm / s.Request.AverageSpeedKmh)
                })
                .ToList();
        }
    }

    private async Task RunSimulationAsync(SimulationState state, CancellationToken externalCancellationToken)
    {
        var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(
            state.CancellationTokenSource.Token, 
            externalCancellationToken);
        var cancellationToken = linkedCts.Token;

        try
        {
            var request = state.Request;
            var totalDistance = CalculateDistance(
                request.StartLatitude, request.StartLongitude,
                request.EndLatitude, request.EndLongitude);
            
            var stepDistanceKm = request.AverageSpeedKmh * (request.UpdateIntervalSeconds / 3600.0);
            var steps = (int)Math.Ceiling(totalDistance / stepDistanceKm);
            
            for (int step = 0; step <= steps && !cancellationToken.IsCancellationRequested; step++)
            {
                var progress = (double)step / steps;
                
                // Interpolation linéaire entre les points avec une petite variation réaliste
                var lat = request.StartLatitude + (request.EndLatitude - request.StartLatitude) * progress;
                var lon = request.StartLongitude + (request.EndLongitude - request.StartLongitude) * progress;
                
                // Ajoute une petite variation pour simuler des mouvements réalistes (pas en ligne droite parfaite)
                var randomVariation = (Math.Sin(step * 0.5) * 0.0001, Math.Cos(step * 0.5) * 0.0001);
                lat += randomVariation.Item1;
                lon += randomVariation.Item2;
                
                var remainingDistance = totalDistance * (1 - progress);
                var heading = CalculateBearing(lat, lon, request.EndLatitude, request.EndLongitude);
                
                // Variation de vitesse réaliste (±20% autour de la vitesse moyenne)
                var speedVariation = 0.8 + (new Random().NextDouble() * 0.4);
                var currentSpeed = request.AverageSpeedKmh * speedVariation;
                
                state.CurrentPosition = new GpsPosition
                {
                    Latitude = lat,
                    Longitude = lon,
                    Timestamp = DateTimeOffset.UtcNow,
                    SpeedKmh = currentSpeed,
                    Heading = heading,
                    DistanceRemainingKm = remainingDistance,
                    ProgressPercent = progress * 100
                };

                // Notifie les observateurs
                if (request.OnPositionUpdate != null)
                {
                    try
                    {
                        await request.OnPositionUpdate(state.CurrentPosition, cancellationToken);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Erreur lors du callback de position pour la simulation {SimulationId}", state.Id);
                    }
                }

                _logger.LogDebug(
                    "Simulation {SimulationId}: Position mise à jour ({Lat:F6}, {Lon:F6}) - Progress: {Progress:F1}%",
                    state.Id, lat, lon, progress * 100);

                if (progress < 1.0)
                {
                    await Task.Delay(TimeSpan.FromSeconds(request.UpdateIntervalSeconds), cancellationToken);
                }
            }

            // Arrivée à destination
            if (!cancellationToken.IsCancellationRequested)
            {
                state.CurrentPosition = new GpsPosition
                {
                    Latitude = request.EndLatitude,
                    Longitude = request.EndLongitude,
                    Timestamp = DateTimeOffset.UtcNow,
                    SpeedKmh = 0,
                    Heading = state.CurrentPosition.Heading,
                    DistanceRemainingKm = 0,
                    ProgressPercent = 100
                };

                _logger.LogInformation("Simulation GPS arrivée à destination: {SimulationId}", state.Id);

                if (request.OnArrival != null)
                {
                    try
                    {
                        await request.OnArrival(cancellationToken);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Erreur lors du callback d'arrivée pour la simulation {SimulationId}", state.Id);
                    }
                }
            }
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("Simulation GPS annulée: {SimulationId}", state.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur dans la simulation GPS: {SimulationId}", state.Id);
        }
        finally
        {
            state.IsCompleted = true;
        }
    }

    private void CleanupCompletedSimulations(object? state)
    {
        lock (_lock)
        {
            var completed = _activeSimulations
                .Where(s => s.Value.IsCompleted || s.Value.StartTime < DateTimeOffset.UtcNow.AddHours(-1))
                .Select(s => s.Key)
                .ToList();

            foreach (var id in completed)
            {
                if (_activeSimulations.TryGetValue(id, out var simState))
                {
                    simState.CancellationTokenSource.Dispose();
                    _activeSimulations.Remove(id);
                }
            }

            if (completed.Count > 0)
            {
                _logger.LogInformation("{Count} simulations GPS nettoyées", completed.Count);
            }
        }
    }

    /// <summary>
    /// Calcule la distance entre deux points GPS (formule de Haversine)
    /// </summary>
    private static double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
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

    /// <summary>
    /// Calcule le cap (heading) entre deux points GPS
    /// </summary>
    private static double CalculateBearing(double lat1, double lon1, double lat2, double lon2)
    {
        var dLon = ToRad(lon2 - lon1);
        var lat1Rad = ToRad(lat1);
        var lat2Rad = ToRad(lat2);

        var y = Math.Sin(dLon) * Math.Cos(lat2Rad);
        var x = Math.Cos(lat1Rad) * Math.Sin(lat2Rad) -
                Math.Sin(lat1Rad) * Math.Cos(lat2Rad) * Math.Cos(dLon);

        var bearing = Math.Atan2(y, x);
        return (ToDegrees(bearing) + 360) % 360;
    }

    private static double ToRad(double degrees) => degrees * Math.PI / 180;
    private static double ToDegrees(double radians) => radians * 180 / Math.PI;

    private class SimulationState
    {
        public Guid Id { get; set; }
        public SimulationRequest Request { get; set; } = null!;
        public GpsPosition CurrentPosition { get; set; } = null!;
        public DateTimeOffset StartTime { get; set; }
        public CancellationTokenSource CancellationTokenSource { get; set; } = null!;
        public bool IsCompleted { get; set; }
    }

    public void Dispose()
    {
        _cleanupTimer?.Dispose();
        
        lock (_lock)
        {
            foreach (var sim in _activeSimulations.Values)
            {
                sim.CancellationTokenSource.Cancel();
                sim.CancellationTokenSource.Dispose();
            }
            _activeSimulations.Clear();
        }
    }
}

/// <summary>
/// Extensions pour faciliter l'utilisation du service de simulation
/// </summary>
public static class GpsSimulationExtensions
{
    /// <summary>
    /// Crée une simulation pour une tournée complète avec plusieurs points d'arrêt
    /// </summary>
    public static async Task<List<Guid>> SimulateDeliveryRouteAsync(
        this IGpsSimulationService service,
        List<(double Lat, double Lon)> waypoints,
        double averageSpeedKmh = 25,
        Func<int, GpsPosition, CancellationToken, Task>? OnWaypointReached = null,
        CancellationToken cancellationToken = default)
    {
        var simulationIds = new List<Guid>();
        
        for (int i = 0; i < waypoints.Count - 1; i++)
        {
            var start = waypoints[i];
            var end = waypoints[i + 1];
            
            var waypointIndex = i;
            var request = new SimulationRequest
            {
                StartLatitude = start.Lat,
                StartLongitude = start.Lon,
                EndLatitude = end.Lat,
                EndLongitude = end.Lon,
                AverageSpeedKmh = averageSpeedKmh,
                OnArrival = OnWaypointReached != null 
                    ? async (ct) => await OnWaypointReached(waypointIndex, service.GetCurrentPosition(simulationIds.Last())!, ct)
                    : null
            };
            
            var id = await service.StartSimulationAsync(request, cancellationToken);
            simulationIds.Add(id);
            
            // Attend que la simulation arrive à destination avant de commencer la suivante
            while (!cancellationToken.IsCancellationRequested)
            {
                var pos = service.GetCurrentPosition(id);
                if (pos?.ProgressPercent >= 100)
                    break;
                await Task.Delay(1000, cancellationToken);
            }
        }
        
        return simulationIds;
    }
}
