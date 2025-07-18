using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UrbanReferralNetwork.Data;

namespace UrbanReferralNetwork.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DataSummaryController : ControllerBase
    {
        private readonly UrbanReferralContext _context;

        public DataSummaryController(UrbanReferralContext context)
        {
            _context = context;
        }

        [HttpGet("overview")]
        public async Task<IActionResult> GetDataOverview()
        {
            try
            {
                var overview = new
                {
                    DatabaseStatus = "Connected",
                    LastUpdated = DateTime.Now,
                    TableCounts = new
                    {
                        ZipCodes = await _context.ZipCodes.CountAsync(),
                        Contractors = await _context.Contractors.CountAsync(),
                        ServiceTypes = await _context.ServiceTypes.CountAsync(),
                        Referrals = await _context.Referrals.CountAsync(),
                        Agents = await _context.Agents.CountAsync(),
                        CallRecords = await _context.CallRecords.CountAsync()
                    },
                    SampleData = new
                    {
                        TopCities = await _context.ZipCodes
                            .GroupBy(z => z.City)
                            .Select(g => new { City = g.Key, Count = g.Count() })
                            .OrderByDescending(x => x.Count)
                            .Take(5)
                            .ToListAsync(),
                        
                        ServiceTypesList = await _context.ServiceTypes
                            .Select(s => s.ServiceName)
                            .ToListAsync(),
                            
                        RecentReferralsCount = await _context.Referrals
                            .Where(r => r.RequestDate >= DateTime.Now.AddDays(-30))
                            .CountAsync()
                    }
                };

                return Ok(overview);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = "Unable to retrieve data overview", details = ex.Message });
            }
        }
    }
}