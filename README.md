# TaskFlow Pro - Real-Time Collaborative To-Do Board

A modern, real-time collaborative task management application built with React, Node.js, Socket.IO, and MongoDB.

## 🚀 Features

- **Real-time Collaboration**: Live updates across all connected users
- **Drag & Drop Interface**: Intuitive task management with React DnD
- **Smart Task Assignment**: Automatically assign tasks to users with the least workload
- **Activity Tracking**: Complete audit trail of all task activities
- **Dark/Light Theme**: Toggle between themes with smooth transitions
- **User Authentication**: Secure JWT-based authentication
- **Responsive Design**: Works perfectly on desktop and mobile devices
- **Beautiful Animations**: Smooth transitions and micro-interactions

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React DnD** for drag and drop
- **Socket.IO Client** for real-time updates
- **Axios** for API calls
- **Lucide React** for icons

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose
- **Socket.IO** for real-time communication
- **JWT** for authentication
- **bcryptjs** for password hashing

## 🏃‍♂️ Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB database
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd collaborative-todo-board
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   JWT_SECRET=your-super-secret-jwt-key-here
   MONGODB_URI=your-mongodb-connection-string
   PORT=3001
   ```

4. **Start the application**
   ```bash
   npm run dev
   ```

   This will start both the client (http://localhost:5173) and server (http://localhost:3001) concurrently.

## 📦 Deployment

### Deploy to Render

#### Option A: Automatic Deployment (Recommended)
1. **Connect GitHub**: Go to [Render Dashboard](https://dashboard.render.com)
2. **Import Repository**: Click "New" → "Blueprint" → Connect your GitHub repo
3. **Configure Environment**: The `render.yaml` will automatically configure the service
4. **Set Environment Variables**:
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: A secure random string (Render can generate this)

#### Option B: Manual Setup
1. **Create Web Service** on Render
2. **Connect GitHub repository**
3. **Settings**:
   - **Build Command**: `npm install && npm run build:client`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     ```
     NODE_ENV=production
     MONGODB_URI=your-mongodb-connection-string
     JWT_SECRET=your-secret-key
     PORT=10000
     ```

## 🎯 Usage

### Creating Tasks
1. Click the "New Task" button
2. Fill in task details (title, description, priority)
3. Optionally assign to a user
4. Click "Create" to add the task

### Managing Tasks
- **Drag & Drop**: Move tasks between columns (Todo, In Progress, Done)
- **Edit**: Click the edit icon on any task card
- **Delete**: Click the delete icon (with confirmation)
- **Smart Assign**: Click the lightning bolt icon to auto-assign

### Real-time Features
- See live updates when other users modify tasks
- View who's currently editing tasks
- Track all activities in the activity panel

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `JWT_SECRET` | Secret key for JWT tokens | Yes |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `PORT` | Server port (default: 3001) | No |

### Database Schema

The application uses three main collections:
- **Users**: User authentication and profile data
- **Tasks**: Task information with status history
- **Activities**: Audit trail of all task activities

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by popular project management tools
- Designed for productivity and collaboration

## 📞 Support

If you have any questions or need help, please open an issue on GitHub.

---

**Happy Task Managing! 🎉**