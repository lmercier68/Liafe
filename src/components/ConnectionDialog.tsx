import React from 'react';
import { LINE_COLORS } from '../store/cardStore';
import { Check } from 'lucide-react';

interface ConnectionDialogProps {
  onConnect: (style: 'solid' | 'dashed', color: string) => void;
  onCancel: () => void;
}

export function ConnectionDialog({ onConnect, onCancel }: ConnectionDialogProps) {
  const [selectedStyle, setSelectedStyle] = React.useState<'solid' | 'dashed'>('solid');
  const [selectedColor, setSelectedColor] = React.useState<string>(Object.values(LINE_COLORS)[0]);

  const handleConnect = () => {
    onConnect(selectedStyle, selectedColor);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        className="bg-white rounded-lg p-6 w-80"
        tabIndex={-1}
      >
        <h3 className="text-lg font-semibold mb-4">Customize Connection</h3>
        
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
        
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleConnect}
            className="px-4 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Apply Connection
          </button>
        </div>
      </div>
    </div>
  );
}