using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UrbanReferralNetwork.Data;

namespace UrbanReferralNetwork.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ContractorsController : ControllerBase
    {
        private readonly UrbanReferralContext _context;

        public ContractorsController(UrbanReferralContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetContractors()
        {
            try
            {
                var contractors = await _context.Contractors
                    .Include(c => c.ZipCode)
                    .Where(c => c.IsActive)
                    .Select(c => new
                    {
                        c.ContractorId,
                        c.CompanyName,
                        c.ContactName,
                        c.Phone,
                        c.Email,
                        c.Address,
                        City = c.ZipCode.City,
                        State = c.ZipCode.State,
                        ZipCode = c.ZipCode.ZipCodeValue,
                        ServiceTypes = c.ServiceTypes,
                        c.Rating,
                        c.IsActive,
                        DateAdded = c.CreatedDate
                    })
                    .OrderBy(c => c.CompanyName)
                    .ToListAsync();

                return Ok(contractors);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = "Failed to retrieve contractors", details = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetContractor(int id)
        {
            try
            {
                var contractor = await _context.Contractors
                    .Include(c => c.ZipCode)
                    .Where(c => c.ContractorId == id && c.IsActive)
                    .Select(c => new
                    {
                        c.ContractorId,
                        c.CompanyName,
                        c.ContactName,
                        c.Phone,
                        c.Email,
                        c.Address,
                        City = c.ZipCode.City,
                        State = c.ZipCode.State,
                        ZipCode = c.ZipCode.ZipCodeValue,
                        ServiceTypes = c.ServiceTypes,
                        c.Rating,
                        c.IsActive,
                        DateAdded = c.CreatedDate
                    })
                    .FirstOrDefaultAsync();

                if (contractor == null)
                    return NotFound(new { error = "Contractor not found" });

                return Ok(contractor);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = "Failed to retrieve contractor", details = ex.Message });
            }
        }
    }
}