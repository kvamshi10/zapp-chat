# 🚀 Quick Start Guide

Get ChatApp running in under 5 minutes!

## Prerequisites Checklist
- [ ] Node.js v16+ installed
- [ ] MongoDB installed and running
- [ ] Git installed

## Step-by-Step Setup

### 1️⃣ Install Dependencies
Open terminal in the project root and run:
```bash
npm run install:all
```
This installs dependencies for both client and server.

### 2️⃣ Start MongoDB
```bash
# macOS/Linux
mongod

# Windows
"C:\Program Files\MongoDB\Server\5.0\bin\mongod.exe"
```

### 3️⃣ Start the Application
In the project root directory:
```bash
npm run dev
```

This starts both the backend server (port 5000) and frontend (port 3000).

### 4️⃣ Open the Application
Navigate to http://localhost:3000 in your browser.

## 🎉 You're Ready!

### First Steps:
1. Click "Create New Account" to register
2. Enter your username, email, and password
3. Start chatting!

## Test Accounts (for Development)
After registering your first account, you can:
1. Open an incognito window
2. Register a second test account
3. Start a conversation between the two accounts

## Common Issues & Solutions

### MongoDB Connection Failed
- Ensure MongoDB is running: `mongod --version`
- Check if port 27017 is available

### Port Already in Use
- Backend port conflict: Change PORT in `/server/.env`
- Frontend port conflict: Change port in `/client/vite.config.js`

### Blank Screen
- Check browser console for errors
- Ensure both servers are running
- Clear browser cache

## Environment Variables
The default `.env` files are pre-configured for local development. For production:
1. Change `JWT_SECRET` to a secure random string
2. Update `ENCRYPTION_KEY` to a secure 32-character key
3. Set `NODE_ENV=production`

## Need Help?
- Check the full README.md for detailed documentation
- Look for error messages in terminal and browser console
- Ensure all prerequisites are installed

---
**Happy Chatting! 💬**
