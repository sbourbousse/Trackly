using System.Reflection;
using Microsoft.EntityFrameworkCore;
using Trackly.Backend.Features.Deliveries;
using RouteEntity = Trackly.Backend.Features.Deliveries.Route;
using Trackly.Backend.Features.Drivers;
using Trackly.Backend.Features.Orders;
using Trackly.Backend.Features.Auth;
using Trackly.Backend.Features.Tenants;
using Trackly.Backend.Infrastructure.MultiTenancy;

namespace Trackly.Backend.Infrastructure.Data;

public sealed class TracklyDbContext : DbContext
{
    private readonly TenantContext _tenantContext;

    public TracklyDbContext(DbContextOptions<TracklyDbContext> options, TenantContext tenantContext)
        : base(options)
    {
        _tenantContext = tenantContext;
    }

    public Guid TenantId => _tenantContext.TenantId;

    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<TracklyUser> Users => Set<TracklyUser>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<Delivery> Deliveries => Set<Delivery>();
    public DbSet<RouteEntity> Routes => Set<RouteEntity>();
    public DbSet<Driver> Drivers => Set<Driver>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.Entity<Delivery>()
            .HasOne<RouteEntity>()
            .WithMany()
            .HasForeignKey(d => d.RouteId)
            .IsRequired(false);
        ApplyTenantFilters(modelBuilder);
    }

    private void ApplyTenantFilters(ModelBuilder modelBuilder)
    {
        var applyMethod = typeof(TracklyDbContext).GetMethod(
            nameof(ApplyTenantFilter),
            BindingFlags.Instance | BindingFlags.NonPublic);

        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (!typeof(ITenantIsolated).IsAssignableFrom(entityType.ClrType))
            {
                continue;
            }

            var genericMethod = applyMethod?.MakeGenericMethod(entityType.ClrType);
            genericMethod?.Invoke(this, new object[] { modelBuilder });
        }
    }

    private void ApplyTenantFilter<TEntity>(ModelBuilder modelBuilder)
        where TEntity : class, ITenantIsolated
    {
        modelBuilder.Entity<TEntity>()
            .HasQueryFilter(entity => entity.TenantId == TenantId);
    }
}
