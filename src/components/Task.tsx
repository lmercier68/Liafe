import React from 'react';
import { Link } from 'lucide-react';
import { useI18n } from '../i18n/useTranslation';

interface TaskProps {
  task: {
    id: string;
    name: string;
    dueDate?: string;
    isCompleted: boolean;
    completedDate?: string;
  };
  cardId: string; // Ajout de l'ID de la carte parente
  isConnecting: boolean;
  connectFrom:string;
  onUpdate: (updates: Partial<TaskProps['task']>) => void;
  onConnect: (taskID:string) => void;
  incomingConnections: Array<{ start: string; end: string }>;
  onDeleteConnection: (startId: string) => void;
}

export function Task({
  task,
  cardId,
  isConnecting,
  connectFrom,
  onUpdate,
  onConnect,
  incomingConnections,
  onDeleteConnection
}: TaskProps) {
  const { t } = useI18n();
  const isOverdue = task.dueDate && !task.isCompleted && new Date(task.dueDate) < new Date();
  const taskConnectionId = `${cardId}-task-${task.id}`;

  const handleConnectClick = (e: React.MouseEvent) => {
    console.log('handleConnectClick - Task.tsx');
    e.stopPropagation(); // Empêcher la propagation vers la carte parente
    onConnect(task.id);
  };

  console.log('Task - render:', {
    taskId: task.id,
    connectionId: taskConnectionId,
    isConnecting,
    incomingConnections,
    connectFrom
  });

  return (
    <div
      id={taskConnectionId}
        className={`p-2 bg-white rounded-lg shadow border relative ${
        isConnecting ? 'ring-2 ring-indigo-500' : ''
      }`}
     // onClick={(e) => e.stopPropagation()} // Empêcher la propagation des clics
    >
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={task.isCompleted}
          onChange={(e) => {
            e.stopPropagation();
            onUpdate({ isCompleted: e.target.checked });
          }}
          className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        <span className={`flex-1 ${task.isCompleted ? 'line-through text-gray-500' : ''}`}>
          {task.name}
        </span>
        <button
       
          className={`p-1 hover:bg-gray-100 rounded ${
            isConnecting ? 'bg-indigo-100 text-indigo-600' : ''
          }`}
        >
          <Link size={16}  onClick={handleConnectClick}/>
        </button>
      </div>

      {(task.dueDate || task.completedDate) && (
        <div className="mt-1 text-sm">
          {task.isCompleted ? (
            <span className="text-green-800">
              {t('checklist.completedOn')}: {new Date(task.completedDate!).toLocaleString()}
            </span>
          ) : task.dueDate && (
            <span className={isOverdue ? 'text-red-600' : 'text-orange-500'}>
              {t('checklist.dueBy')}: {new Date(task.dueDate).toLocaleString()}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
