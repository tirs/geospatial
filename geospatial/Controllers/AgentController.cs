using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UrbanReferralNetwork.Data;
using UrbanReferralNetwork.Models;

namespace UrbanReferralNetwork.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AgentController : ControllerBase
    {
        private readonly UrbanReferralContext _context;
        private readonly ILogger<AgentController> _logger;

        public AgentController(UrbanReferralContext context, ILogger<AgentController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/Agent/list
        [HttpGet("list")]
        public async Task<ActionResult<IEnumerable<object>>> GetAgents([FromHeader(Name = "Authorization")] string? authHeader)
        {
            try
            {
                var sessionToken = ExtractSessionToken(authHeader);
                if (string.IsNullOrEmpty(sessionToken))
                {
                    return Unauthorized(new { error = "Invalid session" });
                }

                var session = await _context.LoginSessions
                    .Include(s => s.Agent)
                    .FirstOrDefaultAsync(s => s.SessionToken == sessionToken && s.IsActive);

                if (session == null || session.IsExpired || session.Agent.UserRole != "Admin")
                {
                    return Unauthorized(new { error = "Admin access required" });
                }

                var agents = await _context.Agents
                    .Where(a => a.IsActive)
                    .Select(a => new
                    {
                        a.AgentId,
                        a.AgentCode,
                        a.FirstName,
                        a.LastName,
                        FullName = a.FirstName + " " + a.LastName,
                        a.Email,
                        a.Phone,
                        a.Department,
                        a.UserRole,
                        a.IsActive,
                        a.LastLoginDate,
                        a.CreatedDate
                    })
                    .OrderBy(a => a.LastName)
                    .ToListAsync();

                return Ok(agents);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving agents list");
                return StatusCode(500, new { error = "Failed to retrieve agents" });
            }
        }

        // GET: api/Agent/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetAgent(int id, [FromHeader(Name = "Authorization")] string? authHeader)
        {
            try
            {
                var sessionToken = ExtractSessionToken(authHeader);
                if (string.IsNullOrEmpty(sessionToken))
                {
                    return Unauthorized(new { error = "Invalid session" });
                }

                var session = await _context.LoginSessions
                    .Include(s => s.Agent)
                    .FirstOrDefaultAsync(s => s.SessionToken == sessionToken && s.IsActive);

                if (session == null || session.IsExpired)
                {
                    return Unauthorized(new { error = "Invalid session" });
                }

                // Allow agents to view their own info, admins can view any
                if (session.Agent.UserRole != "Admin" && session.Agent.AgentId != id)
                {
                    return Forbid();
                }

                var agent = await _context.Agents
                    .Where(a => a.AgentId == id)
                    .Select(a => new
                    {
                        a.AgentId,
                        a.AgentCode,
                        a.FirstName,
                        a.LastName,
                        a.Email,
                        a.Phone,
                        a.Extension,
                        a.Department,
                        a.Shift,
                        a.SkillLevel,
                        a.ServiceTypes,
                        a.MaxConcurrentCalls,
                        a.UserRole,
                        a.IsActive,
                        a.LastLoginDate,
                        a.CreatedDate,
                        a.MustChangePassword
                    })
                    .FirstOrDefaultAsync();

                if (agent == null)
                {
                    return NotFound(new { error = "Agent not found" });
                }

                return Ok(agent);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving agent {AgentId}", id);
                return StatusCode(500, new { error = "Failed to retrieve agent" });
            }
        }

        // PUT: api/Agent/{id}
        [HttpPut("{id}")]
        public async Task<ActionResult<object>> UpdateAgent(int id, [FromBody] AgentUpdateRequest request, [FromHeader(Name = "Authorization")] string? authHeader)
        {
            try
            {
                var sessionToken = ExtractSessionToken(authHeader);
                if (string.IsNullOrEmpty(sessionToken))
                {
                    return Unauthorized(new { error = "Invalid session" });
                }

                var session = await _context.LoginSessions
                    .Include(s => s.Agent)
                    .FirstOrDefaultAsync(s => s.SessionToken == sessionToken && s.IsActive);

                if (session == null || session.IsExpired)
                {
                    return Unauthorized(new { error = "Invalid session" });
                }

                // Allow agents to update their own info, admins can update any
                if (session.Agent.UserRole != "Admin" && session.Agent.AgentId != id)
                {
                    return Forbid();
                }

                var agent = await _context.Agents.FindAsync(id);
                if (agent == null)
                {
                    return NotFound(new { error = "Agent not found" });
                }

                // Update allowed fields
                if (!string.IsNullOrEmpty(request.FirstName))
                    agent.FirstName = request.FirstName;
                if (!string.IsNullOrEmpty(request.LastName))
                    agent.LastName = request.LastName;
                if (!string.IsNullOrEmpty(request.Email))
                    agent.Email = request.Email;
                if (!string.IsNullOrEmpty(request.Phone))
                    agent.Phone = request.Phone;
                if (!string.IsNullOrEmpty(request.Extension))
                    agent.Extension = request.Extension;
                if (!string.IsNullOrEmpty(request.Department))
                    agent.Department = request.Department;
                if (!string.IsNullOrEmpty(request.Shift))
                    agent.Shift = request.Shift;
                if (request.SkillLevel.HasValue)
                    agent.SkillLevel = request.SkillLevel.Value;
                if (!string.IsNullOrEmpty(request.ServiceTypes))
                    agent.ServiceTypes = request.ServiceTypes;
                if (request.MaxConcurrentCalls.HasValue)
                    agent.MaxConcurrentCalls = request.MaxConcurrentCalls.Value;

                // Only admins can change role and status
                if (session.Agent.UserRole == "Admin")
                {
                    if (!string.IsNullOrEmpty(request.UserRole))
                        agent.UserRole = request.UserRole;
                    if (request.IsActive.HasValue)
                        agent.IsActive = request.IsActive.Value;
                }

                agent.UpdatedDate = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Agent updated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating agent {AgentId}", id);
                return StatusCode(500, new { error = "Failed to update agent" });
            }
        }

        // DELETE: api/Agent/{id}
        [HttpDelete("{id}")]
        public async Task<ActionResult<object>> DeleteAgent(int id, [FromHeader(Name = "Authorization")] string? authHeader)
        {
            try
            {
                var sessionToken = ExtractSessionToken(authHeader);
                if (string.IsNullOrEmpty(sessionToken))
                {
                    return Unauthorized(new { error = "Invalid session" });
                }

                var session = await _context.LoginSessions
                    .Include(s => s.Agent)
                    .FirstOrDefaultAsync(s => s.SessionToken == sessionToken && s.IsActive);

                if (session == null || session.IsExpired || session.Agent.UserRole != "Admin")
                {
                    return Unauthorized(new { error = "Admin access required" });
                }

                var agent = await _context.Agents.FindAsync(id);
                if (agent == null)
                {
                    return NotFound(new { error = "Agent not found" });
                }

                // Don't allow deleting yourself
                if (agent.AgentId == session.Agent.AgentId)
                {
                    return BadRequest(new { error = "Cannot delete your own account" });
                }

                // Soft delete - just mark as inactive
                agent.IsActive = false;
                agent.UpdatedDate = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Agent deactivated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting agent {AgentId}", id);
                return StatusCode(500, new { error = "Failed to delete agent" });
            }
        }

        private string? ExtractSessionToken(string? authHeader)
        {
            if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
                return null;
            return authHeader.Substring(7);
        }
    }

    public class AgentUpdateRequest
    {
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? Extension { get; set; }
        public string? Department { get; set; }
        public string? Shift { get; set; }
        public int? SkillLevel { get; set; }
        public string? ServiceTypes { get; set; }
        public int? MaxConcurrentCalls { get; set; }
        public string? UserRole { get; set; }
        public bool? IsActive { get; set; }
    }
}