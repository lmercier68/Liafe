import React, { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Maximize2, Minimize2, Link, Unlink, Calendar, Clock, Trash2 } from 'lucide-react';
import { useCardStore, CARD_COLORS } from '../store/cardStore';
import { ColorPicker } from './ColorPicker';
import { useI18n } from '../i18n/useTranslation';

const STATUS_OPTIONS = [
  { value: 'todo', labelKey: 'cards.status.todo', className: 'bg-yellow-100 text-yellow-800' },
  { value: 'in-progress', labelKey: 'cards.status.inProgress', className: 'bg-blue-100 text-blue-800' },
  { value: 'done', labelKey: 'cards.status.done', className: 'bg-green-100 text-green-800' },
] as const;

interface CardProps {
  id: string;
  title: string;
  content: string;
  isExpanded: boolean;
  isConnecting: boolean;
  color: string;
  dueDate: string | null;
  status: 'todo' | 'in-progress' | 'done' | null;
  incomingConnections: Array<{ start: string; end: string }>;
  onConnect: () => void;
}

export function Card({
  id,
  title,
  content,
  isExpanded,
  isConnecting,
  color,
  dueDate,
  status,
  incomingConnections,
  onConnect
}: CardProps) {
  const { t } = useI18n();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [localTitle, setLocalTitle] = useState(title);
  const [localContent, setLocalContent] = useState(content);
  const [localDueDate, setLocalDueDate] = useState(dueDate || '');
  const [localStatus, setLocalStatus] = useState(status || 'todo');
  const updateCard = useCardStore((state) => state.updateCard);
  const deleteCard = useCardStore((state) => state.deleteCard);
  const deleteConnection = useCardStore((state) => state.deleteConnection);
  const toggleCardExpansion = useCardStore((state) => state.toggleCardExpansion);

  const handleSave = () => {
    updateCard(id, {
      title: localTitle,
      content: localContent,
      dueDate: localDueDate || null,
      status: localStatus,
    });
    setIsEditing(false);
  };

  const handleColorChange = (newColor: string) => {
    updateCard(id, { color: newColor });
  };

  const style = transform
    ? {
        transform: `translate3d(${Math.round(transform.x)}px, ${Math.round(transform.y)}px, 0)`,
        zIndex: isDragging ? 1000 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`absolute transition-all duration-200 border ${
        CARD_COLORS[color as keyof typeof CARD_COLORS]
      } ${isExpanded ? 'w-96 h-80' : 'w-96 h-24'} ${
        isConnecting ? 'ring-2 ring-indigo-500' : ''
      } rounded-lg shadow-lg`}
      id={id}
    >
      <div className="p-4 h-full flex flex-col">
        <div className="flex justify-between items-center mb-2">
          {isEditing ? (
            <div className="flex-1 flex items-center gap-2">
              <input
                type="text"
                value={localTitle}
                onChange={(e) => setLocalTitle(e.target.value)}
                className="text-lg font-semibold flex-1 mr-2 px-2 py-1 border rounded bg-white"
                autoFocus
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center gap-2">
              <h3 className="text-lg font-semibold">{title}</h3>
            </div>
          )}
          <div className="flex gap-2">
            <ColorPicker onColorSelect={handleColorChange} currentColor={color} />
            <button
              onClick={onConnect}
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
                title={t('cards.removeConnection')}
              >
                <Unlink size={18} />
              </button>
            )}
            <button
              onClick={() => deleteCard(id)}
              className="p-1 hover:bg-red-100 text-red-600 rounded"
              title={t('common.delete')}
            >
              <Trash2 size={18} />
            </button>
            <button
              onClick={() => toggleCardExpansion(id)}
              className="p-1 hover:bg-gray-100 rounded"
              title={isExpanded ? t('cards.minimize') : t('cards.maximize')}
            >
              {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
          </div>
        </div>
        {isEditing ? (
          <>
            <textarea
              value={localContent}
              onChange={(e) => setLocalContent(e.target.value)}
              className="flex-1 px-2 py-1 border rounded resize-none mb-4 bg-white min-h-[120px]"
            />
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-gray-500" />
                <input
                  type="datetime-local"
                  value={localDueDate}
                  onChange={(e) => setLocalDueDate(e.target.value)}
                  className="flex-1 px-2 py-1 border rounded bg-white text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-gray-500" />
                <select
                  value={localStatus}
                  onChange={(e) => setLocalStatus(e.target.value as typeof localStatus)}
                  className="flex-1 px-2 py-1 border rounded bg-white text-sm"
                >
                  {STATUS_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {t(option.labelKey)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 text-gray-700"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSave}
                className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                {t('common.save')}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex-1 overflow-auto space-y-2">
              <p>{content}</p>
            </div>
            {(dueDate || status) && (
              <div className="border-t pt-2 mt-2 space-y-1.5 flex-shrink-0">
                {dueDate && (
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Calendar size={14} />
                    <span>{new Date(dueDate).toLocaleString()}</span>
                  </div>
                )}
                {status && (
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} className="text-gray-500" />
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      STATUS_OPTIONS.find(opt => opt.value === status)?.className
                    }`}>
                      {t(STATUS_OPTIONS.find(opt => opt.value === status)?.labelKey || '')}
                    </span>
                  </div>
                )}
                </div>
            )}
            {isExpanded&&
            <button
              onClick={() => setIsEditing(true)}
              className="self-end px-3 py-1 text-sm bg-white bg-opacity-50 rounded hover:bg-opacity-100 mt-2"
            >
              {t('common.edit')}
            </button>}
          </>
        )}
      </div>
    </div>
  );
}