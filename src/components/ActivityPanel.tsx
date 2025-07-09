import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, X, Clock, User, Plus, Edit, Trash, Move, Zap } from 'lucide-react';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.PROD ? '' : 'http://localhost:3001'
);
interface ActivityItem {
  _id: string;
  action: string;
  taskId: {
    _id: string;
    title: string;
  };
  userId: {
    _id: string;
    username: string;
  };
  details: any;
  timestamp: string;
}

interface ActivityPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const ActivityPanel: React.FC<ActivityPanelProps> = ({ isOpen, onClose }) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { socket } = useSocket();

  useEffect(() => {
    if (isOpen) {
      fetchActivities();
    }
  }, [isOpen]);

  useEffect(() => {
    if (socket) {
      socket.on('activity-update', (newActivity) => {
        setActivities(prev => [newActivity, ...prev.slice(0, 19)]);
      });

      return () => {
        socket.off('activity-update');
      };
    }
  }, [socket]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/activity`);
      setActivities(response.data);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created': return <Plus size={16} className="text-green-600" />;
      case 'updated': return <Edit size={16} className="text-blue-600" />;
      case 'deleted': return <Trash size={16} className="text-red-600" />;
      case 'moved': return <Move size={16} className="text-purple-600" />;
      case 'assigned': return <User size={16} className="text-orange-600" />;
      case 'smart_assigned': return <Zap size={16} className="text-yellow-600" />;
      default: return <Activity size={16} className="text-gray-600" />;
    }
  };

  const getActionText = (activity: ActivityItem) => {
    const { action, details, userId, taskId } = activity;
    const username = userId.username;
    const taskTitle = taskId?.title || 'Unknown Task';

    switch (action) {
      case 'created':
        return `${username} created task "${taskTitle}"`;
      case 'updated':
        return `${username} updated task "${taskTitle}"`;
      case 'deleted':
        return `${username} deleted task "${details.title || taskTitle}"`;
      case 'moved':
        return `${username} moved "${taskTitle}" to ${details.status}`;
      case 'assigned':
        return `${username} assigned "${taskTitle}" to ${details.assignedTo || 'someone'}`;
      case 'smart_assigned':
        return `${username} smart assigned "${taskTitle}" to ${details.assignedTo} (${details.activeTasks} active tasks)`;
      default:
        return `${username} performed an action on "${taskTitle}"`;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-end z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white h-full w-96 shadow-2xl overflow-hidden"
          >
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Activity size={24} />
                  <h2 className="text-xl font-bold">Activity Feed</h2>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg"
                >
                  <X size={20} />
                </motion.button>
              </div>
              <p className="text-sm opacity-90 mt-1">Last 20 activities</p>
            </div>

            <div className="p-4 h-full overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  <Activity size={48} className="mx-auto mb-4 text-gray-400" />
                  <p>No activities yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity, index) => (
                    <motion.div
                      key={activity._id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex-shrink-0 mt-1">
                        {getActionIcon(activity.action)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 leading-relaxed">
                          {getActionText(activity)}
                        </p>
                        <div className="flex items-center space-x-1 mt-2 text-xs text-gray-500">
                          <Clock size={12} />
                          <span>{formatTime(activity.timestamp)}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ActivityPanel;