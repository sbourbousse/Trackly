using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Trackly.Backend.Features.Billing;
using Trackly.Backend.Features.Deliveries;
using Trackly.Backend.Features.Drivers;
using Trackly.Backend.Features.Orders;
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
    var connectionString = builder.Configuration.GetConnectionString("TracklyDb");
    if (string.IsNullOrWhiteSpace(connectionString))
    {
        throw new InvalidOperationException("La chaîne de connexion TracklyDb est manquante.");
    }

    options.UseNpgsql(connectionString);
});

var app = builder.Build();

// Active CORS avant les autres middlewares
app.UseCors();

if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<TracklyDbContext>();
    await dbContext.Database.MigrateAsync();
    await SeedData.SeedAsync(scope.ServiceProvider);
}

// Endpoints publics (sans TenantMiddleware)
app.MapGet("/", () => "Trackly API");
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

// Endpoint pour récupérer le tenant par défaut en développement
if (app.Environment.IsDevelopment())
{
    app.MapGet("/api/tenants/default", async (TracklyDbContext dbContext) =>
    {
        var tenant = await dbContext.Tenants
            .AsNoTracking()
            .OrderBy(t => t.CreatedAt)
            .FirstOrDefaultAsync();
        
        if (tenant == null)
        {
            return Results.NotFound("Aucun tenant trouvé. Exécutez le seed de la base de données.");
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

app.Run();
