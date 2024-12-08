import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Minimize2, Maximize2, Link, Unlink, Trash2 } from 'lucide-react';
import { Group } from '../store/cardStore';
import { useCardStore } from '../store/cardStore';

interface GroupOverlayProps {
  group: Group;
  onMove: (deltaX: number, deltaY: number) => void;
  isConnecting: boolean;
  onConnect: () => void;
  hasIncomingConnections: boolean;
  onDeleteConnection: () => void;
}

export function GroupOverlay({ 
  group, 
  onMove, 
  isConnecting, 
  onConnect,
  hasIncomingConnections,
  onDeleteConnection 
}: GroupOverlayProps) {
  const toggleGroupMinimized = useCardStore((state) => state.toggleGroupMinimized);
  const deleteGroup = useCardStore((state) => state.deleteGroup);
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `group-${group.id}`,
  });

  const handleDeleteGroup = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this group? The cards within the group will be preserved.')) {
      deleteGroup(group.id, false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`absolute border-2 border-dashed border-indigo-500 cursor-move group transition-all duration-300 ${
        isConnecting ? 'ring-2 ring-indigo-500' : ''
      } ${
        group.isMinimized ? 'bg-indigo-100 bg-opacity-20' : 'bg-indigo-50 bg-opacity-10'
      }`}
      id={`group-${group.id}`}
      style={{
    left: group.bounds.x,
    top: group.bounds.y,
    width: group.bounds.width,
    height: group.bounds.height
      }}
    >
      <div className="absolute -top-6 left-2 flex items-center gap-2 z-10">
        <div className="bg-indigo-100 px-2 py-0.5 rounded text-sm font-medium text-indigo-700 shadow-sm">
          {group.name}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onConnect();
          }}
          className={`p-1 bg-indigo-100 rounded hover:bg-indigo-200 transition-colors ${
            isConnecting ? 'bg-indigo-200 text-indigo-600' : ''
          }`}
          title="Connect groups"
        >
          <Link size={14} />
        </button>
        {hasIncomingConnections && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteConnection();
            }}
            className="p-1 bg-red-100 rounded hover:bg-red-200 transition-colors text-red-600"
            title="Remove connection"
          >
            <Unlink size={14} />
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleGroupMinimized(group.id);
          }}
          className="p-1 bg-indigo-100 rounded hover:bg-indigo-200 transition-colors"
          title={group.isMinimized ? "Maximize group" : "Minimize group"}
        >
          {group.isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
        </button>
        <button
          onClick={handleDeleteGroup}
          className="p-1 bg-red-100 rounded hover:bg-red-200 transition-colors text-red-600"
          title="Delete group"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}