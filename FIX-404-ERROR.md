# 🚨 Fix 404 Error - IIS Sub-Application Configuration

## **The Problem:**
Your geospatial app is being treated as a .NET Framework app instead of .NET Core, causing 404 errors.

## **🔧 Step-by-Step Fix:**

### **Step 1: Install ASP.NET Core Hosting Bundle**
1. **Download:** [ASP.NET Core 8.0 Hosting Bundle](https://dotnet.microsoft.com/download/dotnet/8.0)
2. **Install** the hosting bundle
3. **Restart IIS:** Run `iisreset` in Command Prompt as Administrator

### **Step 2: Create Proper Application Pool**
1. **Open IIS Manager**
2. **Right-click "Application Pools" → Add Application Pool**
3. **Set:**
   - **Name:** `GeospatialAppPool`
   - **.NET CLR Version:** `No Managed Code` ⚠️ **CRITICAL!**
   - **Managed Pipeline Mode:** `Integrated`
4. **Click OK**

### **Step 3: Configure Sub-Application**
1. **In IIS Manager, expand your main site**
2. **Find the geospatial folder**
3. **Right-click geospatial folder → Convert to Application**
4. **Set:**
   - **Alias:** `geospatial`
   - **Application Pool:** `GeospatialAppPool` (the one you just created)
   - **Physical Path:** `C:\path\to\your\geospatial\folder`
5. **Click OK**

### **Step 4: Verify web.config Location**
Ensure `web.config` is in the **root** of your geospatial folder:
```
C:\inetpub\wwwroot\urbanreferralnetwork.com\
├── [your main site files]
└── geospatial\
    ├── web.config          ← Must be here!
    ├── UrbanReferralNetwork.dll
    ├── wwwroot\
    └── [other files]
```

### **Step 5: Check File Permissions**
1. **Right-click geospatial folder → Properties → Security**
2. **Ensure these accounts have Read & Execute:**
   - `IIS_IUSRS`
   - `IUSR`
   - Your application pool identity

### **Step 6: Restart Everything**
```cmd
# Run as Administrator
iisreset
```

## **🧪 Test the Fix:**

### **1. Health Check:**
Visit: `https://urbanreferralnetwork.com/geospatial/health`
- **Expected:** JSON response with status
- **If 404:** Sub-application not configured correctly

### **2. Static Files:**
Visit: `https://urbanreferralnetwork.com/geospatial/unified-login.html`
- **Expected:** Login page loads
- **If 404:** Path base or static file handling issue

### **3. API Endpoints:**
Check browser console on login page for API calls
- **Expected:** API calls to `/geospatial/api/...`
- **If wrong path:** Frontend configuration issue

## **🔍 Troubleshooting:**

### **Still Getting .NET Framework Error?**
- **Check:** Application pool is set to "No Managed Code"
- **Check:** Sub-application is using the correct app pool
- **Check:** ASP.NET Core Hosting Bundle is installed

### **500.30 Error?**
- **Cause:** ASP.NET Core Hosting Bundle not installed
- **Fix:** Install hosting bundle and restart IIS

### **500.19 Error?**
- **Cause:** web.config syntax error
- **Fix:** Check web.config for XML syntax errors

### **Access Denied?**
- **Cause:** File permissions
- **Fix:** Grant IIS_IUSRS read access to geospatial folder

## **📋 Quick Verification Script:**
Run the included PowerShell script as Administrator:
```powershell
.\verify-iis-config.ps1
```

## **🆘 If Still Not Working:**

### **Check IIS Logs:**
Location: `C:\inetpub\logs\LogFiles\W3SVC1\`

### **Check Event Viewer:**
1. **Windows Logs → Application**
2. **Look for ASP.NET Core errors**

### **Enable Detailed Errors:**
In web.config, temporarily add:
```xml
<httpErrors errorMode="Detailed" />
```

## **✅ Success Indicators:**
- Health check returns JSON
- Login page loads properly
- No .NET Framework version in error messages
- API calls work from browser console