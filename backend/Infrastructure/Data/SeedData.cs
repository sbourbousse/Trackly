using Microsoft.EntityFrameworkCore;
using Trackly.Backend.Features.Deliveries;
using Trackly.Backend.Features.Drivers;
using Trackly.Backend.Features.Orders;
using Trackly.Backend.Features.Tenants;
using Trackly.Backend.Infrastructure.MultiTenancy;
using RouteEntity = Trackly.Backend.Features.Deliveries.Route;

namespace Trackly.Backend.Infrastructure.Data;

public static class SeedData
{
    public static async Task SeedAsync(IServiceProvider services, CancellationToken cancellationToken = default)
    {
        var dbContext = services.GetRequiredService<TracklyDbContext>();
        var tenantContext = services.GetRequiredService<TenantContext>();

        // Vérifie si des données existent déjà
        if (await dbContext.Tenants.AnyAsync(cancellationToken))
        {
            return;
        }

        // =========================================================================
        // CRÉATION DES TENANTS ET DONNÉES DE DÉMO
        // =========================================================================
        
        var random = new Random(42); // Seed fixe pour reproductibilité
        var baseDate = DateTime.Now.Date.AddDays(-3); // Début il y a 3 jours
        var deliveryStatuses = new[] { DeliveryStatus.Pending, DeliveryStatus.InProgress, DeliveryStatus.Completed, DeliveryStatus.Failed };
        var orderStatuses = new[] { OrderStatus.Pending, OrderStatus.Planned, OrderStatus.InTransit, OrderStatus.Delivered, OrderStatus.Cancelled };

        foreach (var demoTenant in DemoData.Tenants)
        {
            // Crée le tenant
            var tenant = new Tenant
            {
                Id = Guid.NewGuid(),
                Name = demoTenant.Name,
                SubscriptionPlan = demoTenant.Plan,
                CreatedAt = DateTimeOffset.UtcNow.AddDays(-30) // Créé il y a 30 jours
            };

            dbContext.Tenants.Add(tenant);
            await dbContext.SaveChangesAsync(cancellationToken);
            
            tenantContext.TenantId = tenant.Id;

            // Crée les drivers
            var drivers = new List<Driver>();
            foreach (var demoDriver in demoTenant.Drivers)
            {
                var driver = new Driver
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenant.Id,
                    Name = demoDriver.Name,
                    Phone = demoDriver.Phone
                };
                drivers.Add(driver);
                dbContext.Drivers.Add(driver);
            }
            await dbContext.SaveChangesAsync(cancellationToken);

            // Crée les commandes et livraisons pour chaque créneau horaire sur 5 jours
            var allOrders = new List<Order>();
            var allDeliveries = new List<Delivery>();
            
            for (int day = 0; day < 5; day++) // 5 jours de données
            {
                var currentDate = baseDate.AddDays(day);
                
                foreach (var slot in demoTenant.DeliverySlots)
                {
                    // Nombre de livraisons pour ce créneau (2-5 livraisons)
                    var deliveriesCount = random.Next(2, 6);
                    
                    // Sélectionne des adresses dans la zone du créneau
                    var zoneAddresses = DemoData.GetAddressesByZone(slot.Zone);
                    if (zoneAddresses.Count == 0)
                    {
                        // Fallback sur des adresses aléatoires si la zone n'a pas d'adresses définies
                        zoneAddresses = DemoData.Addresses.OrderBy(_ => random.Next()).Take(5).ToList();
                    }

                    for (int i = 0; i < deliveriesCount && i < zoneAddresses.Count; i++)
                    {
                        var address = zoneAddresses[i % zoneAddresses.Count];
                        var customerName = DemoData.CustomerNames[random.Next(DemoData.CustomerNames.Count)];
                        var driver = drivers[random.Next(drivers.Count)];
                        
                        // Détermine le statut en fonction du jour
                        // Jours passés → livraisons terminées
                        // Jour courant → mix de statuts
                        // Jours futurs → pending/planned
                        OrderStatus orderStatus;
                        DeliveryStatus deliveryStatus;
                        DateTimeOffset? completedAt = null;
                        
                        if (day < 2) // Jours passés
                        {
                            orderStatus = random.Next(10) < 8 ? OrderStatus.Delivered : OrderStatus.Cancelled;
                            deliveryStatus = orderStatus == OrderStatus.Delivered ? DeliveryStatus.Completed : DeliveryStatus.Failed;
                            if (deliveryStatus == DeliveryStatus.Completed)
                            {
                                completedAt = new DateTimeOffset(currentDate.Date.Add(slot.End), TimeSpan.FromHours(1));
                            }
                        }
                        else if (day == 2) // Jour courant (au moment du seeding)
                        {
                            var statusRoll = random.Next(100);
                            if (statusRoll < 30)
                            {
                                orderStatus = OrderStatus.Delivered;
                                deliveryStatus = DeliveryStatus.Completed;
                                completedAt = DateTimeOffset.UtcNow.AddHours(-random.Next(1, 5));
                            }
                            else if (statusRoll < 50)
                            {
                                orderStatus = OrderStatus.InTransit;
                                deliveryStatus = DeliveryStatus.InProgress;
                            }
                            else if (statusRoll < 70)
                            {
                                orderStatus = OrderStatus.Planned;
                                deliveryStatus = DeliveryStatus.Pending;
                            }
                            else
                            {
                                orderStatus = OrderStatus.Pending;
                                deliveryStatus = DeliveryStatus.Pending;
                            }
                        }
                        else // Jours futurs
                        {
                            orderStatus = OrderStatus.Planned;
                            deliveryStatus = DeliveryStatus.Pending;
                        }

                        // Heure de commande cohérente (entre 1h et 3h avant le créneau de livraison)
                        var orderTime = slot.Start.Subtract(TimeSpan.FromHours(1 + random.Next(3)));
                        if (orderTime.Hours < 6)
                        {
                            orderTime = TimeSpan.FromHours(18); // Si trop tôt, commande de la veille soir
                        }
                        var orderDate = new DateTimeOffset(currentDate.Date.Add(orderTime), TimeSpan.FromHours(1));

                        var order = new Order
                        {
                            Id = Guid.NewGuid(),
                            TenantId = tenant.Id,
                            CustomerName = customerName,
                            Address = address.FullAddress,
                            PhoneNumber = GeneratePhoneNumber(random),
                            InternalComment = GenerateComment(random, demoTenant.Name),
                            OrderDate = orderDate,
                            Status = orderStatus,
                            CreatedAt = orderDate
                        };

                        var delivery = new Delivery
                        {
                            Id = Guid.NewGuid(),
                            TenantId = tenant.Id,
                            OrderId = order.Id,
                            DriverId = driver.Id,
                            Status = deliveryStatus,
                            CreatedAt = orderDate,
                            CompletedAt = completedAt
                        };

                        allOrders.Add(order);
                        allDeliveries.Add(delivery);
                    }
                }
            }

            dbContext.Orders.AddRange(allOrders);
            dbContext.Deliveries.AddRange(allDeliveries);
            await dbContext.SaveChangesAsync(cancellationToken);

            // Crée des tournées (routes) logiques
            await CreateRoutesAsync(dbContext, tenant.Id, drivers, allDeliveries, random, cancellationToken);
        }

        // =========================================================================
        // DONNÉES MINIMALES DE DÉMO (si aucun tenant n'existe)
        // Garde une version simplifiée pour les tests rapides
        // =========================================================================
        
        if (!await dbContext.Tenants.AnyAsync(cancellationToken))
        {
            await SeedMinimalDemoDataAsync(dbContext, tenantContext, cancellationToken);
        }
    }

    /// <summary>
    /// Crée des tournées logiques regroupant les livraisons par proximité géographique
    /// </summary>
    private static async Task CreateRoutesAsync(
        TracklyDbContext dbContext,
        Guid tenantId,
        List<Driver> drivers,
        List<Delivery> deliveries,
        Random random,
        CancellationToken cancellationToken)
    {
        // Récupère les livraisons pending/planned pour créer des tournées
        var pendingDeliveries = deliveries
            .Where(d => d.Status == DeliveryStatus.Pending || d.Status == DeliveryStatus.InProgress)
            .ToList();

        // Groupe les livraisons par jour approximatif et driver
        var deliveryGroups = pendingDeliveries
            .GroupBy(d => new { Date = d.CreatedAt.Date, d.DriverId })
            .ToList();

        foreach (var group in deliveryGroups)
        {
            // Crée une tournée pour ce groupe
            var route = new RouteEntity
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                DriverId = group.Key.DriverId,
                Name = $"Tournée {group.Key.Date:dd/MM} - {drivers.First(d => d.Id == group.Key.DriverId).Name.Split(' ').Last()}",
                CreatedAt = new DateTimeOffset(group.Key.Date, TimeSpan.FromHours(1))
            };

            dbContext.Routes.Add(route);

            // Assigne les livraisons à cette tournée avec un ordre logique
            var groupDeliveries = group.ToList();
            var sequence = 0;
            
            foreach (var delivery in groupDeliveries.OrderBy(_ => random.Next()))
            {
                delivery.RouteId = route.Id;
                delivery.Sequence = sequence++;
            }
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    /// <summary>
    /// Données de démo minimales pour les tests rapides
    /// </summary>
    private static async Task SeedMinimalDemoDataAsync(
        TracklyDbContext dbContext,
        TenantContext tenantContext,
        CancellationToken cancellationToken)
    {
        var tenant = new Tenant
        {
            Id = Guid.NewGuid(),
            Name = "Démo Artisan",
            SubscriptionPlan = SubscriptionPlan.Starter,
            CreatedAt = DateTimeOffset.UtcNow
        };

        dbContext.Tenants.Add(tenant);
        await dbContext.SaveChangesAsync(cancellationToken);

        tenantContext.TenantId = tenant.Id;

        var driver = new Driver
        {
            Id = Guid.NewGuid(),
            TenantId = tenant.Id,
            Name = "Alex Dupont",
            Phone = "+33 6 00 00 00 00"
        };

        var order = new Order
        {
            Id = Guid.NewGuid(),
            TenantId = tenant.Id,
            CustomerName = "Client Démo",
            Address = "Place de la Comédie, 34000 Montpellier",
            Status = OrderStatus.Pending,
            CreatedAt = DateTimeOffset.UtcNow
        };

        var delivery = new Delivery
        {
            Id = Guid.NewGuid(),
            TenantId = tenant.Id,
            OrderId = order.Id,
            DriverId = driver.Id,
            Status = DeliveryStatus.Pending,
            CreatedAt = DateTimeOffset.UtcNow
        };

        dbContext.Drivers.Add(driver);
        dbContext.Orders.Add(order);
        dbContext.Deliveries.Add(delivery);

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    // =========================================================================
    // UTILITAIRES
    // =========================================================================

    private static string GeneratePhoneNumber(Random random)
    {
        return $"+33 6 {random.Next(10)} {random.Next(10):D2} {random.Next(10):D2} {random.Next(10):D2} {random.Next(10):D2}";
    }

    private static string? GenerateComment(Random random, string tenantName)
    {
        var comments = new Dictionary<string, string[]>
        {
            ["Boulangerie Dupont"] = new[]
            {
                "Client fidèle - pain sans sel",
                "Livraison avant 8h impératif",
                "Sonner à l'interphone",
                "Client nouveau - carte de fidélité offerte",
                null
            },
            ["Fleuriste Martin"] = new[]
            {
                "Bouquet personnalisé pour anniversaire",
                "Fleurs fragiles - manipuler avec soin",
                "Livraison discrète (surprise)",
                "Ajouter carte message",
                null
            },
            ["Cave à Vin Languedoc"] = new[]
            {
                "Carton lourd - 6 bouteilles",
                "Vin à température ambiante",
                "Signature requise",
                "Client habitué - livraison rapide",
                null
            },
            ["Librairie Centre-Ville"] = new[]
            {
                "Colis fragile - ne pas plier",
                "Livraison à la conciergerie si absent",
                "Commande spéciale - appeler avant",
                null
            }
        };

        var tenantComments = comments.GetValueOrDefault(tenantName, new[] { (string?)null });
        return tenantComments[random.Next(tenantComments.Length)];
    }
}
