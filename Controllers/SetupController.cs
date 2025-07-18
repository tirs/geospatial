using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UrbanReferralNetwork.Data;
using UrbanReferralNetwork.Models;
using UrbanReferralNetwork.Services;

namespace UrbanReferralNetwork.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SetupController : ControllerBase
    {
        private readonly UrbanReferralContext _context;
        private readonly ISecurityService _securityService;
        private readonly ILogger<SetupController> _logger;

        public SetupController(UrbanReferralContext context, ISecurityService securityService, ILogger<SetupController> logger)
        {
            _context = context;
            _securityService = securityService;
            _logger = logger;
        }

        [HttpGet("check-users")]
        public async Task<ActionResult> CheckUsers()
        {
            var agents = await _context.Agents.Select(a => new 
            {
                a.AgentId,
                a.AgentCode,
                a.FirstName,
                a.LastName,
                a.UserRole,
                a.IsActive,
                HasPassword = !string.IsNullOrEmpty(a.PasswordHash)
            }).ToListAsync();

            return Ok(new { 
                TotalAgents = agents.Count,
                Agents = agents
            });
        }

        [HttpPost("create-admin")]
        public async Task<ActionResult> CreateAdmin()
        {
            try
            {
                // Check if admin already exists
                var existingAdmin = await _context.Agents.FirstOrDefaultAsync(a => a.AgentCode == "ADMIN_001");
                if (existingAdmin != null)
                {
                    return Ok(new { Message = "Admin user already exists", AgentCode = "ADMIN_001" });
                }

                var defaultPassword = "TempPass123!";
                var salt = _securityService.GenerateSalt();
                var passwordHash = _securityService.HashPassword(defaultPassword, salt);
                
                var adminUser = new Agent
                {
                    AgentCode = "ADMIN_001",
                    FirstName = "System",
                    LastName = "Administrator",
                    Email = "admin@urbanreferral.com",
                    Department = "Administration",
                    SkillLevel = 5,
                    UserRole = "Admin",
                    PasswordHash = passwordHash,
                    PasswordSalt = salt,
                    MustChangePassword = true,
                    IsActive = true,
                    HireDate = DateTime.UtcNow,
                    CreatedDate = DateTime.UtcNow,
                    UpdatedDate = DateTime.UtcNow
                };
                
                _context.Agents.Add(adminUser);
                await _context.SaveChangesAsync();
                
                return Ok(new { 
                    Message = "Admin user created successfully",
                    AgentCode = "ADMIN_001",
                    Password = defaultPassword,
                    Note = "Please change password on first login"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating admin user");
                return StatusCode(500, new { Error = "Failed to create admin user", Details = ex.Message });
            }
        }

        [HttpPost("test-login")]
        public async Task<ActionResult> TestLogin([FromBody] TestLoginRequest request)
        {
            try
            {
                var agent = await _context.Agents
                    .FirstOrDefaultAsync(a => a.AgentCode == request.AgentCode);

                if (agent == null)
                {
                    return Ok(new { Result = "AGENT_NOT_FOUND" });
                }

                var passwordValid = _securityService.VerifyPassword(request.Password, agent.PasswordHash ?? "", agent.PasswordSalt ?? "");

                return Ok(new { 
                    Result = passwordValid ? "PASSWORD_VALID" : "PASSWORD_INVALID",
                    AgentCode = agent.AgentCode,
                    HasPasswordHash = !string.IsNullOrEmpty(agent.PasswordHash),
                    HasPasswordSalt = !string.IsNullOrEmpty(agent.PasswordSalt),
                    IsActive = agent.IsActive
                });
            }
            catch (Exception ex)
            {
                return Ok(new { Result = "ERROR", Details = ex.Message });
            }
        }
    }

    public class TestLoginRequest
    {
        public string AgentCode { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}