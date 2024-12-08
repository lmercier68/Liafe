import React, { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Maximize2, Minimize2, Link, Unlink, Trash2 } from 'lucide-react';
import { useCardStore, CARD_COLORS } from '../store/cardStore';
import { ColorPicker } from './ColorPicker';
import { useI18n } from '../i18n/useTranslation';

interface ImageCardProps {
  id: string;
  title: string;
  content: string;
  isExpanded: boolean;
  isConnecting: boolean;
  color: string;
  imageData?: string;
  mimeType?: string;
  incomingConnections: Array<{ start: string; end: string }>;
  onConnect: () => void;
}

export function ImageCard({
  id,
  title,
  content,
  isExpanded,
  isConnecting,
  color,
  imageData,
  mimeType,
  incomingConnections,
  onConnect
}: ImageCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  const [isEditing, setIsEditing] = useState(false);
  const [localTitle, setLocalTitle] = useState(title);
  const [localImageData, setLocalImageData] = useState<string | undefined>(imageData);
  const [localMimeType, setLocalMimeType] = useState<string | undefined>(mimeType);
  const { t } = useI18n();

  const updateCard = useCardStore((state) => state.updateCard);
  const deleteCard = useCardStore((state) => state.deleteCard);
  const deleteConnection = useCardStore((state) => state.deleteConnection);
  const toggleCardExpansion = useCardStore((state) => state.toggleCardExpansion);

  const handleSave = () => {
    updateCard(id, {
      title: localTitle
    });
    setIsEditing(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Image size must be less than 10MB');
      return;
    }
    
    const processImage = (file: File) => {
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const base64Data = (reader.result as string).split(',')[1];
        const img = new Image();
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          let width = img.width;
          let height = img.height;
          
          const MAX_WIDTH = 1920;
          const MAX_HEIGHT = 1080;
          
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
          
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          ctx?.drawImage(img, 0, 0, width, height);
          const compressedData = canvas.toDataURL('image/jpeg', 0.8);
          const base64 = compressedData.split(',')[1];
          
          setLocalImageData(base64);
          setLocalMimeType('image/jpeg');
          updateCard(id, { imageData: base64, mimeType: 'image/jpeg' });
        };
        
        img.src = `data:${file.type};base64,${base64Data}`;
      };
      
      reader.onerror = () => {
        alert('Failed to read image file');
      };
      
      reader.readAsDataURL(file);
    };
    
    processImage(file);
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
      } ${isExpanded ? 'w-96 h-80' : 'w-96 h-24'} ${
        isConnecting ? 'ring-2 ring-indigo-500' : ''
      } rounded-lg shadow-lg overflow-hidden`}
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
            <button
              onClick={onConnect}
              className={`p-1 hover:bg-gray-100 rounded ${
                isConnecting ? 'bg-indigo-100 text-indigo-600' : ''
              }`}
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
            )}
            <button
              onClick={() => deleteCard(id)}
              className="p-1 hover:bg-red-100 text-red-600 rounded"
            >
              <Trash2 size={18} />
            </button>
            <button
              onClick={() => toggleCardExpansion(id)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden relative">
          {localImageData ? (
            <img
              src={`data:${localMimeType};base64,${localImageData}`}
              alt={title}
              className={`w-full h-full object-contain ${isExpanded ? '' : 'object-cover'}`}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <label className="cursor-pointer px-4 py-2 bg-violet-100 text-violet-700 rounded-lg hover:bg-violet-200 transition-colors">
                Upload Image
                <input
                  type="file"
                  accept="image/*"
                  onClick={(e) => e.stopPropagation()}
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </label>
            </div>
          )}
        </div>

        {isEditing && (
          <div className="mt-2 flex justify-between">
            <label className="cursor-pointer px-3 py-1 text-sm bg-violet-100 text-violet-700 rounded hover:bg-violet-200 transition-colors">
              Change Image
              <input
                type="file"
                accept="image/*"
                onClick={(e) => e.stopPropagation()}
                className="hidden"
                onChange={handleFileSelect}
              />
            </label>
            <button
              onClick={handleSave}
              className="px-3 py-1 text-sm bg-violet-600 text-white rounded hover:bg-violet-700"
            >
              {t('common.save')}
            </button>
          </div>
        )}
        
        {!isEditing && isExpanded && (
          <button
            onClick={() => setIsEditing(true)}
            className="self-end mt-2 px-3 py-1 text-sm bg-white bg-opacity-50 rounded hover:bg-opacity-100"
          >
            {t('common.edit')}
          </button>
        )}
      </div>
    </div>
  );
}