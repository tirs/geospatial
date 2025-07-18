using Microsoft.AspNetCore.Mvc;
using UrbanReferralNetwork.Services;

namespace UrbanReferralNetwork.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ServiceAreaController : ControllerBase
    {
        private readonly IServiceAreaMapService _serviceAreaMapService;

        public ServiceAreaController(IServiceAreaMapService serviceAreaMapService)
        {
            _serviceAreaMapService = serviceAreaMapService;
        }

        [HttpGet("contractor/{contractorId}")]
        public async Task<IActionResult> GetContractorServiceArea(int contractorId)
        {
            try
            {
                var serviceArea = await _serviceAreaMapService.GenerateServiceAreaMapAsync(contractorId);
                return Ok(new { success = true, serviceArea });
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { success = false, error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        [HttpPost("multiple")]
        public async Task<IActionResult> GetMultipleServiceAreas([FromBody] MultipleServiceAreasRequest request)
        {
            try
            {
                var serviceAreas = await _serviceAreaMapService.GenerateMultipleServiceAreasAsync(request.ContractorIds);
                return Ok(new { success = true, serviceAreas });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        [HttpGet("bounds/{contractorId}")]
        public async Task<IActionResult> GetServiceAreaBounds(int contractorId)
        {
            try
            {
                var bounds = await _serviceAreaMapService.GetServiceAreaBoundsAsync(contractorId);
                return Ok(new { success = true, bounds });
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { success = false, error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        [HttpGet("points/{contractorId}")]
        public async Task<IActionResult> GetServiceAreaPoints(int contractorId, [FromQuery] int gridSize = 20)
        {
            try
            {
                var points = await _serviceAreaMapService.GetServiceAreaPointsAsync(contractorId, gridSize);
                return Ok(new { success = true, points });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }
    }

    public class MultipleServiceAreasRequest
    {
        public List<int> ContractorIds { get; set; } = new();
    }
}