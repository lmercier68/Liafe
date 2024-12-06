import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Globe } from 'lucide-react';
import { CARD_COLORS } from '../store/cardStore';
import { useI18n } from '../i18n/useTranslation';
import ReactCountryFlag from "react-country-flag";


interface DbConfig {
  host: string;
  user: string;
  password: string;
  port: number;
}

interface ColorLegend {
  id: string;
  name: string;
  color_mappings: Record<string, string>;
  created_at: number;
}

interface SettingsDialogProps {
  onClose: () => void;
}

export function SettingsDialog({ onClose }: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<'database' | 'colors' | 'language'>('database');
  const { language, setLanguage } = useI18n();
  const { t } = useI18n();
  const [config, setConfig] = useState<DbConfig>({
    host: 'localhost',
    user: 'root',
    password: '',
    port: 3306
  });
  const [colorLegends, setColorLegends] = useState<ColorLegend[]>([]);
  const [selectedLegend, setSelectedLegend] = useState<ColorLegend | null>(null);
  const [newLegendName, setNewLegendName] = useState('');
  const [colorMappings, setColorMappings] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<'fr' | 'en' | 'es'>(language || 'fr');

  useEffect(() => {
    const savedConfig = localStorage.getItem('dbConfig');
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }
    
    // Load color legends
    fetchColorLegends();
  }, []);

  const fetchColorLegends = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/color-legends');
      if (response.ok) {
        const data = await response.json();
        setColorLegends(data);
      }
    } catch (error) {
      console.error('Failed to fetch color legends:', error);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      
      const response = await fetch('http://localhost:3000/api/db-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update database settings');
      }

      // Save to localStorage only after successful server update
      localStorage.setItem('dbConfig', JSON.stringify(config));
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update database settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveColorLegend = async () => {
    try {
      setIsSaving(true);
      setError(null);

      const endpoint = selectedLegend
        ? `http://localhost:3000/api/color-legends/${selectedLegend.id}`
        : 'http://localhost:3000/api/color-legends';
      
      const method = selectedLegend ? 'PUT' : 'POST';
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newLegendName,
          colorMappings
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save color legend');
      }

      await fetchColorLegends();
      setNewLegendName('');
      setColorMappings({});
      setSelectedLegend(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save color legend');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteLegend = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:3000/api/color-legends/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchColorLegends();
        if (selectedLegend?.id === id) {
          setSelectedLegend(null);
          setNewLegendName('');
          setColorMappings({});
        }
      }
    } catch (error) {
      console.error('Failed to delete color legend:', error);
    }
  };

  const handleLanguageChange = async (newLanguage: 'fr' | 'en' | 'es') => {
    try {
      setIsSaving(true);
      setError(null);
      setSelectedLanguage(newLanguage);
      
      const response = await fetch('http://localhost:3000/api/app-params/language', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ language: newLanguage })
      });

      if (!response.ok) {
        throw new Error(t('settings.errors.languageUpdateFailed'));
      }

      setLanguage(newLanguage);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('settings.errors.languageUpdateFailed'));
      setSelectedLanguage(language); // Revert on error
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1001]">
      <div className="bg-white rounded-xl shadow-2xl w-[32rem] p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">{t('settings.title')}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-6 border-b">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('database')}
              className={`px-4 py-2 -mb-px ${
                activeTab === 'database'
                  ? 'border-b-2 border-indigo-500 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >{t('settings.database')}</button>
            <button
              onClick={() => setActiveTab('colors')}
              className={`px-4 py-2 -mb-px ${
                activeTab === 'colors'
                  ? 'border-b-2 border-indigo-500 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >{t('settings.colorLegend')}</button>
            <button
              onClick={() => setActiveTab('language')}
              className={`px-4 py-2 -mb-px ${
                activeTab === 'language'
                  ? 'border-b-2 border-indigo-500 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >{t('settings.language')}</button>
          </div>
        </div>

        {activeTab === 'database' ? (
          <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Host
            </label>
            <input
              type="text"
              value={config.host}
              onChange={(e) => setConfig({ ...config, host: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Port
            </label>
            <input
              type="number"
              value={config.port}
              onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) || 3306 })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              value={config.user}
              onChange={(e) => setConfig({ ...config, user: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={config.password}
              onChange={(e) => setConfig({ ...config, password: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
        ) : (activeTab!=='language'?((
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-1/2 border-r pr-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Saved Legends</h3>
                <div className="space-y-2">
                  {colorLegends.map(legend => (
                    <div
                      key={legend.id}
                      className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
                    >
                      <button
                        onClick={() => {
                          setSelectedLegend(legend);
                          setNewLegendName(legend.name);
                          setColorMappings(JSON.parse(legend.color_mappings));
                        }}
                        className="text-sm text-left flex-1"
                      >
                        {legend.name}
                      </button>
                      <button
                        onClick={() => handleDeleteLegend(legend.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      setSelectedLegend(null);
                      setNewLegendName('');
                      setColorMappings({});
                    }}
                    className="w-full p-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded flex items-center justify-center gap-1"
                  >
                    <Plus size={14} />
                    New Legend
                  </button>
                </div>
              </div>
              
              <div className="w-1/2">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  {selectedLegend ? 'Edit Legend' : 'New Legend'}
                </h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    value={newLegendName}
                    onChange={(e) => setNewLegendName(e.target.value)}
                    placeholder="Legend name"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <div className="space-y-2">
                    {Object.entries(CARD_COLORS).map(([color]) => (
                      <div key={color} className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded ${CARD_COLORS[color]}`} />
                        <input
                          type="text"
                          value={colorMappings[color] || ''}
                          onChange={(e) => setColorMappings({
                            ...colorMappings,
                            [color]: e.target.value
                          })}
                          placeholder={`Meaning for ${color}`}
                          className="flex-1 px-2 py-1 text-sm border rounded"
                        />
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleSaveColorLegend}
                    disabled={!newLegendName}
                    className="w-full px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {selectedLegend ? 'Update Legend' : 'Save Legend'}
                  </button>
                </div>
              </div>
            </div>
          </div>)): 
          (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="text-indigo-500" size={20} />
              <h3 className="text-lg font-medium">Sélectionner la langue</h3>
            </div>
            <div className="space-y-2">
            {(['fr', 'en', 'es'] as const).map((lang) => (
        <button
          key={lang}
          onClick={() => handleLanguageChange(lang)}
          className={`w-full p-3 text-left rounded-lg border transition-colors ${
            selectedLanguage === lang
              ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
              : 'border-gray-200 hover:bg-gray-50'
          }`}
        >
          <ReactCountryFlag countryCode={lang === 'fr' ? 'FR' : lang === 'en' ? 'GB' : 'ES'} svg />
          &nbsp;
          {lang === 'fr' ? 'Français' : lang === 'en' ? 'Anglais' : 'Espagnol'}
        </button>
      ))}
            </div>
          </div>
        ))}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}
        
       

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isSaving}
          >{t('common.save')}</button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
            disabled={isSaving}
            style={{ display: activeTab === 'database' ? 'block' : 'none' }}
          >
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}