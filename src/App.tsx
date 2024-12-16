import React, { useEffect, useState } from 'react';
import { 
  DndContext, 
  DragEndEvent, 
  DragMoveEvent, 
  useSensor, 
  useSensors,
  MouseSensor,
  pointerWithin
} from '@dnd-kit/core';
import Xarrow from 'react-xarrows';
import { Card } from './components/Card';
import { BudgetCard } from './components/BudgetCard';
import { ImageCard } from './components/ImageCard';
import { LocationCard } from './components/LocationCard';
import { ItineraireCard } from './components/ItineraireCard';
import { CheckListCard } from './components/CheckListCard';
import { Sidebar } from './components/Sidebar';
import { SplashScreen } from './components/SplashScreen';
import { ConnectionDialog } from './components/ConnectionDialog';
import { useCardStore } from './store/cardStore';
import { useI18n } from './i18n/useTranslation';
import { calculateAnchor } from './utils/anchor';
import { constrainPosition } from './utils/position';
import { GroupOverlay } from './components/GroupOverlay';


function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [connectionUpdateKey, setConnectionUpdateKey] = useState(0);
  const { t, setLanguage } = useI18n();
  const { 
    cards, 
    connections, 
    groups, 
    groupConnections,
    updateCardPosition, 
    addConnection,
    addGroupConnection,
    deleteGroupConnection,
    loadFromDb, 
    createGroup, 
    moveGroup 
  } = useCardStore();
  const [isGroupCreationMode, setIsGroupCreationMode] = useState(false);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [connectingTo, setConnectingTo] = useState<string | null>(null);
  const [connectingGroupFrom, setConnectingGroupFrom] = useState<string | null>(null);
  const [connectingGroupTo, setConnectingGroupTo] = useState<string | null>(null);
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawEnd, setDrawEnd] = useState<{ x: number; y: number } | null>(null);
  
  useEffect(() => {
    loadFromDb().catch(console.error);
  }, [loadFromDb]);

  // Load language setting
  useEffect(() => {
    fetch('http://localhost:3000/api/app-params/language')
      .then(res => res.json())
      .then(data => {
        if (data.language) {
          setLanguage(data.language);
        }
      })
      .catch(console.error);
  }, [setLanguage]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);
  
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 10,
    },
  });
  
  const sensors = useSensors(mouseSensor);

  const handleDragMove = (event: DragMoveEvent) => {
    const { active, activatorEvent } = event;
    const card = cards.find((c) => c.id === active.id);

    if (card) {
      setDraggedCardId(card.id);
      if (activatorEvent instanceof MouseEvent) {
        const container = document.querySelector('.ml-16');
        if (container) {
          const rect = container.getBoundingClientRect();
          const x = activatorEvent.clientX - rect.left;
          const y = activatorEvent.clientY - rect.top;
          updateCardPosition(card.id, constrainPosition(x, y));
        }
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    
    if (typeof active.id === 'string' && active.id.startsWith('group-')) {
      const groupId = active.id.toString().replace('group-', '');
      moveGroup(groupId, delta.x, delta.y);
      setConnectionUpdateKey(prev => prev + 1);
      return;
    }

    const card = cards.find((c) => c.id === active.id);

    if (card) {
      const newPosition = constrainPosition(
        card.position.x + delta.x,
        card.position.y + delta.y
      );
      updateCardPosition(card.id, newPosition);
      setDraggedCardId(null);
    }
  };

  const handleConnect = (cardId: string) => {
    console.log('app - cardID : ', cardId )
    if (connectingFrom === null) {
      setConnectingFrom(cardId);
    } else if (connectingFrom !== cardId) {
      setConnectingTo(cardId);
    } else {
      setConnectingFrom(null);
      setConnectingTo(null);
    }
  };

  const handleConnectionComplete = (style: 'solid' | 'dashed', color: string) => {
    console.log( 'app -  handleConnectionComplete :', {connectingFrom:connectingFrom,connectingTo:connectingTo})
    if (connectingFrom && connectingTo) {
      console.log('app - ajout d une nouvelle connection',{from:connectingFrom,To :connectingTo})
      addConnection({ start: connectingFrom, end: connectingTo }, style, color);
      setConnectingFrom(null);
      setConnectingTo(null);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isGroupCreationMode && e.button === 0 && !e.target.closest('.card')) {
      const container = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - container.left;
      const y = e.clientY - container.top;
      setIsDrawing(true);
      setDrawStart({ x, y });
      setDrawEnd({ x, y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDrawing) {
      const container = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - container.left;
      const y = e.clientY - container.top;
      setDrawEnd({ x, y });
    }
  };

  const handleMouseUp = () => {
    if (isDrawing && drawStart && drawEnd) {
      const bounds = {
        x: Math.min(drawStart.x, drawEnd.x),
        y: Math.min(drawStart.y, drawEnd.y),
        width: Math.abs(drawEnd.x - drawStart.x),
        height: Math.abs(drawEnd.y - drawStart.y)
      };

      if (bounds.width > 50 && bounds.height > 50) {
        const name = prompt('Enter a name for this group:');
        if (name) {
          createGroup(bounds, name);
          setIsGroupCreationMode(false);
        }
      }

      setIsDrawing(false);
      setDrawStart(null);
      setDrawEnd(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {showSplash && <SplashScreen />}

      <Sidebar 
        disabled={showSplash}
        isGroupCreationMode={isGroupCreationMode}
        onToggleGroupCreation={() => setIsGroupCreationMode(!isGroupCreationMode)}
      />
      <DndContext 
        sensors={sensors} 
        onDragEnd={handleDragEnd} 
        onDragMove={handleDragMove}
      >
        <div
          className="ml-16 relative min-w-[calc(100%-4rem)] min-h-screen overflow-auto"
          style={{
            width: '200%',
            height: '200%',
            cursor: isGroupCreationMode ? 'crosshair' : 'default'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => setIsDrawing(false)}
        >
          {groups.map(group => (
            <GroupOverlay
              key={group.id}
              group={group}
              isConnecting={connectingGroupFrom === group.id}
              onConnect={() => {
                if (connectingGroupFrom === null) {
                  setConnectingGroupFrom(group.id);
                } else if (connectingGroupFrom !== group.id) {
                  setConnectingGroupTo(group.id);
                }
              }}
              hasIncomingConnections={groupConnections.some(conn => conn.end === group.id)}
              onDeleteConnection={() => {
                const connection = groupConnections.find(conn => conn.end === group.id);
                if (connection) {
                  deleteGroupConnection(connection.start, connection.end);
                }
              }}
              onMove={(deltaX, deltaY) => moveGroup(group.id, deltaX, deltaY)}
            />
          ))}

          {isDrawing && drawStart && drawEnd && (
            <div
              className="absolute border-2 border-dashed border-indigo-500 bg-indigo-50 bg-opacity-20"
              style={{
                left: Math.min(drawStart.x, drawEnd.x),
                top: Math.min(drawStart.y, drawEnd.y),
                width: Math.abs(drawEnd.x - drawStart.x),
                height: Math.abs(drawEnd.y - drawStart.y)
              }}
            />
          )}

{cards.map((card) => (
  <div
    key={card.id}
    style={{
      position: 'absolute',
      left: card.position.x,
      top: card.position.y,
      transform: 'translate(0, 0)',
    }}
  >
    {card.cardType === 'image' ? (
      <ImageCard
        {...card}
        isConnecting={connectingFrom === card.id}
        incomingConnections={connections.filter(conn => conn.end === card.id)}
        onConnect={() => handleConnect(card.id)}
      />
    ) : card.cardType === 'contact' ? (
      <Card
        {...card}
        isConnecting={connectingFrom === card.id}
        incomingConnections={connections.filter(conn => conn.end === card.id)}
        onConnect={() => handleConnect(card.id)}
      />
    ) : card.cardType === 'budget' ? (
      <BudgetCard
        {...card}
        budgetType={card.budgetType}
        budgetData={card.budgetData || { totalAmount: 0, availableAmount: 0, expenses: [] }}
        isConnecting={connectingFrom === card.id}
        incomingConnections={connections.filter(conn => conn.end === card.id)}
        onConnect={() => handleConnect(card.id)}
      />
    ) : card.cardType === 'location' ? (
      <LocationCard
        {...card}
        isConnecting={connectingFrom === card.id}
        incomingConnections={connections.filter(conn => conn.end === card.id)}
        onConnect={() => handleConnect(card.id)}
      />
    ) : card.cardType === 'itineraire' ? (
      <ItineraireCard {...card} 
      isConnecting={connectingFrom === card.id}
      incomingConnections={connections.filter(conn => conn.end === card.id)}
      onConnect={() => handleConnect(card.id)}
    />
    ) : card.cardType === 'checklist' ? (
      <CheckListCard
        {...card}
        isConnecting={connectingFrom === card.id} 
        connectFrom={connectingFrom}
        incomingConnections={connections.filter(conn => conn.end === card.id)}
        onConnect={(cardId) => {handleConnect(cardId)}} // La connexion est gérée au niveau de la tâche
      />
    )
     : (
      <Card
        {...card}
        isConnecting={connectingFrom === card.id}
        incomingConnections={connections.filter(conn => conn.end === card.id)}
        onConnect={() => handleConnect(card.id)}
      />
    )}
  </div>
))}
          {connections.map((connection) => {
             // Vérifier que les éléments source et cible existent dans le DOM
  const startElement = document.getElementById(connection.start);
  const endElement = document.getElementById(connection.end);
  

           let startCard = cards.find(c => c.id === connection.start);
            const endCard = cards.find(c => c.id === connection.end);
            


            console.log('Rendering connection:', {
              startId: connection.start,
              endId: connection.end,
              startElement,
              endElement,
              startCard,
              endCard
            });
        //    if(!startCard)startCard=connection.start;
           // if (!startCard || !endCard) return null;
            
          //  const dimensions = {
          //    width: startCard.isExpanded ? 384 : 256,
        //      height: startCard.isExpanded ? 320 : 192
        //    };
            
           // const startAnchor = calculateAnchor(startCard.position, endCard.position, dimensions);
          //  const endAnchor = calculateAnchor(endCard.position, startCard.position, dimensions);
            
            return (
              <Xarrow
                key={`${connection.start}-${connection.end}-${draggedCardId || ''}-${connectionUpdateKey}`}
                start={connection.start}
                end={connection.end}
                color={connection.color}
                strokeWidth={2}
                path="smooth"
                   startAnchor="auto"
        endAnchor="auto"
                curveness={0.3}
                showHead={true}
                headSize={6}
                headShape="arrow1"
                animateDrawing={0.3}
                dashness={connection.style === 'dashed' ? { animation: 1 } : false}
                _cpx1Offset={50}
                _cpx2Offset={50}
                _extendSVGcanvas={50}
                className="connection-line"
              />
            );
          })}
          {groupConnections.map((connection) => {
            const startGroup = groups.find(g => g.id === connection.start);
            const endGroup = groups.find(g => g.id === connection.end);
            
            if (!startGroup || !endGroup) return null;            
            
            return (
              <Xarrow
                key={`group-${connection.start}-${connection.end}-${connectionUpdateKey}`}
                start={`group-${connection.start}`}
                end={`group-${connection.end}`}
                startAnchor="auto"
                endAnchor="auto"
                color={connection.color}
                strokeWidth={3}
                path="smooth"
                curveness={0.3}
                showHead={true}
                headSize={8}
                headShape="arrow1"
                animateDrawing={0.3}
                dashness={connection.style === 'dashed' ? { animation: 1 } : false}
                _cpx1Offset={100}
                _cpx2Offset={100}
                _extendSVGcanvas={100}
                className="connection-line group-connection"
              />
            );
          })}
        </div>
      </DndContext>
      {connectingFrom && connectingTo && (
        <ConnectionDialog
          onConnect={handleConnectionComplete}
          onCancel={() => {
            setConnectingFrom(null);
            setConnectingTo(null);
          }}
        />
      )}
      {connectingGroupFrom && connectingGroupTo && (
        <ConnectionDialog
          onConnect={(style, color) => {
            addGroupConnection(
              { start: connectingGroupFrom, end: connectingGroupTo },
              style,
              color
            );
            setConnectingGroupFrom(null);
            setConnectingGroupTo(null);
          }}
          onCancel={() => {
            setConnectingGroupFrom(null);
            setConnectingGroupTo(null);
          }}
        />
      )}
    </div>
  );
}

export default App;