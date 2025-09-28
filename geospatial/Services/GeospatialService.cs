using Microsoft.EntityFrameworkCore;
using UrbanReferralNetwork.Data;
using UrbanReferralNetwork.Models;
using System.Linq;

namespace UrbanReferralNetwork.Services
{
    public interface IGeospatialService
    {
        Task<List<ContractorMatch>> FindContractorsInRadiusAsync(string zipCode, string? serviceType = null, int maxDistance = 25, int maxResults = 3);
        Task<int> LogReferralAsync(string customerName, string customerPhone, string customerZipCode, string serviceType, List<int> contractorIds, string createdBy = "System", string? notes = null, string? status = null, DateTime? appointmentDate = null, decimal? estimateAmount = null, string? estimateNotes = null, DateTime? workStartDate = null, DateTime? workCompletedDate = null);
        Task<bool> ValidateZipCodeAsync(string zipCode);
        double CalculateDistance(decimal lat1, decimal lon1, decimal lat2, decimal lon2);
        
        // New methods for complete workflow
        Task<bool> UpdateReferralDetailStatusAsync(int referralDetailId, string status, DateTime? contactedDate = null, DateTime? appointmentDate = null, decimal? estimateAmount = null, string? estimateNotes = null);
        Task<bool> SelectContractorAsync(int referralId, int selectedContractorId, DateTime? workStartDate = null);
        Task<object?> GetReferralStatusAsync(int referralId);
        Task<bool> CompleteWorkAsync(int referralDetailId, DateTime? workCompletedDate = null);
        
        // Referral management methods
        Task<List<object>> GetAllReferralsAsync(string? status = null, string? dateFilter = null);
        Task<object?> GetReferralByIdAsync(int referralId);
        Task<bool> UpdateReferralAsync(int referralId, UpdateReferralRequest request);
        Task<bool> DeleteReferralAsync(int referralId);
    }

    public class GeospatialService : IGeospatialService
    {
        private readonly UrbanReferralContext _context;

        public GeospatialService(UrbanReferralContext context)
        {
            _context = context;
        }

        public async Task<List<ContractorMatch>> FindContractorsInRadiusAsync(string zipCode, string? serviceType = null, int maxDistance = 25, int maxResults = 3)
        {
            // Get customer coordinates
            var customerZip = await _context.ZipCodes
                .FirstOrDefaultAsync(z => z.ZipCodeValue == zipCode && z.IsActive);

            if (customerZip == null)
                return new List<ContractorMatch>();

            // Find contractors within radius
            var contractors = await _context.Contractors
                .Include(c => c.ZipCode)
                .Where(c => c.IsActive && c.ZipCode.IsActive)
                .ToListAsync();

            var matches = new List<ContractorMatch>();

            foreach (var contractor in contractors)
            {
                var distance = CalculateDistance(
                    customerZip.Latitude, customerZip.Longitude,
                    contractor.ZipCode.Latitude, contractor.ZipCode.Longitude);

                if (distance <= maxDistance)
                {
                    // Check service type if specified
                    if (!string.IsNullOrEmpty(serviceType) && 
                        !string.IsNullOrEmpty(contractor.ServiceTypes) &&
                        !IsServiceTypeMatch(contractor.ServiceTypes, serviceType))
                        continue;

                    matches.Add(new ContractorMatch
                    {
                        ContractorId = contractor.ContractorId,
                        CompanyName = contractor.CompanyName,
                        ContactName = contractor.ContactName,
                        Phone = contractor.Phone,
                        Email = contractor.Email,
                        Address = contractor.Address,
                        ZipCode = contractor.ZipCode.ZipCodeValue,
                        City = contractor.ZipCode.City,
                        Distance = (decimal)distance,
                        Rating = contractor.Rating,
                        ServiceTypes = FormatServiceTypes(contractor.ServiceTypes)
                    });
                }
            }

            // Return top matches sorted by distance, then rating
            return matches
                .OrderBy(m => m.Distance)
                .ThenByDescending(m => m.Rating)
                .Take(maxResults)
                .ToList();
        }

        public async Task<int> LogReferralAsync(string customerName, string customerPhone, string customerZipCode, string serviceType, List<int> contractorIds, string createdBy = "System", string? notes = null, string? status = null, DateTime? appointmentDate = null, decimal? estimateAmount = null, string? estimateNotes = null, DateTime? workStartDate = null, DateTime? workCompletedDate = null)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            
            try
            {
                // Create referral record
                var referral = new Referral
                {
                    CustomerName = customerName,
                    CustomerPhone = customerPhone,
                    CustomerZipCode = customerZipCode,
                    ServiceType = serviceType,
                    CreatedBy = createdBy,
                    Notes = notes
                };

                _context.Referrals.Add(referral);
                await _context.SaveChangesAsync();

                // Get customer coordinates for distance calculation
                var customerZip = await _context.ZipCodes
                    .FirstOrDefaultAsync(z => z.ZipCodeValue == customerZipCode);

                // Create referral details
                for (int i = 0; i < contractorIds.Count; i++)
                {
                    var contractor = await _context.Contractors
                        .Include(c => c.ZipCode)
                        .FirstOrDefaultAsync(c => c.ContractorId == contractorIds[i]);

                    if (contractor != null && customerZip != null)
                    {
                        var distance = CalculateDistance(
                            customerZip.Latitude, customerZip.Longitude,
                            contractor.ZipCode.Latitude, contractor.ZipCode.Longitude);

                        var referralDetail = new ReferralDetail
                        {
                            ReferralId = referral.ReferralId,
                            ContractorId = contractorIds[i],
                            Distance = (decimal)distance,
                            Position = i + 1,
                            Status = status ?? "Referred",
                            AppointmentDate = appointmentDate,
                            EstimateAmount = estimateAmount,
                            EstimateNotes = estimateNotes,
                            WorkStartDate = workStartDate,
                            WorkCompletedDate = workCompletedDate
                        };

                        _context.ReferralDetails.Add(referralDetail);
                    }
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return referral.ReferralId;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<bool> ValidateZipCodeAsync(string zipCode)
        {
            if (string.IsNullOrWhiteSpace(zipCode))
                return false;

            // Basic format validation
            if (!IsValidZipCodeFormat(zipCode))
                return false;

            // Check if ZIP code exists in database
            return await _context.ZipCodes
                .AnyAsync(z => z.ZipCodeValue == zipCode && z.IsActive);
        }

        public double CalculateDistance(decimal lat1, decimal lon1, decimal lat2, decimal lon2)
        {
            const double earthRadius = 3959.0; // Earth radius in miles

            var dLat = ToRadians((double)(lat2 - lat1));
            var dLon = ToRadians((double)(lon2 - lon1));
            var lat1Rad = ToRadians((double)lat1);
            var lat2Rad = ToRadians((double)lat2);

            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                    Math.Cos(lat1Rad) * Math.Cos(lat2Rad) *
                    Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

            return earthRadius * c;
        }

        private static double ToRadians(double degrees) => degrees * Math.PI / 180.0;

        private static bool IsValidZipCodeFormat(string zipCode)
        {
            if (string.IsNullOrWhiteSpace(zipCode))
                return false;

            // 5-digit ZIP code
            if (zipCode.Length == 5 && zipCode.All(char.IsDigit))
                return true;

            // 5+4 ZIP code format
            if (zipCode.Length == 10 && zipCode[5] == '-' &&
                zipCode.Take(5).All(char.IsDigit) &&
                zipCode.Skip(6).All(char.IsDigit))
                return true;

            return false;
        }

        private static bool IsServiceTypeMatch(string contractorServiceTypes, string requestedServiceType)
        {
            try
            {
                // Try to parse as JSON array first
                if (contractorServiceTypes.StartsWith("[") && contractorServiceTypes.EndsWith("]"))
                {
                    var serviceArray = System.Text.Json.JsonSerializer.Deserialize<string[]>(contractorServiceTypes);
                    return serviceArray?.Any(s => s.Contains(requestedServiceType, StringComparison.OrdinalIgnoreCase)) == true;
                }
            }
            catch
            {
                // If JSON parsing fails, fall back to string contains
            }

            // Handle as comma-separated string or simple contains
            return contractorServiceTypes.Contains(requestedServiceType, StringComparison.OrdinalIgnoreCase);
        }

        private static string FormatServiceTypes(string? serviceTypes)
        {
            if (string.IsNullOrEmpty(serviceTypes))
                return "General Services";

            try
            {
                // Try to parse as JSON array and convert to comma-separated string
                if (serviceTypes.StartsWith("[") && serviceTypes.EndsWith("]"))
                {
                    var serviceArray = System.Text.Json.JsonSerializer.Deserialize<string[]>(serviceTypes);
                    return serviceArray != null && serviceArray.Length > 0 
                        ? string.Join(", ", serviceArray) 
                        : "General Services";
                }
            }
            catch
            {
                // If JSON parsing fails, clean up malformed JSON and return as-is
                return serviceTypes.Replace("[", "").Replace("]", "").Replace("\"", "").Trim();
            }

            // Return as-is if it's already a comma-separated string
            return serviceTypes;
        }

        public async Task<bool> UpdateReferralDetailStatusAsync(int referralDetailId, string status, DateTime? contactedDate = null, DateTime? appointmentDate = null, decimal? estimateAmount = null, string? estimateNotes = null)
        {
            var referralDetail = await _context.ReferralDetails.FindAsync(referralDetailId);
            if (referralDetail == null) return false;

            referralDetail.Status = status;
            if (contactedDate.HasValue) referralDetail.ContactedDate = contactedDate;
            if (appointmentDate.HasValue) referralDetail.AppointmentDate = appointmentDate;
            if (estimateAmount.HasValue) referralDetail.EstimateAmount = estimateAmount;
            if (!string.IsNullOrEmpty(estimateNotes)) referralDetail.EstimateNotes = estimateNotes;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> SelectContractorAsync(int referralId, int selectedContractorId, DateTime? workStartDate = null)
        {
            var referralDetails = await _context.ReferralDetails
                .Where(rd => rd.ReferralId == referralId)
                .ToListAsync();

            if (!referralDetails.Any()) return false;

            foreach (var detail in referralDetails)
            {
                detail.SelectedByCustomer = detail.ContractorId == selectedContractorId;
                if (detail.ContractorId == selectedContractorId)
                {
                    detail.Status = "Selected";
                    if (workStartDate.HasValue) detail.WorkStartDate = workStartDate;
                }
            }

            // Update main referral status
            var referral = await _context.Referrals.FindAsync(referralId);
            if (referral != null)
            {
                referral.Status = "In Progress";
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<object?> GetReferralStatusAsync(int referralId)
        {
            var referral = await _context.Referrals
                .Include(r => r.ReferralDetails)
                .ThenInclude(rd => rd.Contractor)
                .FirstOrDefaultAsync(r => r.ReferralId == referralId);

            if (referral == null) return null;

            return new
            {
                referralId = referral.ReferralId,
                customerName = referral.CustomerName,
                customerPhone = referral.CustomerPhone,
                serviceType = referral.ServiceType,
                status = referral.Status,
                requestDate = referral.RequestDate,
                contractors = referral.ReferralDetails.Select(rd => new
                {
                    referralDetailId = rd.ReferralDetailId,
                    position = rd.Position,
                    contractorId = rd.ContractorId,
                    companyName = rd.Contractor.CompanyName,
                    phone = rd.Contractor.Phone,
                    status = rd.Status,
                    contactedDate = rd.ContactedDate,
                    appointmentDate = rd.AppointmentDate,
                    estimateAmount = rd.EstimateAmount,
                    estimateNotes = rd.EstimateNotes,
                    selectedByCustomer = rd.SelectedByCustomer,
                    workStartDate = rd.WorkStartDate,
                    workCompletedDate = rd.WorkCompletedDate
                })
            };
        }

        public async Task<bool> CompleteWorkAsync(int referralDetailId, DateTime? workCompletedDate = null)
        {
            var referralDetail = await _context.ReferralDetails.FindAsync(referralDetailId);
            if (referralDetail == null) return false;

            referralDetail.Status = "Completed";
            referralDetail.WorkCompletedDate = workCompletedDate ?? DateTime.UtcNow;

            // Update main referral status if this was the selected contractor
            if (referralDetail.SelectedByCustomer)
            {
                var referral = await _context.Referrals.FindAsync(referralDetail.ReferralId);
                if (referral != null)
                {
                    referral.Status = "Completed";
                }
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<object>> GetAllReferralsAsync(string? status = null, string? dateFilter = null)
        {
            var query = _context.Referrals
                .Include(r => r.ReferralDetails)
                .ThenInclude(rd => rd.Contractor)
                .AsQueryable();

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(r => r.Status == status);
            }

            if (!string.IsNullOrEmpty(dateFilter))
            {
                var today = DateTime.Today;
                switch (dateFilter.ToLower())
                {
                    case "today":
                        query = query.Where(r => r.RequestDate.Date == today);
                        break;
                    case "week":
                        var startOfWeek = today.AddDays(-(int)today.DayOfWeek);
                        query = query.Where(r => r.RequestDate.Date >= startOfWeek);
                        break;
                    case "month":
                        var startOfMonth = new DateTime(today.Year, today.Month, 1);
                        query = query.Where(r => r.RequestDate.Date >= startOfMonth);
                        break;
                }
            }

            var referrals = await query.OrderByDescending(r => r.RequestDate).ToListAsync();

            return referrals.Select(r => new
            {
                id = r.ReferralId,
                customerName = r.CustomerName,
                customerPhone = r.CustomerPhone,
                serviceType = r.ServiceType,
                status = r.Status,
                requestDate = r.RequestDate,
                notes = r.Notes,
                createdBy = r.CreatedBy,
                contractors = r.ReferralDetails.Select(rd => new
                {
                    contractorId = rd.ContractorId,
                    companyName = rd.Contractor.CompanyName,
                    contactName = rd.Contractor.ContactName,
                    phone = rd.Contractor.Phone,
                    position = rd.Position,
                    status = rd.Status,
                    distance = rd.Distance
                }).ToList()
            }).Cast<object>().ToList();
        }

        public async Task<object?> GetReferralByIdAsync(int referralId)
        {
            var referral = await _context.Referrals
                .Include(r => r.ReferralDetails)
                .ThenInclude(rd => rd.Contractor)
                .FirstOrDefaultAsync(r => r.ReferralId == referralId);

            if (referral == null)
                return null;

            return new
            {
                id = referral.ReferralId,
                customerName = referral.CustomerName,
                customerPhone = referral.CustomerPhone,
                customerZipCode = referral.CustomerZipCode,
                serviceType = referral.ServiceType,
                status = referral.Status,
                requestDate = referral.RequestDate,
                notes = referral.Notes,
                createdBy = referral.CreatedBy,
                createdDate = referral.CreatedDate,
                details = referral.ReferralDetails.Select(rd => new
                {
                    referralDetailId = rd.ReferralDetailId,
                    contractorId = rd.ContractorId,
                    companyName = rd.Contractor.CompanyName,
                    contactName = rd.Contractor.ContactName,
                    phone = rd.Contractor.Phone,
                    email = rd.Contractor.Email,
                    position = rd.Position,
                    distance = rd.Distance,
                    status = rd.Status,
                    contactedDate = rd.ContactedDate,
                    appointmentDate = rd.AppointmentDate,
                    estimateAmount = rd.EstimateAmount,
                    estimateNotes = rd.EstimateNotes,
                    selectedByCustomer = rd.SelectedByCustomer,
                    workStartDate = rd.WorkStartDate,
                    workCompletedDate = rd.WorkCompletedDate
                }).ToList()
            };
        }

        public async Task<bool> UpdateReferralAsync(int referralId, UpdateReferralRequest request)
        {
            var referral = await _context.Referrals.FindAsync(referralId);
            if (referral == null)
                return false;

            if (!string.IsNullOrEmpty(request.CustomerName))
                referral.CustomerName = request.CustomerName;
            
            if (!string.IsNullOrEmpty(request.CustomerPhone))
                referral.CustomerPhone = request.CustomerPhone;
            
            if (!string.IsNullOrEmpty(request.ServiceType))
                referral.ServiceType = request.ServiceType;
            
            if (!string.IsNullOrEmpty(request.Status))
                referral.Status = request.Status;
            
            if (!string.IsNullOrEmpty(request.Notes))
                referral.Notes = request.Notes;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteReferralAsync(int referralId)
        {
            var referral = await _context.Referrals
                .Include(r => r.ReferralDetails)
                .FirstOrDefaultAsync(r => r.ReferralId == referralId);
            
            if (referral == null)
                return false;

            _context.ReferralDetails.RemoveRange(referral.ReferralDetails);
            _context.Referrals.Remove(referral);
            await _context.SaveChangesAsync();
            return true;
        }
    }

    public class ContractorMatch
    {
        public int ContractorId { get; set; }
        public string CompanyName { get; set; } = string.Empty;
        public string ContactName { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? Address { get; set; }
        public string ZipCode { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public decimal Distance { get; set; }
        public decimal Rating { get; set; }
        public string? ServiceTypes { get; set; }
    }
}