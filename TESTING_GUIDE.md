# 🧪 Testing Guide - ChatApp

## ✅ Quick Test Checklist

Follow this guide to ensure everything works correctly.

---

## 🚀 Step 1: Start Backend Server

### Option A: Using Batch File
```
Double-click: start-server.bat
```

### Option B: Using Terminal
```bash
cd server
npm run dev
```

### Expected Output:
```
🚀 Server is running on port 5000
📱 Socket.IO is ready for connections
🌍 Environment: development
✅ MongoDB connected successfully
📦 Database: chatapp
```

### ⚠️ If MongoDB Fails:
If you see:
```
❌ MongoDB connection error
⚠️  MongoDB Atlas Connection Failed!
```

**Fix:** Follow instructions in `MONGODB_SETUP.md` to whitelist your IP address.

---

## 🎨 Step 2: Start Frontend Client

### Option A: Using Batch File (New Terminal)
```
Double-click: start-client.bat
```

### Option B: Using Terminal
```bash
cd client
npm run dev
```

### Expected Output:
```
VITE v4.x.x ready in xxx ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
```

**Note:** If port 3000 is busy, Vite will use 3001 automatically.

---

## 🌐 Step 3: Open the Application

1. **Open your browser**
2. **Go to:** http://localhost:3000 (or 3001 if shown in terminal)
3. **You should see:** Login/Register page

---

## 👤 Step 4: Test User Registration

### Register First User

1. Click **"Create Account"** or **"Register"**
2. Fill in the form:
   - **Username**: `alice`
   - **Email**: `alice@test.com`
   - **Password**: `test123`
   - **Status**: `Hey there! I'm using ChatApp`
3. Click **"Create Account"**
4. **Expected:** Redirected to chat page

---

## 👥 Step 5: Test with Second User

### Open Incognito/Private Window

1. **Chrome**: Ctrl + Shift + N
2. **Firefox**: Ctrl + Shift + P
3. **Edge**: Ctrl + Shift + N

### Register Second User

1. Go to http://localhost:3000 (or 3001)
2. Click **"Create Account"**
3. Fill in the form:
   - **Username**: `bob`
   - **Email**: `bob@test.com`
   - **Password**: `test123`
   - **Status**: `Available for chat`
4. Click **"Create Account"**

---

## 💬 Step 6: Test Real-time Messaging

### In Alice's Window:

1. Click **"New Chat"** button (+ icon)
2. Search for **"bob"**
3. Click on Bob's name
4. Type a message: `Hey Bob!`
5. Press Enter

### In Bob's Window (Incognito):

1. **You should see:** Chat from Alice appear in sidebar
2. **You should see:** Alice's message `Hey Bob!`
3. **Reply with:** `Hi Alice!`

### In Alice's Window:

1. **You should see:** Bob's reply appear instantly
2. **Check:** Message status shows blue checkmarks (read)

---

## 🧪 Feature Tests

### Test 1: Typing Indicators ⌨️

1. **Alice starts typing** in the message box
2. **Bob should see:** "Alice is typing..." under chat header
3. **Bob starts typing**
4. **Alice should see:** "Bob is typing..."

✅ **Pass:** Typing indicators appear in real-time

### Test 2: Online Status 🟢

1. **Check Bob's profile** in Alice's chat list
2. **Should show:** Green dot (online)
3. **Close Bob's browser tab**
4. **Alice should see:** Bob goes offline (no green dot)

✅ **Pass:** Online/offline status updates

### Test 3: Message Status ✓✓

1. **Alice sends message** to Bob
2. **Should show:** Single checkmark ✓ (sent)
3. **When Bob's tab is open:** Double checkmark ✓✓ (delivered)
4. **When Bob views message:** Blue double checkmarks (read)

✅ **Pass:** Message status indicators work

### Test 4: File Upload 📎

1. **Click attachment icon** (paperclip)
2. **Select "Photos"**
3. **Upload an image**
4. **Expected:** Image appears in chat
5. **Bob should see:** Image in real-time

✅ **Pass:** File uploads work

### Test 5: Emoji Reactions 😊

1. **Hover over a message**
2. **Click** three dots menu
3. **Click "React"**
4. **Select an emoji** (❤️)
5. **Expected:** Emoji appears below message
6. **Bob should see:** Reaction in real-time

✅ **Pass:** Reactions work

### Test 6: Theme Switcher 🌓

1. **Click on user profile** (top left)
2. **Click "Dark Mode"** or **"Light Mode"**
3. **Expected:** Theme changes instantly
4. **Refresh page:** Theme persists

✅ **Pass:** Theme toggle works

### Test 7: Settings Page ⚙️

1. **Click user profile** → **Settings**
2. **Change username** to `alice_updated`
3. **Click "Save Changes"**
4. **Expected:** Success message
5. **Bob should see:** Updated username in chat

✅ **Pass:** Profile updates work

---

## 🔍 Troubleshooting Tests

### Test: Backend Connection

**Check:** Is backend running?
```bash
curl http://localhost:5000/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-11-09T...",
  "environment": "development"
}
```

### Test: Socket.IO Connection

**Open Browser Console** (F12)

**Look for:**
```
Socket connected!
```

**If you see errors:** Check CORS settings and backend URL

### Test: API Calls

**In browser console:**
```javascript
fetch('http://localhost:5000/api/auth/me', {
  credentials: 'include'
}).then(r => r.json()).then(console.log)
```

---

## 🐛 Common Issues & Fixes

### Issue 1: "Cannot connect to server"

**Symptoms:**
- Login doesn't work
- Messages don't send

**Fix:**
1. Check backend is running on port 5000
2. Check browser console for CORS errors
3. Verify CLIENT_URL in server/.env

### Issue 2: "MongoDB connection error"

**Symptoms:**
- Server crashes on startup
- Registration fails

**Fix:**
1. Follow MONGODB_SETUP.md
2. Whitelist your IP in MongoDB Atlas
3. Wait 1-2 minutes after whitelisting

### Issue 3: "WebSocket connection failed"

**Symptoms:**
- Real-time updates don't work
- Typing indicators missing

**Fix:**
1. Check Socket.IO is running (backend logs)
2. Verify proxy settings in vite.config.js
3. Check firewall isn't blocking WebSocket

### Issue 4: "Port already in use"

**Symptoms:**
- Server won't start
- Error: EADDRINUSE

**Fix:**
```bash
# Kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

---

## 📊 Performance Tests

### Test: Load Time

1. **Clear browser cache** (Ctrl + Shift + Delete)
2. **Load application**
3. **Expected:** < 3 seconds initial load

### Test: Message Latency

1. **Send message from Alice**
2. **Measure time** until Bob receives
3. **Expected:** < 100ms on local network

### Test: File Upload Speed

1. **Upload 5MB image**
2. **Expected:** Upload completes in < 5 seconds

---

## ✅ Final Checklist

Before considering the app "working":

- [ ] Backend starts without errors
- [ ] MongoDB connects successfully
- [ ] Frontend loads in browser
- [ ] Can register new user
- [ ] Can login successfully
- [ ] Can create chat
- [ ] Can send messages
- [ ] Messages appear in real-time
- [ ] Typing indicators work
- [ ] Online status updates
- [ ] File uploads work
- [ ] Theme switcher works
- [ ] Settings page accessible
- [ ] Profile updates work
- [ ] Reactions work
- [ ] No console errors

---

## 🎉 Success!

If all tests pass, your ChatApp is fully functional!

**Next Steps:**
- Test group chats
- Test with more users
- Deploy to production
- Add custom features

---

## 📞 Support

If tests fail:
1. Check terminal output for errors
2. Check browser console (F12)
3. Review MONGODB_SETUP.md
4. Check STARTUP_GUIDE.md

**Everything working?** Start building your chat empire! 💬🚀
