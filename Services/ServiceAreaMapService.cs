using Microsoft.EntityFrameworkCore;
using UrbanReferralNetwork.Data;
using UrbanReferralNetwork.Models;

namespace UrbanReferralNetwork.Services
{
    public interface IServiceAreaMapService
    {
        Task<ServiceAreaMapData> GenerateServiceAreaMapAsync(int contractorId);
        Task<List<ServiceAreaMapData>> GenerateMultipleServiceAreasAsync(List<int> contractorIds);
        Task<ServiceAreaBounds> GetServiceAreaBoundsAsync(int contractorId);
        Task<List<MapPoint>> GetServiceAreaPointsAsync(int contractorId, int gridSize = 20);
    }

    public class ServiceAreaMapService : IServiceAreaMapService
    {
        private readonly UrbanReferralContext _context;
        private readonly IGeospatialService _geospatialService;

        public ServiceAreaMapService(UrbanReferralContext context, IGeospatialService geospatialService)
        {
            _context = context;
            _geospatialService = geospatialService;
        }

        public async Task<ServiceAreaMapData> GenerateServiceAreaMapAsync(int contractorId)
        {
            var contractor = await _context.Contractors
                .Include(c => c.ZipCode)
                .FirstOrDefaultAsync(c => c.ContractorId == contractorId);

            if (contractor == null)
                throw new ArgumentException("Contractor not found");

            var centerLat = contractor.ZipCode.Latitude;
            var centerLon = contractor.ZipCode.Longitude;
            var radiusMiles = contractor.ServiceRadius;

            // Get all ZIP codes within service radius
            var allZips = await _context.ZipCodes
                .Where(z => z.IsActive)
                .ToListAsync();

            var serviceZips = new List<ServiceZipCode>();
            var bounds = new ServiceAreaBounds
            {
                MinLat = centerLat,
                MaxLat = centerLat,
                MinLon = centerLon,
                MaxLon = centerLon
            };

            foreach (var zip in allZips)
            {
                var distance = _geospatialService.CalculateDistance(
                    centerLat, centerLon, zip.Latitude, zip.Longitude);

                if (distance <= radiusMiles)
                {
                    serviceZips.Add(new ServiceZipCode
                    {
                        ZipCode = zip.ZipCodeValue,
                        City = zip.City,
                        Latitude = zip.Latitude,
                        Longitude = zip.Longitude,
                        Distance = (decimal)distance
                    });

                    // Update bounds
                    if (zip.Latitude < bounds.MinLat) bounds.MinLat = zip.Latitude;
                    if (zip.Latitude > bounds.MaxLat) bounds.MaxLat = zip.Latitude;
                    if (zip.Longitude < bounds.MinLon) bounds.MinLon = zip.Longitude;
                    if (zip.Longitude > bounds.MaxLon) bounds.MaxLon = zip.Longitude;
                }
            }

            return new ServiceAreaMapData
            {
                ContractorId = contractorId,
                CompanyName = contractor.CompanyName,
                CenterLatitude = centerLat,
                CenterLongitude = centerLon,
                ServiceRadius = radiusMiles,
                ServiceZipCodes = serviceZips.OrderBy(z => z.Distance).ToList(),
                Bounds = bounds,
                CirclePoints = GenerateCirclePoints(centerLat, centerLon, radiusMiles)
            };
        }

        public async Task<List<ServiceAreaMapData>> GenerateMultipleServiceAreasAsync(List<int> contractorIds)
        {
            var results = new List<ServiceAreaMapData>();

            foreach (var contractorId in contractorIds)
            {
                try
                {
                    var mapData = await GenerateServiceAreaMapAsync(contractorId);
                    results.Add(mapData);
                }
                catch
                {
                    // Skip invalid contractors
                }
            }

            return results;
        }

        public async Task<ServiceAreaBounds> GetServiceAreaBoundsAsync(int contractorId)
        {
            var mapData = await GenerateServiceAreaMapAsync(contractorId);
            return mapData.Bounds;
        }

        public async Task<List<MapPoint>> GetServiceAreaPointsAsync(int contractorId, int gridSize = 20)
        {
            var contractor = await _context.Contractors
                .Include(c => c.ZipCode)
                .FirstOrDefaultAsync(c => c.ContractorId == contractorId);

            if (contractor == null)
                return new List<MapPoint>();

            var centerLat = (double)contractor.ZipCode.Latitude;
            var centerLon = (double)contractor.ZipCode.Longitude;
            var radiusMiles = contractor.ServiceRadius;

            var points = new List<MapPoint>();

            // Generate grid points within service area
            var latRange = radiusMiles / 69.0; // Approximate miles per degree latitude
            var lonRange = radiusMiles / (69.0 * Math.Cos(centerLat * Math.PI / 180.0));

            var latStep = (latRange * 2) / gridSize;
            var lonStep = (lonRange * 2) / gridSize;

            for (int i = 0; i <= gridSize; i++)
            {
                for (int j = 0; j <= gridSize; j++)
                {
                    var lat = centerLat - latRange + (i * latStep);
                    var lon = centerLon - lonRange + (j * lonStep);

                    var distance = _geospatialService.CalculateDistance(
                        (decimal)centerLat, (decimal)centerLon, (decimal)lat, (decimal)lon);

                    if (distance <= radiusMiles)
                    {
                        points.Add(new MapPoint
                        {
                            Latitude = (decimal)lat,
                            Longitude = (decimal)lon,
                            IsInServiceArea = true,
                            Distance = (decimal)distance
                        });
                    }
                }
            }

            return points;
        }

        private List<CirclePoint> GenerateCirclePoints(decimal centerLat, decimal centerLon, int radiusMiles, int numPoints = 64)
        {
            var points = new List<CirclePoint>();
            var centerLatRad = (double)centerLat * Math.PI / 180.0;
            var centerLonRad = (double)centerLon * Math.PI / 180.0;
            var radiusRadians = radiusMiles / 3959.0; // Earth radius in miles

            for (int i = 0; i < numPoints; i++)
            {
                var angle = 2.0 * Math.PI * i / numPoints;
                
                var lat = Math.Asin(Math.Sin(centerLatRad) * Math.Cos(radiusRadians) +
                                   Math.Cos(centerLatRad) * Math.Sin(radiusRadians) * Math.Cos(angle));
                
                var lon = centerLonRad + Math.Atan2(Math.Sin(angle) * Math.Sin(radiusRadians) * Math.Cos(centerLatRad),
                                                   Math.Cos(radiusRadians) - Math.Sin(centerLatRad) * Math.Sin(lat));

                points.Add(new CirclePoint
                {
                    Latitude = (decimal)(lat * 180.0 / Math.PI),
                    Longitude = (decimal)(lon * 180.0 / Math.PI)
                });
            }

            return points;
        }
    }

    public class ServiceAreaMapData
    {
        public int ContractorId { get; set; }
        public string CompanyName { get; set; } = string.Empty;
        public decimal CenterLatitude { get; set; }
        public decimal CenterLongitude { get; set; }
        public int ServiceRadius { get; set; }
        public List<ServiceZipCode> ServiceZipCodes { get; set; } = new();
        public ServiceAreaBounds Bounds { get; set; } = new();
        public List<CirclePoint> CirclePoints { get; set; } = new();
    }

    public class ServiceZipCode
    {
        public string ZipCode { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }
        public decimal Distance { get; set; }
    }

    public class ServiceAreaBounds
    {
        public decimal MinLat { get; set; }
        public decimal MaxLat { get; set; }
        public decimal MinLon { get; set; }
        public decimal MaxLon { get; set; }
    }

    public class CirclePoint
    {
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }
    }

    public class MapPoint
    {
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }
        public bool IsInServiceArea { get; set; }
        public decimal Distance { get; set; }
    }
}