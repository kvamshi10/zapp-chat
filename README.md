# ChatApp - Real-time Chat Application

A production-ready, full-featured real-time chat application built with modern web technologies. Features include end-to-end encryption, file sharing, group chats, voice/video calling capabilities, and much more.

## 🌟 Features

### Core Messaging
- **Real-time Messaging**: Instant message delivery using Socket.IO WebSockets
- **1-to-1 & Group Chats**: Private conversations and group discussions
- **Message Status Indicators**: Sent ✓, Delivered ✓✓, Read (blue ticks)
- **Typing Indicators**: See when others are typing
- **Message Reactions**: React to messages with emojis
- **Message Editing & Deletion**: Edit or delete messages after sending
- **Reply to Messages**: Quote and reply to specific messages
- **Message Search**: Search through chat history

### Media & Files
- **File Sharing**: Share images, videos, documents, and more
- **Voice Messages**: Record and send voice notes
- **Media Gallery**: View all shared media in a chat
- **File Management**: Organized view of all shared files

### User Features
- **User Authentication**: Secure JWT-based authentication
- **Profile Management**: Customizable profiles with avatars and status
- **Online/Offline Status**: Real-time presence indicators
- **Last Seen**: Track when users were last active
- **Contact Management**: Add, remove, and manage contacts
- **Block/Unblock Users**: Control who can message you

### Security & Privacy
- **End-to-End Encryption**: RSA-based message encryption
- **Secure File Storage**: Protected file uploads
- **Privacy Controls**: Manage who can see your profile, status, and last seen
- **Read Receipts Control**: Toggle read receipt visibility

### Additional Features
- **Dark/Light Theme**: Customizable appearance with theme support
- **Push Notifications**: Browser-based notifications
- **Responsive Design**: Works seamlessly on desktop and mobile
- **PWA Support**: Installable as a Progressive Web App
- **Emoji Support**: Rich emoji picker for expressive messaging
- **Message Formatting**: Support for rich text formatting

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Socket.IO** - Real-time bidirectional communication
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication tokens
- **Bcrypt** - Password hashing
- **Multer** - File upload handling
- **Helmet** - Security headers
- **Compression** - Response compression
- **CORS** - Cross-origin resource sharing

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **React Router v6** - Client-side routing
- **Zustand** - State management
- **Socket.IO Client** - WebSocket client
- **TailwindCSS** - Utility-first CSS framework
- **HeadlessUI** - Unstyled UI components
- **React Hook Form** - Form handling
- **React Hot Toast** - Toast notifications
- **Emoji Picker React** - Emoji selection
- **Date-fns** - Date formatting
- **Axios** - HTTP client

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager
- Git

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/chatapp.git
cd chatapp
```

### 2. Install Backend Dependencies

```bash
cd server
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../client
npm install
```

### 4. Environment Configuration

#### Backend Configuration
Create a `.env` file in the `/server` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/chatapp

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=30d

# Encryption Keys
ENCRYPTION_KEY=your-32-character-encryption-key-change-this

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# CORS
CLIENT_URL=http://localhost:3000
```

#### Frontend Configuration
Create a `.env` file in the `/client` directory:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## 🏃‍♂️ Running the Application

### Development Mode

#### Start MongoDB
```bash
# On macOS/Linux
mongod

# On Windows
"C:\Program Files\MongoDB\Server\5.0\bin\mongod.exe"
```

#### Start Backend Server
```bash
cd server
npm run dev
```

#### Start Frontend Development Server
```bash
cd client
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Socket.IO: http://localhost:5000

### Production Mode

#### Build Frontend
```bash
cd client
npm run build
```

#### Start Production Server
```bash
cd server
npm start
```

## 📁 Project Structure

```
chat-app/
├── client/                    # React frontend
│   ├── public/               # Static assets
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/           # Page components
│   │   ├── store/           # Zustand stores
│   │   ├── utils/           # Utility functions
│   │   ├── App.jsx          # Main app component
│   │   ├── main.jsx         # Entry point
│   │   └── index.css        # Global styles
│   ├── package.json
│   └── vite.config.js       # Vite configuration
│
├── server/                   # Node.js backend
│   ├── models/              # MongoDB models
│   ├── routes/              # API routes
│   ├── middleware/          # Custom middleware
│   ├── socket/              # Socket.IO handlers
│   ├── uploads/             # File uploads directory
│   ├── server.js            # Entry point
│   └── package.json
│
└── README.md
```

## 🔧 Configuration Details

### MongoDB Setup

1. **Local Installation**:
   - Download MongoDB from [mongodb.com](https://www.mongodb.com/try/download/community)
   - Install and start MongoDB service
   - Default connection string: `mongodb://localhost:27017/chatapp`

2. **MongoDB Atlas (Cloud)**:
   - Create account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   - Create a cluster
   - Get connection string and update `MONGODB_URI` in `.env`

### File Upload Configuration

- Maximum file size: 10MB (configurable via `MAX_FILE_SIZE`)
- Supported formats: Images, videos, documents
- Storage location: `/server/uploads/`

### Security Configuration

1. **JWT Secret**: Generate a strong secret key
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

2. **Encryption Key**: Generate a 32-character key
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64').slice(0, 32))"
   ```

## 🌐 Deployment

### Deploy to Render

1. **Backend Deployment**:
   - Create a new Web Service on Render
   - Connect your GitHub repository
   - Set build command: `cd server && npm install`
   - Set start command: `cd server && npm start`
   - Add environment variables

2. **Frontend Deployment**:
   - Create a new Static Site on Render
   - Connect your GitHub repository
   - Set build command: `cd client && npm install && npm run build`
   - Set publish directory: `client/dist`

### Deploy to Vercel (Frontend)

```bash
cd client
npm i -g vercel
vercel
```

### Deploy to Railway

1. Install Railway CLI
2. Run `railway login`
3. Run `railway init`
4. Run `railway up`

### Deploy to Heroku

1. Create `Procfile` in root:
   ```
   web: cd server && npm start
   ```

2. Deploy:
   ```bash
   heroku create your-app-name
   heroku config:set MONGODB_URI=your-mongodb-uri
   heroku config:set JWT_SECRET=your-jwt-secret
   git push heroku main
   ```

## 🧪 Testing

### Run Backend Tests
```bash
cd server
npm test
```

### Run Frontend Tests
```bash
cd client
npm test
```

## 📱 PWA Installation

The application can be installed as a Progressive Web App:

1. Open the application in Chrome/Edge
2. Click the install icon in the address bar
3. Follow the installation prompts

## 🔐 Security Best Practices

1. **Environment Variables**: Never commit `.env` files
2. **HTTPS**: Always use HTTPS in production
3. **Rate Limiting**: Implemented on authentication endpoints
4. **Input Validation**: All inputs are validated and sanitized
5. **XSS Protection**: Helmet.js provides XSS protection
6. **CORS**: Properly configured CORS policies
7. **Password Security**: Bcrypt with salt rounds
8. **JWT Security**: Tokens expire and are validated

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**:
   - Ensure MongoDB is running
   - Check connection string in `.env`
   - Verify network access for cloud databases

2. **Socket Connection Issues**:
   - Check CORS configuration
   - Ensure WebSocket port is not blocked
   - Verify socket URL in frontend config

3. **File Upload Errors**:
   - Check file size limits
   - Verify upload directory permissions
   - Ensure multer configuration is correct

4. **Build Errors**:
   - Clear node_modules and reinstall
   - Check Node.js version compatibility
   - Verify all environment variables are set

## 📈 Performance Optimization

1. **Database Indexing**: Indexes on frequently queried fields
2. **Image Optimization**: Compress images before upload
3. **Lazy Loading**: Components and routes are lazy loaded
4. **Caching**: Browser caching for static assets
5. **Compression**: Gzip compression enabled
6. **Code Splitting**: Automatic code splitting with Vite

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Support

For support, email support@chatapp.com or join our Discord server.

## 🙏 Acknowledgments

- Socket.IO for real-time communication
- MongoDB for database
- React team for the amazing framework
- TailwindCSS for the utility-first CSS framework
- All open-source contributors

## 📸 Screenshots

[Add screenshots of your application here]

## 🎯 Roadmap

- [ ] Voice and video calling with WebRTC
- [ ] Screen sharing capabilities
- [ ] Message translation
- [ ] Advanced message search with filters
- [ ] Bot integration support
- [ ] Message scheduling
- [ ] Location sharing
- [ ] Status/Stories feature
- [ ] Multi-device support
- [ ] Backup and restore functionality

---

**Made with ❤️ by the ChatApp Team**
