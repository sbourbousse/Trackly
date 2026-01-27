using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Trackly.Backend.Features.Billing;
using Trackly.Backend.Features.Deliveries;
using Trackly.Backend.Features.Drivers;
using Trackly.Backend.Features.Orders;
using Trackly.Backend.Features.Tenants;
using Trackly.Backend.Features.Tracking;
using Trackly.Backend.Infrastructure.Data;
using Trackly.Backend.Infrastructure.MultiTenancy;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddScoped<TenantContext>();
builder.Services.AddScoped<IBillingService, BillingService>();
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
                "http://localhost:3000",   // Port alternatif
                "http://127.0.0.1:5173",
                "http://127.0.0.1:5174",
                "http://127.0.0.1:5175",
                "http://127.0.0.1:5176"
            )
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
        }
        else
        {
            // En production, configurez les origines spécifiques
            var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() 
                ?? Array.Empty<string>();
            policy.WithOrigins(allowedOrigins)
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

var app = builder.Build();

var allowTenantBootstrap = builder.Configuration.GetValue<bool>("ALLOW_TENANT_BOOTSTRAP");

// Active CORS avant les autres middlewares
app.UseCors();

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

app.UseMiddleware<TenantMiddleware>();

app.MapOrderEndpoints();
app.MapDeliveryEndpoints();
app.MapDriverEndpoints();

// SignalR Hub pour le tracking temps réel
app.MapHub<TrackingHub>("/hubs/tracking");

// Configuration du port pour Railway et autres plateformes cloud
var port = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrEmpty(port))
{
    app.Urls.Add($"http://0.0.0.0:{port}");
}

app.Run();

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
