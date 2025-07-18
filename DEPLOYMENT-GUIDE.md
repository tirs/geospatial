# 🚀 Geospatial Sub-Application Deployment Guide

## **Overview**
This guide explains how to deploy the .NET Core Geospatial application as a sub-application within your existing .NET Framework website at `urbanreferralnetwork.com`.

## **📁 Deployment Structure**
```
urbanreferralnetwork.com/
├── [Your existing .NET Framework site files]
└── geospatial/                    ← Sub-application folder
    ├── web.config                 ← IIS configuration for sub-app
    ├── UrbanReferralNetwork.dll   ← Main application
    ├── wwwroot/                   ← Static files
    ├── logs/                      ← Application logs
    └── [Other .NET Core files]
```

## **🔧 IIS Configuration Steps**

### **Step 1: Create Sub-Application in IIS**
1. Open **IIS Manager**
2. Navigate to your main site: `urbanreferralnetwork.com`
3. Right-click → **Add Application**
4. Set:
   - **Alias:** `geospatial`
   - **Physical Path:** `C:\path\to\your\site\geospatial`
   - **Application Pool:** Create new pool for .NET Core

### **Step 2: Configure Application Pool**
1. Create new Application Pool: `GeospatialAppPool`
2. Set **.NET CLR Version:** `No Managed Code`
3. Set **Managed Pipeline Mode:** `Integrated`
4. Set **Identity:** `ApplicationPoolIdentity`

### **Step 3: Install ASP.NET Core Hosting Bundle**
- Download and install: [ASP.NET Core Hosting Bundle](https://dotnet.microsoft.com/download/dotnet/8.0)
- Restart IIS after installation

## **📦 Deployment Files**

### **Required Files:**
- ✅ `web.config` - IIS configuration
- ✅ `UrbanReferralNetwork.dll` - Main application
- ✅ All dependency DLLs
- ✅ `wwwroot/` folder with static files
- ✅ `appsettings.json` and `appsettings.Production.json`

### **Key Configuration:**
- **Path Base:** `/geospatial` (configured in web.config)
- **Database:** Remote SQL Server (configured)
- **Environment:** `Production`

## **🌐 Access URLs**
After deployment, your application will be available at:
- **Main App:** `https://urbanreferralnetwork.com/geospatial/`
- **Admin Dashboard:** `https://urbanreferralnetwork.com/geospatial/pages/dashboard.html`
- **Health Check:** `https://urbanreferralnetwork.com/geospatial/health`

## **🔍 Troubleshooting**

### **Common Issues:**
1. **500.19 Error:** Check web.config syntax
2. **500.30 Error:** ASP.NET Core Hosting Bundle not installed
3. **404 Errors:** Check application pool and path base configuration
4. **Database Connection:** Verify connection string in web.config

### **Log Locations:**
- **Application Logs:** `geospatial/logs/`
- **IIS Logs:** `C:\inetpub\logs\LogFiles\`
- **Event Viewer:** Windows Logs → Application

## **✅ Verification Steps**
1. Check health endpoint: `/geospatial/health`
2. Test login page: `/geospatial/unified-login.html`
3. Verify API endpoints work
4. Test admin dashboard functionality

## **🔒 Security Notes**
- Application runs in isolated application pool
- Database connection uses encrypted connection
- HTTPS enforced through main site configuration
- Security headers configured in web.config