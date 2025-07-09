import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Plus, Activity, LogOut, Search, CheckSquare, Clock, Target, Moon, Sun } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import Column from './Column';
import TaskModal from './TaskModal';
import ActivityPanel from './ActivityPanel';
import ProfileModal from './ProfileModal';

const API_BASE_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.PROD ? '' : 'http://localhost:3001'
);
interface Task {
  _id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignedTo?: {
    _id: string;
    username: string;
  };
  createdBy: {
    _id: string;
    username: string;
  };
  createdAt: string;
  statusHistory?: Array<{
    status: string;
    timestamp: string;
    updatedBy?: {
      username: string;
    };
  }>;
}

interface User {
  _id: string;
  username: string;
  email: string;
}

const Board: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isActivityPanelOpen, setIsActivityPanelOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const { user, logout } = useAuth();
  const { socket, connected } = useSocket();
  const { isDark, toggleTheme } = useTheme();

  const columns = ['Todo', 'In Progress', 'Done'];

  useEffect(() => {
    fetchTasks();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('task-updated', (updatedTask) => {
        setTasks(prev => prev.map(task => 
          task._id === updatedTask._id ? updatedTask : task
        ));
      });

      return () => {
        socket.off('task-updated');
      };
    }
  }, [socket]);

  const fetchTasks = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/tasks`);
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/tasks/users`);
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleCreateTask = async (taskData: Partial<Task>) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/tasks`, taskData);
      setTasks(prev => [response.data, ...prev]);
      
      if (socket) {
        socket.emit('task-updated', response.data);
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error creating task');
    }
  };

  const handleUpdateTask = async (taskData: Partial<Task>) => {
    if (!editingTask) return;

    try {
      const response = await axios.put(`${API_BASE_URL}/api/tasks/${editingTask._id}`, taskData);
      setTasks(prev => prev.map(task => 
        task._id === editingTask._id ? response.data : task
      ));
      
      if (socket) {
        socket.emit('task-updated', response.data);
      }
      
      setEditingTask(null);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error updating task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      await axios.delete(`${API_BASE_URL}/api/tasks/${taskId}`);
      setTasks(prev => prev.filter(task => task._id !== taskId));
      
      if (socket) {
        socket.emit('task-updated', { _id: taskId, deleted: true });
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error deleting task');
    }
  };

  const handleDrop = async (taskId: string, newStatus: string) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/tasks/${taskId}`, {
        status: newStatus
      });
      
      setTasks(prev => prev.map(task => 
        task._id === taskId ? response.data : task
      ));
      
      if (socket) {
        socket.emit('task-updated', response.data);
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error updating task');
    }
  };

  const handleSmartAssign = async (taskId: string) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/tasks/${taskId}/smart-assign`);
      setTasks(prev => prev.map(task => 
        task._id === taskId ? response.data : task
      ));
      
      if (socket) {
        socket.emit('task-updated', response.data);
      }
      
      // Show success message
      const assignedUser = response.data.assignedTo?.username || 'someone';
      alert(`Task successfully assigned to ${assignedUser}!`);
    } catch (error: any) {
      console.error('Smart assign error:', error);
      alert(error.response?.data?.message || 'Error smart assigning task');
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = !filterPriority || task.priority === filterPriority;
    return matchesSearch && matchesPriority;
  });

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const closeTaskModal = () => {
    setIsTaskModalOpen(false);
    setEditingTask(null);
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900' : 'bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100'} flex items-center justify-center`}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className={`w-16 h-16 border-4 ${isDark ? 'border-emerald-400 border-t-transparent' : 'border-teal-500 border-t-transparent'} rounded-full`}
        />
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={`min-h-screen transition-colors duration-500 ${isDark ? 'bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900' : 'bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100'} relative overflow-hidden`}>
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Large floating task cards */}
          <motion.div
            animate={{
              x: [0, 100, 0],
              y: [0, -50, 0],
              rotate: [0, 5, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className={`absolute top-20 left-10 w-64 h-40 ${isDark ? 'bg-slate-800/20 border-slate-700/30' : 'bg-white/20 border-white/30'} backdrop-blur-sm rounded-2xl border shadow-2xl`}
          >
            <div className="p-6">
              <div className={`w-full h-4 ${isDark ? 'bg-slate-600/30' : 'bg-white/30'} rounded mb-3`}></div>
              <div className={`w-3/4 h-3 ${isDark ? 'bg-slate-600/20' : 'bg-white/20'} rounded mb-2`}></div>
              <div className={`w-1/2 h-3 ${isDark ? 'bg-slate-600/20' : 'bg-white/20'} rounded`}></div>
            </div>
          </motion.div>

          <motion.div
            animate={{
              x: [0, -80, 0],
              y: [0, 60, 0],
              rotate: [0, -3, 0],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className={`absolute top-1/3 right-20 w-56 h-36 ${isDark ? 'bg-slate-800/20 border-slate-700/30' : 'bg-white/20 border-white/30'} backdrop-blur-sm rounded-2xl border shadow-2xl`}
          >
            <div className="p-5">
              <div className={`w-full h-3 ${isDark ? 'bg-slate-600/30' : 'bg-white/30'} rounded mb-3`}></div>
              <div className={`w-2/3 h-3 ${isDark ? 'bg-slate-600/20' : 'bg-white/20'} rounded mb-2`}></div>
              <div className={`w-4/5 h-3 ${isDark ? 'bg-slate-600/20' : 'bg-white/20'} rounded`}></div>
            </div>
          </motion.div>

          {/* Floating geometric shapes representing tasks */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -30, 0],
                x: [0, Math.sin(i) * 20, 0],
                rotate: [0, 360],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 15 + i * 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 2,
              }}
              className={`absolute w-8 h-8 rounded-lg opacity-30 ${
                i % 3 === 0 
                  ? (isDark ? 'bg-emerald-400' : 'bg-teal-400') 
                  : i % 3 === 1 
                  ? (isDark ? 'bg-cyan-400' : 'bg-emerald-400') 
                  : (isDark ? 'bg-teal-400' : 'bg-cyan-400')
              }`}
              style={{
                top: `${20 + (i * 10)}%`,
                left: `${10 + (i * 12)}%`,
              }}
            />
          ))}

          {/* Animated checkmarks */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={`check-${i}`}
              animate={{
                opacity: [0.1, 0.4, 0.1],
                scale: [1, 1.2, 1],
                rotate: [0, 10, 0],
              }}
              transition={{
                duration: 8 + i,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 3,
              }}
              className={`absolute ${isDark ? 'text-emerald-400/40' : 'text-teal-500/40'}`}
              style={{
                top: `${30 + (i * 15)}%`,
                right: `${5 + (i * 8)}%`,
                fontSize: '2rem',
              }}
            >
              ✓
            </motion.div>
          ))}

          {/* Flowing lines representing workflow */}
          <svg className="absolute inset-0 w-full h-full opacity-20">
            <motion.path
              d="M100,200 Q300,100 500,200 T900,200"
              stroke={isDark ? "url(#gradientDark1)" : "url(#gradientLight1)"}
              strokeWidth="2"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.path
              d="M200,400 Q400,300 600,400 T1000,400"
              stroke={isDark ? "url(#gradientDark2)" : "url(#gradientLight2)"}
              strokeWidth="2"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />
            <defs>
              <linearGradient id="gradientLight1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#14B8A6" />
                <stop offset="100%" stopColor="#06B6D4" />
              </linearGradient>
              <linearGradient id="gradientLight2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#14B8A6" />
              </linearGradient>
              <linearGradient id="gradientDark1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#06B6D4" />
              </linearGradient>
              <linearGradient id="gradientDark2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#14B8A6" />
                <stop offset="100%" stopColor="#10B981" />
              </linearGradient>
            </defs>
          </svg>

          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="grid grid-cols-12 gap-8 h-full">
              {[...Array(144)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0.1, 0.3, 0.1] }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    delay: i * 0.1,
                  }}
                  className={`w-2 h-2 ${isDark ? 'bg-emerald-400' : 'bg-teal-400'} rounded-full`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Header */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={`${isDark ? 'bg-slate-800/95 border-slate-700/50' : 'bg-white/95 border-gray-200/50'} backdrop-blur-xl shadow-lg border-b sticky top-0 z-40 relative transition-colors duration-300`}
        >
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Left Section - Logo and Brand */}
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-3">
                  <motion.div 
                    whileHover={{ scale: 1.05, rotate: 5 }}
                    className="w-12 h-12 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg"
                  >
                    <CheckSquare className="w-6 h-6 text-white" />
                  </motion.div>
                  <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                      TaskFlow Pro
                    </h1>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} font-medium`}>Collaborative Workspace</p>
                  </div>
                </div>
                
                {/* Search and Filter - Hidden on mobile */}
                <div className="hidden lg:flex items-center space-x-3">
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="relative"
                  >
                    <Search size={16} className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDark ? 'text-gray-400' : 'text-gray-400'}`} />
                    <input
                      type="text"
                      placeholder="Search tasks..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`pl-9 pr-4 py-2 ${isDark ? 'bg-slate-700/80 border-slate-600 text-white placeholder-gray-400' : 'bg-white/80 border-gray-200 text-gray-900'} backdrop-blur-sm border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm w-64 shadow-sm transition-colors duration-300`}
                    />
                  </motion.div>
                  <motion.select
                    whileHover={{ scale: 1.02 }}
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className={`px-3 py-2 ${isDark ? 'bg-slate-700/80 border-slate-600 text-white' : 'bg-white/80 border-gray-200 text-gray-900'} backdrop-blur-sm border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm shadow-sm transition-colors duration-300`}
                  >
                    <option value="">All Priorities</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </motion.select>
                </div>
              </div>

              {/* Right Section - Actions and User */}
              <div className="flex items-center space-x-3">
                {/* Theme Toggle */}
                <motion.button
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleTheme}
                  className={`p-2 ${isDark ? 'bg-slate-700/80 hover:bg-slate-600 border-slate-600' : 'bg-white/90 hover:bg-white border-gray-200'} backdrop-blur-sm border rounded-lg transition-all duration-300 shadow-sm hover:shadow-md`}
                >
                  {isDark ? (
                    <Sun size={16} className="text-yellow-400" />
                  ) : (
                    <Moon size={16} className="text-slate-600" />
                  )}
                </motion.button>

                {/* Connection Status */}
                <div className="hidden sm:flex">
                  {connected ? (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={`flex items-center space-x-2 ${isDark ? 'text-emerald-400 bg-emerald-900/30 border-emerald-700/50' : 'text-emerald-600 bg-emerald-50 border-emerald-200'} px-3 py-1.5 rounded-full border`}
                    >
                      <div className={`w-2 h-2 ${isDark ? 'bg-emerald-400' : 'bg-emerald-500'} rounded-full animate-pulse`}></div>
                      <span className="text-xs font-semibold">Live</span>
                    </motion.div>
                  ) : (
                    <div className={`flex items-center space-x-2 ${isDark ? 'text-red-400 bg-red-900/30 border-red-700/50' : 'text-red-600 bg-red-50 border-red-200'} px-3 py-1.5 rounded-full border`}>
                      <div className={`w-2 h-2 ${isDark ? 'bg-red-400' : 'bg-red-500'} rounded-full`}></div>
                      <span className="text-xs font-semibold">Offline</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <motion.button
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsTaskModalOpen(true)}
                  className="flex items-center space-x-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-white px-4 py-2 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg text-sm font-medium"
                >
                  <Plus size={16} />
                  <span className="hidden sm:inline">New Task</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsActivityPanelOpen(true)}
                  className={`flex items-center space-x-2 ${isDark ? 'bg-slate-700/90 hover:bg-slate-600 text-gray-200 border-slate-600' : 'bg-white/90 hover:bg-white text-gray-700 border-gray-200'} backdrop-blur-sm px-4 py-2 rounded-lg border hover:shadow-md transition-all duration-300 shadow-sm text-sm font-medium`}
                >
                  <Activity size={16} />
                  <span className="hidden sm:inline">Activity</span>
                </motion.button>

                {/* User Profile */}
                <motion.button
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsProfileModalOpen(true)}
                  className={`flex items-center space-x-2 ${isDark ? 'bg-slate-700/90 hover:bg-slate-600 border-slate-600' : 'bg-white/90 hover:bg-white border-gray-200'} backdrop-blur-sm px-3 py-2 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md border`}
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-full flex items-center justify-center overflow-hidden shadow-sm">
                    {user?.avatar ? (
                      <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white text-xs font-bold">
                        {user?.username.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className={`hidden md:inline font-medium text-sm ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{user?.username}</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={logout}
                  className={`flex items-center space-x-1 ${isDark ? 'text-red-400 hover:bg-red-900/30 border-red-700/50' : 'text-red-600 hover:bg-red-50 border-red-200'} hover:border-red-300 px-3 py-2 rounded-lg transition-all duration-300 border`}
                >
                  <LogOut size={16} />
                </motion.button>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Stats Bar */}
        <div className="max-w-7xl mx-auto px-6 py-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {columns.map((column, index) => {
              const columnTasks = filteredTasks.filter(task => task.status === column);
              const getColumnColor = (title: string) => {
                switch (title) {
                  case 'Todo': return isDark ? 'from-emerald-500 via-emerald-600 to-teal-600' : 'from-teal-500 via-teal-600 to-emerald-600';
                  case 'In Progress': return isDark ? 'from-cyan-500 via-blue-500 to-indigo-500' : 'from-cyan-500 via-sky-500 to-blue-500';
                  case 'Done': return isDark ? 'from-green-500 via-emerald-500 to-teal-600' : 'from-emerald-500 via-green-500 to-teal-600';
                  default: return 'from-gray-500 to-gray-600';
                }
              };
              
              const getIcon = (title: string) => {
                switch (title) {
                  case 'Todo': return <Target className="w-6 h-6 text-white" />;
                  case 'In Progress': return <Clock className="w-6 h-6 text-white" />;
                  case 'Done': return <CheckSquare className="w-6 h-6 text-white" />;
                  default: return <Target className="w-6 h-6 text-white" />;
                }
              };
              
              return (
                <motion.div
                  key={column}
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  whileHover={{ scale: 1.02, y: -5 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={`${isDark ? 'bg-slate-800/90 border-slate-700/50' : 'bg-white/90 border-gray-200/50'} backdrop-blur-sm rounded-2xl p-6 shadow-xl border hover:shadow-2xl transition-all duration-300`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={`font-bold text-lg ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>{column}</h3>
                      <p className={`text-3xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{columnTasks.length}</p>
                      <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {columnTasks.length === 1 ? 'task' : 'tasks'}
                      </p>
                    </div>
                    <div className={`w-16 h-16 bg-gradient-to-r ${getColumnColor(column)} rounded-2xl flex items-center justify-center shadow-lg`}>
                      {getIcon(column)}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Board */}
        <main className="max-w-7xl mx-auto px-6 pb-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {columns.map((column) => (
              <Column
                key={column}
                title={column}
                tasks={filteredTasks.filter(task => task.status === column)}
                onDrop={handleDrop}
                onEditTask={openEditModal}
                onDeleteTask={handleDeleteTask}
                onSmartAssign={handleSmartAssign}
              />
            ))}
          </div>
        </main>

        {/* Modals */}
        <TaskModal
          isOpen={isTaskModalOpen}
          onClose={closeTaskModal}
          onSave={editingTask ? handleUpdateTask : handleCreateTask}
          task={editingTask}
          users={users}
        />

        <ActivityPanel
          isOpen={isActivityPanelOpen}
          onClose={() => setIsActivityPanelOpen(false)}
        />

        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
        />
      </div>
    </DndProvider>
  );
};

export default Board;