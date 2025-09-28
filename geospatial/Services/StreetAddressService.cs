using Microsoft.EntityFrameworkCore;
using UrbanReferralNetwork.Data;
using UrbanReferralNetwork.Models;

namespace UrbanReferralNetwork.Services
{
    public interface IStreetAddressService
    {
        Task<List<StreetAddressMatch>> SearchStreetAddressesAsync(string query, int maxResults = 10);
        Task<AddressValidationResult> ValidateFullAddressAsync(string fullAddress);
        Task<List<StreetSuggestion>> GetStreetSuggestionsAsync(string streetName, string zipCode);
    }

    public class StreetAddressService : IStreetAddressService
    {
        private readonly UrbanReferralContext _context;

        public StreetAddressService(UrbanReferralContext context)
        {
            _context = context;
        }

        public async Task<List<StreetAddressMatch>> SearchStreetAddressesAsync(string query, int maxResults = 10)
        {
            if (string.IsNullOrWhiteSpace(query) || query.Length < 3)
                return new List<StreetAddressMatch>();

            // Since Streets table doesn't exist, use ZIP/city search
            return await FallbackToZipCitySearch(query, maxResults);
        }

        public async Task<AddressValidationResult> ValidateFullAddressAsync(string fullAddress)
        {
            if (string.IsNullOrWhiteSpace(fullAddress))
                return new AddressValidationResult { IsValid = false, Error = "Address is required" };

            // Parse address components
            var addressParts = ParseAddress(fullAddress);
            
            if (addressParts.ZipCode == null)
                return new AddressValidationResult { IsValid = false, Error = "ZIP code not found in address" };

            // Validate ZIP code exists
            var zipCode = await _context.ZipCodes
                .FirstOrDefaultAsync(z => z.ZipCodeValue == addressParts.ZipCode && z.IsActive);

            if (zipCode == null)
                return new AddressValidationResult { IsValid = false, Error = "Invalid ZIP code" };

            // Streets table doesn't exist, only validate ZIP code

            return new AddressValidationResult 
            { 
                IsValid = true, 
                ZipCode = zipCode.ZipCodeValue,
                City = zipCode.City,
                State = zipCode.State,
                County = zipCode.County,
                Latitude = zipCode.Latitude,
                Longitude = zipCode.Longitude
            };
        }

        public Task<List<StreetSuggestion>> GetStreetSuggestionsAsync(string streetName, string zipCode)
        {
            // Streets table doesn't exist, return empty list
            return Task.FromResult(new List<StreetSuggestion>());
        }

        private async Task<List<StreetAddressMatch>> FallbackToZipCitySearch(string query, int maxResults)
        {
            // Fall back to ZIP/city search when Streets table doesn't exist
            var zipMatches = await _context.ZipCodes
                .Where(z => (z.ZipCodeValue.Contains(query) || z.City.Contains(query)) && z.IsActive)
                .OrderBy(z => z.ZipCodeValue)
                .Take(maxResults)
                .Select(z => new StreetAddressMatch
                {
                    City = z.City,
                    State = z.State,
                    ZipCode = z.ZipCodeValue,
                    County = z.County,
                    Latitude = z.Latitude,
                    Longitude = z.Longitude,
                    FormattedAddress = $"{z.City}, {z.State} {z.ZipCodeValue}",
                    IsValidNumber = true
                })
                .ToListAsync();

            return zipMatches;
        }

        private AddressParts ParseAddress(string fullAddress)
        {
            var parts = new AddressParts();
            
            // Simple regex patterns for address parsing
            var zipPattern = @"\b\d{5}(-\d{4})?\b";
            var zipMatch = System.Text.RegularExpressions.Regex.Match(fullAddress, zipPattern);
            if (zipMatch.Success)
                parts.ZipCode = zipMatch.Value.Split('-')[0]; // Take just the 5-digit part

            // Extract street number (first number in address)
            var numberPattern = @"^\s*(\d+)";
            var numberMatch = System.Text.RegularExpressions.Regex.Match(fullAddress, numberPattern);
            if (numberMatch.Success && int.TryParse(numberMatch.Groups[1].Value, out int streetNumber))
                parts.StreetNumber = streetNumber;

            // Extract street name (simplified - between number and city/ZIP)
            var streetPattern = @"^\s*\d+\s+([^,]+?)(?:\s+(?:St|Ave|Blvd|Dr|Rd|Ln|Way|Ct|Pl|Pkwy|Cir),|\s*,)";
            var streetMatch = System.Text.RegularExpressions.Regex.Match(fullAddress, streetPattern, System.Text.RegularExpressions.RegexOptions.IgnoreCase);
            if (streetMatch.Success)
                parts.StreetName = streetMatch.Groups[1].Value.Trim();

            return parts;
        }
    }

    public class StreetAddressMatch
    {
        public int? StreetNumber { get; set; }
        public string StreetName { get; set; } = string.Empty;
        public string StreetType { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string ZipCode { get; set; } = string.Empty;
        public string County { get; set; } = string.Empty;
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }
        public string FormattedAddress { get; set; } = string.Empty;
        public bool IsValidNumber { get; set; }
    }

    public class AddressValidationResult
    {
        public bool IsValid { get; set; }
        public string Error { get; set; } = string.Empty;
        public string ZipCode { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string County { get; set; } = string.Empty;
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }
    }

    public class StreetSuggestion
    {
        public string StreetName { get; set; } = string.Empty;
        public string StreetType { get; set; } = string.Empty;
        public string FullStreetName { get; set; } = string.Empty;
        public int? NumberRangeStart { get; set; }
        public int? NumberRangeEnd { get; set; }
    }

    public class AddressParts
    {
        public int? StreetNumber { get; set; }
        public string? StreetName { get; set; }
        public string? ZipCode { get; set; }
    }
}