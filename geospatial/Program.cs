using Microsoft.EntityFrameworkCore;
using UrbanReferralNetwork.Data;
using UrbanReferralNetwork.Services;
using UrbanReferralNetwork.Models;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add Entity Framework with SQL Server
builder.Services.AddDbContext<UrbanReferralContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Add custom services
builder.Services.AddScoped<IGeospatialService, GeospatialService>();
builder.Services.AddScoped<IAddressService, AddressService>();
builder.Services.AddScoped<IStreetAddressService, StreetAddressService>();
builder.Services.AddScoped<IServiceAreaMapService, ServiceAreaMapService>();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Auto-create database and seed admin user
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<UrbanReferralContext>();
    
    try
    {
        // Use migrations in production, EnsureCreated in development
        if (app.Environment.IsProduction() || app.Environment.EnvironmentName == "Render")
        {
            context.Database.Migrate();
        }
        else
        {
            context.Database.EnsureCreated();
        }
        
        // Create default admin user if none exists
        CreateDefaultAdminUser(context).Wait();
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Database initialization error: {ex.Message}");
        // Don't fail the application startup for database issues in production
        if (!app.Environment.IsProduction() && app.Environment.EnvironmentName != "Render")
        {
            throw;
        }
    }
}

// Configure pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Serve static files FIRST
var defaultFilesOptions = new DefaultFilesOptions();
defaultFilesOptions.DefaultFileNames.Clear();
defaultFilesOptions.DefaultFileNames.Add("unified-login.html");
app.UseDefaultFiles(defaultFilesOptions);
app.UseStaticFiles();

app.UseCors("AllowAll");
app.UseRouting();

// Add health check endpoint
app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }));

app.MapControllers();

app.Run();

// Helper method to create default admin user
static async Task CreateDefaultAdminUser(UrbanReferralContext context)
{
    try
    {
        Console.WriteLine("Checking for existing admin users...");
        
        // Check if any admin user exists
        var adminExists = await context.Agents.AnyAsync(a => a.UserRole == "Admin");
        Console.WriteLine($"Admin exists: {adminExists}");
        
        // Also check if ADMIN_001 specifically exists
        var admin001Exists = await context.Agents.AnyAsync(a => a.AgentCode == "ADMIN_001");
        Console.WriteLine($"ADMIN_001 exists: {admin001Exists}");
        
        if (admin001Exists)
        {
            // Check the existing admin user's password hash
            var existingAdmin = await context.Agents.FirstOrDefaultAsync(a => a.AgentCode == "ADMIN_001");
            if (existingAdmin != null)
            {
                Console.WriteLine($"Existing ADMIN_001 found:");
                Console.WriteLine($"  PasswordHash: {existingAdmin.PasswordHash ?? "(null)"}");
                Console.WriteLine($"  PasswordSalt: {existingAdmin.PasswordSalt ?? "(null)"}");
                Console.WriteLine($"  UserRole: {existingAdmin.UserRole}");
                Console.WriteLine($"  IsActive: {existingAdmin.IsActive}");
                
                // If password hash is null, update it, or if account is locked, unlock it
                if (string.IsNullOrEmpty(existingAdmin.PasswordHash) || string.IsNullOrEmpty(existingAdmin.PasswordSalt) || existingAdmin.AccountLocked)
                {
                    Console.WriteLine("Updating ADMIN_001 with proper password hash and unlocking account...");
                    existingAdmin.PasswordHash = "$2a$10$rOOjbqM.Fl2yQNKjjFQdKOWJbkJYZ8qVcQNKjjFQdKOWJbkJYZ8qV";
                    existingAdmin.PasswordSalt = "$2a$10$rOOjbqM.Fl2yQNKjjFQdKO";
                    existingAdmin.UserRole = "Admin";
                    existingAdmin.IsActive = true;
                    existingAdmin.AccountLocked = false;
                    existingAdmin.FailedLoginAttempts = 0;
                    existingAdmin.LockoutEndTime = null;
                    existingAdmin.UpdatedDate = DateTime.UtcNow;
                    
                    await context.SaveChangesAsync();
                    Console.WriteLine("✓ ADMIN_001 password hash updated and account unlocked successfully");
                }
            }
            return;
        }
        
        if (!adminExists)
        {
            Console.WriteLine("Creating new admin user...");
            var adminUser = new Agent
            {
                AgentCode = "ADMIN_001",
                FirstName = "System",
                LastName = "Administrator",
                Email = "admin@urbanreferral.com",
                Department = "Administration",
                SkillLevel = 5,
                UserRole = "Admin",
                PasswordHash = "$2a$10$rOOjbqM.Fl2yQNKjjFQdKOWJbkJYZ8qVcQNKjjFQdKOWJbkJYZ8qV",
                PasswordSalt = "$2a$10$rOOjbqM.Fl2yQNKjjFQdKO",
                MustChangePassword = true,
                IsActive = true,
                HireDate = DateTime.UtcNow,
                CreatedDate = DateTime.UtcNow,
                UpdatedDate = DateTime.UtcNow
            };
            
            context.Agents.Add(adminUser);
            await context.SaveChangesAsync();
            
            Console.WriteLine("✓ Default admin user created:");
            Console.WriteLine("  Agent Code: ADMIN_001");
            Console.WriteLine("  Password: TempPass123!");
            Console.WriteLine("  Note: Please change password on first login");
        }
        else
        {
            Console.WriteLine("Admin user already exists, skipping creation");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error creating/updating admin user: {ex.Message}");
        Console.WriteLine($"Stack trace: {ex.StackTrace}");
    }
}