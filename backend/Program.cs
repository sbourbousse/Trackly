using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
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
                "http://localhost:5173",
                "http://localhost:5174",
                "http://localhost:5175",
                "http://localhost:5176",
                "http://localhost:3000",
                "http://localhost:3004",
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
            // En production, autorise les origines configurées
            var origins = new List<string>();
            
            // Récupère depuis CORS_ORIGINS (format: url1,url2,url3)
            var corsOrigins = Environment.GetEnvironmentVariable("CORS_ORIGINS");
            if (!string.IsNullOrWhiteSpace(corsOrigins))
            {
                origins.AddRange(corsOrigins.Split(',', StringSplitOptions.RemoveEmptyEntries)
                    .Select(o => o.Trim())
                    .Where(o => !string.IsNullOrWhiteSpace(o)));
            }
            
            // Récupère depuis Cors:AllowedOrigins (indexée)
            var configOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();
            if (configOrigins != null)
            {
                origins.AddRange(configOrigins);
            }
            
            // Origines par défaut pour Trackly
            origins.Add("https://frontend-business-production.up.railway.app");
            origins.Add("https://trackly-frontend-business-kgj6q1smi-sbourbousses-projects.vercel.app");
            origins.Add("https://trackly-frontend-driver-k6ogv930f-sbourbousses-projects.vercel.app");
            origins.Add("https://trackly-frontend-tracking-iu5b5wyt5-sbourbousses-projects.vercel.app");
            
            // Supprime les doublons
            origins = origins.Distinct().ToList();
            
            if (origins.Count == 0)
            {
                Console.WriteLine("[WARNING] Aucune origine CORS configurée.");
            }
            else
            {
                Console.WriteLine($"[INFO] CORS: {origins.Count} origine(s)");
            }
            
            policy.WithOrigins(origins.ToArray())
                .AllowAnyMethod()
                .AllowAnyHeader()
                .AllowCredentials();
        }
    });
});

builder.Services.AddDbContext<TracklyDbContext>(options =>
{
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
    throw new InvalidOperationException("JWT_SECRET doit faire au moins 32 caractères.");
}

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

// Endpoints
app.MapTenantEndpoints();
app.MapAuthEndpoints();
app.MapOrderEndpoints();
app.MapDeliveryEndpoints();
app.MapRouteEndpoints();
app.MapDriverEndpoints();
app.MapTrackingEndpoints();
app.MapGeocodeEndpoints();

// Hub SignalR
app.MapHub<TrackingHub>("/hubs/tracking");

app.Run();

static string NormalizeConnectionString(string connectionString)
{
    if (connectionString.StartsWith("postgres://"))
    {
        var uri = new Uri(connectionString);
        var userInfo = uri.UserInfo.Split(':');
        var username = userInfo[0];
        var password = userInfo.Length > 1 ? userInfo[1] : "";
        var database = uri.AbsolutePath.TrimStart('/');
        
        return $"Host={uri.Host};Port={uri.Port};Database={database};Username={username};Password={password};SSL Mode=Require;Trust Server Certificate=true";
    }
    return connectionString;
}
