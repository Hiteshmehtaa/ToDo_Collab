import React from 'react';
import { motion } from 'framer-motion';
import { useDrop } from 'react-dnd';
import { useTheme } from '../context/ThemeContext';
import TaskCard from './TaskCard';

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
}

interface ColumnProps {
  title: string;
  tasks: Task[];
  onDrop: (taskId: string, newStatus: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onSmartAssign: (taskId: string) => void;
}

const Column: React.FC<ColumnProps> = ({ title, tasks, onDrop, onEditTask, onDeleteTask, onSmartAssign }) => {
  const { isDark } = useTheme();
  
  const [{ isOver }, drop] = useDrop({
    accept: 'task',
    drop: (item: { id: string; status: string }) => {
      if (item.status !== title) {
        onDrop(item.id, title);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const getColumnColor = (title: string) => {
    switch (title) {
      case 'Todo': return isDark ? 'from-emerald-500 to-teal-600' : 'from-teal-500 to-emerald-600';
      case 'In Progress': return isDark ? 'from-cyan-500 to-blue-500' : 'from-cyan-500 to-sky-500';
      case 'Done': return isDark ? 'from-green-500 to-emerald-600' : 'from-emerald-500 to-green-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <motion.div
      ref={drop}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${
        isDark 
          ? 'bg-slate-800/60 border-slate-700/50' 
          : 'bg-white/60 border-gray-200/50'
      } backdrop-blur-sm rounded-2xl p-5 min-h-96 transition-all duration-300 border shadow-lg ${
        isOver 
          ? isDark 
            ? 'bg-slate-700/80 ring-2 ring-teal-400 ring-opacity-50 shadow-2xl scale-105' 
            : 'bg-blue-50/80 ring-2 ring-blue-400 ring-opacity-50 shadow-2xl scale-105'
          : 'hover:shadow-xl'
      }`}
    >
      <motion.div 
        whileHover={{ scale: 1.02 }}
        className={`bg-gradient-to-r ${getColumnColor(title)} text-white p-5 rounded-2xl mb-6 text-center shadow-lg`}
      >
        <h2 className="font-bold text-xl">{title}</h2>
        <div className="flex items-center justify-center space-x-2 mt-2">
          <span className="text-sm opacity-90">{tasks.length}</span>
          <span className="text-xs opacity-75">{tasks.length === 1 ? 'task' : 'tasks'}</span>
        </div>
      </motion.div>

      <div className={`space-y-4 max-h-96 overflow-y-auto scrollbar-thin ${
        isDark 
          ? 'scrollbar-thumb-slate-600 scrollbar-track-transparent' 
          : 'scrollbar-thumb-gray-300 scrollbar-track-transparent'
      }`}>
        {tasks.map((task) => (
          <TaskCard
            key={task._id}
            task={task}
            onEdit={onEditTask}
            onDelete={onDeleteTask}
            onSmartAssign={onSmartAssign}
          />
        ))}
      </div>

      {isOver && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`border-2 border-dashed ${
            isDark 
              ? 'border-teal-400 text-teal-400 bg-gradient-to-br from-teal-900/20 to-emerald-900/20' 
              : 'border-blue-400 text-blue-600 bg-gradient-to-br from-blue-50/80 to-indigo-50/80'
          } rounded-2xl p-8 text-center mt-4 backdrop-blur-sm`}
        >
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <div className="text-lg font-bold">Drop task here</div>
            <div className="text-sm opacity-75 mt-1">Release to move to {title}</div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Column;