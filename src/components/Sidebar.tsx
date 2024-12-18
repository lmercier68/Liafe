import React, { useState } from 'react';
import { Plus, Save, FolderOpen, FileText, Users, Group, Wallet, Settings, Image, MapPin, Map, Navigation, FilePen, NotepadText, ListTodo } from 'lucide-react';
import { useCardStore } from '../store/cardStore';
import { DocumentDialog } from './DocumentDialog';
import { SaveDialog } from './SaveDialog';
import { LoadDialog } from './LoadDialog';
import { ContactDialog } from './ContactDialog';
import { useI18n } from '../i18n/useTranslation';
import { SettingsDialog } from './SettingsDialog';

interface SidebarProps {
  disabled?: boolean;
  isGroupCreationMode: boolean;
  onToggleGroupCreation: () => void;
}

export function Sidebar({ disabled, isGroupCreationMode, onToggleGroupCreation }: SidebarProps) {
  const { t } = useI18n();
  const { addCard, saveToDb, loadFromDb, loadSets } = useCardStore();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [showDocumentDialog, setShowDocumentDialog] = useState(false);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [showBudgetTypeDialog, setShowBudgetTypeDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showLocationMenu, setShowLocationMenu] = useState(false);
  const [showNotesMenu, setShowNotesMenu] = useState(false);
  const [sets, setSets] = useState<Array<{ id: string; name: string; created_at: number; }>>([]);

  const handleAddDocument = async (displayName: string, filePath: string, comment: string) => {
    try {
      if (!useCardStore.getState().currentSetId) {
        alert('Please save your card set first before adding documents.');
        setShowDocumentDialog(false);
        return;
      }

      const response = await fetch('http://localhost:3000/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          setId: useCardStore.getState().currentSetId,
          displayName,
          filePath,
          comment,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save document');
      }

      const data = await response.json();
      if (data.success) {
        // Create a new card for the document
        const id = crypto.randomUUID();
        addCard({
          id,
          title: `📄 ${displayName}`,
          content: `File: ${filePath}\nAdded: ${new Date().toLocaleString()}${
            comment ? `\n\nComment: ${comment}` : ''
          }`,
          tasks:[],
          position: {
            x: Math.random() * (window.innerWidth - 400) + 200,
            y: Math.random() * (window.innerHeight - 300) + 100,
          },
          color: 'emerald',
          isExpanded: false,
          dueDate: new Date().toISOString(),
          status: null,
        });
        setShowDocumentDialog(false);
      }
    } catch (error) {
      console.error('Failed to add document:', error);
      alert('Failed to add document. Please try again.');
    }
  };

  const handleAddCard = () => {
    const id = crypto.randomUUID();
    addCard({
      id,
      title: t('cards.newCard'),
      content: t('cards.addContent'),
      tasks:[],
      position: {
        x: Math.random() * (window.innerWidth - 400) + 200,
        y: Math.random() * (window.innerHeight - 300) + 100,
      },
      color: 'slate',
      cardType: 'standard',
      isExpanded: false,
      dueDate: null,
      status: 'todo',
    });
  };

  const handleAddImageCard = () => {
    const id = crypto.randomUUID();
    addCard({
      id,
      title: t('cards.imageCard'),
      content: '',
      tasks:[],
      position: {
        x: Math.random() * (window.innerWidth - 400) + 200,
        y: Math.random() * (window.innerHeight - 300) + 100,
      },
      color: 'violet',
      cardType: 'image',
      isExpanded: true,
      dueDate: null,
      status: null,
    });
  };

  const handleAddBudgetCard = (type: 'total-available' | 'expenses-tracking') => {
    const id = crypto.randomUUID();
    addCard({
      id,
      title: type === 'total-available' ? t('budget.overview') : t('budget.expenseTracker'),
      content: '',
      tasks:[],
      position: {
        x: Math.random() * (window.innerWidth - 400) + 200,
        y: Math.random() * (window.innerHeight - 300) + 100,
      },
      color: 'emerald',
      cardType: 'budget',
      isExpanded: true,
      dueDate: null,
      status: null,
      budgetType: type,
      budgetData: {
        totalAmount: 0,
        availableAmount: 0,
        expenses: []
      }
    });
    setShowBudgetTypeDialog(false);
  };
  
  const handleAddLocationCard = () => {
    const id = crypto.randomUUID();
    addCard({
      id,
      title: t('sidebar.locationCard'),
      content: '',
      position: {
        x: Math.random() * (window.innerWidth - 400) + 200,
        y: Math.random() * (window.innerHeight - 300) + 100,
      },
      color: 'sky',
      tasks:[],
      cardType: 'location',
      isExpanded: true,
      dueDate: null,
      status: null,
      locationData: {
        streetNumber: '',
        street: '',
        postalCode: '',
        city: '',
        country: ''
      }
    });
    setShowLocationMenu(false);
  };

  const handleAddItineraireCard = () => {
    const id = crypto.randomUUID();
    addCard({
      id,
      title: t('itineraire.routeCard'),
      content: '',
      tasks:[],
      position: {
        x: Math.random() * (window.innerWidth - 400) + 200,
        y: Math.random() * (window.innerHeight - 300) + 100,
      },
      color: 'sky',
      cardType: 'itineraire',
      isExpanded: true,
      dueDate: null,
      status: null,
      itineraireData: {
        start: { address: '' },
        end: { address: '' }
      }
    });
    setShowLocationMenu(false);
  };
  const handleAddNoteCard = () => {
    const id = crypto.randomUUID();
    addCard({
      id,
      title: t('cards.noteCard'),
      content: '',
      tasks:[],
      position: {
        x: Math.random() * (window.innerWidth - 400) + 200,
        y: Math.random() * (window.innerHeight - 300) + 100,
      },
      color: 'white',
      cardType: 'note',
      isExpanded: true,
      dueDate: null,
      status: null,
    });
    setShowNotesMenu(false);
  };

  const handleAddChecklistCard = () => {
    const id = crypto.randomUUID();
    addCard({
      id,
      title: t('cards.checklistCard'),
      content: '',
      tasks:[],
      position: {
        x: Math.random() * (window.innerWidth - 400) + 200,
        y: Math.random() * (window.innerHeight - 300) + 100,
      },
      color: 'white',
      cardType: 'checklist',
      isExpanded: true,
      dueDate: null,
      status: null,
    });
    setShowNotesMenu(false);
  };
  const handleSave = async (name: string) => {
    try {
      console.log('Sidebar: handleSave called with name:', name);
      await saveToDb(name);
      const currentSetId = useCardStore.getState().currentSetId;
      console.log('Set saved with ID:', currentSetId);
      setShowSaveDialog(false);
      alert('Card set saved successfully!');
    } catch (error) {
      console.error('Failed to save cards:', error);
      console.error('Error details:', error);
      alert('Failed to save card set. Please try again.');
    }
  };

  const handleShowLoad = async () => {
    try {
      const loadedSets = await loadSets();
      setSets(loadedSets);
      setShowLoadDialog(true);
    } catch (error) {
      console.error('Failed to load sets:', error);
      alert('Failed to load card sets. Please try again.');
    }
  };

  const handleLoad = async (setId: string) => {
    try {
      await loadFromDb(setId);
      setShowLoadDialog(false);
    } catch (error) {
      console.error('Failed to load set:', error);
      alert('Failed to load card set. Please try again.');
    }
  };

  return (
    <>
      <div className="fixed left-0 top-0 h-full w-16 bg-gray-900 flex flex-col items-center py-4 gap-4 shadow-lg z-[1000]">
        <button
          onClick={handleAddCard}
          className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center text-white hover:bg-indigo-700 transition-colors duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed relative group"
          disabled={disabled}

        >
          <Plus size={24} />
          <span className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">
          {t('sidebar.addCard')}
          </span>
        </button>
        <button
          onClick={() => setShowDocumentDialog(true)}
          className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center text-white hover:bg-purple-700 transition-colors duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed relative group"
          disabled={disabled}

        >
          <FileText size={24} />
          <span className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">
          {t('sidebar.addDocument')}
          </span>
        </button>
        <button
          onClick={handleAddImageCard}
          className="w-12 h-12 bg-violet-600 rounded-lg flex items-center justify-center text-white hover:bg-violet-700 transition-colors duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed relative group"
          disabled={disabled}
 
        >
          <Image size={24} />
          <span className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">
          {t('sidebar.addImage')}
          </span>
        </button>
        <button
          className="w-12 h-12 rounded-lg flex items-center justify-center text-white transition-colors duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed relative group"
          onClick={() => setShowNotesMenu(!showNotesMenu)}
          disabled={disabled}
          style={{ backgroundColor: '#E615D7'}}
        >
          <FilePen size={24} />
          <span className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">
            {t('sidebar.notes')}
          </span>
        </button>
        {showNotesMenu && (
          <div className="fixed left-14 ml-2 bg-gray-900 rounded-lg shadow-xl p-2 flex gap-2 items-center" style={{ top: `${3* 4 + 1}rem` }}>
            <button
              className="p-2 hover:bg-gray-800 rounded-lg group relative flex items-center justify-center"
              onClick={handleAddNoteCard}
            >
              <NotepadText size={24} className="text-white" />
              <span className="absolute top-full mt-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">
                {t('sidebar.noteCard')}
              </span>
            </button>
            <button
              className="p-2 hover:bg-gray-800 rounded-lg group relative flex items-center justify-center"
              onClick={handleAddChecklistCard}
            >
              <ListTodo size={24} className="text-white" />
              <span className="absolute top-full mt-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">
                {t('sidebar.checklistCard')}
              </span>
            </button>
          </div>
        )}
        <button
                  className="w-12 h-12 bg-rose-600 rounded-lg flex items-center justify-center text-white hover:bg-rose-700 transition-colors duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed relative group"
          onClick={() => setShowContactDialog(true)}
          disabled={disabled}
    
        >
          <Users size={24} />
          <span className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">
          {t('sidebar.addContact')}
          </span>
        </button>
        <button
           className="w-12 h-12 bg-emerald-600 rounded-lg flex items-center justify-center text-white hover:bg-emerald-700 transition-colors duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed relative group"
          onClick={() => setShowBudgetTypeDialog(true)}
          disabled={disabled}
        
        >
          <Wallet size={24} />
          <span className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">
          {t('sidebar.addBudget')}
          </span>
        </button>
        <button
          className="w-12 h-12 bg-sky-600 rounded-lg flex items-center justify-center text-white hover:bg-sky-700 transition-colors duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed relative group"
          onClick={() => setShowLocationMenu(!showLocationMenu)}
          disabled={disabled}
        >
          <MapPin size={24} />
          <span className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">
            {t('sidebar.location')}
          </span>
        </button>
        {showLocationMenu && (
          <div className="fixed left-14 ml-2 bg-gray-900 rounded-lg shadow-xl p-2 flex gap-2 items-center" style={{ top: `${6 * 4 + 1}rem` }}>
            <button
              className="p-2 hover:bg-gray-800 rounded-lg group relative flex items-center justify-center"
              onClick={handleAddLocationCard}
            >
              <Map size={24} className="text-white" />
              <span className="absolute top-full mt-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">
                {t('sidebar.locationCard')}
              </span>
            </button>
            <button
              className="p-2 hover:bg-gray-800 rounded-lg group relative flex items-center justify-center"
              onClick={handleAddItineraireCard}
            >
              <Navigation size={24} className="text-white" />
              <span className="absolute top-full mt-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">
                {t('itineraire.routeCard')}
              </span>
            </button>
          </div>
        )}
        <button
          onClick={onToggleGroupCreation}
          className={`w-12 h-12 rounded-lg flex items-center justify-center text-white transition-colors duration-200 shadow-lg ${
            isGroupCreationMode 
              ? 'bg-amber-600 hover:bg-amber-700' 
              : 'bg-amber-500 hover:bg-amber-600'
          } relative group`}
          disabled={disabled}
         
        >
          <Group size={24} />
          <span className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">
          {isGroupCreationMode ? t('sidebar.cancelGroup') : t('sidebar.createGroup')}
          </span>
        </button>
        <button
          onClick={() => setShowSaveDialog(true)}
          className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center text-white hover:bg-green-700 transition-colors duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed relative group"
          disabled={disabled}
      
        >
          <Save size={24} />
          <span className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">
          {t('sidebar.save')}
          </span>
        </button>
        <button
          onClick={handleShowLoad}
          className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white hover:bg-blue-700 transition-colors duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed relative group"
          disabled={disabled}
        
        >
          <FolderOpen size={24} />
          <span className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">
          {t('sidebar.load')}
          </span>
        </button>
        <button
          onClick={() => setShowSettingsDialog(true)}
          className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center text-white hover:bg-gray-700 transition-colors duration-200 shadow-lg relative group"
         
        >
          <Settings size={24} />
          <span className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">
          {t('sidebar.settings')}
          </span>
        </button>
      </div>

      {showSaveDialog && (
        <SaveDialog
          onSave={handleSave}
          onCancel={() => setShowSaveDialog(false)}
        />
      )}

      {showLoadDialog && (
        <LoadDialog
          sets={sets}
          onLoad={handleLoad}
          onCancel={() => setShowLoadDialog(false)}
        />
      )}
      {showDocumentDialog && (
        <DocumentDialog
          onSave={handleAddDocument}
          onCancel={() => setShowDocumentDialog(false)}
        />
      )}
      {showContactDialog && (
        <ContactDialog
          onClose={() => setShowContactDialog(false)}
        />
      )}
      {showBudgetTypeDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-80">
            <h3 className="text-lg font-semibold mb-4">{t('sidebar.budgetTypes.title')}</h3>
            <div className="space-y-3">
              <button
                onClick={() => handleAddBudgetCard('total-available')}
                className="w-full p-3 text-left bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200"
              >
                <h4 className="font-medium text-emerald-900">{t('sidebar.budgetTypes.overview.title')}</h4>
                <p className="text-sm text-emerald-600">{t('sidebar.budgetTypes.overview.description')}</p>
              </button>
              <button
                onClick={() => handleAddBudgetCard('expenses-tracking')}
                className="w-full p-3 text-left bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200"
              >
                <h4 className="font-medium text-emerald-900">{t('sidebar.budgetTypes.expenses.title')}</h4>
                <p className="text-sm text-emerald-600">{t('sidebar.budgetTypes.expenses.description')}</p>
              </button>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowBudgetTypeDialog(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded"
              >
              
              {t('common.cancel')}</button>
            </div>
          </div>
        </div>
      )}
      {showSettingsDialog && (
        <SettingsDialog onClose={() => setShowSettingsDialog(false)} />
      )}
    </>
  );
}