namespace UrbanReferralNetwork.Models.Configuration
{
    public class CacheSettings
    {
        public int DefaultExpirationMinutes { get; set; } = 30;
        public int SlidingExpirationMinutes { get; set; } = 10;
    }
}