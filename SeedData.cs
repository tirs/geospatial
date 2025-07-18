using UrbanReferralNetwork.Data;
using UrbanReferralNetwork.Models;

namespace UrbanReferralNetwork
{
    public static class SeedData
    {
        public static void Initialize(UrbanReferralContext context)
        {
            // Check if data already exists
            if (context.ZipCodes.Any()) return;

            // Add LA ZIP codes with coordinates
            var zipCodes = new[]
            {
                new ZipCode { ZipCodeValue = "90210", City = "Beverly Hills", Latitude = 34.0901m, Longitude = -118.4065m },
                new ZipCode { ZipCodeValue = "90211", City = "Beverly Hills", Latitude = 34.0836m, Longitude = -118.4006m },
                new ZipCode { ZipCodeValue = "90212", City = "Beverly Hills", Latitude = 34.0669m, Longitude = -118.3959m },
                new ZipCode { ZipCodeValue = "90028", City = "Hollywood", Latitude = 34.1016m, Longitude = -118.3267m },
                new ZipCode { ZipCodeValue = "90038", City = "Hollywood", Latitude = 34.0928m, Longitude = -118.3287m },
                new ZipCode { ZipCodeValue = "90046", City = "West Hollywood", Latitude = 34.0969m, Longitude = -118.3781m },
                new ZipCode { ZipCodeValue = "90069", City = "West Hollywood", Latitude = 34.0851m, Longitude = -118.3889m },
                new ZipCode { ZipCodeValue = "90401", City = "Santa Monica", Latitude = 34.0195m, Longitude = -118.4912m },
                new ZipCode { ZipCodeValue = "90402", City = "Santa Monica", Latitude = 34.0236m, Longitude = -118.4804m },
                new ZipCode { ZipCodeValue = "90403", City = "Santa Monica", Latitude = 34.0322m, Longitude = -118.4931m }
            };

            context.ZipCodes.AddRange(zipCodes);
            context.SaveChanges();

            // Add service types
            var serviceTypes = new[]
            {
                new ServiceType { ServiceName = "Plumbing", Category = "Repair", Description = "Plumbing repairs and installations" },
                new ServiceType { ServiceName = "Electrical", Category = "Repair", Description = "Electrical work and repairs" },
                new ServiceType { ServiceName = "HVAC", Category = "Repair", Description = "Heating, ventilation, and air conditioning" },
                new ServiceType { ServiceName = "Roofing", Category = "Construction", Description = "Roof repairs and installations" },
                new ServiceType { ServiceName = "Flooring", Category = "Construction", Description = "Floor installation and repair" },
                new ServiceType { ServiceName = "Painting", Category = "Maintenance", Description = "Interior and exterior painting" },
                new ServiceType { ServiceName = "Landscaping", Category = "Maintenance", Description = "Garden and landscape services" }
            };

            context.ServiceTypes.AddRange(serviceTypes);
            context.SaveChanges();

            // Add sample contractors
            var contractors = new[]
            {
                new Contractor 
                { 
                    CompanyName = "Beverly Hills Plumbing Pro", 
                    ContactName = "John Smith", 
                    Phone = "(310) 555-0101", 
                    Email = "john@bhplumbing.com",
                    ZipCodeId = zipCodes[0].ZipCodeId,
                    ServiceRadius = 15,
                    ServiceTypes = "[\"Plumbing\"]",
                    Rating = 4.8m
                },
                new Contractor 
                { 
                    CompanyName = "Hollywood Electric Solutions", 
                    ContactName = "Maria Garcia", 
                    Phone = "(323) 555-0202", 
                    Email = "maria@hesolutions.com",
                    ZipCodeId = zipCodes[3].ZipCodeId,
                    ServiceRadius = 20,
                    ServiceTypes = "[\"Electrical\"]",
                    Rating = 4.9m
                },
                new Contractor 
                { 
                    CompanyName = "Santa Monica HVAC Experts", 
                    ContactName = "David Chen", 
                    Phone = "(310) 555-0303", 
                    Email = "david@smhvac.com",
                    ZipCodeId = zipCodes[7].ZipCodeId,
                    ServiceRadius = 25,
                    ServiceTypes = "[\"HVAC\"]",
                    Rating = 4.7m
                },
                new Contractor 
                { 
                    CompanyName = "West Side Roofing", 
                    ContactName = "Sarah Johnson", 
                    Phone = "(310) 555-0404", 
                    Email = "sarah@westsideroofing.com",
                    ZipCodeId = zipCodes[5].ZipCodeId,
                    ServiceRadius = 30,
                    ServiceTypes = "[\"Roofing\"]",
                    Rating = 4.6m
                },
                new Contractor 
                { 
                    CompanyName = "All-Pro Home Services", 
                    ContactName = "Mike Wilson", 
                    Phone = "(323) 555-0505", 
                    Email = "mike@allprohome.com",
                    ZipCodeId = zipCodes[4].ZipCodeId,
                    ServiceRadius = 35,
                    ServiceTypes = "[\"Plumbing\", \"Electrical\", \"Painting\"]",
                    Rating = 4.5m
                }
            };

            context.Contractors.AddRange(contractors);
            context.SaveChanges();
        }
    }
}