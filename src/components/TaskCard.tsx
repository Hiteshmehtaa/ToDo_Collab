import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useDrag } from 'react-dnd';
import { useTheme } from '../context/ThemeContext';
import { Edit3, Trash2, User, Clock, AlertCircle, Zap } from 'lucide-react';

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

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onSmartAssign: (taskId: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onDelete, onSmartAssign }) => {
  const { isDark } = useTheme();
  
  const [{ isDragging }, drag] = useDrag({
    type: 'task',
    item: { id: task._id, status: task.status },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return isDark ? 'text-red-400 bg-red-900/30 border-red-700/50' : 'text-red-600 bg-red-100 border-red-200';
      case 'Medium': return isDark ? 'text-yellow-400 bg-yellow-900/30 border-yellow-700/50' : 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'Low': return isDark ? 'text-green-400 bg-green-900/30 border-green-700/50' : 'text-green-600 bg-green-100 border-green-200';
      default: return isDark ? 'text-gray-400 bg-gray-800/30 border-gray-700/50' : 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'High': return <AlertCircle size={14} />;
      case 'Medium': return <Clock size={14} />;
      case 'Low': return <Clock size={14} />;
      default: return <Clock size={14} />;
    }
  };

  return (
    <motion.div
      ref={drag}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className={`${
        isDark 
          ? 'bg-slate-800/90 border-slate-700/50 hover:border-slate-600' 
          : 'bg-white border-gray-100 hover:border-gray-300'
      } rounded-xl shadow-md border p-4 cursor-move transition-all duration-200 ${
        isDragging ? 'opacity-50 scale-95 rotate-3' : 'hover:shadow-2xl'
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className={`font-bold text-base line-clamp-2 flex-1 mr-2 ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>{task.title}</h3>
        <div className="flex space-x-1">
          <motion.button
            whileHover={{ scale: 1.2, rotate: 15 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onSmartAssign(task._id)}
            className={`p-2 ${
              isDark 
                ? 'text-purple-400 hover:bg-purple-900/30' 
                : 'text-purple-600 hover:bg-purple-100'
            } rounded-xl transition-all duration-200 hover:shadow-md`}
            title="Smart Assign"
          >
            <Zap size={16} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.2, rotate: 15 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onEdit(task)}
            className={`p-2 ${
              isDark 
                ? 'text-blue-400 hover:bg-blue-900/30' 
                : 'text-blue-600 hover:bg-blue-100'
            } rounded-xl transition-all duration-200 hover:shadow-md`}
          >
            <Edit3 size={16} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.2, rotate: 15 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onDelete(task._id)}
            className={`p-2 ${
              isDark 
                ? 'text-red-400 hover:bg-red-900/30' 
                : 'text-red-600 hover:bg-red-100'
            } rounded-xl transition-all duration-200 hover:shadow-md`}
          >
            <Trash2 size={16} />
          </motion.button>
        </div>
      </div>

      {task.description && (
        <p className={`text-sm mb-4 line-clamp-3 leading-relaxed p-3 rounded-lg ${
          isDark 
            ? 'text-gray-300 bg-slate-700/50' 
            : 'text-gray-600 bg-gray-50'
        }`}>{task.description}</p>
      )}

      <div className="flex justify-between items-center">
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className={`flex items-center space-x-1 px-3 py-2 rounded-full text-xs font-bold shadow-sm border ${getPriorityColor(task.priority)}`}
        >
          {getPriorityIcon(task.priority)}
          <span>{task.priority}</span>
        </motion.div>

        <div className="flex items-center space-x-2">
          {task.assignedTo && (
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className={`flex items-center space-x-1 text-xs px-3 py-1.5 rounded-full shadow-sm ${
                isDark 
                  ? 'text-gray-300 bg-slate-700/50' 
                  : 'text-gray-600 bg-gray-100'
              }`}
            >
              <User size={12} />
              <span className="max-w-16 truncate">{task.assignedTo.username}</span>
            </motion.div>
          )}
          <motion.div 
            whileHover={{ scale: 1.1 }}
            className="w-9 h-9 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-full flex items-center justify-center shadow-md"
          >
            <span className="text-white text-sm font-bold">
              {task.createdBy.username.charAt(0).toUpperCase()}
            </span>
          </motion.div>
        </div>
      </div>

      <div className={`text-xs mt-4 pt-3 border-t ${
        isDark 
          ? 'text-gray-500 border-slate-700' 
          : 'text-gray-400 border-gray-200'
      }`}>
        <div className="flex justify-between items-center">
          <span>Created {new Date(task.createdAt).toLocaleDateString()}</span>
          {task.statusHistory && task.statusHistory.length > 1 && (
            <span className={`font-medium ${isDark ? 'text-teal-400' : 'text-blue-600'}`}>
              {task.statusHistory.length} status changes
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default TaskCard;