# 🔧 MongoDB Atlas Setup Guide

## ⚠️ Issue: Connection Failed

If you see this error when starting the server:
```
❌ MongoDB connection error: MongooseServerSelectionError: Could not connect to any servers
```

This means your IP address is not whitelisted in MongoDB Atlas.

---

## 🛠️ Fix: Whitelist Your IP Address

### Step 1: Go to MongoDB Atlas
1. Open your browser and go to: https://cloud.mongodb.com
2. Log in with your MongoDB Atlas account

### Step 2: Navigate to Network Access
1. Click on your cluster name
2. In the left sidebar, click **"Network Access"**
3. You'll see a list of whitelisted IP addresses

### Step 3: Add Your IP Address

**Option A: Allow All IPs (Easiest for Development)**
1. Click **"Add IP Address"** button
2. Click **"Allow Access from Anywhere"**
3. Click **"Confirm"**

**Option B: Add Only Your Current IP (More Secure)**
1. Click **"Add IP Address"** button
2. Click **"Add Current IP Address"**
3. Your IP will be automatically detected
4. Add a comment like "My Development Machine"
5. Click **"Confirm"**

### Step 4: Wait for Changes to Apply
- **Important**: Changes take 1-2 minutes to take effect
- You'll see a yellow "Pending" status that turns green when ready

### Step 5: Restart Your Server
```bash
cd server
npm run dev
```

You should now see:
```
✅ MongoDB connected successfully
📦 Database: chatapp
```

---

## 🔒 Security Note

**For Production:**
- Never use "Allow Access from Anywhere" (0.0.0.0/0)
- Only whitelist specific server IPs
- Use VPC peering or private endpoints for better security

**For Development:**
- "Allow Access from Anywhere" is fine for testing
- Remember to remove it before deploying to production

---

## ✅ Verify Connection

Once whitelisted, your server should show:
```
🚀 Server is running on port 5000
📱 Socket.IO is ready for connections
🌍 Environment: development
✅ MongoDB connected successfully
📦 Database: chatapp
```

---

## 🆘 Still Having Issues?

### Check Your Connection String
In `server/.env`, verify:
```
MONGODB_URI=mongodb+srv://codesens04_db_user:hJ5AYSVZw2yYUtjF@cluster0.zhuhcar.mongodb.net/chatapp?retryWrites=true&w=majority&appName=Cluster0
```

### Test Connection Manually
```bash
# In server directory
node -e "const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://codesens04_db_user:hJ5AYSVZw2yYUtjF@cluster0.zhuhcar.mongodb.net/chatapp').then(() => console.log('Connected!')).catch(err => console.log('Error:', err.message));"
```

### Common Errors

**Error: "bad auth"**
- Wrong username or password in connection string

**Error: "Could not connect to any servers"**
- IP not whitelisted (follow steps above)
- Cluster is paused or deleted
- Internet connection issue

**Error: "ENOTFOUND"**
- DNS resolution failed
- Check internet connection
- Verify cluster URL is correct

---

## 📞 Need More Help?

Check the MongoDB Atlas documentation:
https://www.mongodb.com/docs/atlas/security/ip-access-list/

Or contact MongoDB support:
https://www.mongodb.com/contact
