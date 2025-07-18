# 🚀 Urban Referral Network - Render Deployment Guide

## **Why Render?**
- ✅ **Native .NET 8 Support** - No IIS configuration needed
- ✅ **Automatic SSL/HTTPS** - Built-in certificate management
- ✅ **Easy Deployment** - Git-based deployment
- ✅ **Built-in Health Checks** - Automatic monitoring
- ✅ **Environment Management** - Easy configuration
- ✅ **Scalable** - Auto-scaling capabilities

## **📋 Prerequisites**
1. **GitHub/GitLab Repository** - Your code needs to be in a git repository
2. **Render Account** - Sign up at https://render.com
3. **Database Access** - Already configured

## **🔧 Deployment Steps**

### **Step 1: Push Code to Git Repository**
```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### **Step 2: Create Render Service**
1. Go to https://render.com dashboard
2. Click "New" → "Web Service"
3. Connect your GitHub/GitLab repository
4. Select your repository

### **Step 3: Configure Service**
**Basic Settings:**
- **Name:** `urban-referral-network`
- **Runtime:** `Docker` or `Native Environment`
- **Build Command:** `dotnet publish -c Release -o ./publish`
- **Start Command:** `dotnet ./publish/UrbanReferralNetwork.dll`

**Environment Variables:**
- `ASPNETCORE_ENVIRONMENT` = `Production`
- `PORT` = `10000` (Render will set this automatically)
- `ConnectionStrings__DefaultConnection` = `Server=sql8011.arnaco.com;Database=db_a28254_urbaweb;User Id=db_a28254_urbaweb_admin;Password=6Th38P623hLg;Encrypt=true;TrustServerCertificate=true;MultipleActiveResultSets=true`

### **Step 4: Deploy**
1. Click "Create Web Service"
2. Render will automatically build and deploy
3. Your app will be available at `https://your-app-name.onrender.com`

## **🎯 Configuration Files Included**

### **render.yaml** (Optional - for advanced configuration)
```yaml
services:
  - type: web
    name: urban-referral-network
    runtime: dotnet
    env: dotnet
    buildCommand: dotnet publish -c Release -o ./publish
    startCommand: dotnet ./publish/UrbanReferralNetwork.dll
    plan: starter
    envVars:
      - key: ASPNETCORE_ENVIRONMENT
        value: Production
      - key: ASPNETCORE_URLS
        value: http://0.0.0.0:10000
    healthCheckPath: /health
```

### **appsettings.Render.json** (Will be used automatically)
- Database connection configured
- HTTPS disabled (Render handles SSL termination)
- CORS configured for all origins
- Rate limiting enabled

## **✅ What's Configured**
- ✅ **Database Connection** - Production SQL Server
- ✅ **Health Checks** - `/health` endpoint
- ✅ **Logging** - Console and file logging
- ✅ **Security** - JWT authentication, CORS, rate limiting
- ✅ **Static Files** - All frontend assets
- ✅ **Port Configuration** - Dynamic port binding

## **🔍 Testing Your Deployment**
Once deployed, test these URLs:
- **Main App:** `https://your-app-name.onrender.com`
- **Health Check:** `https://your-app-name.onrender.com/health`
- **Login:** `https://your-app-name.onrender.com/unified-login.html`
- **API:** `https://your-app-name.onrender.com/api/v1/contractors/search?zipCode=90210`

## **🎛️ Render Dashboard Features**
- **Automatic Deployments** - Deploy on git push
- **Logs** - Real-time application logs
- **Metrics** - CPU, memory, response times
- **Custom Domains** - Add your own domain
- **Environment Variables** - Easy configuration management

## **💰 Pricing**
- **Free Tier** - Perfect for testing (spins down after 15 min of inactivity)
- **Starter Plan** - $7/month for always-on service
- **Pro Plans** - For production with more resources

## **🔧 Advanced Configuration**
- **Custom Domain:** Point `urbanreferralnetwork.com` to your Render app
- **Environment Variables:** Manage through Render dashboard
- **Health Checks:** Built-in monitoring at `/health`
- **SSL/HTTPS:** Automatically provided by Render

## **🚀 Benefits Over IIS**
- ✅ **No Server Management** - Render handles everything
- ✅ **Automatic SSL** - HTTPS out of the box
- ✅ **Git-based Deployment** - Deploy with git push
- ✅ **Built-in Monitoring** - Health checks, logs, metrics
- ✅ **Scalability** - Auto-scaling based on traffic
- ✅ **No .NET Framework Conflicts** - Native .NET 8 support

## **📞 Support**
- **Render Documentation:** https://render.com/docs
- **Community Support:** https://community.render.com
- **Status Page:** https://status.render.com