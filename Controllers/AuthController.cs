using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UrbanReferralNetwork.Data;
using UrbanReferralNetwork.Models;
using UrbanReferralNetwork.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;

namespace UrbanReferralNetwork.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [EnableRateLimiting("AuthPolicy")]
    public class AuthController : ControllerBase
    {
        private readonly UrbanReferralContext _context;
        private readonly ILogger<AuthController> _logger;
        private readonly ISecurityService _securityService;
        private readonly IJwtService _jwtService;
        private readonly ICacheService _cacheService;

        public AuthController(UrbanReferralContext context, ILogger<AuthController> logger, 
            ISecurityService securityService, IJwtService jwtService, ICacheService cacheService)
        {
            _context = context;
            _logger = logger;
            _securityService = securityService;
            _jwtService = jwtService;
            _cacheService = cacheService;
        }

        // POST: api/Auth/login
        [HttpPost("login")]
        public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
        {
            try
            {
                var agent = await _context.Agents
                    .FirstOrDefaultAsync(a => a.AgentCode == request.AgentCode && a.IsActive);

                if (agent == null)
                {
                    await LogAuditAction(null, "LOGIN_FAILED", "Agent", null, $"Invalid agent code: {request.AgentCode}");
                    return Ok(new LoginResponse { Result = "INVALID_CREDENTIALS", Message = "Invalid credentials" });
                }

                // Check if account is locked
                if (agent.AccountLocked)
                {
                    await LogAuditAction(agent.AgentId, "LOGIN_BLOCKED", "Agent", agent.AgentId, "Account locked");
                    return Ok(new LoginResponse { Result = "ACCOUNT_LOCKED", Message = "Account is locked" });
                }

                // Validate password - allow login if no password is set (for password reset)
                bool passwordValid = false;
                
                if (string.IsNullOrEmpty(agent.PasswordHash))
                {
                    // No password set - allow login with any password for reset
                    passwordValid = true;
                }
                else
                {
                    // Normal password validation
                    passwordValid = _securityService.VerifyPassword(request.Password, agent.PasswordHash, agent.PasswordSalt ?? "");
                }
                
                if (!passwordValid)
                {
                    // Increment failed attempts
                    agent.FailedLoginAttempts++;
                    if (agent.FailedLoginAttempts >= 5)
                    {
                        agent.AccountLocked = true;
                        agent.LockoutEndTime = DateTime.UtcNow.AddMinutes(30);
                    }
                    await _context.SaveChangesAsync();

                    await LogAuditAction(agent.AgentId, "LOGIN_FAILED", "Agent", agent.AgentId, "Invalid password");
                    return Ok(new LoginResponse { Result = "INVALID_CREDENTIALS", Message = "Invalid credentials" });
                }

                // Generate JWT token
                var jwtToken = _jwtService.GenerateToken(agent);

                // Reset failed attempts and update login info
                agent.FailedLoginAttempts = 0;
                agent.LastLoginDate = DateTime.UtcNow;

                // Create session record for audit
                var session = new LoginSession
                {
                    AgentId = agent.AgentId,
                    SessionToken = Guid.NewGuid().ToString(), // Use unique GUID instead of partial token
                    ExpiryTime = _jwtService.GetTokenExpiry(jwtToken),
                    IPAddress = GetClientIP(),
                    UserAgent = Request.Headers["User-Agent"].ToString()
                };

                _context.LoginSessions.Add(session);
                await _context.SaveChangesAsync();

                // Cache user info for quick access (simplified)
                await _cacheService.SetAsync($"agent_{agent.AgentId}", agent.AgentCode, TimeSpan.FromHours(8));

                await LogAuditAction(agent.AgentId, "LOGIN_SUCCESS", "Agent", agent.AgentId, "Successful login");

                return Ok(new LoginResponse
                {
                    Result = "SUCCESS",
                    SessionToken = jwtToken,
                    AgentId = agent.AgentId,
                    UserRole = agent.UserRole,
                    FirstName = agent.FirstName,
                    LastName = agent.LastName,
                    MustChangePassword = false // Always false now
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during login for agent {AgentCode}", request.AgentCode);
                return StatusCode(500, new LoginResponse { Result = "ERROR", Message = "Login failed" });
            }
        }

        // POST: api/Auth/logout
        [HttpPost("logout")]
        public async Task<ActionResult<object>> Logout([FromHeader(Name = "Authorization")] string? authHeader)
        {
            try
            {
                var sessionToken = ExtractSessionToken(authHeader);
                if (string.IsNullOrEmpty(sessionToken))
                {
                    return Ok(new { Result = "SUCCESS" });
                }

                var session = await _context.LoginSessions
                    .FirstOrDefaultAsync(s => s.SessionToken == sessionToken && s.IsActive);

                if (session != null)
                {
                    session.IsActive = false;
                    session.LogoutTime = DateTime.UtcNow;
                    session.LogoutReason = "Manual";

                    var agent = await _context.Agents.FindAsync(session.AgentId);
                    if (agent != null)
                    {
                        agent.SessionToken = null;
                        agent.SessionExpiry = null;
                    }

                    await _context.SaveChangesAsync();
                    await LogAuditAction(session.AgentId, "LOGOUT", "Agent", session.AgentId, "Manual logout");
                }

                return Ok(new { Result = "SUCCESS" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during logout");
                return Ok(new { Result = "SUCCESS" }); // Always return success for logout
            }
        }

        // POST: api/Auth/validate
        [HttpPost("validate")]
        [DisableRateLimiting]
        public async Task<ActionResult<SessionValidationResponse>> ValidateSession([FromHeader(Name = "Authorization")] string? authHeader)
        {
            try
            {
                var token = ExtractSessionToken(authHeader);
                if (string.IsNullOrEmpty(token))
                {
                    return Ok(new SessionValidationResponse { Result = "INVALID_SESSION" });
                }

                // Validate JWT token
                if (!_jwtService.ValidateToken(token, out int userId, out string userType))
                {
                    return Ok(new SessionValidationResponse { Result = "INVALID_SESSION" });
                }

                if (userType == "Agent")
                {
                    // Get agent from database (skip cache for now to avoid complexity)
                    var agent = await _context.Agents.FindAsync(userId);
                    if (agent == null || !agent.IsActive)
                    {
                        return Ok(new SessionValidationResponse { Result = "INVALID_SESSION" });
                    }

                    return Ok(new SessionValidationResponse
                    {
                        Result = "VALID",
                        AgentId = agent.AgentId,
                        UserRole = agent.UserRole,
                        FirstName = agent.FirstName,
                        LastName = agent.LastName,
                        AgentCode = agent.AgentCode
                    });
                }

                return Ok(new SessionValidationResponse { Result = "INVALID_SESSION" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating session");
                return Ok(new SessionValidationResponse { Result = "INVALID_SESSION" });
            }
        }

        // POST: api/Auth/contractor-login
        [HttpPost("contractor-login")]
        public async Task<ActionResult<ContractorLoginResponse>> ContractorLogin([FromBody] ContractorLoginRequest request)
        {
            try
            {
                var contractor = await _context.Contractors
                    .FirstOrDefaultAsync(c => c.Phone == request.Phone && c.IsActive);

                if (contractor == null)
                {
                    await LogAuditAction(null, "CONTRACTOR_LOGIN_FAILED", "Contractor", null, $"Invalid phone: {request.Phone}");
                    return Ok(new ContractorLoginResponse { Result = "INVALID_CREDENTIALS", Message = "Invalid credentials" });
                }

                // For now, use company name as password (you can enhance this later)
                var expectedPassword = contractor.CompanyName.Replace(" ", "").ToLower() + "123";
                if (request.Password != expectedPassword)
                {
                    await LogAuditAction(contractor.ContractorId, "CONTRACTOR_LOGIN_FAILED", "Contractor", contractor.ContractorId, "Invalid password");
                    return Ok(new ContractorLoginResponse { Result = "INVALID_CREDENTIALS", Message = "Invalid credentials" });
                }

                // Generate JWT token
                var jwtToken = _jwtService.GenerateContractorToken(contractor);

                // Update contractor login info
                contractor.LastLoginDate = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                // Cache contractor info
                await _cacheService.SetAsync($"contractor_{contractor.ContractorId}", new
                {
                    contractor.ContractorId,
                    contractor.CompanyName,
                    contractor.ContactName
                }, TimeSpan.FromHours(24));

                await LogAuditAction(contractor.ContractorId, "CONTRACTOR_LOGIN_SUCCESS", "Contractor", contractor.ContractorId, "Successful login");

                return Ok(new ContractorLoginResponse
                {
                    Result = "SUCCESS",
                    SessionToken = jwtToken,
                    ContractorId = contractor.ContractorId,
                    CompanyName = contractor.CompanyName,
                    ContactName = contractor.ContactName,
                    UserType = "Contractor"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during contractor login for phone {Phone}", request.Phone);
                return StatusCode(500, new ContractorLoginResponse { Result = "ERROR", Message = "Login failed" });
            }
        }

        // POST: api/Auth/contractor-validate
        [HttpPost("contractor-validate")]
        public async Task<ActionResult<ContractorValidationResponse>> ValidateContractorSession([FromHeader(Name = "Authorization")] string? authHeader)
        {
            try
            {
                var sessionToken = ExtractSessionToken(authHeader);
                if (string.IsNullOrEmpty(sessionToken))
                {
                    return Ok(new ContractorValidationResponse { Result = "INVALID_SESSION" });
                }

                var contractor = await _context.Contractors
                    .FirstOrDefaultAsync(c => c.SessionToken == sessionToken && c.IsActive);

                if (contractor == null || contractor.SessionExpiry < DateTime.UtcNow)
                {
                    return Ok(new ContractorValidationResponse { Result = "INVALID_SESSION" });
                }

                // Update last activity
                contractor.LastLoginDate = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return Ok(new ContractorValidationResponse
                {
                    Result = "VALID",
                    ContractorId = contractor.ContractorId,
                    CompanyName = contractor.CompanyName,
                    ContactName = contractor.ContactName,
                    UserType = "Contractor"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating contractor session");
                return Ok(new ContractorValidationResponse { Result = "INVALID_SESSION" });
            }
        }

        // POST: api/Auth/register-agent (Admin only)
        [HttpPost("register-agent")]
        public async Task<ActionResult<object>> RegisterAgent([FromBody] AgentRegistrationRequest request, [FromHeader(Name = "Authorization")] string? authHeader)
        {
            try
            {
                // Validate admin session
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

                // Check if agent code already exists
                var existingAgent = await _context.Agents
                    .FirstOrDefaultAsync(a => a.AgentCode == request.AgentCode);

                if (existingAgent != null)
                {
                    return BadRequest(new { error = "Agent code already exists" });
                }

                // Validate password strength
                if (!_securityService.IsValidPassword(request.Password))
                {
                    return BadRequest(new { error = "Password must be at least 8 characters with uppercase, lowercase, number, and special character" });
                }

                // Generate password salt and hash
                var salt = _securityService.GenerateSalt();
                var passwordHash = _securityService.HashPassword(request.Password, salt);

                // Create new agent
                var agent = new Agent
                {
                    AgentCode = request.AgentCode,
                    FirstName = request.FirstName,
                    LastName = request.LastName,
                    Email = request.Email,
                    Phone = request.Phone,
                    Extension = request.Extension,
                    Department = request.Department,
                    Shift = request.Shift,
                    SkillLevel = request.SkillLevel,
                    ServiceTypes = request.ServiceTypes,
                    MaxConcurrentCalls = request.MaxConcurrentCalls,
                    UserRole = request.UserRole,
                    PasswordHash = passwordHash,
                    PasswordSalt = salt,
                    MustChangePassword = request.MustChangePassword,
                    IsActive = true
                };

                _context.Agents.Add(agent);
                await _context.SaveChangesAsync();

                await LogAuditAction(session.AgentId, "AGENT_CREATED", "Agent", agent.AgentId, 
                    $"New agent created: {agent.AgentCode} - {agent.FullName}");

                return Ok(new { 
                    success = true, 
                    message = "Agent registered successfully",
                    agentId = agent.AgentId,
                    agentCode = agent.AgentCode
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error registering agent");
                return StatusCode(500, new { error = "Failed to register agent" });
            }
        }



        // POST: api/Auth/reset-password-requirements
        [HttpPost("reset-password-requirements")]
        public async Task<ActionResult> ResetPasswordRequirements()
        {
            try
            {
                var agents = await _context.Agents.ToListAsync();
                foreach (var agent in agents)
                {
                    agent.MustChangePassword = false;
                }
                await _context.SaveChangesAsync();
                return Ok(new { message = $"Updated {agents.Count} agents - password change no longer required" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error resetting password requirements");
                return StatusCode(500, new { error = "Failed to reset password requirements" });
            }
        }

        // Helper methods

        private string? ExtractSessionToken(string? authHeader)
        {
            if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
                return null;
            return authHeader.Substring(7);
        }

        private string GetClientIP()
        {
            return HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
        }

        private async Task LogAuditAction(int? agentId, string action, string entityType, int? entityId, string details)
        {
            try
            {
                var auditLog = new AuditLog
                {
                    AgentId = agentId,
                    Action = action,
                    EntityType = entityType,
                    EntityId = entityId,
                    NewValues = details,
                    IPAddress = GetClientIP(),
                    UserAgent = Request.Headers["User-Agent"].ToString()
                };

                _context.AuditLogs.Add(auditLog);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to log audit action: {Action}", action);
            }
        }
    }
}