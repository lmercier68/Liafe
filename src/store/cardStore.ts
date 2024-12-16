import { create } from 'zustand';
import { getAllSets, loadSet, saveSet } from '../db';
import type { DbCard, DbConnection, DbCardSet } from '../db/types';

export interface Card {
  id: string;
  title: string;
  content: string;
  position: { x: number; y: number };
  originalPosition?: { x: number; y: number };
  color: string;
  isExpanded: boolean;
  dueDate: string | null;
  status: 'todo' | 'in-progress' | 'done' | null;
  cardType?: 'standard' | 'budget' | 'image' | 'contact' | 'location' | 'itineraire' | 'note' | 'checklist';
  budgetType?: 'total-available' | 'expenses-tracking';
  budgetData?: {
    totalAmount?: number;
    availableAmount?: number;
    expenses?: Array<{
      amount: number;
      description: string;
      date: string;
    }>;
  };
  itineraireData?: ItineraireData;
  
  locationData?: LocationData;
  imageData?: string;
  mimeType?: string;
  groupId?: string | null;
}

interface ItineraireData {
  start: {
    address: string;
    coordinates?: [number, number];
  };
  end: {
    address: string;
    coordinates?: [number, number];
  };
};

interface LocationData {
  streetNumber?: string;
  street?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  coordinates?: [number, number];
}



export interface Connection {
  start: string;
  end: string;
  style: 'solid' | 'dashed';
  color: string;
}

interface GroupConnection {
  start: string;
  end: string;
  style: 'solid' | 'dashed';
  color: string;
}

export interface Group {
  id: string;
  name: string;
  isMinimized: boolean;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  originalBounds?: {
    width: number;
    height: number;
  };
}

interface CardState {
  cards: Card[];
  connections: Connection[];
  groupConnections: GroupConnection[];
  groups: Group[];
  currentSetId: string | null;
  deleteCard: (id: string) => void;
  addCard: (card: Card) => void;
  updateCard: (id: string, updates: Partial<Card>) => void;
  updateCardPosition: (id: string, position: { x: number; y: number }) => void;
  toggleCardExpansion: (id: string) => void;
  deleteConnection: (start: string, end: string) => void;
  addConnection: (connection: Omit<Connection, 'style' | 'color'>, style: 'solid' | 'dashed', color: string) => void;
  updateConnection: (start: string, end: string, updates: Partial<Connection>) => void;
  createGroup: (bounds: { x: number; y: number; width: number; height: number }, name: string) => void;
  updateGroupBounds: (groupId: string, bounds: { x: number; y: number; width: number; height: number }) => void;
  deleteGroup: (groupId: string, deleteCards?: boolean) => void;
  toggleGroupMinimized: (groupId: string) => void;
  moveGroup: (groupId: string, deltaX: number, deltaY: number) => void;
  addGroupConnection: (connection: Omit<GroupConnection, 'style' | 'color'>, style: 'solid' | 'dashed', color: string) => void;
  deleteGroupConnection: (start: string, end: string) => void;
  updateGroupConnection: (start: string, end: string, updates: Partial<GroupConnection>) => void;
  saveToDb: (name: string) => Promise<void>;
  loadFromDb: (setId?: string) => Promise<void>;
  loadSets: () => Promise<DbCardSet[]>;
}

export const CARD_COLORS = {
  slate: 'bg-slate-100 border-slate-200',
  red: 'bg-red-100 border-red-200',
  orange: 'bg-orange-100 border-orange-200',
  amber: 'bg-amber-100 border-amber-200',
  yellow: 'bg-yellow-100 border-yellow-200',
  lime: 'bg-lime-100 border-lime-200',
  green: 'bg-green-100 border-green-200',
  emerald: 'bg-emerald-100 border-emerald-200',
  teal: 'bg-teal-100 border-teal-200',
  cyan: 'bg-cyan-100 border-cyan-200',
  sky: 'bg-sky-100 border-sky-200', 
} as const;

export const LINE_COLORS = {
  slate: '#64748b',
  red: '#ef4444',
  orange: '#f97316',
  amber: '#f59e0b',
  yellow: '#eab308',
  lime: '#84cc16',
  green: '#22c55e',
  emerald: '#10b981',
  teal: '#14b8a6',
  cyan: '#06b6d4',
  sky: '#0ea5e9', 
} as const;


function toDbCard(card: Card): DbCard {
  let budgetData = null;
  if (card.budgetType && card.budgetData) {
    try {
      budgetData = JSON.stringify({
        totalAmount: Number(card.budgetData.totalAmount) || 0,
        availableAmount: Number(card.budgetData.availableAmount) || 0,
        expenses: Array.isArray(card.budgetData.expenses) ? card.budgetData.expenses.map(exp => ({
          amount: Number(exp.amount) || 0,
          description: String(exp.description || ''),
          date: String(exp.date || new Date().toISOString())
        })) : []
      });
    } catch (error) {
      console.error('Failed to stringify budget data:', error);
      budgetData = null;
    }
  }
  
  const cardType = card.cardType || 'standard';
  const imageData = card.imageData || null;
  let locationData = null;
  if (card.cardType === 'location' && card.locationData) {
    locationData = JSON.stringify(card.locationData);
  }
  console.log('cardType: ',card.cardType);
  let itineraireData = null;
  if (card.cardType === 'itineraire' && card.itineraireData) {
    itineraireData = JSON.stringify(card.itineraireData);
    console.log('card type = itineraire');
  }
  return {
    id: card.id,
    set_id: '', // This will be set by the saveSet function
    title: card.title,
    content: card.content,
    position_x: card.position.x,
    position_y: card.position.y,
    color: card.color,
    is_expanded: card.isExpanded ? 1 : 0,
    due_date: card.dueDate,
    status: card.status,
    budget_type: card.budgetType || null,
    budget_data: budgetData,
    image_data: imageData,
    mime_type: card.mimeType || null,
    location_data: locationData,
    card_type: card.cardType || 'standard',
    itineraire_data: itineraireData,
  };
}

function fromDbCard(dbCard: DbCard): Card {
  let budgetData;
  try {
    if (dbCard.budget_type) {
      const parsed = dbCard.budget_data && typeof dbCard.budget_data === 'object' 
        ? dbCard.budget_data
        : dbCard.budget_data ? JSON.parse(dbCard.budget_data as string) : null;

      budgetData = {
        totalAmount: parsed ? Number(parsed.totalAmount) || 0 : 0,
        availableAmount: parsed ? Number(parsed.availableAmount) || 0 : 0,
        expenses: parsed && Array.isArray(parsed.expenses) ? parsed.expenses.map(exp => ({
          amount: Number(exp.amount) || 0,
          description: String(exp.description || ''),
          date: String(exp.date || new Date().toISOString())
        })) : [],
      };
    }
  } catch (error) {
    console.error('Failed to parse budget data:', error);
    budgetData = {
      totalAmount: 0,
      availableAmount: 0,
      expenses: []
    };
  }

  let locationData: LocationData | undefined;
  try {
    if (dbCard.card_type === 'location' && dbCard.location_data) {
      locationData = typeof dbCard.location_data === 'object'
        ? dbCard.location_data
        : JSON.parse(dbCard.location_data);
    }
  } catch (error) {
    console.error('Failed to parse location data:', error);
    locationData = undefined;
  }

  let itineraireData;
  try {
    if (dbCard.card_type === 'itineraire' && dbCard.itineraire_data) {
      itineraireData = typeof dbCard.itineraire_data === 'object'
        ? dbCard.itineraire_data
        : JSON.parse(dbCard.itineraire_data);
    }
  } catch (error) {
    console.error('Failed to parse itineraire data:', error);
    itineraireData = undefined;
  }

  return {
    id: dbCard.id,
    title: dbCard.title,
    content: dbCard.content,
    position: {
      x: dbCard.position_x,
      y: dbCard.position_y,
    },
    color: dbCard.color,
    isExpanded: Boolean(dbCard.is_expanded),
    dueDate: dbCard.due_date,
    status: dbCard.status,
    budgetType: dbCard.budget_type as 'total-available' | 'expenses-tracking',
    budgetData: budgetData,
    imageData: dbCard.image_data || undefined,
    mimeType: dbCard.mime_type || undefined,
    cardType: dbCard.card_type,
    locationData: locationData,
    itineraireData: itineraireData
  };
}

function toDbConnection(conn: Connection): DbConnection {
  return {
    start_id: conn.start,
    end_id: conn.end,
    set_id: '', // This will be set by the saveSet function
    style: conn.style,
    color: conn.color,
  };
}

function fromDbConnection(dbConn: DbConnection): Connection {
  return {
    start: dbConn.start_id,
    end: dbConn.end_id,
    style: dbConn.style,
    color: dbConn.color,
  };
}

export const useCardStore = create<CardState>()((set, get) => ({
  cards: [],
  connections: [],
  groupConnections: [],
  groups: [],
  currentSetId: null,
  deleteCard: (id) => {
    set((state) => ({
      cards: state.cards.filter((card) => card.id !== id),
      connections: state.connections.filter(
        (conn) => conn.start !== id && conn.end !== id
      ),
    }));
  },
  addCard: (card) => {
    set((state) => ({
      cards: [...state.cards, card],
    }));
  },
  updateCard: (id, updates) => {
    set((state) => ({
      cards: state.cards.map((card) =>
        card.id === id ? {
          ...card,
          ...updates,
          budgetData: updates.budgetData ? {
            ...card.budgetData,
            ...updates.budgetData
          } : card.budgetData
        } : card
      ),
    }));
  },
  updateCardPosition: (id, position) => {
    set((state) => ({
      cards: state.cards.map((card) =>
        card.id === id ? {
          ...card, 
          position: {
            x: Math.round(position.x),
            y: Math.round(position.y)
          }
        } : card
      ),
    }));
  },
  createGroup: (bounds, name) => {
    const groupId = crypto.randomUUID();
    set((state) => {
      // Find cards within the bounds
      const cardsInGroup = state.cards.filter(card => 
        card.position.x >= bounds.x &&
        card.position.x <= bounds.x + bounds.width &&
        card.position.y >= bounds.y &&
        card.position.y <= bounds.y + bounds.height
      );
      
      return {
        groups: [...state.groups, { 
          id: groupId, 
          name, 
          bounds,
          originalBounds: { width: bounds.width, height: bounds.height },
          isMinimized: false 
        }],
        cards: state.cards.map(card => 
          cardsInGroup.find(c => c.id === card.id)
            ? { ...card, groupId }
            : card
        )
      };
    });
  },
  toggleGroupMinimized: (groupId) => {
    set((state) => {
      const cardsInGroup = state.cards.filter(card => card.groupId === groupId);
      const group = state.groups.find(g => g.id === groupId);
      if (!group) return state;

      const CARD_STACK_OFFSET = 100;
      const CARD_MIN_HEIGHT = 192;
      const CARD_MIN_WIDTH = 384; // Augmenté pour accommoder les noms de fichiers longs
      const PADDING = 48;
      const TOP_OFFSET = 5;

      // Calculate minimized dimensions
      const minimizedHeight = TOP_OFFSET + CARD_MIN_HEIGHT + 
        (Math.max(0, cardsInGroup.length - 1) * CARD_STACK_OFFSET);
      const minimizedWidth = CARD_MIN_WIDTH + PADDING;
      
      return {
        cards: state.cards.map(card => {
          if (card.groupId === groupId) {
            const cardIndex = cardsInGroup.findIndex(c => c.id === card.id);
            // Minimiser les cartes quand le groupe est minimisé
            const shouldBeExpanded = group.isMinimized;
            if (!group.isMinimized) {
              // Store original position when minimizing
              return {
                ...card,
                position: {
                  x: group.bounds.x + PADDING / 2,
                  y: group.bounds.y + TOP_OFFSET + (cardIndex * CARD_STACK_OFFSET)
                },
                originalPosition: card.originalPosition || card.position,
                isExpanded: shouldBeExpanded
              };
            } else {
              // Restore original position when maximizing
              return {
                ...card,
                position: card.originalPosition || card.position,
                originalPosition: undefined,
                isExpanded: shouldBeExpanded
              };
            }
          }
          return card;
        }),
        groups: state.groups.map(group =>
          group.id === groupId
            ? { 
                ...group, 
                isMinimized: !group.isMinimized,
                bounds: group.isMinimized 
                  ? { 
                      ...group.bounds,
                      width: group.originalBounds?.width || group.bounds.width,
                      height: group.originalBounds?.height || group.bounds.height
                    }
                  : { 
                      ...group.bounds, 
                      width: minimizedWidth,
                      height: minimizedHeight
                    }
              }
            : group
        )
      };
    });
  },
  updateGroupBounds: (groupId, bounds) => {
    set((state) => ({
      groups: state.groups.map(group =>
        group.id === groupId
          ? { ...group, bounds }
          : group
      )
    }));
  },
  deleteGroup: (groupId, deleteCards = false) => {
    set((state) => ({
      groups: state.groups.filter(group => group.id !== groupId),
      groupConnections: state.groupConnections.filter(
        conn => conn.start !== groupId && conn.end !== groupId
      ),
      cards: state.cards.map(card =>
        card.groupId === groupId ? (
          deleteCards ? undefined : { ...card, groupId: null }
        ) : card
      ).filter((card): card is Card => card !== undefined),
    }));
  },
  addGroupConnection: (connection, style, color) => {
    set((state) => ({
      groupConnections: [...state.groupConnections, { ...connection, style, color }],
    }));
  },
  deleteGroupConnection: (start, end) => {
    set((state) => ({
      groupConnections: state.groupConnections.filter(
        conn => !(conn.start === start && conn.end === end)
      ),
    }));
  },
  updateGroupConnection: (start, end, updates) => {
    set((state) => ({
      groupConnections: state.groupConnections.map((conn) =>
        conn.start === start && conn.end === end ? { ...conn, ...updates } : conn
      )
    }));
  },
  moveGroup: (groupId, deltaX, deltaY) => {
    set((state) => {
      const group = state.groups.find(g => g.id === groupId);
      if (!group) return state;

      return {
        groups: state.groups.map(g =>
          g.id === groupId
            ? {
                ...g,
                bounds: {
                  ...g.bounds,
                  x: g.bounds.x + deltaX,
                  y: g.bounds.y + deltaY
                }
              }
            : g
        ),
        cards: state.cards.map(card =>
          card.groupId === groupId
            ? {
                ...card,
                position: {
                  x: card.position.x + deltaX,
                  y: card.position.y + deltaY
                }
              }
            : card
        )
      };
    });
  },
  toggleCardExpansion: (id) => {
    set((state) => ({
      cards: state.cards.map((card) =>
        card.id === id ? { ...card, isExpanded: !card.isExpanded } : card
      ),
    }));
  },
  addConnection: (connection, style='dashed', color="red") => {
    console.log('cardStore - addConnection : ' ,{connection:connection, style:style,color:color})
    set((state) => ({
      connections: [...state.connections, { ...connection, style, color }],
    }));
  },
  deleteConnection: (start, end) => {
    set((state) => ({
      connections: state.connections.filter(
        conn => !(conn.start === start && conn.end === end)
      ),
    }));
  },
  updateConnection: (start, end, updates) => {
    set((state) => ({
      connections: state.connections.map((conn) =>
        conn.start === start && conn.end === end ? { ...conn, ...updates } : conn
      ),
    }));
  },
  saveToDb: async (name: string) => {
    try {
      console.log('Starting saveToDb with name:', name);
      const { cards, connections, groups, groupConnections } = get();
      const currentSetId = get().currentSetId;
      const setId = currentSetId || crypto.randomUUID();
      
      // Préparer les données pour l'API
      const payload = {
        id: setId,
        name,
        cards: cards.map(card => {
          const dbCard = toDbCard(card);
          dbCard.set_id = setId;
          return dbCard;
        }),
        connections: connections.map(conn => ({
          start_id: conn.start,
          end_id: conn.end,
          set_id: setId,
          style: conn.style,
          color: conn.color
        })),
        groups: groups.map(group => ({
          id: group.id,
          set_id: setId,
          name: group.name,
          bounds_x: group.bounds.x,
          bounds_y: group.bounds.y,
          bounds_width: group.bounds.width,
          bounds_height: group.bounds.height,
          is_minimized: group.isMinimized,
          original_width: group.originalBounds?.width || null,
          original_height: group.originalBounds?.height || null
        })),
        groupConnections: groupConnections.map(conn => ({
          start_id: conn.start,
          end_id: conn.end,
          set_id: setId,
          style: conn.style,
          color: conn.color
        }))
      };
  
      // Utiliser PUT si nous avons un currentSetId, sinon utiliser POST
      const method = currentSetId ? 'PUT' : 'POST';
      const url = currentSetId 
        ? `http://localhost:3000/api/sets/${currentSetId}`
        : 'http://localhost:3000/api/sets';
  
      console.log(`Sending ${method} request to ${url}`);
  
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Server error: ${errorData.error}\nDetails: ${errorData.details}`);
      }
  
      const data = await response.json();
      set({ currentSetId: setId });
      console.log('Save successful:', data);
      return data;
    } catch (error) {
      console.error('Failed to save to database:', error);
      throw error;
    }
  },
  loadFromDb: async (setId?: string) => {
    try {
      const data = await loadSet(setId);
      set({
        currentSetId: setId,
        cards: data.cards.map(fromDbCard),
        connections: data.connections.map(fromDbConnection),
        groups: data.groups?.map(group => ({
          id: group.id,
          name: group.name,
          bounds: {
            x: group.bounds_x,
            y: group.bounds_y,
            width: group.bounds_width,
            height: group.bounds_height
          },
          isMinimized: group.is_minimized,
          originalBounds: group.original_width && group.original_height ? {
            width: group.original_width,
            height: group.original_height
          } : undefined
        })) || [],
        groupConnections: data.groupConnections?.map(conn => ({
          start: conn.start_id,
          end: conn.end_id,
          style: conn.style,
          color: conn.color
        })) || []
      });
      console.log('Save successful');
    } catch (error) {
      console.error('Failed to load from database:', error);
      set({ cards: [], connections: [] });
      throw error;
    }
  },
  loadSets: getAllSets,
}));