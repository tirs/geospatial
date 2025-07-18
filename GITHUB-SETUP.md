# 🔧 GitHub Setup Guide for Urban Referral Network

## **Current Status:**
✅ **Local git repository created**
✅ **All files committed (114 files, 48,982 lines)**
✅ **Remote origin configured: https://github.com/tirs/geospatial.git**

❌ **Permission denied when pushing to GitHub**

## **🔑 Authentication Options**

### **Option 1: Personal Access Token (Recommended)**

1. **Go to GitHub Settings:**
   - Visit: https://github.com/settings/tokens
   - Click "Generate new token (classic)"

2. **Configure Token:**
   - Name: "Urban Referral Network Deploy"
   - Expiration: 90 days (or as needed)
   - Scopes: Select "repo" (full control of private repositories)

3. **Copy the token** (you'll only see it once!)

4. **Use token for push:**
   ```bash
   git push -u origin main
   ```
   - Username: `tirs`
   - Password: `[use your personal access token]`

### **Option 2: SSH Key (Alternative)**

1. **Generate SSH Key:**
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```

2. **Add to GitHub:**
   - Go to: https://github.com/settings/keys
   - Click "New SSH key"
   - Paste your public key

3. **Change remote to SSH:**
   ```bash
   git remote set-url origin git@github.com:tirs/geospatial.git
   git push -u origin main
   ```

## **🚀 After Successful Push**

Once you've pushed to GitHub, you can immediately deploy to Render:

1. **Go to Render:**
   - Visit: https://render.com
   - Sign up/Login

2. **Create Web Service:**
   - Click "New" → "Web Service"
   - Connect GitHub account
   - Select repository: `tirs/geospatial`

3. **Render will automatically detect:**
   - ✅ .NET 8 application
   - ✅ Build command: `dotnet publish -c Release -o ./publish`
   - ✅ Start command: `dotnet ./publish/geospatial.dll`

4. **Environment Variables (Render will ask):**
   - `ASPNETCORE_ENVIRONMENT` = `Production`
   - `ConnectionStrings__DefaultConnection` = `[your database connection]`

## **📋 Repository Contents Ready for Render:**

Your repository now contains:
- ✅ **Complete .NET 8 application** (114 files)
- ✅ **render.yaml** - Render configuration
- ✅ **Dockerfile** - Container deployment option
- ✅ **appsettings.Render.json** - Production configuration
- ✅ **All source code** - Controllers, Models, Services
- ✅ **All frontend files** - HTML, CSS, JavaScript
- ✅ **Database migrations** - Ready for production
- ✅ **Deployment documentation** - Complete guides

## **🎯 Next Steps After Push:**

1. **Push to GitHub** (using token/SSH)
2. **Deploy to Render** (5-minute process)
3. **Your app will be live** at `https://your-app-name.onrender.com`

## **💡 Troubleshooting:**

**If still having issues:**
- Check if repository `tirs/geospatial` exists on GitHub
- Verify you have write access to the repository
- Try using GitHub Desktop instead of command line
- Consider creating a new repository if needed

**Alternative:** Create a new repository and push there:
```bash
git remote set-url origin https://github.com/tirs/urban-referral-network.git
git push -u origin main
```

## **🔗 Helpful Links:**
- **GitHub Token Setup:** https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token
- **Render Deployment:** https://render.com/docs/deploy-node-express-app
- **GitHub SSH Setup:** https://docs.github.com/en/authentication/connecting-to-github-with-ssh