// store.js
import {create} from 'zustand';

const useStore = create((set) => ({
  connections: [], // Liste des connexions
  activeOutput: null, // Composant Output sélectionné

  setActiveOutput: (outputId) => set({ activeOutput: outputId }),

  addConnection: (inputId) =>
   
    set((state) => {
      if (state.activeOutput) {
        const newConnection = { from: state.activeOutput, to: inputId };
        return {
          connections: [...state.connections, newConnection],
          activeOutput: null, // Reset de l'output actif
        };
      }
      return state;
    }),
}));

export default useStore;
