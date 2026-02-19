using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using Npgsql;
using Trackly.Backend.Infrastructure.MultiTenancy;

namespace Trackly.Backend.Infrastructure.Data;

/// <summary>
/// Utilisé par les outils EF (dotnet ef migrations, dotnet ef database update).
/// Priorité : 1) DATABASE_URL (variable d'environnement), 2) ConnectionStrings:TracklyDb (appsettings).
/// Si DATABASE_URL est définie dans le terminal/système, elle écrase appsettings.
/// Pour forcer l'usage des appsettings : désactiver DATABASE_URL dans le terminal (ex. $env:DATABASE_URL = $null).
/// </summary>
public sealed class TracklyDbContextFactory : IDesignTimeDbContextFactory<TracklyDbContext>
{
    public TracklyDbContext CreateDbContext(string[] args)
    {
        var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development";
        // dotnet ef peut s'exécuter depuis bin/Debug/net9.0 : on charge les appsettings depuis le dossier du projet (.csproj)
        var basePath = ResolveProjectDirectory();

        // Config depuis les fichiers uniquement (pour priorité appsettings)
        var configFromFiles = new ConfigurationBuilder()
            .SetBasePath(basePath)
            .AddJsonFile("appsettings.json", optional: false)
            .AddJsonFile($"appsettings.{environment}.json", optional: true)
            .Build();

        // Priorité : 1) DATABASE_URL, 2) ConnectionStrings:TracklyDb des fichiers (pas les variables d'env)
        // Ainsi les appsettings sont utilisés sauf si DATABASE_URL est défini.
        // (ConnectionStrings__TracklyDb en variable d'env n'écrase plus les fichiers.)
        var connectionString = Environment.GetEnvironmentVariable("DATABASE_URL")
            ?? configFromFiles.GetConnectionString("TracklyDb");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                "Chaîne de connexion manquante. Définissez DATABASE_URL ou ConnectionStrings:TracklyDb dans appsettings.");
        }

        var normalized = NormalizeConnectionString(connectionString);
        var displayDb = GetDatabaseDisplayString(normalized);
        var source = Environment.GetEnvironmentVariable("DATABASE_URL") != null ? "DATABASE_URL" : "appsettings";
        Console.WriteLine($"[EF] Base utilisée (migrations) : {displayDb} (source : {source})");

        var options = new DbContextOptionsBuilder<TracklyDbContext>()
            .UseNpgsql(normalized)
            .Options;

        return new TracklyDbContext(options, new TenantContext());
    }

    /// <summary>Retourne le dossier du projet (contenant le .csproj). Part de l'emplacement de l'assembly pour être fiable avec dotnet ef.</summary>
    private static string ResolveProjectDirectory()
    {
        // Partir du dossier de l'assembly (backend/bin/Debug/net9.0) pour ne pas dépendre de BaseDirectory ni du répertoire courant
        var assemblyDir = Path.GetDirectoryName(typeof(TracklyDbContextFactory).Assembly.Location);
        if (string.IsNullOrEmpty(assemblyDir)) assemblyDir = AppContext.BaseDirectory;

        var dir = assemblyDir;
        for (var i = 0; i < 6; i++)
        {
            var fullPath = Path.GetFullPath(dir);
            if (Directory.Exists(fullPath) && Directory.GetFiles(fullPath, "*.csproj").Length > 0)
                return fullPath;
            var parent = Directory.GetParent(fullPath);
            if (parent == null) break;
            dir = parent.FullName;
        }
        return Directory.GetCurrentDirectory();
    }

    private static string GetDatabaseDisplayString(string connectionString)
    {
        if (string.IsNullOrWhiteSpace(connectionString)) return "(non configurée)";
        try
        {
            var builder = new NpgsqlConnectionStringBuilder(connectionString);
            var port = builder.Port > 0 ? $":{builder.Port}" : "";
            var db = string.IsNullOrEmpty(builder.Database) ? "" : $"/{builder.Database}";
            return $"{builder.Host}{port}{db}";
        }
        catch
        {
            return "(chaîne non reconnue)";
        }
    }

    private static string NormalizeConnectionString(string connectionString)
    {
        if (string.IsNullOrWhiteSpace(connectionString)) return connectionString;
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
}
