using Microsoft.AspNetCore.Mvc;
using UrbanReferralNetwork.Services;

namespace UrbanReferralNetwork.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AddressController : ControllerBase
    {
        private readonly IAddressService _addressService;

        public AddressController(IAddressService addressService)
        {
            _addressService = addressService;
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchAddresses([FromQuery] string query, [FromQuery] int maxResults = 10)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(query))
                    return BadRequest(new { success = false, error = "Query is required" });

                var results = await _addressService.SearchAddressesAsync(query, maxResults);
                return Ok(new { success = true, results });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        [HttpGet("details/{zipCode}")]
        public async Task<IActionResult> GetAddressDetails(string zipCode)
        {
            try
            {
                var details = await _addressService.GetAddressDetailsAsync(zipCode);
                if (details == null)
                    return NotFound(new { success = false, error = "ZIP code not found" });

                return Ok(new { success = true, details });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        [HttpGet("nearby/{zipCode}")]
        public async Task<IActionResult> GetNearbyZipCodes(string zipCode, [FromQuery] double radius = 10)
        {
            try
            {
                var nearbyZips = await _addressService.GetNearbyZipCodesAsync(zipCode, radius);
                return Ok(new { success = true, zipCodes = nearbyZips });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        [HttpPost("validate")]
        public async Task<IActionResult> ValidateAddress([FromBody] AddressValidationRequest request)
        {
            try
            {
                var isValid = await _addressService.ValidateAddressAsync(request.Address, request.ZipCode);
                return Ok(new { success = true, isValid });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        [HttpGet("debug/cities")]
        public async Task<IActionResult> GetAllCities()
        {
            try
            {
                var results = await _addressService.SearchAddressesAsync("", 1000);
                var cities = results.Select(r => r.City).Distinct().OrderBy(c => c).ToList();
                return Ok(new { success = true, cities, count = cities.Count });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }
    }

    public class AddressValidationRequest
    {
        public string Address { get; set; } = string.Empty;
        public string ZipCode { get; set; } = string.Empty;
    }
}