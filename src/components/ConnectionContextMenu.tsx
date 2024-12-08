import React from 'react';
import { LINE_COLORS } from '../store/cardStore';
import { Check, Trash2 } from 'lucide-react';

interface ConnectionContextMenuProps {
  style: 'solid' | 'dashed';
  color: string;
  position: { x: number; y: number };
  onUpdate: (style: 'solid' | 'dashed', color: string) => void;
  onDelete: () => void;
  onClose: () => void;
}

export function ConnectionContextMenu({
  style: initialStyle,
  color: initialColor,
  position,
  onUpdate,
  onDelete,
  onClose
}: ConnectionContextMenuProps) {
  const [selectedStyle, setSelectedStyle] = React.useState<'solid' | 'dashed'>(initialStyle);
  const [selectedColor, setSelectedColor] = React.useState<string>(initialColor);

  const handleUpdate = () => {
    onUpdate(selectedStyle, selectedColor);
    onClose();
  };

  return (
    <div 
      className="fixed bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-80 z-50"
      style={{ 
        left: position.x, 
        top: position.y,
        transform: 'translate(-50%, -50%)' 
      }}
    >
      <h3 className="text-lg font-semibold mb-4">Edit Connection</h3>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <p className="font-medium">Line Style:</p>
          <div className="flex gap-4">
            <button
              onClick={() => setSelectedStyle('solid')}
              className={`flex-1 p-2 border rounded hover:bg-gray-50 ${
                selectedStyle === 'solid' ? 'border-indigo-500 bg-indigo-50' : ''
              }`}
            >
              Solid
            </button>
            <button
              onClick={() => setSelectedStyle('dashed')}
              className={`flex-1 p-2 border rounded hover:bg-gray-50 ${
                selectedStyle === 'dashed' ? 'border-indigo-500 bg-indigo-50' : ''
              }`}
            >
              Dashed
            </button>
          </div>
        </div>
        
        <div className="space-y-2">
          <p className="font-medium">Line Color:</p>
          <div className="grid grid-cols-5 gap-2">
            {Object.entries(LINE_COLORS).map(([name, color]) => (
              <button
                key={name}
                onClick={() => setSelectedColor(color)}
                className={`w-8 h-8 rounded-full border flex items-center justify-center ${
                  selectedColor === color ? 'ring-2 ring-offset-2 ring-indigo-500' : ''
                }`}
                style={{ backgroundColor: color }}
              >
                {selectedColor === color && <Check className="text-white" size={16} />}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="mt-6 flex justify-between">
        <button
          onClick={onDelete}
          className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded inline-flex items-center gap-2"
        >
          <Trash2 size={16} />
          Delete Connection
        </button>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            className="px-4 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
}