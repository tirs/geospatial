# Urban Referral Network - Render Deployment Guide

## Prerequisites

1. **Git Repository**: Your code must be in a Git repository (GitHub, GitLab, etc.)
2. **Render Account**: Sign up at [render.com](https://render.com)
3. **Database**: SQL Server database is already configured

## Deployment Steps

### 1. Prepare for Deployment

Run the deployment preparation script:

```powershell
.\deploy.ps1
```

This script will:
- Test the build locally
- Verify all required files are present
- Show deployment checklist

### 2. Commit and Push Changes

```bash
git add .
git commit -m "Configure for Render deployment"
git push origin main
```

### 3. Deploy to Render

1. **Login to Render**: Go to [render.com](https://render.com) and sign in
2. **Create New Web Service**: Click "New" → "Web Service"
3. **Connect Repository**: Connect your Git repository
4. **Configure Service**:
   - **Name**: `urban-referral-network`
   - **Runtime**: Render will auto-detect from `render.yaml`
   - **Build Command**: Auto-configured
   - **Start Command**: Auto-configured

5. **Deploy**: Click "Create Web Service"

Render will automatically:
- Detect the `render.yaml` configuration
- Build your .NET application
- Deploy to a public URL
- Set up health checks

### 4. Verify Deployment

Once deployed, test these endpoints:

- **Health Check**: `https://your-app.onrender.com/health`
- **Application**: `https://your-app.onrender.com`
- **Admin Login**: Use `ADMIN_001` / `TempPass123!`

## Configuration Details

### Environment Variables

The following are automatically configured via `render.yaml`:

- `ASPNETCORE_ENVIRONMENT=Render`
- `ASPNETCORE_URLS=http://0.0.0.0:10000`
- `ConnectionStrings__DefaultConnection` (your SQL Server)

### Database

- **Type**: SQL Server (external)
- **Server**: sql8011.arnaco.com
- **Database**: db_a28254_urbaweb
- **Migrations**: Automatically applied on startup

### Static Files

- Served from `wwwroot` directory
- Default page: `unified-login.html`
- All CSS, JS, and HTML files included

## Troubleshooting

### Build Issues

1. **Check Logs**: View build logs in Render dashboard
2. **Local Test**: Run `.\deploy.ps1` to test locally
3. **Dependencies**: Ensure all NuGet packages are restored

### Runtime Issues

1. **Health Check**: Visit `/health` endpoint
2. **Database**: Check connection string in environment variables
3. **Logs**: View application logs in Render dashboard

### Common Solutions

- **Build Timeout**: Increase build timeout in Render settings
- **Memory Issues**: Upgrade to a higher plan if needed
- **Database Connection**: Verify SQL Server allows external connections

## File Structure

```
Geospatial/
├── render.yaml                 # Render configuration
├── deploy.ps1                 # Deployment script
├── DEPLOYMENT.md              # This file
└── geospatial/               # Application directory
    ├── UrbanReferralNetwork.csproj
    ├── Program.cs
    ├── appsettings.json
    ├── appsettings.Render.json
    └── wwwroot/              # Static files
```

## Support

- **Render Documentation**: [render.com/docs](https://render.com/docs)
- **Application Logs**: Available in Render dashboard
- **Health Check**: Monitor via `/health` endpoint

## Security Notes

- Database credentials are configured as environment variables
- HTTPS is automatically provided by Render
- CORS is configured to allow all origins (adjust for production)