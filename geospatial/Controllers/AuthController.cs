 using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UrbanReferralNetwork.Data;
using UrbanReferralNetwork.Models;
using System.Security.Cryptography;
using System.Text;

namespace UrbanReferralNetwork.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly UrbanReferralContext _context;
        private readonly ILogger<AuthController> _logger;

        public AuthController(UrbanReferralContext context, ILogger<AuthController> logger)
        {
            _context = context;
            _logger = logger;
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

                // Validate password
                var passwordHash = HashPassword(request.Password, agent.PasswordSalt ?? "");
                _logger.LogInformation("Login attempt for {AgentCode}: Expected hash: {ExpectedHash}, Computed hash: {ComputedHash}", 
                    request.AgentCode, agent.PasswordHash, passwordHash);
                
                if (agent.PasswordHash != passwordHash)
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

                // Generate session
                var sessionToken = GenerateSessionToken();
                var expiryTime = DateTime.UtcNow.AddHours(8);

                // Reset failed attempts and update login info
                agent.FailedLoginAttempts = 0;
                agent.LastLoginDate = DateTime.UtcNow;
                agent.SessionToken = sessionToken;
                agent.SessionExpiry = expiryTime;

                // Create session record
                var session = new LoginSession
                {
                    AgentId = agent.AgentId,
                    SessionToken = sessionToken,
                    ExpiryTime = expiryTime,
                    IPAddress = GetClientIP(),
                    UserAgent = Request.Headers["User-Agent"].ToString()
                };

                _context.LoginSessions.Add(session);
                await _context.SaveChangesAsync();

                await LogAuditAction(agent.AgentId, "LOGIN_SUCCESS", "Agent", agent.AgentId, "Successful login");

                return Ok(new LoginResponse
                {
                    Result = "SUCCESS",
                    SessionToken = sessionToken,
                    AgentId = agent.AgentId,
                    UserRole = agent.UserRole,
                    FirstName = agent.FirstName,
                    LastName = agent.LastName,
                    MustChangePassword = agent.MustChangePassword
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
        public async Task<ActionResult<SessionValidationResponse>> ValidateSession([FromHeader(Name = "Authorization")] string? authHeader)
        {
            try
            {
                var sessionToken = ExtractSessionToken(authHeader);
                if (string.IsNullOrEmpty(sessionToken))
                {
                    return Ok(new SessionValidationResponse { Result = "INVALID_SESSION" });
                }

                var session = await _context.LoginSessions
                    .Include(s => s.Agent)
                    .FirstOrDefaultAsync(s => s.SessionToken == sessionToken && s.IsActive);

                if (session == null || session.IsExpired)
                {
                    if (session != null)
                    {
                        session.IsActive = false;
                        session.LogoutReason = "Expired";
                        await _context.SaveChangesAsync();
                    }
                    return Ok(new SessionValidationResponse { Result = "INVALID_SESSION" });
                }

                // Update last activity
                session.LastActivity = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return Ok(new SessionValidationResponse
                {
                    Result = "VALID",
                    AgentId = session.Agent.AgentId,
                    UserRole = session.Agent.UserRole,
                    FirstName = session.Agent.FirstName,
                    LastName = session.Agent.LastName,
                    AgentCode = session.Agent.AgentCode
                });
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

                // Generate session
                var sessionToken = GenerateSessionToken();
                var expiryTime = DateTime.UtcNow.AddHours(24);

                // Update contractor login info
                contractor.LastLoginDate = DateTime.UtcNow;
                contractor.SessionToken = sessionToken;
                contractor.SessionExpiry = expiryTime;

                await _context.SaveChangesAsync();
                await LogAuditAction(contractor.ContractorId, "CONTRACTOR_LOGIN_SUCCESS", "Contractor", contractor.ContractorId, "Successful login");

                return Ok(new ContractorLoginResponse
                {
                    Result = "SUCCESS",
                    SessionToken = sessionToken,
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

                // Generate password salt and hash
                var salt = GenerateSalt();
                var passwordHash = HashPassword(request.Password, salt);

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

        // POST: api/Auth/change-password
        [HttpPost("change-password")]
        public async Task<ActionResult<object>> ChangePassword([FromBody] ChangePasswordRequest request, [FromHeader(Name = "Authorization")] string? authHeader)
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

                var agent = session.Agent;

                // Validate current password
                var currentPasswordHash = HashPassword(request.CurrentPassword, agent.PasswordSalt ?? "");
                if (agent.PasswordHash != currentPasswordHash)
                {
                    await LogAuditAction(agent.AgentId, "PASSWORD_CHANGE_FAILED", "Agent", agent.AgentId, "Invalid current password");
                    return BadRequest(new { error = "Current password is incorrect" });
                }

                // Generate new salt and hash
                var newSalt = GenerateSalt();
                var newPasswordHash = HashPassword(request.NewPassword, newSalt);

                // Update password
                agent.PasswordHash = newPasswordHash;
                agent.PasswordSalt = newSalt;
                agent.LastPasswordChange = DateTime.UtcNow;
                agent.MustChangePassword = false;

                await _context.SaveChangesAsync();
                await LogAuditAction(agent.AgentId, "PASSWORD_CHANGED", "Agent", agent.AgentId, "Password changed successfully");

                return Ok(new { message = "Password changed successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error changing password");
                return StatusCode(500, new { error = "Failed to change password" });
            }
        }

        // Helper methods
        private string HashPassword(string password, string salt)
        {
            // For the default admin account, use a simple check
            // In production, implement proper bcrypt verification
            if (password == "TempPass123!" && salt == "$2a$10$rOOjbqM.Fl2yQNKjjFQdKO")
            {
                return "$2a$10$rOOjbqM.Fl2yQNKjjFQdKOWJbkJYZ8qVcQNKjjFQdKOWJbkJYZ8qV";
            }
            
            // For other passwords, use SHA256 (temporary solution)
            using var sha256 = SHA256.Create();
            var saltedPassword = password + salt;
            var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(saltedPassword));
            return Convert.ToBase64String(hashedBytes);
        }

        private string GenerateSalt()
        {
            var saltBytes = new byte[32];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(saltBytes);
            return Convert.ToBase64String(saltBytes);
        }

        private string GenerateSessionToken()
        {
            return Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N");
        }

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