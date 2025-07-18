using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UrbanReferralNetwork.Data;
using UrbanReferralNetwork.Models;

namespace UrbanReferralNetwork.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CallCenterController : ControllerBase
    {
        private readonly UrbanReferralContext _context;
        private readonly ILogger<CallCenterController> _logger;

        public CallCenterController(UrbanReferralContext context, ILogger<CallCenterController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/CallCenter/queue/status
        [HttpGet("queue/status")]
        public async Task<ActionResult<object>> GetQueueStatus()
        {
            try
            {
                var queueItems = await _context.CallQueue
                    .Where(q => q.QueueStatus == "Waiting")
                    .Include(q => q.CallRecord)
                    .OrderBy(q => q.QueuePosition)
                    .Select(q => new
                    {
                        q.QueueId,
                        q.QueuePosition,
                        q.Priority,
                        q.EstimatedWaitTime,
                        CallerName = q.CallRecord.CallerName ?? "Unknown Caller",
                        CallerPhone = q.CallRecord.CallerPhone,
                        ServiceType = q.CallRecord.ServiceType ?? "General",
                        WaitTime = EF.Functions.DateDiffSecond(q.CallRecord.QueueStartTime, DateTime.UtcNow),
                        QueueStartTime = q.CallRecord.QueueStartTime
                    })
                    .ToListAsync();

                var availableAgents = await _context.AgentStatus
                    .Where(s => s.IsActive && s.Status == "Available")
                    .Include(s => s.Agent)
                    .CountAsync();

                var totalCalls = queueItems.Count;
                var averageWaitTime = totalCalls > 0 
                    ? queueItems.Average(q => q.WaitTime) 
                    : 0;

                return Ok(new
                {
                    TotalCalls = totalCalls,
                    AverageWaitTime = $"{(int)(averageWaitTime / 60):D2}:{(int)(averageWaitTime % 60):D2}",
                    AvailableAgents = availableAgents,
                    Calls = queueItems
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting queue status");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        // POST: api/CallCenter/calls/incoming
        [HttpPost("calls/incoming")]
        public async Task<ActionResult<object>> HandleIncomingCall([FromBody] IncomingCallRequest request)
        {
            try
            {
                // Create call record
                var callRecord = new CallRecord
                {
                    CallUniqueId = Guid.NewGuid().ToString(),
                    CallerPhone = request.From,
                    CallerName = request.CallerName,
                    ServiceType = request.ServiceType,
                    CallSource = request.CallSource ?? "Phone",
                    Priority = request.Priority ?? "Normal",
                    CallStatus = "Queued"
                };

                _context.CallRecords.Add(callRecord);
                await _context.SaveChangesAsync();

                // Get next queue position
                var maxPosition = await _context.CallQueue
                    .Where(q => q.QueueStatus == "Waiting")
                    .MaxAsync(q => (int?)q.QueuePosition) ?? 0;

                // Add to queue
                var queueItem = new CallQueue
                {
                    CallId = callRecord.CallId,
                    QueuePosition = maxPosition + 1,
                    Priority = request.Priority ?? "Normal",
                    ServiceType = request.ServiceType,
                    EstimatedWaitTime = CalculateEstimatedWaitTime()
                };

                _context.CallQueue.Add(queueItem);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Call {callRecord.CallUniqueId} added to queue at position {queueItem.QueuePosition}");

                return Ok(new
                {
                    CallId = callRecord.CallId,
                    QueuePosition = queueItem.QueuePosition,
                    EstimatedWaitTime = queueItem.EstimatedWaitTime,
                    Message = "Call added to queue successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error handling incoming call");
                return StatusCode(500, new { error = "Failed to process incoming call" });
            }
        }

        // POST: api/CallCenter/calls/{callId}/accept
        [HttpPost("calls/{callId}/accept")]
        public async Task<ActionResult<object>> AcceptCall(int callId, [FromBody] AcceptCallRequest request)
        {
            try
            {
                var callRecord = await _context.CallRecords.FindAsync(callId);
                if (callRecord == null)
                {
                    return NotFound(new { error = "Call not found" });
                }

                var agent = await _context.Agents.FindAsync(request.AgentId);
                if (agent == null)
                {
                    return NotFound(new { error = "Agent not found" });
                }

                // Check if agent is available
                var agentStatus = await _context.AgentStatus
                    .Where(s => s.AgentId == request.AgentId && s.IsActive)
                    .FirstOrDefaultAsync();

                if (agentStatus?.Status != "Available")
                {
                    return BadRequest(new { error = "Agent is not available" });
                }

                using var transaction = await _context.Database.BeginTransactionAsync();

                try
                {
                    // Update call record
                    callRecord.AgentId = request.AgentId;
                    callRecord.CallStartTime = DateTime.UtcNow;
                    callRecord.CallStatus = "InProgress";
                    callRecord.WaitTime = (int)(DateTime.UtcNow - callRecord.QueueStartTime).TotalSeconds;

                    // Update queue
                    var queueItem = await _context.CallQueue
                        .Where(q => q.CallId == callId)
                        .FirstOrDefaultAsync();

                    if (queueItem != null)
                    {
                        queueItem.AssignedAgent = request.AgentId;
                        queueItem.AssignedTime = DateTime.UtcNow;
                        queueItem.QueueStatus = "Assigned";
                    }

                    // Update agent status
                    agentStatus.IsActive = false;
                    agentStatus.StatusEndTime = DateTime.UtcNow;

                    var newStatus = new AgentStatus
                    {
                        AgentId = request.AgentId,
                        Status = "OnCall",
                        CurrentCallId = callId,
                        IsActive = true
                    };

                    _context.AgentStatus.Add(newStatus);

                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    _logger.LogInformation($"Call {callRecord.CallUniqueId} accepted by agent {agent.AgentCode}");

                    return Ok(new
                    {
                        Message = "Call accepted successfully",
                        CallId = callId,
                        AgentName = agent.FullName,
                        CallStartTime = callRecord.CallStartTime
                    });
                }
                catch
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error accepting call {CallId}", callId);
                return StatusCode(500, new { error = "Failed to accept call" });
            }
        }

        // PUT: api/CallCenter/calls/{callId}/complete
        [HttpPut("calls/{callId}/complete")]
        public async Task<ActionResult<object>> CompleteCall(int callId, [FromBody] CompleteCallRequest request)
        {
            try
            {
                var callRecord = await _context.CallRecords
                    .Include(c => c.Agent)
                    .FirstOrDefaultAsync(c => c.CallId == callId);

                if (callRecord == null)
                {
                    return NotFound(new { error = "Call not found" });
                }

                using var transaction = await _context.Database.BeginTransactionAsync();

                try
                {
                    // Update call record
                    callRecord.CallEndTime = DateTime.UtcNow;
                    callRecord.CallStatus = request.Status;
                    callRecord.CallOutcome = request.Outcome;
                    callRecord.CallNotes = request.Notes;
                    callRecord.CustomerSatisfaction = request.CustomerSatisfaction;
                    callRecord.FollowUpRequired = request.FollowUpRequired;
                    callRecord.FollowUpDate = request.FollowUpDate;

                    if (callRecord.CallStartTime.HasValue)
                    {
                        callRecord.CallDuration = (int)(callRecord.CallEndTime.Value - callRecord.CallStartTime.Value).TotalSeconds;
                    }

                    // Update queue status
                    var queueItem = await _context.CallQueue
                        .Where(q => q.CallId == callId)
                        .FirstOrDefaultAsync();

                    if (queueItem != null)
                    {
                        queueItem.QueueStatus = "Completed";
                    }

                    // Update agent status back to available
                    if (callRecord.AgentId.HasValue)
                    {
                        var currentStatus = await _context.AgentStatus
                            .Where(s => s.AgentId == callRecord.AgentId && s.IsActive)
                            .FirstOrDefaultAsync();

                        if (currentStatus != null)
                        {
                            currentStatus.IsActive = false;
                            currentStatus.StatusEndTime = DateTime.UtcNow;

                            var newStatus = new AgentStatus
                            {
                                AgentId = callRecord.AgentId.Value,
                                Status = "Available",
                                StatusReason = "Call completed",
                                IsActive = true
                            };

                            _context.AgentStatus.Add(newStatus);
                        }
                    }

                    // Create customer interaction record
                    var interaction = new CustomerInteraction
                    {
                        CustomerPhone = callRecord.CallerPhone,
                        CustomerName = callRecord.CallerName,
                        InteractionType = "Call",
                        InteractionChannel = callRecord.CallSource,
                        ServiceType = callRecord.ServiceType,
                        AgentId = callRecord.AgentId,
                        CallId = callRecord.CallId,
                        InteractionSummary = request.Notes,
                        CustomerSatisfaction = request.CustomerSatisfaction,
                        ResolutionStatus = request.Outcome
                    };

                    _context.CustomerInteractions.Add(interaction);

                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    _logger.LogInformation($"Call {callRecord.CallUniqueId} completed with status {request.Status}");

                    return Ok(new
                    {
                        Message = "Call completed successfully",
                        CallId = callId,
                        Duration = callRecord.FormattedDuration,
                        Status = request.Status,
                        Outcome = request.Outcome
                    });
                }
                catch
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error completing call {CallId}", callId);
                return StatusCode(500, new { error = "Failed to complete call" });
            }
        }

        // GET: api/CallCenter/agents/status
        [HttpGet("agents/status")]
        public async Task<ActionResult<object>> GetAgentStatus()
        {
            try
            {
                var agents = await _context.AgentStatus
                    .Where(s => s.IsActive)
                    .Include(s => s.Agent)
                    .Include(s => s.CurrentCall)
                    .Select(s => new
                    {
                        s.Agent.AgentId,
                        s.Agent.AgentCode,
                        AgentName = s.Agent.FullName,
                        s.Agent.Department,
                        s.Status,
                        s.StatusReason,
                        StatusDuration = s.FormattedStatusDuration,
                        CurrentCall = s.CurrentCall != null ? new
                        {
                            s.CurrentCall.CallerName,
                            s.CurrentCall.CallerPhone,
                            s.CurrentCall.ServiceType
                        } : null
                    })
                    .ToListAsync();

                return Ok(agents);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting agent status");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        // POST: api/CallCenter/referrals/create
        [HttpPost("referrals/create")]
        public async Task<ActionResult<object>> CreateReferral([FromBody] CallCenterCreateReferralRequest request)
        {
            try
            {
                var referral = new Referral
                {
                    CustomerName = request.CustomerName,
                    CustomerPhone = request.CustomerPhone,
                    CustomerZipCode = request.CustomerZipCode,
                    ServiceType = request.ServiceType,
                    Notes = request.Notes,
                    Status = request.Status ?? "Pending",
                    CreatedBy = request.CreatedBy ?? "Call Center"
                };

                _context.Referrals.Add(referral);
                await _context.SaveChangesAsync();

                // Link to call if provided
                if (request.CallId.HasValue)
                {
                    var callRecord = await _context.CallRecords.FindAsync(request.CallId.Value);
                    if (callRecord != null)
                    {
                        callRecord.ReferralId = referral.ReferralId;
                        await _context.SaveChangesAsync();
                    }
                }

                _logger.LogInformation($"Referral {referral.ReferralId} created for customer {request.CustomerName}");

                return Ok(new
                {
                    ReferralId = referral.ReferralId,
                    Message = "Referral created successfully",
                    Customer = request.CustomerName,
                    ServiceType = request.ServiceType
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating referral");
                return StatusCode(500, new { error = "Failed to create referral" });
            }
        }

        // POST: api/CallCenter/calls/{callId}/transfer
        [HttpPost("calls/{callId}/transfer")]
        public async Task<ActionResult<object>> InitiateTransfer(int callId, [FromBody] InitiateTransferRequest request)
        {
            try
            {
                var callRecord = await _context.CallRecords
                    .Include(c => c.Agent)
                    .FirstOrDefaultAsync(c => c.CallId == callId);

                if (callRecord == null)
                    return NotFound(new { error = "Call not found" });

                if (callRecord.CallStatus != "InProgress")
                    return BadRequest(new { error = "Call must be in progress to transfer" });

                // Validate target
                if (request.ToAgentId.HasValue)
                {
                    var targetAgent = await _context.Agents.FindAsync(request.ToAgentId.Value);
                    if (targetAgent == null)
                        return NotFound(new { error = "Target agent not found" });

                    var targetStatus = await _context.AgentStatus
                        .Where(s => s.AgentId == request.ToAgentId && s.IsActive)
                        .FirstOrDefaultAsync();

                    if (targetStatus?.Status != "Available")
                        return BadRequest(new { error = "Target agent is not available" });
                }

                var transfer = new CallTransfer
                {
                    CallId = callId,
                    FromAgentId = request.FromAgentId,
                    ToAgentId = request.ToAgentId,
                    ToDepartment = request.ToDepartment,
                    TransferReason = request.TransferReason,
                    TransferType = request.TransferType,
                    Notes = request.Notes,
                    TransferStatus = "Pending"
                };

                _context.CallTransfers.Add(transfer);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Transfer initiated for call {callRecord.CallUniqueId} by agent {request.FromAgentId}");

                return Ok(new
                {
                    TransferId = transfer.TransferId,
                    Message = "Transfer initiated successfully",
                    TransferType = transfer.TransferType,
                    Target = transfer.TransferTarget
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error initiating transfer for call {CallId}", callId);
                return StatusCode(500, new { error = "Failed to initiate transfer" });
            }
        }

        // POST: api/CallCenter/transfers/{transferId}/accept
        [HttpPost("transfers/{transferId}/accept")]
        public async Task<ActionResult<object>> AcceptTransfer(int transferId, [FromBody] AcceptTransferRequest request)
        {
            try
            {
                var transfer = await _context.CallTransfers
                    .Include(t => t.CallRecord)
                    .Include(t => t.FromAgent)
                    .FirstOrDefaultAsync(t => t.TransferId == transferId);

                if (transfer == null)
                    return NotFound(new { error = "Transfer not found" });

                if (transfer.TransferStatus != "Pending")
                    return BadRequest(new { error = "Transfer is not pending" });

                using var transaction = await _context.Database.BeginTransactionAsync();

                try
                {
                    // Update transfer status
                    transfer.TransferStatus = "Accepted";
                    transfer.AcceptedTime = DateTime.UtcNow;

                    // Update call record
                    transfer.CallRecord.AgentId = request.AgentId;

                    // Update original agent status to available
                    var originalAgentStatus = await _context.AgentStatus
                        .Where(s => s.AgentId == transfer.FromAgentId && s.IsActive)
                        .FirstOrDefaultAsync();

                    if (originalAgentStatus != null)
                    {
                        originalAgentStatus.IsActive = false;
                        originalAgentStatus.StatusEndTime = DateTime.UtcNow;

                        _context.AgentStatus.Add(new AgentStatus
                        {
                            AgentId = transfer.FromAgentId,
                            Status = "Available",
                            StatusReason = "Call transferred",
                            IsActive = true
                        });
                    }

                    // Update new agent status to on call
                    var newAgentStatus = await _context.AgentStatus
                        .Where(s => s.AgentId == request.AgentId && s.IsActive)
                        .FirstOrDefaultAsync();

                    if (newAgentStatus != null)
                    {
                        newAgentStatus.IsActive = false;
                        newAgentStatus.StatusEndTime = DateTime.UtcNow;

                        _context.AgentStatus.Add(new AgentStatus
                        {
                            AgentId = request.AgentId,
                            Status = "OnCall",
                            CurrentCallId = transfer.CallId,
                            IsActive = true
                        });
                    }

                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    _logger.LogInformation($"Transfer {transferId} accepted by agent {request.AgentId}");

                    return Ok(new
                    {
                        Message = "Transfer accepted successfully",
                        CallId = transfer.CallId,
                        NewAgentId = request.AgentId
                    });
                }
                catch
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error accepting transfer {TransferId}", transferId);
                return StatusCode(500, new { error = "Failed to accept transfer" });
            }
        }

        // POST: api/CallCenter/transfers/{transferId}/reject
        [HttpPost("transfers/{transferId}/reject")]
        public async Task<ActionResult<object>> RejectTransfer(int transferId, [FromBody] RejectTransferRequest request)
        {
            try
            {
                var transfer = await _context.CallTransfers.FindAsync(transferId);
                if (transfer == null)
                    return NotFound(new { error = "Transfer not found" });

                if (transfer.TransferStatus != "Pending")
                    return BadRequest(new { error = "Transfer is not pending" });

                transfer.TransferStatus = "Rejected";
                transfer.Notes = $"{transfer.Notes}\nRejected: {request.RejectionReason}";

                await _context.SaveChangesAsync();

                _logger.LogInformation($"Transfer {transferId} rejected by agent {request.AgentId}");

                return Ok(new
                {
                    Message = "Transfer rejected",
                    Reason = request.RejectionReason
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error rejecting transfer {TransferId}", transferId);
                return StatusCode(500, new { error = "Failed to reject transfer" });
            }
        }

        // GET: api/CallCenter/transfers/pending
        [HttpGet("transfers/pending")]
        public async Task<ActionResult<object>> GetPendingTransfers()
        {
            try
            {
                var transfers = await _context.CallTransfers
                    .Where(t => t.TransferStatus == "Pending")
                    .Include(t => t.CallRecord)
                    .Include(t => t.FromAgent)
                    .Include(t => t.ToAgent)
                    .Select(t => new
                    {
                        t.TransferId,
                        t.CallId,
                        CallerName = t.CallRecord.CallerName ?? "Unknown",
                        CallerPhone = t.CallRecord.CallerPhone,
                        FromAgent = t.FromAgent.FullName,
                        ToAgent = t.ToAgent != null ? t.ToAgent.FullName : null,
                        t.ToDepartment,
                        t.TransferReason,
                        t.TransferType,
                        t.TransferTime,
                        t.Notes,
                        TransferTypeIcon = t.TransferTypeIcon,
                        Target = t.TransferTarget
                    })
                    .OrderBy(t => t.TransferTime)
                    .ToListAsync();

                return Ok(transfers);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting pending transfers");
                return StatusCode(500, new { error = "Failed to get pending transfers" });
            }
        }

        // GET: api/CallCenter/reports/call-statistics
        [HttpGet("reports/call-statistics")]
        public async Task<ActionResult<object>> GetCallStatistics([FromQuery] ReportsFilterRequest filter)
        {
            try
            {
                var startDate = filter.StartDate ?? DateTime.Today.AddDays(-30);
                var endDate = filter.EndDate ?? DateTime.Today.AddDays(1);

                var callsQuery = _context.CallRecords
                    .Where(c => c.CreatedDate >= startDate && c.CreatedDate < endDate);

                if (filter.AgentId.HasValue)
                    callsQuery = callsQuery.Where(c => c.AgentId == filter.AgentId);

                if (!string.IsNullOrEmpty(filter.ServiceType))
                    callsQuery = callsQuery.Where(c => c.ServiceType == filter.ServiceType);

                var calls = await callsQuery.ToListAsync();

                var totalCalls = calls.Count;
                var answeredCalls = calls.Count(c => c.CallStatus == "Completed" || c.CallStatus == "InProgress");
                var abandonedCalls = calls.Count(c => c.CallStatus == "Abandoned");
                var avgWaitTime = calls.Where(c => c.WaitTime.HasValue).Average(c => c.WaitTime) ?? 0;
                var avgCallDuration = calls.Where(c => c.CallDuration.HasValue).Average(c => c.CallDuration) ?? 0;

                var dailyStats = calls
                    .GroupBy(c => c.CreatedDate.Date)
                    .Select(g => new
                    {
                        Date = g.Key.ToString("yyyy-MM-dd"),
                        TotalCalls = g.Count(),
                        AnsweredCalls = g.Count(c => c.CallStatus == "Completed"),
                        AbandonedCalls = g.Count(c => c.CallStatus == "Abandoned"),
                        AvgWaitTime = g.Where(c => c.WaitTime.HasValue).Average(c => c.WaitTime) ?? 0
                    })
                    .OrderBy(s => s.Date)
                    .ToList();

                var serviceTypeStats = calls
                    .GroupBy(c => c.ServiceType ?? "Unknown")
                    .Select(g => new
                    {
                        ServiceType = g.Key,
                        Count = g.Count(),
                        Percentage = Math.Round((double)g.Count() / totalCalls * 100, 1)
                    })
                    .OrderByDescending(s => s.Count)
                    .ToList();

                return Ok(new
                {
                    Summary = new
                    {
                        TotalCalls = totalCalls,
                        AnsweredCalls = answeredCalls,
                        AbandonedCalls = abandonedCalls,
                        AnswerRate = totalCalls > 0 ? Math.Round((double)answeredCalls / totalCalls * 100, 1) : 0,
                        AbandonRate = totalCalls > 0 ? Math.Round((double)abandonedCalls / totalCalls * 100, 1) : 0,
                        AvgWaitTime = Math.Round(avgWaitTime, 1),
                        AvgCallDuration = Math.Round(avgCallDuration, 1)
                    },
                    DailyStats = dailyStats,
                    ServiceTypeStats = serviceTypeStats,
                    Period = new { StartDate = startDate, EndDate = endDate }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting call statistics");
                return StatusCode(500, new { error = "Failed to get call statistics" });
            }
        }

        // GET: api/CallCenter/reports/agent-performance
        [HttpGet("reports/agent-performance")]
        public async Task<ActionResult<object>> GetAgentPerformance([FromQuery] ReportsFilterRequest filter)
        {
            try
            {
                var startDate = filter.StartDate ?? DateTime.Today.AddDays(-30);
                var endDate = filter.EndDate ?? DateTime.Today.AddDays(1);

                var agentStats = await _context.CallRecords
                    .Where(c => c.CreatedDate >= startDate && c.CreatedDate < endDate && c.AgentId.HasValue && c.Agent != null)
                    .Include(c => c.Agent)
                    .GroupBy(c => new { c.AgentId, c.Agent!.FullName, c.Agent.AgentCode })
                    .Select(g => new
                    {
                        AgentId = g.Key.AgentId,
                        AgentName = g.Key.FullName,
                        AgentCode = g.Key.AgentCode,
                        TotalCalls = g.Count(),
                        CompletedCalls = g.Count(c => c.CallStatus == "Completed"),
                        AvgCallDuration = g.Where(c => c.CallDuration.HasValue).Average(c => c.CallDuration) ?? 0,
                        AvgWaitTime = g.Where(c => c.WaitTime.HasValue).Average(c => c.WaitTime) ?? 0,
                        CustomerSatisfaction = g.Where(c => c.CustomerSatisfaction.HasValue).Average(c => c.CustomerSatisfaction) ?? 0,
                        TotalTalkTime = g.Where(c => c.CallDuration.HasValue).Sum(c => c.CallDuration) ?? 0
                    })
                    .OrderByDescending(a => a.TotalCalls)
                    .ToListAsync();

                var agentStatusTime = await _context.AgentStatus
                    .Where(s => s.StatusStartTime >= startDate && s.StatusStartTime < endDate && s.Agent != null)
                    .Include(s => s.Agent)
                    .GroupBy(s => new { s.AgentId, s.Agent!.FullName })
                    .Select(g => new
                    {
                        AgentId = g.Key.AgentId,
                        AgentName = g.Key.FullName,
                        AvailableTime = g.Where(s => s.Status == "Available").Sum(s => s.StatusDuration.TotalMinutes),
                        OnCallTime = g.Where(s => s.Status == "OnCall").Sum(s => s.StatusDuration.TotalMinutes),
                        BreakTime = g.Where(s => s.Status == "Break").Sum(s => s.StatusDuration.TotalMinutes),
                        TotalTime = g.Sum(s => s.StatusDuration.TotalMinutes)
                    })
                    .ToListAsync();

                var combinedStats = agentStats.Select(a => new
                {
                    a.AgentId,
                    a.AgentName,
                    a.AgentCode,
                    a.TotalCalls,
                    a.CompletedCalls,
                    CompletionRate = a.TotalCalls > 0 ? Math.Round((double)a.CompletedCalls / a.TotalCalls * 100, 1) : 0,
                    AvgCallDuration = Math.Round(a.AvgCallDuration, 1),
                    AvgWaitTime = Math.Round(a.AvgWaitTime, 1),
                    CustomerSatisfaction = Math.Round(a.CustomerSatisfaction, 1),
                    TotalTalkTime = Math.Round(a.TotalTalkTime / 60.0, 1), // Convert to minutes
                    StatusBreakdown = agentStatusTime.FirstOrDefault(s => s.AgentId == a.AgentId)
                }).ToList();

                return Ok(new
                {
                    AgentStats = combinedStats,
                    TopPerformers = combinedStats.OrderByDescending(a => a.CustomerSatisfaction).Take(5),
                    Period = new { StartDate = startDate, EndDate = endDate }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting agent performance");
                return StatusCode(500, new { error = "Failed to get agent performance" });
            }
        }

        // GET: api/CallCenter/reports/queue-analytics
        [HttpGet("reports/queue-analytics")]
        public async Task<ActionResult<object>> GetQueueAnalytics([FromQuery] ReportsFilterRequest filter)
        {
            try
            {
                var startDate = filter.StartDate ?? DateTime.Today.AddDays(-30);
                var endDate = filter.EndDate ?? DateTime.Today.AddDays(1);

                var queueData = await _context.CallQueue
                    .Where(q => q.CallRecord.QueueStartTime >= startDate && q.CallRecord.QueueStartTime < endDate)
                    .Include(q => q.CallRecord)
                    .ToListAsync();

                var hourlyStats = queueData
                    .GroupBy(q => q.CallRecord.QueueStartTime.Hour)
                    .Select(g => new
                    {
                        Hour = g.Key,
                        TotalCalls = g.Count(),
                        AvgWaitTime = g.Average(q => q.EstimatedWaitTime ?? 0),
                        PeakPosition = g.Max(q => q.QueuePosition)
                    })
                    .OrderBy(h => h.Hour)
                    .ToList();

                var priorityStats = queueData
                    .GroupBy(q => q.Priority ?? "Normal")
                    .Select(g => new
                    {
                        Priority = g.Key,
                        Count = g.Count(),
                        AvgWaitTime = g.Average(q => q.EstimatedWaitTime ?? 0),
                        Percentage = Math.Round((double)g.Count() / queueData.Count * 100, 1)
                    })
                    .OrderByDescending(p => p.Count)
                    .ToList();

                var currentQueueStatus = await _context.CallQueue
                    .Where(q => q.QueueStatus == "Waiting")
                    .Include(q => q.CallRecord)
                    .Select(q => new
                    {
                        q.QueueId,
                        q.QueuePosition,
                        q.Priority,
                        CallerName = q.CallRecord.CallerName ?? "Unknown",
                        WaitTime = EF.Functions.DateDiffSecond(q.CallRecord.QueueStartTime, DateTime.UtcNow),
                        ServiceType = q.ServiceType
                    })
                    .OrderBy(q => q.QueuePosition)
                    .ToListAsync();

                return Ok(new
                {
                    Summary = new
                    {
                        TotalQueuedCalls = queueData.Count,
                        AvgWaitTime = Math.Round(queueData.Average(q => q.EstimatedWaitTime ?? 0), 1),
                        MaxWaitTime = queueData.Max(q => q.EstimatedWaitTime ?? 0),
                        CurrentQueueLength = currentQueueStatus.Count
                    },
                    HourlyStats = hourlyStats,
                    PriorityStats = priorityStats,
                    CurrentQueue = currentQueueStatus,
                    Period = new { StartDate = startDate, EndDate = endDate }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting queue analytics");
                return StatusCode(500, new { error = "Failed to get queue analytics" });
            }
        }

        // GET: api/CallCenter/reports/customer-satisfaction
        [HttpGet("reports/customer-satisfaction")]
        public async Task<ActionResult<object>> GetCustomerSatisfaction([FromQuery] ReportsFilterRequest filter)
        {
            try
            {
                var startDate = filter.StartDate ?? DateTime.Today.AddDays(-30);
                var endDate = filter.EndDate ?? DateTime.Today.AddDays(1);

                var satisfactionData = await _context.CallRecords
                    .Where(c => c.CreatedDate >= startDate && c.CreatedDate < endDate && c.CustomerSatisfaction.HasValue)
                    .Include(c => c.Agent)
                    .ToListAsync();

                var overallSatisfaction = satisfactionData.Average(c => c.CustomerSatisfaction) ?? 0;

                var satisfactionDistribution = satisfactionData
                    .GroupBy(c => c.CustomerSatisfaction)
                    .Select(g => new
                    {
                        Rating = g.Key,
                        Count = g.Count(),
                        Percentage = Math.Round((double)g.Count() / satisfactionData.Count * 100, 1)
                    })
                    .OrderBy(s => s.Rating)
                    .ToList();

                var agentSatisfaction = satisfactionData
                    .Where(c => c.Agent != null)
                    .GroupBy(c => new { c.AgentId, AgentName = c.Agent!.FullName })
                    .Select(g => new
                    {
                        AgentId = g.Key.AgentId,
                        AgentName = g.Key.AgentName,
                        AvgSatisfaction = Math.Round(g.Average(c => c.CustomerSatisfaction) ?? 0, 1),
                        TotalRatings = g.Count(),
                        HighRatings = g.Count(c => c.CustomerSatisfaction >= 4),
                        LowRatings = g.Count(c => c.CustomerSatisfaction <= 2)
                    })
                    .OrderByDescending(a => a.AvgSatisfaction)
                    .ToList();

                var serviceTypeSatisfaction = satisfactionData
                    .GroupBy(c => c.ServiceType ?? "Unknown")
                    .Select(g => new
                    {
                        ServiceType = g.Key,
                        AvgSatisfaction = Math.Round(g.Average(c => c.CustomerSatisfaction) ?? 0, 1),
                        TotalRatings = g.Count()
                    })
                    .OrderByDescending(s => s.AvgSatisfaction)
                    .ToList();

                var dailyTrends = satisfactionData
                    .GroupBy(c => c.CreatedDate.Date)
                    .Select(g => new
                    {
                        Date = g.Key.ToString("yyyy-MM-dd"),
                        AvgSatisfaction = Math.Round(g.Average(c => c.CustomerSatisfaction) ?? 0, 1),
                        TotalRatings = g.Count()
                    })
                    .OrderBy(d => d.Date)
                    .ToList();

                return Ok(new
                {
                    Summary = new
                    {
                        OverallSatisfaction = Math.Round(overallSatisfaction, 1),
                        TotalRatings = satisfactionData.Count,
                        HighSatisfaction = satisfactionData.Count(c => c.CustomerSatisfaction >= 4),
                        LowSatisfaction = satisfactionData.Count(c => c.CustomerSatisfaction <= 2),
                        SatisfactionRate = satisfactionData.Count > 0 ? 
                            Math.Round((double)satisfactionData.Count(c => c.CustomerSatisfaction >= 4) / satisfactionData.Count * 100, 1) : 0
                    },
                    Distribution = satisfactionDistribution,
                    AgentSatisfaction = agentSatisfaction,
                    ServiceTypeSatisfaction = serviceTypeSatisfaction,
                    DailyTrends = dailyTrends,
                    Period = new { StartDate = startDate, EndDate = endDate }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting customer satisfaction data");
                return StatusCode(500, new { error = "Failed to get customer satisfaction data" });
            }
        }

        // GET: api/CallCenter/reports/dashboard
        [HttpGet("reports/dashboard")]
        public async Task<ActionResult<object>> GetDashboardSummary()
        {
            try
            {
                var today = DateTime.Today;
                var thisWeek = today.AddDays(-7);
                var thisMonth = today.AddDays(-30);

                // Today's stats
                var todaysCalls = await _context.CallRecords
                    .Where(c => c.CreatedDate >= today)
                    .CountAsync();

                var todaysAnswered = await _context.CallRecords
                    .Where(c => c.CreatedDate >= today && c.CallStatus == "Completed")
                    .CountAsync();

                // Current queue
                var currentQueue = await _context.CallQueue
                    .Where(q => q.QueueStatus == "Waiting")
                    .CountAsync();

                // Available agents
                var availableAgents = await _context.AgentStatus
                    .Where(s => s.IsActive && s.Status == "Available")
                    .CountAsync();

                // This week's satisfaction
                var weekSatisfaction = await _context.CallRecords
                    .Where(c => c.CreatedDate >= thisWeek && c.CustomerSatisfaction.HasValue)
                    .AverageAsync(c => c.CustomerSatisfaction);

                // Monthly trends
                var monthlyStatsRaw = await _context.CallRecords
                    .Where(c => c.CreatedDate >= thisMonth)
                    .GroupBy(c => c.CreatedDate.Date)
                    .Select(g => new
                    {
                        Date = g.Key,
                        Calls = g.Count(),
                        Answered = g.Count(c => c.CallStatus == "Completed")
                    })
                    .OrderBy(s => s.Date)
                    .ToListAsync();

                var monthlyStats = monthlyStatsRaw.Select(s => new
                {
                    Date = s.Date.ToString("MM-dd"),
                    s.Calls,
                    s.Answered
                }).ToList();

                return Ok(new
                {
                    RealTime = new
                    {
                        TodaysCalls = todaysCalls,
                        TodaysAnswered = todaysAnswered,
                        AnswerRate = todaysCalls > 0 ? Math.Round((double)todaysAnswered / todaysCalls * 100, 1) : 0,
                        CurrentQueue = currentQueue,
                        AvailableAgents = availableAgents
                    },
                    WeeklyTrends = new
                    {
                        CustomerSatisfaction = Math.Round(weekSatisfaction ?? 0, 1)
                    },
                    MonthlyStats = monthlyStats
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting dashboard summary");
                return StatusCode(500, new { error = "Failed to get dashboard summary" });
            }
        }

        private int CalculateEstimatedWaitTime()
        {
            // Simple calculation: 2 minutes per call in queue
            var queueLength = _context.CallQueue.Count(q => q.QueueStatus == "Waiting");
            return queueLength * 120; // 2 minutes in seconds
        }

        // POST: api/CallCenter/test/seed-data
        [HttpPost("test/seed-data")]
        public async Task<ActionResult<object>> SeedTestData()
        {
            try
            {
                // Check if we already have test data
                var existingCalls = await _context.CallRecords.CountAsync();
                if (existingCalls > 10)
                {
                    return Ok(new { message = "Test data already exists", existingRecords = existingCalls });
                }

                var random = new Random();
                var serviceTypes = new[] { "Plumbing", "Electrical", "HVAC", "Roofing", "Handyman" };
                var outcomes = new[] { "Resolved", "Referral Created", "Transfer", "Callback Scheduled" };
                var names = new[] { "John Smith", "Sarah Johnson", "Mike Davis", "Lisa Rodriguez", "Tom Wilson", "Emma Brown", "David Lee", "Anna Garcia" };

                // Create test agents if they don't exist
                var agentCount = await _context.Agents.CountAsync();
                if (agentCount == 0)
                {
                    var agents = new[]
                    {
                        new Agent { AgentCode = "AGENT_001", FirstName = "Alice", LastName = "Johnson", Email = "alice@company.com", Department = "Customer Service", IsActive = true },
                        new Agent { AgentCode = "AGENT_002", FirstName = "Bob", LastName = "Smith", Email = "bob@company.com", Department = "Customer Service", IsActive = true },
                        new Agent { AgentCode = "AGENT_003", FirstName = "Carol", LastName = "Davis", Email = "carol@company.com", Department = "Technical Support", IsActive = true }
                    };

                    _context.Agents.AddRange(agents);
                    await _context.SaveChangesAsync();

                    // Add agent statuses
                    foreach (var agent in agents)
                    {
                        _context.AgentStatus.Add(new AgentStatus
                        {
                            AgentId = agent.AgentId,
                            Status = "Available",
                            IsActive = true
                        });
                    }
                    await _context.SaveChangesAsync();
                }

                var agentIds = await _context.Agents.Select(a => a.AgentId).ToListAsync();

                // Create test call records for the last 30 days
                var callRecords = new List<CallRecord>();
                for (int i = 0; i < 50; i++)
                {
                    var createdDate = DateTime.UtcNow.AddDays(-random.Next(0, 30));
                    var callRecord = new CallRecord
                    {
                        CallUniqueId = Guid.NewGuid().ToString(),
                        CallerPhone = $"(555) {random.Next(100, 999)}-{random.Next(1000, 9999)}",
                        CallerName = names[random.Next(names.Length)],
                        ServiceType = serviceTypes[random.Next(serviceTypes.Length)],
                        CallSource = "Phone",
                        AgentId = agentIds[random.Next(agentIds.Count)],
                        QueueStartTime = createdDate,
                        CallStartTime = createdDate.AddMinutes(random.Next(1, 10)),
                        CallEndTime = createdDate.AddMinutes(random.Next(11, 30)),
                        CallDuration = random.Next(300, 1800), // 5-30 minutes
                        WaitTime = random.Next(30, 600), // 30 seconds to 10 minutes
                        CallStatus = "Completed",
                        CallOutcome = outcomes[random.Next(outcomes.Length)],
                        Priority = random.Next(1, 10) > 7 ? "High" : random.Next(1, 10) > 4 ? "Medium" : "Low",
                        CustomerSatisfaction = random.Next(1, 6), // 1-5 rating
                        CallNotes = "Test call record for reporting",
                        CreatedDate = createdDate,
                        UpdatedDate = createdDate
                    };

                    callRecords.Add(callRecord);
                }

                _context.CallRecords.AddRange(callRecords);
                await _context.SaveChangesAsync();

                // Create customer interactions
                foreach (var call in callRecords)
                {
                    _context.CustomerInteractions.Add(new CustomerInteraction
                    {
                        CustomerPhone = call.CallerPhone,
                        CustomerName = call.CallerName,
                        InteractionType = "Call",
                        InteractionChannel = "Phone",
                        ServiceType = call.ServiceType,
                        AgentId = call.AgentId,
                        CallId = call.CallId,
                        InteractionSummary = $"Customer called for {call.ServiceType} service",
                        CustomerSatisfaction = call.CustomerSatisfaction,
                        ResolutionStatus = call.CallOutcome,
                        CreatedDate = call.CreatedDate
                    });
                }

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Test data created successfully",
                    callRecords = callRecords.Count,
                    agents = agentIds.Count,
                    interactions = callRecords.Count
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating test data");
                return StatusCode(500, new { error = "Failed to create test data" });
            }
        }

        // POST: api/CallCenter/test/twilio-connection
        [HttpPost("test/twilio-connection")]
        public async Task<ActionResult<object>> TestTwilioConnection([FromBody] TwilioTestRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.AccountSid) || string.IsNullOrEmpty(request.AuthToken))
                {
                    return BadRequest(new { error = "Account SID and Auth Token are required" });
                }

                // Test Twilio connection by making a simple API call
                using var httpClient = new HttpClient();
                var credentials = Convert.ToBase64String(System.Text.Encoding.ASCII.GetBytes($"{request.AccountSid}:{request.AuthToken}"));
                httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Basic", credentials);

                var response = await httpClient.GetAsync($"https://api.twilio.com/2010-04-01/Accounts/{request.AccountSid}.json");
                
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var accountInfo = System.Text.Json.JsonSerializer.Deserialize<dynamic>(content);
                    
                    return Ok(new
                    {
                        success = true,
                        message = "Twilio connection successful",
                        accountSid = request.AccountSid,
                        status = "Connected",
                        timestamp = DateTime.UtcNow
                    });
                }
                else
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    return BadRequest(new { 
                        success = false, 
                        message = "Twilio connection failed", 
                        error = errorContent,
                        statusCode = response.StatusCode
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error testing Twilio connection");
                return StatusCode(500, new { 
                    success = false, 
                    message = "Connection test failed", 
                    error = ex.Message 
                });
            }
        }

        // POST: api/CallCenter/test/asterisk-connection
        [HttpPost("test/asterisk-connection")]
        public async Task<ActionResult<object>> TestAsteriskConnection([FromBody] AsteriskTestRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.Host) || string.IsNullOrEmpty(request.Username) || string.IsNullOrEmpty(request.Password))
                {
                    return BadRequest(new { error = "Host, Username, and Password are required" });
                }

                // Test Asterisk AMI connection
                using var tcpClient = new System.Net.Sockets.TcpClient();
                var connectTask = tcpClient.ConnectAsync(request.Host, request.Port);
                var timeoutTask = Task.Delay(5000); // 5 second timeout

                var completedTask = await Task.WhenAny(connectTask, timeoutTask);
                
                if (completedTask == timeoutTask)
                {
                    return BadRequest(new { 
                        success = false, 
                        message = "Connection timeout", 
                        error = "Could not connect to Asterisk server within 5 seconds"
                    });
                }

                if (tcpClient.Connected)
                {
                    // Simple connection test - in a real implementation, you'd do AMI authentication
                    tcpClient.Close();
                    
                    return Ok(new
                    {
                        success = true,
                        message = "Asterisk connection successful",
                        host = request.Host,
                        port = request.Port,
                        status = "Connected",
                        timestamp = DateTime.UtcNow,
                        note = "Basic TCP connection test - AMI authentication not implemented in this demo"
                    });
                }
                else
                {
                    return BadRequest(new { 
                        success = false, 
                        message = "Could not connect to Asterisk server",
                        error = "TCP connection failed"
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error testing Asterisk connection");
                return StatusCode(500, new { 
                    success = false, 
                    message = "Connection test failed", 
                    error = ex.Message 
                });
            }
        }
    }

    // Request models for connection testing
    public class TwilioTestRequest
    {
        public string AccountSid { get; set; } = string.Empty;
        public string AuthToken { get; set; } = string.Empty;
    }

    public class AsteriskTestRequest
    {
        public string Host { get; set; } = string.Empty;
        public int Port { get; set; } = 5038;
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }


}