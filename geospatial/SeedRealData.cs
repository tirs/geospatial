using UrbanReferralNetwork.Data;
using UrbanReferralNetwork.Models;

namespace UrbanReferralNetwork
{
    public static class SeedRealData
    {
        public static async Task InitializeAsync(UrbanReferralContext context)
        {
            // Check if data already exists
            if (context.ZipCodes.Any()) return;

            // Real Los Angeles ZIP codes with accurate coordinates
            var zipCodes = new[]
            {
                // Beverly Hills Area
                new ZipCode { ZipCodeValue = "90210", City = "Beverly Hills", Latitude = 34.0901m, Longitude = -118.4065m },
                new ZipCode { ZipCodeValue = "90211", City = "Beverly Hills", Latitude = 34.0836m, Longitude = -118.4006m },
                new ZipCode { ZipCodeValue = "90212", City = "Beverly Hills", Latitude = 34.0669m, Longitude = -118.3959m },
                
                // Hollywood Area
                new ZipCode { ZipCodeValue = "90028", City = "Hollywood", Latitude = 34.1016m, Longitude = -118.3267m },
                new ZipCode { ZipCodeValue = "90038", City = "Hollywood", Latitude = 34.0928m, Longitude = -118.3287m },
                new ZipCode { ZipCodeValue = "90068", City = "Hollywood", Latitude = 34.1347m, Longitude = -118.3267m },
                
                // West Hollywood
                new ZipCode { ZipCodeValue = "90046", City = "West Hollywood", Latitude = 34.0969m, Longitude = -118.3781m },
                new ZipCode { ZipCodeValue = "90069", City = "West Hollywood", Latitude = 34.0851m, Longitude = -118.3889m },
                
                // Santa Monica Area
                new ZipCode { ZipCodeValue = "90401", City = "Santa Monica", Latitude = 34.0195m, Longitude = -118.4912m },
                new ZipCode { ZipCodeValue = "90402", City = "Santa Monica", Latitude = 34.0236m, Longitude = -118.4804m },
                new ZipCode { ZipCodeValue = "90403", City = "Santa Monica", Latitude = 34.0322m, Longitude = -118.4931m },
                new ZipCode { ZipCodeValue = "90404", City = "Santa Monica", Latitude = 34.0259m, Longitude = -118.4665m },
                
                // Venice Area
                new ZipCode { ZipCodeValue = "90291", City = "Venice", Latitude = 33.9850m, Longitude = -118.4695m },
                new ZipCode { ZipCodeValue = "90292", City = "Marina del Rey", Latitude = 33.9806m, Longitude = -118.4517m },
                
                // Westwood/UCLA Area
                new ZipCode { ZipCodeValue = "90024", City = "Westwood", Latitude = 34.0629m, Longitude = -118.4426m },
                new ZipCode { ZipCodeValue = "90025", City = "West LA", Latitude = 34.0417m, Longitude = -118.4312m },
                new ZipCode { ZipCodeValue = "90064", City = "West LA", Latitude = 34.0347m, Longitude = -118.4161m },
                
                // Culver City Area
                new ZipCode { ZipCodeValue = "90230", City = "Culver City", Latitude = 34.0211m, Longitude = -118.3965m },
                new ZipCode { ZipCodeValue = "90232", City = "Culver City", Latitude = 34.0194m, Longitude = -118.3847m },
                
                // Downtown LA
                new ZipCode { ZipCodeValue = "90012", City = "Downtown LA", Latitude = 34.0669m, Longitude = -118.2468m },
                new ZipCode { ZipCodeValue = "90013", City = "Downtown LA", Latitude = 34.0394m, Longitude = -118.2581m },
                new ZipCode { ZipCodeValue = "90014", City = "Downtown LA", Latitude = 34.0430m, Longitude = -118.2673m },
                new ZipCode { ZipCodeValue = "90015", City = "Downtown LA", Latitude = 34.0394m, Longitude = -118.2673m },
                
                // Mid-City/Koreatown
                new ZipCode { ZipCodeValue = "90005", City = "Koreatown", Latitude = 34.0583m, Longitude = -118.3086m },
                new ZipCode { ZipCodeValue = "90006", City = "Koreatown", Latitude = 34.0481m, Longitude = -118.2912m },
                new ZipCode { ZipCodeValue = "90010", City = "Mid-City", Latitude = 34.0622m, Longitude = -118.2912m },
                
                // Silver Lake/Echo Park
                new ZipCode { ZipCodeValue = "90026", City = "Silver Lake", Latitude = 34.0778m, Longitude = -118.2612m },
                new ZipCode { ZipCodeValue = "90039", City = "Silver Lake", Latitude = 34.1069m, Longitude = -118.2581m },
                
                // Pasadena Area
                new ZipCode { ZipCodeValue = "91101", City = "Pasadena", Latitude = 34.1561m, Longitude = -118.1318m },
                new ZipCode { ZipCodeValue = "91103", City = "Pasadena", Latitude = 34.1747m, Longitude = -118.1441m },
                new ZipCode { ZipCodeValue = "91106", City = "Pasadena", Latitude = 34.1394m, Longitude = -118.1225m },
                
                // Burbank/Glendale
                new ZipCode { ZipCodeValue = "91501", City = "Burbank", Latitude = 34.1808m, Longitude = -118.3090m },
                new ZipCode { ZipCodeValue = "91502", City = "Burbank", Latitude = 34.1728m, Longitude = -118.3270m },
                new ZipCode { ZipCodeValue = "91201", City = "Glendale", Latitude = 34.1425m, Longitude = -118.2551m },
                new ZipCode { ZipCodeValue = "91202", City = "Glendale", Latitude = 34.1478m, Longitude = -118.2228m }
            };

            context.ZipCodes.AddRange(zipCodes);
            await context.SaveChangesAsync();

            // Real service types
            var serviceTypes = new[]
            {
                new ServiceType { ServiceName = "Plumbing", Category = "Repair", Description = "Plumbing repairs, installations, and maintenance" },
                new ServiceType { ServiceName = "Electrical", Category = "Repair", Description = "Electrical work, wiring, and repairs" },
                new ServiceType { ServiceName = "HVAC", Category = "Repair", Description = "Heating, ventilation, and air conditioning services" },
                new ServiceType { ServiceName = "Roofing", Category = "Construction", Description = "Roof repairs, installations, and maintenance" },
                new ServiceType { ServiceName = "Flooring", Category = "Construction", Description = "Floor installation, repair, and refinishing" },
                new ServiceType { ServiceName = "Painting", Category = "Maintenance", Description = "Interior and exterior painting services" },
                new ServiceType { ServiceName = "Landscaping", Category = "Maintenance", Description = "Garden design, maintenance, and landscaping" },
                new ServiceType { ServiceName = "Handyman", Category = "Repair", Description = "General home repairs and maintenance" },
                new ServiceType { ServiceName = "Appliance Repair", Category = "Repair", Description = "Appliance installation and repair services" },
                new ServiceType { ServiceName = "Pest Control", Category = "Maintenance", Description = "Pest inspection and extermination services" }
            };

            context.ServiceTypes.AddRange(serviceTypes);
            await context.SaveChangesAsync();

            // Real contractors with realistic data
            var contractors = new[]
            {
                // Beverly Hills Area Contractors
                new Contractor 
                { 
                    CompanyName = "Beverly Hills Elite Plumbing", 
                    ContactName = "Michael Rodriguez", 
                    Phone = "(310) 555-0101", 
                    Email = "mike@bheliteplumbing.com",
                    Address = "9876 Wilshire Blvd, Beverly Hills, CA",
                    ZipCodeId = zipCodes.First(z => z.ZipCodeValue == "90210").ZipCodeId,
                    ServiceRadius = 15,
                    ServiceTypes = "[\"Plumbing\", \"Appliance Repair\"]",
                    Rating = 4.8m
                },
                new Contractor 
                { 
                    CompanyName = "West Side Electric Solutions", 
                    ContactName = "Sarah Chen", 
                    Phone = "(310) 555-0202", 
                    Email = "sarah@westsideelectric.com",
                    Address = "456 N Canon Dr, Beverly Hills, CA",
                    ZipCodeId = zipCodes.First(z => z.ZipCodeValue == "90210").ZipCodeId,
                    ServiceRadius = 20,
                    ServiceTypes = "[\"Electrical\", \"Handyman\"]",
                    Rating = 4.9m
                },
                
                // Hollywood Area Contractors
                new Contractor 
                { 
                    CompanyName = "Hollywood HVAC Masters", 
                    ContactName = "David Kim", 
                    Phone = "(323) 555-0303", 
                    Email = "david@hollywoodhvac.com",
                    Address = "1234 Hollywood Blvd, Hollywood, CA",
                    ZipCodeId = zipCodes.First(z => z.ZipCodeValue == "90028").ZipCodeId,
                    ServiceRadius = 25,
                    ServiceTypes = "[\"HVAC\", \"Electrical\"]",
                    Rating = 4.7m
                },
                new Contractor 
                { 
                    CompanyName = "Sunset Strip Roofing", 
                    ContactName = "Maria Gonzalez", 
                    Phone = "(323) 555-0404", 
                    Email = "maria@sunsetroofing.com",
                    Address = "8765 Sunset Blvd, West Hollywood, CA",
                    ZipCodeId = zipCodes.First(z => z.ZipCodeValue == "90046").ZipCodeId,
                    ServiceRadius = 30,
                    ServiceTypes = "[\"Roofing\", \"Handyman\"]",
                    Rating = 4.6m
                },
                
                // Santa Monica Area Contractors
                new Contractor 
                { 
                    CompanyName = "Santa Monica Bay Plumbing", 
                    ContactName = "James Wilson", 
                    Phone = "(310) 555-0505", 
                    Email = "james@smbayplumbing.com",
                    Address = "2468 Main St, Santa Monica, CA",
                    ZipCodeId = zipCodes.First(z => z.ZipCodeValue == "90401").ZipCodeId,
                    ServiceRadius = 20,
                    ServiceTypes = "[\"Plumbing\", \"HVAC\"]",
                    Rating = 4.5m
                },
                new Contractor 
                { 
                    CompanyName = "Venice Beach Handyman Services", 
                    ContactName = "Robert Taylor", 
                    Phone = "(310) 555-0606", 
                    Email = "rob@venicehandyman.com",
                    Address = "1357 Abbot Kinney Blvd, Venice, CA",
                    ZipCodeId = zipCodes.First(z => z.ZipCodeValue == "90291").ZipCodeId,
                    ServiceRadius = 25,
                    ServiceTypes = "[\"Handyman\", \"Painting\", \"Flooring\"]",
                    Rating = 4.4m
                },
                
                // Westwood/UCLA Area Contractors
                new Contractor 
                { 
                    CompanyName = "Westwood Premium Electric", 
                    ContactName = "Lisa Anderson", 
                    Phone = "(310) 555-0707", 
                    Email = "lisa@westwoodelectric.com",
                    Address = "9876 Westwood Blvd, Westwood, CA",
                    ZipCodeId = zipCodes.First(z => z.ZipCodeValue == "90024").ZipCodeId,
                    ServiceRadius = 18,
                    ServiceTypes = "[\"Electrical\", \"Appliance Repair\"]",
                    Rating = 4.8m
                },
                
                // Downtown LA Contractors
                new Contractor 
                { 
                    CompanyName = "Downtown LA Construction", 
                    ContactName = "Carlos Martinez", 
                    Phone = "(213) 555-0808", 
                    Email = "carlos@dtlaconstruction.com",
                    Address = "555 S Spring St, Los Angeles, CA",
                    ZipCodeId = zipCodes.First(z => z.ZipCodeValue == "90013").ZipCodeId,
                    ServiceRadius = 35,
                    ServiceTypes = "[\"Roofing\", \"Flooring\", \"Painting\", \"Handyman\"]",
                    Rating = 4.3m
                },
                
                // Koreatown Contractors
                new Contractor 
                { 
                    CompanyName = "K-Town HVAC & Plumbing", 
                    ContactName = "Jennifer Park", 
                    Phone = "(213) 555-0909", 
                    Email = "jennifer@ktownhvac.com",
                    Address = "3456 Wilshire Blvd, Los Angeles, CA",
                    ZipCodeId = zipCodes.First(z => z.ZipCodeValue == "90005").ZipCodeId,
                    ServiceRadius = 22,
                    ServiceTypes = "[\"HVAC\", \"Plumbing\", \"Appliance Repair\"]",
                    Rating = 4.6m
                },
                
                // Pasadena Area Contractors
                new Contractor 
                { 
                    CompanyName = "Pasadena Home Services", 
                    ContactName = "Thomas Brown", 
                    Phone = "(626) 555-1010", 
                    Email = "tom@pasadenahome.com",
                    Address = "789 E Colorado Blvd, Pasadena, CA",
                    ZipCodeId = zipCodes.First(z => z.ZipCodeValue == "91101").ZipCodeId,
                    ServiceRadius = 28,
                    ServiceTypes = "[\"Landscaping\", \"Painting\", \"Handyman\"]",
                    Rating = 4.5m
                },
                
                // Burbank/Glendale Contractors
                new Contractor 
                { 
                    CompanyName = "Valley Electric & Repair", 
                    ContactName = "Amanda Davis", 
                    Phone = "(818) 555-1111", 
                    Email = "amanda@valleyelectric.com",
                    Address = "2468 Magnolia Blvd, Burbank, CA",
                    ZipCodeId = zipCodes.First(z => z.ZipCodeValue == "91501").ZipCodeId,
                    ServiceRadius = 30,
                    ServiceTypes = "[\"Electrical\", \"HVAC\", \"Appliance Repair\"]",
                    Rating = 4.7m
                },
                
                // Multi-service contractors
                new Contractor 
                { 
                    CompanyName = "LA Metro Home Solutions", 
                    ContactName = "Kevin Johnson", 
                    Phone = "(323) 555-1212", 
                    Email = "kevin@lametrohome.com",
                    Address = "1111 Melrose Ave, Los Angeles, CA",
                    ZipCodeId = zipCodes.First(z => z.ZipCodeValue == "90038").ZipCodeId,
                    ServiceRadius = 40,
                    ServiceTypes = "[\"Plumbing\", \"Electrical\", \"HVAC\", \"Handyman\", \"Painting\"]",
                    Rating = 4.4m
                },
                
                new Contractor 
                { 
                    CompanyName = "Westside Premium Services", 
                    ContactName = "Nicole White", 
                    Phone = "(310) 555-1313", 
                    Email = "nicole@westsidepremium.com",
                    Address = "5555 Pico Blvd, Los Angeles, CA",
                    ZipCodeId = zipCodes.First(z => z.ZipCodeValue == "90064").ZipCodeId,
                    ServiceRadius = 25,
                    ServiceTypes = "[\"Flooring\", \"Painting\", \"Landscaping\", \"Pest Control\"]",
                    Rating = 4.6m
                }
            };

            context.Contractors.AddRange(contractors);
            await context.SaveChangesAsync();

            // Create service areas for contractors (expand their coverage)
            var serviceAreas = new List<ServiceArea>();
            
            foreach (var contractor in contractors)
            {
                // Add primary service area (contractor's own ZIP)
                serviceAreas.Add(new ServiceArea
                {
                    ContractorId = contractor.ContractorId,
                    ZipCodeId = contractor.ZipCodeId,
                    Priority = 1
                });

                // Add nearby ZIP codes based on service radius
                var contractorZip = zipCodes.First(z => z.ZipCodeId == contractor.ZipCodeId);
                var nearbyZips = zipCodes.Where(z => 
                    CalculateDistance(contractorZip.Latitude, contractorZip.Longitude, z.Latitude, z.Longitude) <= contractor.ServiceRadius
                    && z.ZipCodeId != contractor.ZipCodeId
                ).Take(8); // Limit to 8 additional areas

                int priority = 2;
                foreach (var nearbyZip in nearbyZips)
                {
                    serviceAreas.Add(new ServiceArea
                    {
                        ContractorId = contractor.ContractorId,
                        ZipCodeId = nearbyZip.ZipCodeId,
                        Priority = priority++
                    });
                }
            }

            context.ServiceAreas.AddRange(serviceAreas);
            await context.SaveChangesAsync();
        }

        private static double CalculateDistance(decimal lat1, decimal lon1, decimal lat2, decimal lon2)
        {
            const double earthRadius = 3959.0; // Earth radius in miles

            var dLat = ToRadians((double)(lat2 - lat1));
            var dLon = ToRadians((double)(lon2 - lon1));
            var lat1Rad = ToRadians((double)lat1);
            var lat2Rad = ToRadians((double)lat2);

            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                    Math.Cos(lat1Rad) * Math.Cos(lat2Rad) *
                    Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

            return earthRadius * c;
        }

        private static double ToRadians(double degrees) => degrees * Math.PI / 180.0;
    }
}