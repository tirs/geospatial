using Microsoft.EntityFrameworkCore;
using UrbanReferralNetwork.Data;
using UrbanReferralNetwork.Models;

namespace UrbanReferralNetwork.Services
{
    public interface IAddressService
    {
        Task<List<AddressMatch>> SearchAddressesAsync(string query, int maxResults = 10);
        Task<AddressDetails?> GetAddressDetailsAsync(string zipCode);
        Task<List<ZipCodeInfo>> GetNearbyZipCodesAsync(string zipCode, double radiusMiles = 10);
        Task<bool> ValidateAddressAsync(string address, string zipCode);
    }

    public class AddressService : IAddressService
    {
        private readonly UrbanReferralContext _context;
        private readonly IGeospatialService _geospatialService;

        public AddressService(UrbanReferralContext context, IGeospatialService geospatialService)
        {
            _context = context;
            _geospatialService = geospatialService;
        }

        public async Task<List<AddressMatch>> SearchAddressesAsync(string query, int maxResults = 10)
        {
            if (string.IsNullOrWhiteSpace(query) || query.Length < 2)
                return new List<AddressMatch>();

            var matches = new List<AddressMatch>();

            // Search by ZIP code
            if (query.All(char.IsDigit) && query.Length >= 3)
            {
                var zipMatches = await _context.ZipCodes
                    .Where(z => z.ZipCodeValue.StartsWith(query) && z.IsActive)
                    .OrderBy(z => z.ZipCodeValue)
                    .Take(maxResults)
                    .Select(z => new AddressMatch
                    {
                        Type = "zipcode",
                        Display = $"{z.ZipCodeValue} - {z.City}, {z.State}",
                        ZipCode = z.ZipCodeValue,
                        City = z.City,
                        State = z.State,
                        County = z.County,
                        Latitude = z.Latitude,
                        Longitude = z.Longitude
                    })
                    .ToListAsync();

                matches.AddRange(zipMatches);
            }

            // Search by city name
            var cityMatches = await _context.ZipCodes
                .Where(z => z.City.Contains(query) && z.IsActive)
                .GroupBy(z => new { z.City, z.State, z.County })
                .Select(g => new AddressMatch
                {
                    Type = "city",
                    Display = $"{g.Key.City}, {g.Key.State}",
                    City = g.Key.City,
                    State = g.Key.State,
                    County = g.Key.County,
                    ZipCode = g.OrderBy(z => z.ZipCodeValue).First().ZipCodeValue,
                    Latitude = g.Average(z => z.Latitude),
                    Longitude = g.Average(z => z.Longitude)
                })
                .Take(maxResults - matches.Count)
                .ToListAsync();

            matches.AddRange(cityMatches);

            return matches.Take(maxResults).ToList();
        }

        public async Task<AddressDetails?> GetAddressDetailsAsync(string zipCode)
        {
            var zip = await _context.ZipCodes
                .FirstOrDefaultAsync(z => z.ZipCodeValue == zipCode && z.IsActive);

            if (zip == null) return null;

            return new AddressDetails
            {
                ZipCode = zip.ZipCodeValue,
                City = zip.City,
                County = zip.County,
                State = zip.State,
                Latitude = zip.Latitude,
                Longitude = zip.Longitude,
                FormattedAddress = $"{zip.City}, {zip.State} {zip.ZipCodeValue}"
            };
        }

        public async Task<List<ZipCodeInfo>> GetNearbyZipCodesAsync(string zipCode, double radiusMiles = 10)
        {
            var centerZip = await _context.ZipCodes
                .FirstOrDefaultAsync(z => z.ZipCodeValue == zipCode && z.IsActive);

            if (centerZip == null) return new List<ZipCodeInfo>();

            var allZips = await _context.ZipCodes
                .Where(z => z.IsActive)
                .ToListAsync();

            var nearbyZips = new List<ZipCodeInfo>();

            foreach (var zip in allZips)
            {
                var distance = _geospatialService.CalculateDistance(
                    centerZip.Latitude, centerZip.Longitude,
                    zip.Latitude, zip.Longitude);

                if (distance <= radiusMiles)
                {
                    nearbyZips.Add(new ZipCodeInfo
                    {
                        ZipCode = zip.ZipCodeValue,
                        City = zip.City,
                        State = zip.State,
                        County = zip.County,
                        Distance = (decimal)distance,
                        Latitude = zip.Latitude,
                        Longitude = zip.Longitude
                    });
                }
            }

            return nearbyZips.OrderBy(z => z.Distance).ToList();
        }

        public async Task<bool> ValidateAddressAsync(string address, string zipCode)
        {
            if (string.IsNullOrWhiteSpace(address) || string.IsNullOrWhiteSpace(zipCode))
                return false;

            // Check if ZIP code exists
            var zipExists = await _context.ZipCodes
                .AnyAsync(z => z.ZipCodeValue == zipCode && z.IsActive);

            if (!zipExists) return false;

            // Basic address validation (can be enhanced)
            var addressParts = address.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            return addressParts.Length >= 2; // At least street number and name
        }
    }

    public class AddressMatch
    {
        public string Type { get; set; } = string.Empty; // "zipcode", "city", "street"
        public string Display { get; set; } = string.Empty;
        public string ZipCode { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string County { get; set; } = string.Empty;
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }
    }

    public class AddressDetails
    {
        public string ZipCode { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string County { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }
        public string FormattedAddress { get; set; } = string.Empty;
    }

    public class ZipCodeInfo
    {
        public string ZipCode { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string County { get; set; } = string.Empty;
        public decimal Distance { get; set; }
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }
    }
}