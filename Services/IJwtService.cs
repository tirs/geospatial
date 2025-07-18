using UrbanReferralNetwork.Models;

namespace UrbanReferralNetwork.Services
{
    public interface IJwtService
    {
        string GenerateToken(Agent agent);
        string GenerateContractorToken(Contractor contractor);
        bool ValidateToken(string token, out int userId, out string userType);
        DateTime GetTokenExpiry(string token);
    }
}