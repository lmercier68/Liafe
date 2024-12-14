import React, { useState, useEffect } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Maximize2, Minimize2, Link, Unlink, Navigation2, Trash2 } from 'lucide-react';
import { useCardStore, CARD_COLORS } from '../store/cardStore';
import { ColorPicker } from './ColorPicker';
import { useI18n } from '../i18n/useTranslation';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { geocodeAddress } from '../utils/geocoding';
import { verifyExistingTiles } from '../db';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import L from 'leaflet';
import 'leaflet-routing-machine';

// Fix Leaflet default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface ItineraireData {
  start: {
    address: string;
    coordinates?: [number, number];
  };
  end: {
    address: string;
    coordinates?: [number, number];
  };
}

function latLngToTile(lat : number, lng : number, zoom :number) {
    const scale = Math.pow(2, zoom);
    const x = Math.floor((lng + 180) / 360 * scale);
    const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * scale);
    console.log('tile:',{ x, y });
    return { x, y };
}
interface Tile {
    x: number;
    y: number;
  }

  function RoutingMachine({ start, end }: { start: [number, number]; end: [number, number] }) {
    const map = useMap();
  
    useEffect(() => {
      if (!map || !start || !end) return;
  
      // Crée les limites pour centrer la carte
      const bounds = L.latLngBounds([
        L.latLng(start[0], start[1]),
        L.latLng(end[0], end[1]),
      ]);
  
      // Ajuste la vue de la carte aux limites
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
  
      const control = L.Routing.control({
        waypoints: [
          L.latLng(start[0], start[1]),
          L.latLng(end[0], end[1]),
        ],
        router: L.Routing.osrmv1({
          serviceUrl: 'https://router.project-osrm.org/route/v1',
        }),
        lineOptions: {
          styles: [{ color: '#6366f1', weight: 4 }],
          extendToWaypoints: true,
          missingRouteTolerance: 0,
        },
        show: false,
        addWaypoints: false,
        routeWhileDragging: false,
        fitSelectedRoutes: true,
        showAlternatives: false,
      }).addTo(map);
  
      // Listen for routes to be calculated
      control.on('routesfound', function (e) {
        const polylineCoordinates = e.routes[0].coordinates; // Get polyline coordinates
        const bounds = L.latLngBounds(polylineCoordinates); // Calculate bounds
        const northEast = bounds.getNorthEast(); // Upper-right corner
        const southWest = bounds.getSouthWest(); // Lower-left corner
  
        console.log('Bounds:', {
          northEast: { lat: northEast.lat, lng: northEast.lng },
          southWest: { lat: southWest.lat, lng: southWest.lng },
        });
  
        const zoom = map.getZoom(); // Get the current zoom level
        console.log('Niveau de zoom calculé :', zoom);
  // Appliquer manuellement le zoom si nécessaire
        map.setZoom(zoom);
        const northEastTile = latLngToTile(northEast.lat, northEast.lng, zoom);
        const southWestTile = latLngToTile(southWest.lat, southWest.lng, zoom);
  
        console.log('NorthEast Tile:', northEastTile);
        console.log('SouthWest Tile:', southWestTile);
  
        // Calculate all tiles within the bounding box
        const tiles = [];
        const minX = Math.min(southWestTile.x, northEastTile.x);
        const maxX = Math.max(southWestTile.x, northEastTile.x);
        const minY = Math.min(southWestTile.y, northEastTile.y);
        const maxY = Math.max(southWestTile.y, northEastTile.y);
  
        for (let x = minX; x <= maxX; x++) {
          for (let y = minY; y <= maxY; y++) {
            tiles.push({ x, y });
          }
        }
  
        console.log('All Tiles:', tiles);
        tilesManager(tiles, zoom);
      });
  
      return () => {
        map.removeControl(control);
      };
    }, [map, start, end]);
  
    return null;
  }
  
async function tilesManager(tiles: Tile[], zoom: number) {
    try {
      // Vérifier les tuiles existantes et obtenir les URLs des images
      const data = await verifyExistingTiles(zoom, tiles);
      console.log('Verified tiles response data:', data);
  
      // Télécharger les images
      const imageUrls = data.tiles.map(tile => tile.path);
      await downloadImages(imageUrls);
  
      console.log('Images downloaded successfully');
    } catch (error) {
      console.error('Error in tilesManager:', error);
    }
  }
  
  async function downloadImages(imageUrls: string[]) {
    const downloadPromises = imageUrls.map(url =>
      fetch(url).then(response => {
        if (!response.ok) {
          throw new Error(`Failed to download image: ${url}`);
        }
        return response.blob();
      }).then(blob => {
        const imageUrl = URL.createObjectURL(blob);
        console.log('Downloaded image:', imageUrl);
        // Vous pouvez afficher l'image ou l'utiliser comme vous le souhaitez
        // Par exemple, vous pouvez créer une balise img et l'ajouter au DOM
        const img = document.createElement('img');
        img.src = imageUrl;
        document.body.appendChild(img);
      })
    );
  
    await Promise.all(downloadPromises);
  }

interface ItineraireCardProps {
  id: string;
  title: string;
  content: string;
  isExpanded: boolean;
  isConnecting: boolean;
  color: string;
  itineraireData?: ItineraireData;
  incomingConnections: Array<{ start: string; end: string }>;
  onConnect: () => void;
}

export function ItineraireCard({
  id,
  title,
  content,
  isExpanded,
  isConnecting,
  color,
  itineraireData,
  incomingConnections,
  onConnect
}: ItineraireCardProps) {
  const { t } = useI18n();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  const [isEditing, setIsEditing] = useState(false);
  const [localTitle, setLocalTitle] = useState(title);
  const [localItineraireData, setLocalItineraireData] = useState<ItineraireData>(
    itineraireData || { start: { address: '' }, end: { address: '' } }
  );
  const [geocodedCoordinates, setGeocodedCoordinates] = useState<{
    start?: [number, number];
    end?: [number, number];
  }>({});

  const updateCard = useCardStore((state) => state.updateCard);
  const deleteCard = useCardStore((state) => state.deleteCard);
  const deleteConnection = useCardStore((state) => state.deleteConnection);
  const toggleCardExpansion = useCardStore((state) => state.toggleCardExpansion);

  const handleSave = async () => {
    const startCoords = await geocodeAddress(localItineraireData.start.address);
    const endCoords = await geocodeAddress(localItineraireData.end.address);

    setGeocodedCoordinates({
      start: startCoords || undefined,
      end: endCoords || undefined
    });

    const updatedItineraireData = {
      start: {
        ...localItineraireData.start,
        coordinates: startCoords || undefined
      },
      end: {
        ...localItineraireData.end,
        coordinates: endCoords || undefined
      }
    };

    updateCard(id, {
      title: localTitle,
      itineraireData: updatedItineraireData
    });

    setIsEditing(false);
  };

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDragging ? 1000 : 1,
    cursor: isDragging ? 'grabbing' : 'grab'
  } : undefined;

  const hasValidCoordinates =
    geocodedCoordinates.start &&
    geocodedCoordinates.end;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`absolute transition-all duration-200 border ${
        CARD_COLORS[color as keyof typeof CARD_COLORS]
      } ${isExpanded ? 'w-[768px] h-[640px]' : 'w-96 h-24'} ${
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
              <Navigation2 size={18} className="text-indigo-600" />
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('itineraire.startAddress')}
                </label>
                <input
                  type="text"
                  value={localItineraireData.start.address}
                  onChange={(e) => setLocalItineraireData({
                    ...localItineraireData,
                    start: { ...localItineraireData.start, address: e.target.value }
                  })}
                  className="w-full px-2 py-1 border rounded text-sm"
                  placeholder={t('itineraire.enterStartAddress')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('itineraire.endAddress')}
                </label>
                <input
                  type="text"
                  value={localItineraireData.end.address}
                  onChange={(e) => setLocalItineraireData({
                    ...localItineraireData,
                    end: { ...localItineraireData.end, address: e.target.value }
                  })}
                  className="w-full px-2 py-1 border rounded text-sm"
                  placeholder={t('itineraire.enterEndAddress')}
                />
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">{t('itineraire.from')}:</span>{' '}
                  {localItineraireData.start.address}
                </div>
                <div>
                  <span className="font-medium">{t('itineraire.to')}:</span>{' '}
                  {localItineraireData.end.address}
                </div>
              </div>

              {isExpanded && hasValidCoordinates && (
                <div className="flex-1 rounded-lg overflow-hidden border mt-2">
                  <MapContainer
                    center={geocodedCoordinates.start}
                    zoom={13}
                    
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={false}
                  >
                    <TileLayer
                      url="http://localhost:5174/tiles/{z}/{x}/{y}.png"
                    
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    {geocodedCoordinates.start && geocodedCoordinates.end && (
                      <RoutingMachine
                        start={geocodedCoordinates.start}
                        end={geocodedCoordinates.end}
                      />
                    )}
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
