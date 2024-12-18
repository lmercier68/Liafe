import React, { useEffect, useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Maximize2, Minimize2, Link, Unlink, Trash2, Plus, Calendar } from 'lucide-react';
import { useCardStore, CARD_COLORS } from '../store/cardStore';

import { ColorPicker } from './ColorPicker';
import { Task } from './Task';
import { useI18n } from '../i18n/useTranslation';

interface CheckListCardProps {
  id: string;
  title: string;
  content: string;
  isExpanded: boolean;
  isConnecting: boolean;
  connectFrom: string |null;
  color: string;
  tasks?: Array<{
    id: string;
    name: string;
    dueDate?: string;
    isCompleted: boolean;
    completedDate?: string;
    cardId: string; // Ajout de l'ID de la carte parente
    isConnecting: boolean;
    connectingFrom: string | null;
    connectingTo:string |null;
    incomingConnections: Array<{ start: string; end: string }>;
  }>;
  incomingConnections: Array<{ start: string; end: string }>;
  onConnectTask: (taskId: string,cardId:string,taskName: string) => void;
  onConnect: () => void;
}

export function CheckListCard({
    id,
    title,
    content,
    isExpanded,
    isConnecting,
    connectFrom,
    color,
    tasks = [],
    incomingConnections,
    onConnectTask,
    onConnect
  
  }: CheckListCardProps) {
  const { t } = useI18n();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  const [isEditing, setIsEditing] = useState(false);
  const [localTitle, setLocalTitle] = useState(title);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskDate, setNewTaskDate] = useState<string>('');
  const [localTasks, setLocalTasks] = useState(tasks);
  const [forceUpdate, setForceUpdate] = useState(false); // État pour forcer le re-rendu
const [tasksConnections,setTasksConnections] =useState([]);

  const updateCard = useCardStore((state) => state.updateCard);
  const deleteCard = useCardStore((state) => state.deleteCard);
  const deleteConnection = useCardStore((state) => state.deleteConnection);
  const deleteTaskConnection = useCardStore((state) => state.deleteTaskConnection);
  const toggleCardExpansion = useCardStore((state) => state.toggleCardExpansion);
  const addTask = useCardStore((state) => state.addTask);
  const upDateTaskConnections =useCardStore((state)=> state.upDateTaskConnections);
  const upDateTasks =useCardStore((state)=> state.upDateTasks);
  const taskConnections= useCardStore((state)=>state.taskConnections)

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/tasks/${id}`);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        console.log('data fetch task', data.tasks)
        console.log('data fetch taskConnection', data.tasksConnections)
        if (Array.isArray(data.tasks)) {
          setLocalTasks(data.tasks);
          data.tasks.forEach(task => {
            const paramtCardId = task.card_id;
            const updatedTask = { ...task, cardId: paramtCardId };
            console.log('data fetch task Modified', updatedTask);
            upDateTasks(updatedTask);
            console.log('updated task in CL', updatedTask);
            setForceUpdate(prev => !prev); // Forcer le re-rendu
          });
        } else {
          console.error('data.tasks is not an array:', data.tasks);
        }
  setTasksConnections(data.tasksConnections);
    
  setForceUpdate(prev => !prev);
        console.log('localTasks :', localTasks);
      } catch (error) {
        console.error('Failed to fetch tasks:', error);
      }
    };
  
    fetchTasks();

  }, [forceUpdate]);

  useEffect(() => {
    if (Array.isArray(tasksConnections)) {
         
      tasksConnections.forEach(taskConnection => {
        console.log('taskConnection3 :', taskConnection);
        upDateTaskConnections(taskConnection);
      });
    } else {
      console.error('data.tasksConnections is not an array:', tasksConnections);
    }},[tasksConnections]);
  const handleSave = () => {
    updateCard(id, {
      title: localTitle,
      tasks: localTasks
    });
    setIsEditing(false);
  };

  const handleAddTask = () => {
    if (newTaskName.trim()) {
      const newTask = {
        id: crypto.randomUUID(),
        name: newTaskName.trim(),
        dueDate: newTaskDate || undefined,
        isCompleted: false,
        cardId: id,
        isConnecting: false,
        connectingFrom:null,
        connectingTo:null,
        incomingConnections:[]
      };
      
      const updatedTasks = [...localTasks, newTask];
      setLocalTasks(updatedTasks);
      updateCard(id, { tasks: updatedTasks });
      addTask(newTask);
      setNewTaskName('');
      setNewTaskDate('');
    }
  };

  const handleTaskUpdate = (taskId: string, updates: Partial<typeof localTasks[0]>) => {
    const updatedTasks = localTasks.map(task =>
      task.id === taskId
        ? { 
            ...task, 
            ...updates, 
            completedDate: updates.isCompleted ? new Date().toISOString() : undefined 
          }
        : task
    );
    setLocalTasks(updatedTasks);
    updateCard(id, { tasks: updatedTasks });
  };

  const handleTaskConnect = (taskId: string) => {
    const taskName = `${taskId}`;
    console.log('CheckListCard - handleTaskConnect:', {
      cardId: id,
      taskId,
      taskName,
      connectFrom
    });
    onConnectTask(taskId,id,taskName);

//    useCardStore.getState().startTaskConnection(connectionId);
  };
  const handleTaskConnectionDelete = (startId: string, taskId: string) => {
    console.log('(handleTaskConnectionDelete', {startId , taskId,incomingConnections,taskConnections})
    deleteTaskConnection(startId, `${taskId}`);
  };

   // Ne pas propager isConnecting à la tâche, utiliser une comparaison locale
   const isTaskConnecting = (taskId: string) => {
    const connectionId = `${taskId}`;
    console.log('CheckListCard - isTaskConnecting:', {
      taskId,
      connectionId,
      isConnecting: connectFrom === taskId,
      connectFrom
    });
    return connectionId === connectFrom;
  };

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDragging ? 1000 : 1,
    cursor: isDragging ? 'grabbing' : 'grab'
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`absolute transition-all duration-200 border ${
        CARD_COLORS[color as keyof typeof CARD_COLORS]
      } ${isExpanded ? 'w-96 min-h-[12rem] max-h-[80vh]' : 'w-96 h-24'} rounded-lg shadow-lg overflow-hidden`}
      onClick={(e) => e.stopPropagation()} // Empêcher la propagation des clics sur la carte
      id={id}
    >
      <div className="p-4 h-full flex flex-col">
        <div className="flex justify-between items-center mb-2">
          {isEditing ? (
            <input
              type="text"
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              className="flex-1 px-2 py-1 border rounded"
            />
          ) : (
            <h3 className="text-lg font-semibold">{title}</h3>
          )}
          <div className="flex gap-2">
            <ColorPicker onColorSelect={(color) => updateCard(id, { color })} currentColor={color} />
       {/*   <button
              onClick={()=>{onConnect()}}
              className={`p-1 hover:bg-gray-100 rounded ${
                isConnecting ? 'bg-indigo-100 text-indigo-600' : ''
              }`}
              title={t('cards.connect')}
            >
              <Link size={18} />
            </button>
            {incomingConnections.length > 0 && (
              <button
                onClick={() => deleteConnection(incomingConnections[0].start, id)}
                className="p-1 hover:bg-red-100 text-red-600 rounded"
              >
                <Unlink size={18} />
              </button>
            )}*/}
            <button
              onClick={() => deleteCard(id)}
              className="p-1 hover:bg-red-100 text-red-600 rounded"
            >
              <Trash2 size={18} />
            </button>
            {!isEditing && <button
              onClick={() => toggleCardExpansion(id)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>}
          </div>
        </div>

        {isExpanded && (
          <div className="flex-1 overflow-auto">
            {isEditing ? (
              <div className="space-y-3 mb-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    placeholder={t('checklist.enterTaskName')}
                    className="flex-1 px-2 py-1 border rounded text-sm"
                  />
                  <input
                    type="datetime-local"
                    value={newTaskDate}
                    onChange={(e) => setNewTaskDate(e.target.value)}
                    className="px-2 py-1 border rounded text-sm"
                  />
                  <button
                    onClick={handleAddTask}
                    disabled={!newTaskName.trim()}
                    className="p-1 bg-indigo-100 rounded hover:bg-indigo-200 disabled:opacity-50"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            ) : null}

<div className="space-y-2">
        {localTasks.map(task => (
          <Task
          id={task.id}
            key={task.id}
            task={task}
            cardId={id}
            connectFrom={connectFrom}
            connectingTo={'tt'}
            isConnecting={isTaskConnecting(task.id)}
            onUpdate={(updates) => handleTaskUpdate(task.id, updates)}
            onConnect={() => handleTaskConnect(task.id)}
            incomingConnections={taskConnections.filter(conn => 
              conn.end === `${task.id}`
            )}
            onDeleteConnection={(startId) => 
              handleTaskConnectionDelete(startId, task.id)
            }
          />
        ))}
      </div>
          </div>
        )}

        {isExpanded && (
          <button
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className="self-end mt-2 px-3 py-1 text-sm bg-white bg-opacity-50 rounded hover:bg-opacity-100"
          >
            {isEditing ? t('common.save') : t('common.edit')}
          </button>
        )}
      </div>
    </div>
  );
}
