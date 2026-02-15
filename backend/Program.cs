using System.Text;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Npgsql;
using Trackly.Backend.Features.Auth;
using Trackly.Backend.Features.Billing;
using Trackly.Backend.Features.Deliveries;
using Trackly.Backend.Features.Drivers;
using Trackly.Backend.Features.Geocode;
using Trackly.Backend.Features.Orders;
using Trackly.Backend.Features.Tenants;
using Trackly.Backend.Features.Tracking;
using Trackly.Backend.Infrastructure.Data;
using Trackly.Backend.Infrastructure.MultiTenancy;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddScoped<TenantContext>();
builder.Services.AddScoped<IBillingService, BillingService>();
builder.Services.AddSingleton<AuthService>();
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

// Configuration SignalR
builder.Services.AddSignalR();

// Configuration CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        if (builder.Environment.IsDevelopment())
        {
            // En développement, autorise toutes les origines locales
            policy.WithOrigins(
                "http://localhost:5173",  // Vite/SvelteKit par défaut (frontend-business)
                "http://localhost:5174",   // Port alternatif Vite
                "http://localhost:5175",   // Frontend Driver PWA
                "http://localhost:5176",   // Frontend Driver PWA (port alternatif)
                "http://localhost:3000",   // Frontend Landing (Next.js)
                "http://localhost:3004",   // Frontend Tracking (Next.js)
                "http://127.0.0.1:5173",
                "http://127.0.0.1:5174",
                "http://127.0.0.1:5175",
                "http://127.0.0.1:5176",
                "http://127.0.0.1:3000",
                "http://127.0.0.1:3004"
            )
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
        }
        else
        {
            // En production, autorise les origines configurées + pattern matching pour les previews
            var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() 
                ?? Array.Empty<string>();
            var allowedPatterns = builder.Configuration.GetSection("Cors:AllowedPatterns").Get<string[]>() 
                ?? Array.Empty<string>();
            
            Console.WriteLine($"[CORS] Config - Origins: {string.Join(", ", allowedOrigins)}");
            Console.WriteLine($"[CORS] Config - Patterns: {string.Join(", ", allowedPatterns)}");
            
            policy.SetIsOriginAllowed(origin =>
            {
                // Autorise les origines exactes
                if (allowedOrigins.Contains(origin))
                    return true;
                
                // Autorise les origines qui matchent les patterns (ex: *.vercel.app)
                foreach (var pattern in allowedPatterns)
                {
                    if (MatchesOriginPattern(origin, pattern))
                        return true;
                }
                
                return false;
            })
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
        }
    });
});

builder.Services.AddDbContext<TracklyDbContext>(options =>
{
    // Priorité à DATABASE_URL (Railway), fallback sur la config .NET
    var connectionString = Environment.GetEnvironmentVariable("DATABASE_URL")
        ?? builder.Configuration.GetConnectionString("TracklyDb");

    if (string.IsNullOrWhiteSpace(connectionString))
    {
        throw new InvalidOperationException(
            "La chaîne de connexion TracklyDb est manquante. " +
            "Configurez DATABASE_URL (Railway) ou ConnectionStrings:TracklyDb.");
    }

    options.UseNpgsql(NormalizeConnectionString(connectionString));
});

var jwtSecret = builder.Configuration["JWT_SECRET"]
    ?? Environment.GetEnvironmentVariable("JWT_SECRET");
if (string.IsNullOrWhiteSpace(jwtSecret))
{
    if (builder.Environment.IsDevelopment())
    {
        jwtSecret = "dev-secret-change-me";
    }
    else
    {
        throw new InvalidOperationException("JWT_SECRET est requis en production.");
    }
}
else if (jwtSecret.Length < 32)
{
    throw new InvalidOperationException("JWT_SECRET doit contenir au moins 32 caracteres (256 bits).");
}

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1)
        };
    });

builder.Services.AddAuthorization();

// Client HTTP nommé pour le géocodage Nominatim (User-Agent requis par leur politique d'utilisation)
builder.Services.AddHttpClient("Nominatim", client =>
{
    client.BaseAddress = new Uri("https://nominatim.openstreetmap.org/");
    client.DefaultRequestHeaders.Add("User-Agent", "Trackly/1.0 (contact@trackly.app)");
});

// Service de simulation GPS pour les démonstrations (TEMPORAIREMENT DÉSACTIVÉ)
// builder.Services.AddSingleton<IGpsSimulationService, GpsSimulationService>();

var app = builder.Build();

var allowTenantBootstrap = builder.Configuration.GetValue<bool>("ALLOW_TENANT_BOOTSTRAP");

// Active CORS avant les autres middlewares
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

// Exécute les migrations en développement et production
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<TracklyDbContext>();
    await dbContext.Database.MigrateAsync();
    
    // Seed uniquement en développement
    if (app.Environment.IsDevelopment())
    {
        await SeedData.SeedAsync(scope.ServiceProvider);
    }
}

// Endpoints publics (sans TenantMiddleware)
app.MapGet("/", () => "Trackly API");
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

// Endpoint de diagnostic CORS
app.MapGet("/debug/cors", () =>
{
    var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
    var allowedPatterns = builder.Configuration.GetSection("Cors:AllowedPatterns").Get<string[]>() ?? Array.Empty<string>();
    
    return Results.Ok(new
    {
        environment = builder.Environment.EnvironmentName,
        isDevelopment = builder.Environment.IsDevelopment(),
        corsOrigins = allowedOrigins,
        corsPatterns = allowedPatterns,
        message = "CORS configuration diagnostic"
    });
});

// Auth business (création de compte + login)
app.MapPost("/api/auth/register", async (TracklyDbContext dbContext, AuthService authService, RegisterRequest request) =>
{
    var companyName = request.CompanyName?.Trim();
    var name = request.Name?.Trim();
    var email = request.Email?.Trim().ToLowerInvariant();
    var password = request.Password;

    if (string.IsNullOrWhiteSpace(companyName) ||
        string.IsNullOrWhiteSpace(name) ||
        string.IsNullOrWhiteSpace(email) ||
        string.IsNullOrWhiteSpace(password))
    {
        return Results.BadRequest("CompanyName, Name, Email et Password sont requis.");
    }

    var existingUser = await dbContext.Users
        .IgnoreQueryFilters()
        .AnyAsync(u => u.Email == email);

    if (existingUser)
    {
        return Results.Conflict("Un compte existe deja pour cet email.");
    }

    var tenant = new Tenant { Name = companyName };
    dbContext.Tenants.Add(tenant);

    var user = new TracklyUser
    {
        TenantId = tenant.Id,
        Name = name,
        Email = email
    };
    user.PasswordHash = authService.HashPassword(user, password);

    dbContext.Users.Add(user);
    await dbContext.SaveChangesAsync();

    var token = authService.CreateToken(user, jwtSecret);
    return Results.Ok(new AuthResponse(token, tenant.Id, user.Id, user.Name, user.Email));
});

app.MapPost("/api/auth/login", async (TracklyDbContext dbContext, AuthService authService, LoginRequest request) =>
{
    var email = request.Email?.Trim().ToLowerInvariant();
    var password = request.Password;

    if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
    {
        return Results.BadRequest("Email et Password sont requis.");
    }

    var user = await dbContext.Users
        .IgnoreQueryFilters()
        .FirstOrDefaultAsync(u => u.Email == email);

    if (user == null || !authService.VerifyPassword(user, password))
    {
        return Results.Unauthorized();
    }

    var token = authService.CreateToken(user, jwtSecret);
    return Results.Ok(new AuthResponse(token, user.TenantId, user.Id, user.Name, user.Email));
});

// Enregistrement public d'un tenant (création simple)
app.MapPost("/api/tenants/register", async (TracklyDbContext dbContext, TenantRegistrationRequest request) =>
{
    var name = request.Name?.Trim();
    if (string.IsNullOrWhiteSpace(name))
    {
        return Results.BadRequest("Le nom du tenant est requis.");
    }

    var tenant = new Tenant { Name = name };
    dbContext.Tenants.Add(tenant);
    await dbContext.SaveChangesAsync();

    return Results.Created($"/api/tenants/{tenant.Id}", new { id = tenant.Id, name = tenant.Name });
});

// Endpoint pour récupérer le tenant par défaut (dev ou bootstrap explicite)
if (app.Environment.IsDevelopment() || allowTenantBootstrap)
{
    app.MapGet("/api/tenants/default", async (TracklyDbContext dbContext) =>
    {
        var tenant = await dbContext.Tenants
            .AsNoTracking()
            .OrderBy(t => t.CreatedAt)
            .FirstOrDefaultAsync();
        
        if (tenant == null)
        {
            tenant = new Tenant { Name = "Default" };
            dbContext.Tenants.Add(tenant);
            await dbContext.SaveChangesAsync();
        }
        
        return Results.Ok(new { id = tenant.Id, name = tenant.Name });
    });
}

// Endpoint de debug pour lister tous les drivers (dev uniquement)
if (app.Environment.IsDevelopment())
{
    app.MapGet("/api/drivers/debug/all", async (TracklyDbContext dbContext) =>
    {
        // IgnoreQueryFilters() pour voir tous les drivers sans filtre de tenant
        var drivers = await dbContext.Drivers
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Select(d => new { d.Id, d.Name, d.Phone, d.TenantId })
            .ToListAsync();

        return Results.Ok(drivers);
    });
}

// Endpoint public pour récupérer le tenant ID d'un driver (utilisé par le frontend-driver)
app.MapGet("/api/drivers/{driverId}/tenant", async (TracklyDbContext dbContext, string driverId) =>
{
    if (!Guid.TryParse(driverId, out var driverGuid))
    {
        return Results.BadRequest("ID driver invalide.");
    }

    // IgnoreQueryFilters() est nécessaire car cet endpoint est public (avant TenantMiddleware)
    // et doit pouvoir trouver le driver sans filtre de tenant
    var driver = await dbContext.Drivers
        .IgnoreQueryFilters()
        .AsNoTracking()
        .FirstOrDefaultAsync(d => d.Id == driverGuid);

    if (driver == null)
    {
        return Results.NotFound("Driver non trouvé.");
    }

    return Results.Ok(new { tenantId = driver.TenantId });
});

// Endpoint public pour le suivi client (frontend-tracking) - AVANT TenantMiddleware
app.MapGet("/api/public/deliveries/{id:guid}/tracking", 
    async (Guid id, TracklyDbContext dbContext, CancellationToken cancellationToken) =>
        await Trackly.Backend.Features.Deliveries.DeliveryEndpoints.GetPublicTracking(id, dbContext, cancellationToken));

app.UseMiddleware<TenantMiddleware>();

// Siège social du tenant (paramètres entreprise) — requiert X-Tenant-Id
app.MapGet("/api/tenants/me/headquarters", async (TracklyDbContext dbContext, TenantContext tenantContext, CancellationToken cancellationToken) =>
{
    if (tenantContext.TenantId == Guid.Empty)
        return Results.BadRequest("Tenant manquant.");
    var tenant = await dbContext.Tenants
        .AsNoTracking()
        .FirstOrDefaultAsync(t => t.Id == tenantContext.TenantId, cancellationToken);
    if (tenant == null)
        return Results.NotFound("Tenant non trouvé.");
    return Results.Ok(new
    {
        address = tenant.HeadquartersAddress ?? (string?)null,
        lat = tenant.HeadquartersLat,
        lng = tenant.HeadquartersLng
    });
});

app.MapPut("/api/tenants/me/headquarters", async (TracklyDbContext dbContext, TenantContext tenantContext, HeadquartersRequest request, CancellationToken cancellationToken) =>
{
    if (tenantContext.TenantId == Guid.Empty)
        return Results.BadRequest("Tenant manquant.");
    var tenant = await dbContext.Tenants
        .FirstOrDefaultAsync(t => t.Id == tenantContext.TenantId, cancellationToken);
    if (tenant == null)
        return Results.NotFound("Tenant non trouvé.");
    tenant.HeadquartersAddress = string.IsNullOrWhiteSpace(request.Address) ? null : request.Address.Trim();
    tenant.HeadquartersLat = request.Lat;
    tenant.HeadquartersLng = request.Lng;
    await dbContext.SaveChangesAsync(cancellationToken);
    return Results.Ok(new
    {
        address = tenant.HeadquartersAddress,
        lat = tenant.HeadquartersLat,
        lng = tenant.HeadquartersLng
    });
});

app.MapOrderEndpoints();
app.MapDeliveryEndpoints();
app.MapRouteEndpoints();
app.MapDriverEndpoints();
app.MapGeocodeEndpoints();

// SignalR Hub pour le tracking temps réel
app.MapHub<TrackingHub>("/hubs/tracking");

// ============================================================================
// ENDPOINTS DE DÉMO GPS (développement uniquement) - TEMPORAIREMENT DÉSACTIVÉS
// ============================================================================
// if (app.Environment.IsDevelopment())
// {
//     // Démarrer une simulation GPS entre deux points
//     app.MapPost("/api/demo/gps/simulate", async (
//         IGpsSimulationService gpsService,
//         SimulationRequest request) =>
//     {
//         var simulationId = await gpsService.StartSimulationAsync(request);
//         return Results.Ok(new 
//         { 
//             simulationId, 
//             message = "Simulation GPS démarrée",
//             from = new { lat = request.StartLatitude, lon = request.StartLongitude },
//             to = new { lat = request.EndLatitude, lon = request.EndLongitude }
//         });
//     });
// 
//     // ... autres endpoints de démo
// }

// Requête pour simulation de tournée (désactivé)
// public record RouteSimulationRequest(
//     List<Waypoint> Waypoints,
//     double AverageSpeedKmh = 25
// );
// 
// public record Waypoint(double Lat, double Lon);

// Configuration du port pour Railway et autres plateformes cloud
var port = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrEmpty(port))
{
    app.Urls.Add($"http://0.0.0.0:{port}");
}

app.Run();

// Vérifie si une origine correspond à un pattern (supporte * comme wildcard)
static bool MatchesOriginPattern(string origin, string pattern)
{
    // Convertit le pattern en regex
    // *.vercel.app -> ^https://[^.]+\.vercel\.app$
    var regexPattern = "^" + Regex.Escape(pattern).Replace("\\*", "[^/]+") + "$";
    return Regex.IsMatch(origin, regexPattern, RegexOptions.IgnoreCase);
}

static string NormalizeConnectionString(string connectionString)
{
    if (connectionString.Contains("${{", StringComparison.Ordinal))
    {
        throw new InvalidOperationException(
            "DATABASE_URL semble être une variable Railway non résolue. " +
            "Assurez-vous qu'elle pointe vers une vraie valeur ou une référence Railway valide.");
    }

    if (connectionString.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) ||
        connectionString.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
    {
        var uri = new Uri(connectionString);
        var userInfo = uri.UserInfo.Split(':', 2);
        var builder = new NpgsqlConnectionStringBuilder
        {
            Host = uri.Host,
            Port = uri.IsDefaultPort ? 5432 : uri.Port,
            Database = uri.AbsolutePath.TrimStart('/'),
            Username = userInfo.Length > 0 ? Uri.UnescapeDataString(userInfo[0]) : string.Empty,
            Password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : string.Empty,
            SslMode = SslMode.Require
        };

        return builder.ConnectionString;
    }

    return connectionString;
}
