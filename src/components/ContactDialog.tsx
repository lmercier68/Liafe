import React, { useState, useEffect } from 'react';
import { Eye, Plus } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { useCardStore } from '../store/cardStore';
import { geocodeAddress } from '../utils/geocoding';
import { useI18n } from '../i18n/useTranslation';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle map view updates
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 13);
  }, [map, center]);
  return null;
}

interface Contact {
  id: string;
  title: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  position?: string;
  streetNumber?: string;
  street?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  email?: string;
  phone?: string;
}

interface ContactDialogProps {
  onClose: () => void;
}

export function ContactDialog({ onClose }: ContactDialogProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { t } = useI18n();
  const [newContact, setNewContact] = useState<Partial<Contact>>({
    title: t('contacts.abrTitleMr'),
  });
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  const addCard = useCardStore((state) => state.addCard);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/contacts');
      const data = await response.json();
      const formattedContacts = data.map((contact: any) => ({
        id: contact.id,
        title: contact.title,
        firstName: contact.first_name,
        lastName: contact.last_name,
        company: contact.company,
        position: contact.position,
        streetNumber: contact.street_number,
        street: contact.street,
        postalCode: contact.postal_code,
        city: contact.city,
        country: contact.country,
        email: contact.email,
        phone: contact.phone,
      }));
      setContacts(formattedContacts);
    } catch (error) {
      console.error(t('contacts.failedFetchContact'), error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3000/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newContact,
          id: crypto.randomUUID(),
          first_name: newContact.firstName,
          last_name: newContact.lastName,
          street_number: newContact.streetNumber,
          postal_code: newContact.postalCode,
        }),
      });

      if (response.ok) {
        fetchContacts();
        setNewContact({ title: t('contacts.abrTitleMr') });
      }
    } catch (error) {
      console.error(t('contacts.failedAddContact'), error);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContact) return;

    try {
      const response = await fetch(`http://localhost:3000/api/contacts/${editingContact.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editingContact,
          first_name: editingContact.firstName,
          last_name: editingContact.lastName,
          street_number: editingContact.streetNumber,
          postal_code: editingContact.postalCode,
        }),
      });

      if (response.ok) {
        fetchContacts();
        setIsEditing(false);
        setEditingContact(null);
        setShowDetails(false);
      }
    } catch (error) {
      console.error(t('contacts.failedUpdateContact'), error);
    }
  };

  const updateMapCoordinates = async (contact: Contact) => {
    const addressParts = [
      contact.streetNumber,
      contact.street,
      contact.postalCode,
      contact.city,
      contact.country
    ].filter(Boolean);
    
    if (addressParts.length > 0) {
      const coords = await geocodeAddress(addressParts.join(', '));
      setCoordinates(coords);
    } else {
      setCoordinates(null);
    }
  };

  useEffect(() => {
    if (selectedContact) {
      updateMapCoordinates(selectedContact);
    }
  }, [selectedContact]);

  const handleCreateCard = (contact: Contact) => {
    const id = crypto.randomUUID();
    const content = [
      contact.company && `🏢 ${contact.company}`,
      contact.position && `💼 ${contact.position}`,
      contact.email && `📧 ${contact.email}`,
      contact.phone && `📞 ${contact.phone}`,
      contact.streetNumber && contact.street && `📍 ${contact.streetNumber} ${contact.street}`,
      contact.postalCode && contact.city && `${contact.postalCode} ${contact.city}`,
      contact.country && contact.country,
    ].filter(Boolean).join('\n');

    addCard({
      id,
      title: contact.title === t('contacts.company')
        ? `${contact.company}`
        : `${contact.title} ${contact.firstName} ${contact.lastName}`,
      content,
      position: {
        x: Math.random() * (window.innerWidth - 400) + 200,
        y: Math.random() * (window.innerHeight - 300) + 100,
      },
      color: 'rose',
      cardType: 'contact',
      isExpanded: true,
      dueDate: null,
      status: null,
    });
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/95 rounded-2xl shadow-2xl border border-indigo-100 p-8 w-[80rem] h-[80vh] flex gap-8">
        {/* Contact List */}
        <div className="w-1/3 border-r border-indigo-100 pr-8">
          <h3 className="text-2xl font-semibold mb-6 text-indigo-900">{t('contacts.contacts')}</h3>
          <div className="space-y-3 overflow-auto max-h-[calc(80vh-10rem)] pr-2">
            {contacts.map((contact) => (
              <button
                key={contact.id}
                className={`w-full text-left p-4 rounded-xl hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 border border-indigo-100 flex items-center justify-between transition-all duration-200 ${
                  selectedContact?.id === contact.id ? 'border-indigo-500 bg-gradient-to-r from-indigo-50 to-purple-50 shadow-md' : ''
                }`}
              >
                <div className="flex-1">
                  <div className="font-semibold text-indigo-900">
                    {contact.title === t('contacts.company') 
                      ? contact.company || 'Unnamed Company'
                      : `${contact.title} ${contact.firstName || ''} ${contact.lastName || ''}`.trim()}
                  </div>
                  {contact.company && contact.title !== t('contacts.company') && (
                    <div className="text-sm text-indigo-600 font-medium mt-0.5">{contact.company}</div>
                  )}
                  {contact.position && (
                    <div className="text-sm text-indigo-400 mt-0.5">{contact.position}</div>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedContact(contact);
                      setShowDetails(true);
                    }}
                    className="p-1.5 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-100 rounded-lg transition-colors duration-200"
                    title="View details"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCreateCard(contact);
                    }}
                    className="p-1.5 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-100 rounded-lg transition-colors duration-200"
                    title="Create card"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* New Contact Form */}
        <div className="flex-1 px-4">
          <h3 className="text-2xl font-semibold mb-6 text-indigo-900">{t('contacts.addContact')}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-indigo-900 mb-2">
                  {t('contacts.title')}
                </label>
                <select
                  value={newContact.title}
                  onChange={(e) => setNewContact({ 
                    ...newContact, 
                    title: e.target.value 
                  })}
                  className="w-full px-4 py-2.5 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white/50"
                >
                  <option value={t('contacts.abrTitleMr')}>{t('contacts.abrTitleMr')}</option>
                  <option value={t('contacts.abrTitleMs')}>{t('contacts.abrTitleMs')}</option>
                  <option value={t('contacts.company')}>{t('contacts.company')}</option>
                </select>
              </div>

              {newContact.title !== t('contacts.company') && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-indigo-900 mb-2">
                    {t('contacts.firstName')}
                    </label>
                    <input
                      type="text"
                      value={newContact.firstName || ''}
                      onChange={(e) => setNewContact({ ...newContact, firstName: e.target.value })}
                      className="w-full px-4 py-2.5 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-indigo-900 mb-2">
                    {t('contacts.lastName')}
                    </label>
                    <input
                      type="text"
                      value={newContact.lastName || ''}
                      onChange={(e) => setNewContact({ ...newContact, lastName: e.target.value })}
                      className="w-full px-4 py-2.5 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white/50"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-indigo-900 mb-2">
                {t('contacts.company')}
                </label>
                <input
                  type="text"
                  value={newContact.company || ''}
                  onChange={(e) => setNewContact({ ...newContact, company: e.target.value })}
                  className="w-full px-4 py-2.5 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white/50"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-indigo-900 mb-2">
                {t('contacts.position')}
                </label>
                <input
                  type="text"
                  value={newContact.position || ''}
                  onChange={(e) => setNewContact({ ...newContact, position: e.target.value })}
                  className="w-full px-4 py-2.5 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-indigo-900 mb-2">
                {t('contacts.streetNumber')}
                </label>
                <input
                  type="text"
                  value={newContact.streetNumber || ''}
                  onChange={(e) => setNewContact({ ...newContact, streetNumber: e.target.value })}
                  className="w-full px-4 py-2.5 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white/50"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-indigo-900 mb-2">
                {t('contacts.street')}
                </label>
                <input
                  type="text"
                  value={newContact.street || ''}
                  onChange={(e) => setNewContact({ ...newContact, street: e.target.value })}
                  className="w-full px-4 py-2.5 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-indigo-900 mb-2">
                {t('contacts.postalCode')}
                </label>
                <input
                  type="text"
                  value={newContact.postalCode || ''}
                  onChange={(e) => setNewContact({ ...newContact, postalCode: e.target.value })}
                  className="w-full px-4 py-2.5 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white/50"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-indigo-900 mb-2">
                {t('contacts.city')}
                </label>
                <input
                  type="text"
                  value={newContact.city || ''}
                  onChange={(e) => setNewContact({ ...newContact, city: e.target.value })}
                  className="w-full px-4 py-2.5 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white/50"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-indigo-900 mb-2">
                {t('contacts.country')}
                </label>
                <input
                  type="text"
                  value={newContact.country || ''}
                  onChange={(e) => setNewContact({ ...newContact, country: e.target.value })}
                  className="w-full px-4 py-2.5 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-indigo-900 mb-2">
                {t('contacts.email')}
                </label>
                <input
                  type="email"
                  value={newContact.email || ''}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white/50"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-indigo-900 mb-2">
                {t('contacts.phone')}
                </label>
                <input
                  type="tel"
                  value={newContact.phone || ''}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  className="w-full px-4 py-2.5 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white/50"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors duration-200"
              >
                {t('common.close')}
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 text-sm font-medium bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                {t('contacts.addContact')}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Contact Details Modal */}
      {showDetails && selectedContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white/95 rounded-2xl shadow-2xl border border-indigo-100 p-8 w-[40rem] max-h-[80vh] overflow-y-auto">
            <h3 className="text-2xl font-semibold mb-6 text-indigo-900">{t('contacts.contactDetails')}</h3>
            
            {isEditing ? (
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('contacts.title')}
                    </label>
                    <select
                      value={editingContact?.title}
                      onChange={(e) => setEditingContact(prev => prev ? {
                        ...prev,
                        title: e.target.value 
                      } : null)}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value={t('contacts.abrTitleMr')}>{t('contacts.abrTitleMr')}</option>
                      <option value={t('contacts.abrTitleMs')}>{t('contacts.abrTitleMs')}</option>
                      <option value={t('contacts.company')}>{t('contacts.company')}</option>
                    </select>
                  </div>

                  {editingContact?.title !== t('contact.company') && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('contacts.firstName')}
                        </label>
                        <input
                          type="text"
                          value={editingContact?.firstName || ''}
                          onChange={(e) => setEditingContact(prev => prev ? {
                            ...prev,
                            firstName: e.target.value
                          } : null)}
                          className="w-full px-3 py-2 border rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('contacts.lastName')}
                        </label>
                        <input
                          type="text"
                          value={editingContact?.lastName || ''}
                          onChange={(e) => setEditingContact(prev => prev ? {
                            ...prev,
                            lastName: e.target.value
                          } : null)}
                          className="w-full px-3 py-2 border rounded-md"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('contacts.company')}
                    </label>
                    <input
                      type="text"
                      value={editingContact?.company || ''}
                      onChange={(e) => setEditingContact(prev => prev ? {
                        ...prev,
                        company: e.target.value
                      } : null)}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('contacts.position')}
                    </label>
                    <input
                      type="text"
                      value={editingContact?.position || ''}
                      onChange={(e) => setEditingContact(prev => prev ? {
                        ...prev,
                        position: e.target.value
                      } : null)}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('contacts.streetNumber')}
                    </label>
                    <input
                      type="text"
                      value={editingContact?.streetNumber || ''}
                      onChange={(e) => setEditingContact(prev => prev ? {
                        ...prev,
                        streetNumber: e.target.value
                      } : null)}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('contacts.street')}
                    </label>
                    <input
                      type="text"
                      value={editingContact?.street || ''}
                      onChange={(e) => setEditingContact(prev => prev ? {
                        ...prev,
                        street: e.target.value
                      } : null)}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('contacts.postalCode')}
                    </label>
                    <input
                      type="text"
                      value={editingContact?.postalCode || ''}
                      onChange={(e) => setEditingContact(prev => prev ? {
                        ...prev,
                        postalCode: e.target.value
                      } : null)}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('contacts.city')}
                    </label>
                    <input
                      type="text"
                      value={editingContact?.city || ''}
                      onChange={(e) => setEditingContact(prev => prev ? {
                        ...prev,
                        city: e.target.value
                      } : null)}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('contacts.country')}
                    </label>
                    <input
                      type="text"
                      value={editingContact?.country || ''}
                      onChange={(e) => setEditingContact(prev => prev ? {
                        ...prev,
                        country: e.target.value
                      } : null)}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('contacts.email')}
                    </label>
                    <input
                      type="email"
                      value={editingContact?.email || ''}
                      onChange={(e) => setEditingContact(prev => prev ? {
                        ...prev,
                        email: e.target.value
                      } : null)}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('contacts.phone')}
                    </label>
                    <input
                      type="tel"
                      value={editingContact?.phone || ''}
                      onChange={(e) => setEditingContact(prev => prev ? {
                        ...prev,
                        phone: e.target.value
                      } : null)}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setEditingContact(null);
                    }}
                    className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  >
                    {t('common.save')}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">{t('contacts.title')}</label>
                      <div className="mt-1">{selectedContact.title}</div>
                    </div>
                    {selectedContact.title !== t('contacts.company') && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-500">{t('contacts.name')}</label>
                          <div className="mt-1">
                            {selectedContact.firstName} {selectedContact.lastName}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500">{t('contacts.company')}</label>
                    <div className="mt-1">{selectedContact.company || '-'}</div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500">{t('contacts.position')}</label>
                    <div className="mt-1">{selectedContact.position || '-'}</div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-500">{t('contacts.address')}</label>
                    <div className="mt-1">
                      {(selectedContact.streetNumber || selectedContact.street) && (
                        <>{[selectedContact.streetNumber, selectedContact.street].filter(Boolean).join(' ')}<br /></>
                      )}
                      {(selectedContact.postalCode || selectedContact.city) && (
                        <>{[selectedContact.postalCode, selectedContact.city].filter(Boolean).join(' ')}<br /></>
                      )}
                      {selectedContact.country && selectedContact.country}
                    </div>
                    {(selectedContact.city || selectedContact.country) && (
                      <div className="mt-4 rounded-lg overflow-hidden border border-gray-200 shadow-md h-[300px] relative">
                        <MapContainer
                          center={coordinates || [48.8566, 2.3522]}
                          zoom={coordinates ? 13 : 4}
                          style={{ height: '100%', width: '100%' }}
                          scrollWheelZoom={true}
                        >
                          <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          />
                          {coordinates && <Marker position={coordinates} />}
                          <MapUpdater center={coordinates || [48.8566, 2.3522]} />
                        </MapContainer>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">{t('contacts.email')}</label>
                      <div className="mt-1">{selectedContact.email || '-'}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">{t('contacts.phone')}</label>
                      <div className="mt-1">{selectedContact.phone || '-'}</div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <button
                    onClick={() => setShowDetails(false)}
                    className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded"
                  >
                    {t('common.close')}
                  </button>
                  <button
                    onClick={() => {
                      setEditingContact(selectedContact);
                      setIsEditing(true);
                    }}
                    className="px-4 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  >
                    {t('contacts.editContact')}
                  </button>
                  <button
                    onClick={() => {
                      handleCreateCard(selectedContact);
                      setShowDetails(false);
                    }}
                    className="px-4 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  >
                    {t('common.createCard')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}