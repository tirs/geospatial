using Microsoft.EntityFrameworkCore;
using UrbanReferralNetwork.Data;
using UrbanReferralNetwork.Services;
using UrbanReferralNetwork.Models;
using UrbanReferralNetwork.Models.Configuration;
using Serilog;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Asp.Versioning;

// Configure Serilog with enhanced settings
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj} {Properties:j}{NewLine}{Exception}")
    .WriteTo.File("logs/app-.txt", 
        rollingInterval: RollingInterval.Day,
        retainedFileCountLimit: 30,
        outputTemplate: "[{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} {Level:u3}] {Message:lj} {Properties:j}{NewLine}{Exception}")
    .Enrich.FromLogContext()
    .Enrich.WithProperty("Application", "UrbanReferralNetwork")
    .CreateLogger();

var builder = WebApplication.CreateBuilder(args);

// Configure Kestrel for Render
if (builder.Environment.IsProduction())
{
    builder.WebHost.ConfigureKestrel(options =>
    {
        options.ListenAnyIP(int.Parse(Environment.GetEnvironmentVariable("PORT") ?? "10000"));
    });
}

// Configure allowed hosts for Render
if (builder.Environment.IsProduction())
{
    builder.WebHost.UseKestrel(options =>
    {
        options.AllowSynchronousIO = true;
    });
}

// Add Serilog
builder.Host.UseSerilog();

// Configure strongly typed settings
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("JWT"));
builder.Services.Configure<CacheSettings>(builder.Configuration.GetSection("Cache"));

// Add API versioning
builder.Services.AddApiVersioning(options =>
{
    options.DefaultApiVersion = new ApiVersion(1, 0);
    options.AssumeDefaultVersionWhenUnspecified = true;
    options.ApiVersionReader = ApiVersionReader.Combine(
        new UrlSegmentApiVersionReader(),
        new QueryStringApiVersionReader("version"),
        new HeaderApiVersionReader("X-Version")
    );
}).AddApiExplorer(options =>
{
    options.GroupNameFormat = "'v'VVV";
    options.SubstituteApiVersionInUrl = true;
});

// Add services
builder.Services.AddControllers(options =>
{
    options.ModelValidatorProviders.Clear();
});

// Add model validation
builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.InvalidModelStateResponseFactory = context =>
    {
        var errors = context.ModelState
            .Where(x => x.Value?.Errors.Count > 0)
            .SelectMany(x => x.Value!.Errors)
            .Select(x => x.ErrorMessage);
        
        return new BadRequestObjectResult(new { errors });
    };
});

builder.Services.AddEndpointsApiExplorer();

// Only add Swagger in development
if (builder.Environment.IsDevelopment())
{
    builder.Services.AddSwaggerGen();
}

// Add Entity Framework with SQL Server
builder.Services.AddDbContext<UrbanReferralContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Add caching
builder.Services.AddMemoryCache();

// Add JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JWT").Get<JwtSettings>()!;
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.SecretKey)),
            ValidateIssuer = true,
            ValidIssuer = jwtSettings.Issuer,
            ValidateAudience = true,
            ValidAudience = jwtSettings.Audience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });

// Add Authorization
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
    options.AddPolicy("AgentOnly", policy => policy.RequireRole("Agent", "Admin"));
    options.AddPolicy("ContractorOnly", policy => policy.RequireClaim("UserType", "Contractor"));
});

// Add custom services
builder.Services.AddScoped<IGeospatialService, GeospatialService>();
builder.Services.AddScoped<IAddressService, AddressService>();
builder.Services.AddScoped<IStreetAddressService, StreetAddressService>();
builder.Services.AddScoped<IServiceAreaMapService, ServiceAreaMapService>();
builder.Services.AddScoped<ISecurityService, SecurityService>();
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<ICacheService, CacheService>();

// Add Data Protection
builder.Services.AddDataProtection()
    .PersistKeysToFileSystem(new DirectoryInfo("./keys"))
    .SetApplicationName("UrbanReferralNetwork");

// Add Rate Limiting
builder.Services.ConfigureRateLimiting(builder.Configuration);

// Add Health Checks
builder.Services.AddHealthChecks()
    .AddSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")!,
        healthQuery: "SELECT 1",
        name: "database",
        timeout: TimeSpan.FromSeconds(30))
    .AddCheck("self", () => Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Healthy());

// Add CORS with security
var allowedOrigins = builder.Configuration.GetSection("Security:AllowedOrigins").Get<string[]>() ?? new[] { "http://localhost:5000" };
builder.Services.AddCors(options =>
{
    options.AddPolicy("SecurePolicy", policy =>
    {
        if (builder.Environment.IsProduction())
        {
            // Allow all origins in production for Render
            policy.AllowAnyOrigin()
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        }
        else
        {
            policy.WithOrigins(allowedOrigins)
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        }
    });
});

var app = builder.Build();

// Configure path base for subdirectory deployment
// Disabled for Render deployment
// if (!app.Environment.IsDevelopment())
// {
//     app.UsePathBase("/core");
// }

// Auto-create database and seed admin user
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<UrbanReferralContext>();
    var securityService = scope.ServiceProvider.GetRequiredService<ISecurityService>();
    
    if (app.Environment.IsDevelopment())
    {
        context.Database.EnsureCreated();
        // Skip seeding since using remote database
    }
    else
    {
        // In production/render, database already exists with data - just ensure migrations
        try 
        {
            // Test connection first
            await context.Database.CanConnectAsync();
            Console.WriteLine("✅ Database connection successful");
            
            // Apply any pending migrations
            context.Database.Migrate();
            Console.WriteLine("✅ Database migrations applied");
        }
        catch (Exception ex)
        {
            // Log migration error but don't fail startup
            Console.WriteLine($"⚠️ Database warning: {ex.Message}");
        }
    }
    
    // Create default admin user if none exists
    CreateDefaultAdminUser(context, securityService).Wait();
}

// Configure pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}

// Security headers
app.Use(async (context, next) =>
{
    var headers = context.Response.Headers;
    headers["X-Content-Type-Options"] = "nosniff";
    headers["X-Frame-Options"] = "DENY";
    headers["X-XSS-Protection"] = "1; mode=block";
    headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;";
    await next();
});

// HTTPS redirection in production
if (builder.Configuration.GetValue<bool>("Security:RequireHttps"))
{
    app.UseHttpsRedirection();
}

// Serve static files FIRST
var defaultFilesOptions = new DefaultFilesOptions();
defaultFilesOptions.DefaultFileNames.Clear();
defaultFilesOptions.DefaultFileNames.Add("unified-login.html");
app.UseDefaultFiles(defaultFilesOptions);
app.UseStaticFiles();

// Add Rate Limiting (if enabled)
if (builder.Configuration.GetValue<bool>("RateLimiting:EnableRateLimiting"))
{
    app.UseRateLimiter();
}

app.UseCors("SecurePolicy");
app.UseAuthentication();
app.UseAuthorization();
app.UseRouting();

// Add enhanced health checks
app.MapHealthChecks("/health", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    ResponseWriter = async (context, report) =>
    {
        context.Response.ContentType = "application/json";
        var response = new
        {
            status = report.Status.ToString(),
            timestamp = DateTime.UtcNow,
            duration = report.TotalDuration,
            checks = report.Entries.Select(entry => new
            {
                name = entry.Key,
                status = entry.Value.Status.ToString(),
                duration = entry.Value.Duration,
                description = entry.Value.Description,
                data = entry.Value.Data
            })
        };
        await context.Response.WriteAsync(System.Text.Json.JsonSerializer.Serialize(response));
    }
});

app.MapControllers();

app.Run();

// Helper method to create default admin user
static async Task CreateDefaultAdminUser(UrbanReferralContext context, ISecurityService securityService)
{
    // Check if any admin user exists
    var adminExists = await context.Agents.AnyAsync(a => a.UserRole == "Admin");
    
    if (!adminExists)
    {
        var defaultPassword = "TempPass123!";
        var salt = securityService.GenerateSalt();
        var passwordHash = securityService.HashPassword(defaultPassword, salt);
        
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
        
        context.Agents.Add(adminUser);
        await context.SaveChangesAsync();
        
        Log.Information("✓ Default admin user created:");
        Log.Information("  Agent Code: ADMIN_001");
        Log.Information("  Password: {Password}", defaultPassword);
        Log.Information("  Note: Please change password on first login");
    }
}