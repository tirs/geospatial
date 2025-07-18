using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UrbanReferralNetwork.Data;
using UrbanReferralNetwork.Models;

namespace UrbanReferralNetwork.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ZipCodeController : ControllerBase
    {
        private readonly UrbanReferralContext _context;

        public ZipCodeController(UrbanReferralContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Search ZIP codes for autocomplete functionality
        /// </summary>
        /// <param name="q">Search query (ZIP code or city name)</param>
        /// <param name="limit">Maximum number of results (default: 8)</param>
        /// <returns>List of matching ZIP codes</returns>
        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<object>>> SearchZipCodes(
            [FromQuery] string q, 
            [FromQuery] int limit = 8)
        {
            if (string.IsNullOrWhiteSpace(q) || q.Length < 2)
            {
                return BadRequest("Query must be at least 2 characters long");
            }

            try
            {
                var query = q.Trim().ToLower();
                
                var zipCodes = await _context.ZipCodes
                    .Where(z => z.IsActive && 
                               (z.ZipCodeValue.StartsWith(query) || 
                                z.City.ToLower().Contains(query)))
                    .OrderBy(z => z.ZipCodeValue.StartsWith(query) ? 0 : 1) // ZIP matches first
                    .ThenBy(z => z.ZipCodeValue)
                    .Take(limit)
                    .Select(z => new
                    {
                        zipCode = z.ZipCodeValue,
                        city = z.City,
                        state = z.State,
                        county = z.County
                    })
                    .ToListAsync();

                return Ok(zipCodes);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Internal server error", message = ex.Message });
            }
        }

        /// <summary>
        /// Get ZIP code details by ZIP code
        /// </summary>
        /// <param name="zipCode">5-digit ZIP code</param>
        /// <returns>ZIP code details</returns>
        [HttpGet("{zipCode}")]
        public async Task<ActionResult<object>> GetZipCodeDetails(string zipCode)
        {
            if (string.IsNullOrWhiteSpace(zipCode) || zipCode.Length != 5)
            {
                return BadRequest("ZIP code must be exactly 5 digits");
            }

            try
            {
                var zip = await _context.ZipCodes
                    .Where(z => z.IsActive && z.ZipCodeValue == zipCode)
                    .Select(z => new
                    {
                        zipCode = z.ZipCodeValue,
                        city = z.City,
                        state = z.State,
                        county = z.County,
                        latitude = z.Latitude,
                        longitude = z.Longitude
                    })
                    .FirstOrDefaultAsync();

                if (zip == null)
                {
                    return NotFound(new { error = "ZIP code not found" });
                }

                return Ok(zip);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Internal server error", message = ex.Message });
            }
        }

        /// <summary>
        /// Get all cities in Los Angeles County
        /// </summary>
        /// <returns>List of cities</returns>
        [HttpGet("cities")]
        public async Task<ActionResult<IEnumerable<string>>> GetCities()
        {
            try
            {
                var cities = await _context.ZipCodes
                    .Where(z => z.IsActive && z.County == "Los Angeles")
                    .Select(z => z.City)
                    .Distinct()
                    .OrderBy(c => c)
                    .ToListAsync();

                return Ok(cities);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Internal server error", message = ex.Message });
            }
        }

        /// <summary>
        /// Find contractors serving a specific ZIP code
        /// </summary>
        /// <param name="zipCode">5-digit ZIP code</param>
        /// <param name="serviceType">Optional service type filter</param>
        /// <returns>List of contractors serving the area</returns>
        [HttpGet("{zipCode}/contractors")]
        public async Task<ActionResult<IEnumerable<object>>> GetContractorsByZip(
            string zipCode, 
            [FromQuery] string? serviceType = null)
        {
            if (string.IsNullOrWhiteSpace(zipCode) || zipCode.Length != 5)
            {
                return BadRequest("ZIP code must be exactly 5 digits");
            }

            try
            {
                var query = _context.Contractors
                    .Where(c => c.IsActive && 
                               c.ServiceAreas.Any(sa => sa.ZipCode.ZipCodeValue == zipCode));

                if (!string.IsNullOrWhiteSpace(serviceType))
                {
                    query = query.Where(c => c.ServiceTypes != null && c.ServiceTypes.Contains(serviceType));
                }

                var contractors = await query
                    .Select(c => new
                    {
                        contractorId = c.ContractorId,
                        businessName = c.CompanyName,
                        contactName = c.ContactName,
                        phone = c.Phone,
                        email = c.Email,
                        rating = c.Rating,
                        isVerified = c.IsActive,
                        serviceTypes = c.ServiceTypes ?? "",
                        responseTime = "Standard",
                        availability = c.IsActive ? "Available" : "Inactive"
                    })
                    .OrderByDescending(c => c.rating)
                    .ToListAsync();

                return Ok(contractors);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Internal server error", message = ex.Message });
            }
        }

        /// <summary>
        /// Check service coverage for a ZIP code
        /// </summary>
        /// <param name="zipCode">5-digit ZIP code</param>
        /// <returns>Service coverage information</returns>
        [HttpGet("{zipCode}/coverage")]
        public async Task<ActionResult<object>> GetServiceCoverage(string zipCode)
        {
            if (string.IsNullOrWhiteSpace(zipCode) || zipCode.Length != 5)
            {
                return BadRequest("ZIP code must be exactly 5 digits");
            }

            try
            {
                var zipExists = await _context.ZipCodes
                    .AnyAsync(z => z.IsActive && z.ZipCodeValue == zipCode);

                if (!zipExists)
                {
                    return NotFound(new { error = "ZIP code not found" });
                }

                var serviceTypes = await _context.ServiceTypes
                    .Select(st => new
                    {
                        serviceType = st.ServiceName,
                        contractorCount = _context.Contractors
                            .Count(c => c.IsActive && 
                                       c.ServiceTypes != null && c.ServiceTypes.Contains(st.ServiceName) &&
                                       c.ServiceAreas.Any(sa => sa.ZipCode.ZipCodeValue == zipCode)),
                        isAvailable = _context.Contractors
                            .Any(c => c.IsActive &&
                                     c.ServiceTypes != null && c.ServiceTypes.Contains(st.ServiceName) &&
                                     c.ServiceAreas.Any(sa => sa.ZipCode.ZipCodeValue == zipCode))
                    })
                    .ToListAsync();

                var totalContractors = await _context.Contractors
                    .CountAsync(c => c.IsActive && 
                                    c.ServiceAreas.Any(sa => sa.ZipCode.ZipCodeValue == zipCode));

                var availableContractors = await _context.Contractors
                    .CountAsync(c => c.IsActive &&
                                    c.ServiceAreas.Any(sa => sa.ZipCode.ZipCodeValue == zipCode));

                return Ok(new
                {
                    zipCode,
                    totalContractors,
                    availableContractors,
                    coveragePercentage = totalContractors > 0 ? Math.Round((double)availableContractors / totalContractors * 100, 1) : 0,
                    serviceTypes,
                    status = totalContractors > 0 ? "Covered" : "No Coverage"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Internal server error", message = ex.Message });
            }
        }

        /// <summary>
        /// Get nearby ZIP codes for expanded search
        /// </summary>
        /// <param name="zipCode">5-digit ZIP code</param>
        /// <param name="radiusMiles">Search radius in miles (default: 10)</param>
        /// <returns>List of nearby ZIP codes</returns>
        [HttpGet("{zipCode}/nearby")]
        public async Task<ActionResult<IEnumerable<object>>> GetNearbyZipCodes(
            string zipCode, 
            [FromQuery] double radiusMiles = 10)
        {
            if (string.IsNullOrWhiteSpace(zipCode) || zipCode.Length != 5)
            {
                return BadRequest("ZIP code must be exactly 5 digits");
            }

            try
            {
                var centerZip = await _context.ZipCodes
                    .Where(z => z.IsActive && z.ZipCodeValue == zipCode)
                    .FirstOrDefaultAsync();

                if (centerZip == null)
                {
                    return NotFound(new { error = "ZIP code not found" });
                }

                // Simple distance calculation (approximate)
                var nearbyZips = await _context.ZipCodes
                    .Where(z => z.IsActive && z.ZipCodeValue != zipCode)
                    .Select(z => new
                    {
                        zipCode = z.ZipCodeValue,
                        city = z.City,
                        state = z.State,
                        latitude = z.Latitude,
                        longitude = z.Longitude,
                        distance = Math.Sqrt(
                            Math.Pow((double)(z.Latitude - centerZip.Latitude) * 69, 2) +
                            Math.Pow((double)(z.Longitude - centerZip.Longitude) * 54.6, 2)
                        )
                    })
                    .Where(z => z.distance <= radiusMiles)
                    .OrderBy(z => z.distance)
                    .Take(20)
                    .ToListAsync();

                return Ok(nearbyZips);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Internal server error", message = ex.Message });
            }
        }
    }
}