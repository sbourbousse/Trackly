using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Trackly.Backend.Features.Billing;
using Trackly.Backend.Features.Deliveries;
using Trackly.Backend.Features.Orders;
using Trackly.Backend.Infrastructure.Data;
using Trackly.Backend.Infrastructure.MultiTenancy;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddScoped<TenantContext>();
builder.Services.AddScoped<IBillingService, BillingService>();
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
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

if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<TracklyDbContext>();
    await dbContext.Database.MigrateAsync();
    await SeedData.SeedAsync(scope.ServiceProvider);
}

app.UseMiddleware<TenantMiddleware>();

app.MapGet("/", () => "Trackly API");
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));
app.MapOrderEndpoints();
app.MapDeliveryEndpoints();

app.Run();
