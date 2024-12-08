import React from 'react';
import { formatDate } from '../utils/date';

interface CardSet {
  id: string;
  name: string;
  created_at: number;
}

interface LoadDialogProps {
  sets: CardSet[];
  onLoad: (setId: string) => void;
  onCancel: () => void;
}

export function LoadDialog({ sets, onLoad, onCancel }: LoadDialogProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        className="bg-white rounded-lg p-6 w-[32rem] max-h-[80vh] flex flex-col"
        tabIndex={-1}
      >
        <h3 className="text-lg font-semibold mb-4">Load Card Set</h3>
        <div className="flex-1 overflow-auto">
          {sets.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No saved card sets found</p>
          ) : (
            <div className="space-y-2">
              {sets.map((set) => (
                <button
                  key={set.id}
                  onClick={() => onLoad(set.id)}
                  className="w-full text-left p-3 rounded hover:bg-gray-50 border flex justify-between items-center group"
                >
                  <div>
                    <h4 className="font-medium group-hover:text-indigo-600">{set.name}</h4>
                    <p className="text-sm text-gray-500">
                      Created {formatDate(set.created_at)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}