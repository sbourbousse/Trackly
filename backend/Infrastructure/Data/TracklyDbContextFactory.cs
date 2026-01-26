using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using Trackly.Backend.Infrastructure.MultiTenancy;

namespace Trackly.Backend.Infrastructure.Data;

public sealed class TracklyDbContextFactory : IDesignTimeDbContextFactory<TracklyDbContext>
{
    public TracklyDbContext CreateDbContext(string[] args)
    {
        var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development";
        var configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", optional: false)
            .AddJsonFile($"appsettings.{environment}.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var connectionString = configuration.GetConnectionString("TracklyDb");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException("La chaîne de connexion TracklyDb est manquante.");
        }

        var options = new DbContextOptionsBuilder<TracklyDbContext>()
            .UseNpgsql(connectionString)
            .Options;

        return new TracklyDbContext(options, new TenantContext());
    }
}
