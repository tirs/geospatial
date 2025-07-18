using Microsoft.Extensions.Caching.Memory;
using System.Text.Json;

namespace UrbanReferralNetwork.Services
{
    public class CacheService : ICacheService
    {
        private readonly IMemoryCache _cache;
        private readonly IConfiguration _config;
        private readonly ILogger<CacheService> _logger;

        public CacheService(IMemoryCache cache, IConfiguration config, ILogger<CacheService> logger)
        {
            _cache = cache;
            _config = config;
            _logger = logger;
        }

        public Task<T?> GetAsync<T>(string key) where T : class
        {
            try
            {
                if (_cache.TryGetValue(key, out var value) && value is string json)
                {
                    return Task.FromResult(JsonSerializer.Deserialize<T>(json));
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to get cache item: {Key}", key);
            }

            return Task.FromResult<T?>(null);
        }

        public Task SetAsync<T>(string key, T value, TimeSpan? expiry = null) where T : class
        {
            try
            {
                var json = JsonSerializer.Serialize(value);
                var options = new MemoryCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = expiry ?? TimeSpan.FromMinutes(_config.GetValue<int>("Cache:DefaultExpirationMinutes")),
                    SlidingExpiration = TimeSpan.FromMinutes(_config.GetValue<int>("Cache:SlidingExpirationMinutes"))
                };

                _cache.Set(key, json, options);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to set cache item: {Key}", key);
            }

            return Task.CompletedTask;
        }

        public Task RemoveAsync(string key)
        {
            _cache.Remove(key);
            return Task.CompletedTask;
        }

        public Task RemovePatternAsync(string pattern)
        {
            // Memory cache doesn't support pattern removal easily
            // For production, consider using Redis
            _logger.LogWarning("Pattern removal not implemented for MemoryCache: {Pattern}", pattern);
            return Task.CompletedTask;
        }

        public async Task<T> GetOrSetAsync<T>(string key, Func<Task<T>> getItem, TimeSpan? expiry = null) where T : class
        {
            var cached = await GetAsync<T>(key);
            if (cached != null)
                return cached;

            var item = await getItem();
            await SetAsync(key, item, expiry);
            return item;
        }
    }
}