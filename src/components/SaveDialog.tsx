import React, { useState, useEffect } from 'react';
import { useCardStore } from '../store/cardStore';

interface SaveDialogProps {
  onSave: (name: string) => void;
  onCancel: () => void;
}

export function SaveDialog({ onSave, onCancel }: SaveDialogProps) {
  const [name, setName] = useState('');
  const currentSetId = useCardStore((state) => state.currentSetId);
  const sets = useCardStore((state) => state.loadSets);

  useEffect(() => {
    const loadCurrentSetName = async () => {
      if (currentSetId) {
        const allSets = await sets();
        const currentSet = allSets.find(set => set.id === currentSetId);
        if (currentSet) {
          setName(currentSet.name);
        }
      }
    };
    loadCurrentSetName();
  }, [currentSetId, sets]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Save button clicked, name:', name);
    if (name.trim()) {
      console.log('Attempting to save with name:', name.trim());
      onSave(name.trim());
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div 
        className="bg-white rounded-lg p-6 w-96"
        tabIndex={-1}
      >
        <h3 className="text-lg font-semibold mb-4">Save Card Set</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Set Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              readOnly={!!currentSetId}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none z-50"
              placeholder="Enter a name for your card set"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              onClick={() => console.log('Save button clicked directly')}
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}