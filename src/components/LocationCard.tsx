import React, { useState, useEffect } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Maximize2, Minimize2, Link, Unlink, MapPin, Trash2 } from 'lucide-react';
import { useCardStore, CARD_COLORS } from '../store/cardStore';
import { ColorPicker } from './ColorPicker';
import { useI18n } from '../i18n/useTranslation';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { geocodeAddress } from '../utils/geocoding';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 13);
  }, [map, center]);
  return null;
}

interface LocationCardProps {
  id: string;
  title: string;
  content: string;
  isExpanded: boolean;
  isConnecting: boolean;
  color: string;
  locationData?: {
    streetNumber?: string;
    street?: string;
    postalCode?: string;
    city?: string;
    country?: string;
    coordinates?: [number, number];
  };
  incomingConnections: Array<{ start: string; end: string }>;
  onConnect: () => void;
}

export function LocationCard({
  id,
  title,
  content,
  isExpanded,
  isConnecting,
  color,
  locationData,
  incomingConnections,
  onConnect
}: LocationCardProps) {
  const { t } = useI18n();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  const [isEditing, setIsEditing] = useState(false);
  const [localTitle, setLocalTitle] = useState(title);
  const [localLocationData, setLocalLocationData] = useState(locationData || {});
  const [coordinates, setCoordinates] = useState<[number, number] | null>(
    locationData?.coordinates || null
  );

  const updateCard = useCardStore((state) => state.updateCard);
  const deleteCard = useCardStore((state) => state.deleteCard);
  const deleteConnection = useCardStore((state) => state.deleteConnection);
  const toggleCardExpansion = useCardStore((state) => state.toggleCardExpansion);

  const handleSave = async () => {
    const address = [
      localLocationData.streetNumber,
      localLocationData.street,
      localLocationData.postalCode,
      localLocationData.city,
      localLocationData.country
    ].filter(Boolean).join(', ');

    const coords = await geocodeAddress(address);
    
    updateCard(id, {
      title: localTitle,
      locationData: {
        ...localLocationData,
        coordinates: coords || undefined
      }
    });
    
    if (coords) {
      setCoordinates(coords);
    }
    
    setIsEditing(false);
  };

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDragging ? 1000 : 1,
    cursor: isDragging ? 'grabbing' : 'grab'
  } : undefined;

  const formatAddress = () => {
    const parts = [];
    if (localLocationData.streetNumber || localLocationData.street) {
      parts.push(`${localLocationData.streetNumber || ''} ${localLocationData.street || ''}`);
    }
    if (localLocationData.postalCode || localLocationData.city) {
      parts.push(`${localLocationData.postalCode || ''} ${localLocationData.city || ''}`);
    }
    if (localLocationData.country) {
      parts.push(localLocationData.country);
    }
    return parts.filter(part => part.trim()).join('\n');
  };

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
      } rounded-lg shadow-lg`}
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
            <div className="flex items-center gap-2">
              <MapPin size={18} className="text-indigo-600" />
              <h3 className="text-lg font-semibold">{title}</h3>
            </div>
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
            {!isEditing && <button
              onClick={() => toggleCardExpansion(id)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>}
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {isEditing ? (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('contacts.streetNumber')}
                  </label>
                  <input
                    type="text"
                    value={localLocationData.streetNumber || ''}
                    onChange={(e) => setLocalLocationData({
                      ...localLocationData,
                      streetNumber: e.target.value
                    })}
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('contacts.street')}
                  </label>
                  <input
                    type="text"
                    value={localLocationData.street || ''}
                    onChange={(e) => setLocalLocationData({
                      ...localLocationData,
                      street: e.target.value
                    })}
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('contacts.postalCode')}
                  </label>
                  <input
                    type="text"
                    value={localLocationData.postalCode || ''}
                    onChange={(e) => setLocalLocationData({
                      ...localLocationData,
                      postalCode: e.target.value
                    })}
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('contacts.city')}
                  </label>
                  <input
                    type="text"
                    value={localLocationData.city || ''}
                    onChange={(e) => setLocalLocationData({
                      ...localLocationData,
                      city: e.target.value
                    })}
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('contacts.country')}
                </label>
                <input
                  type="text"
                  value={localLocationData.country || ''}
                  onChange={(e) => setLocalLocationData({
                    ...localLocationData,
                    country: e.target.value
                  })}
                  className="w-full px-2 py-1 border rounded text-sm"
                />
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              <div className="whitespace-pre-line text-sm mb-2">
                {formatAddress()}
              </div>
              {isExpanded && coordinates && (
                <div className="flex-1 rounded-lg overflow-hidden border mt-2">
                  <MapContainer
                    center={coordinates}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <Marker position={coordinates} />
                    <MapUpdater center={coordinates} />
                  </MapContainer>
                </div>
              )}
            </div>
          )}
        </div>

        {isExpanded && (
          <button
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className="self-end mt-2 px-3 py-1 text-sm bg-white bg-opacity-50 rounded hover:bg-opacity-100"
          >
            {isEditing ? t('common.save') : t('common.edit')}
          </button>
        )}
      </div>
    </div>
  );
}
