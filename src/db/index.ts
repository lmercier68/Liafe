import type { DbCard, DbConnection, DbCardSet, DbGroup, Tile, TileResponse } from './types';



const API_URL = 'http://localhost:3000/api';

export async function getAllSets(): Promise<DbCardSet[]> {
  try {
    const response = await fetch(`${API_URL}/sets`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to load sets:', error);
    return [];
  }
}

export async function loadSet(setId?: string): Promise<{ 
  cards: DbCard[], 
  connections: DbConnection[],
  groups: DbGroup[],
  groupConnections: DbConnection[]
}> {
  if (!setId) {
    return { cards: [], connections: [], groups: [], groupConnections: [] };
  }
  
  try {
    const response = await fetch(`${API_URL}/sets/${setId}`);
    const data = await response.json();
    
    return {
      cards: data.cards || [],
      connections: data.connections || [],
      groups: data.groups || [],
      groupConnections: data.groupConnections || []
    };
  } catch (error) {
    console.error('Failed to load set:', error);
    throw new Error('Failed to load card set from database');
  }
}

export async function saveSet(
  name: string,
  cards: DbCard[],
  connections: DbConnection[],
  groups: Array<{
    id: string;
    set_id: string;
    name: string;
    bounds_x: number;
    bounds_y: number;
    bounds_width: number;
    bounds_height: number;
    is_minimized: boolean;
    original_width: number | null;
    original_height: number | null;
  }>,
  groupConnections: DbConnection[],
  existingSetId?: string | null
): Promise<string> {
  try {
    const setId = existingSetId || crypto.randomUUID();
    const method = existingSetId ? 'PUT' : 'POST';
    const endpoint = existingSetId ? `${API_URL}/sets/${existingSetId}` : `${API_URL}/sets`;

    const response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: setId,
        name,
        cards,
        connections,
        groups,
        groupConnections
      }),
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to save card set');
    }

    return setId;
  } catch (error) {
    console.error('Failed to save set:', error);
    throw new Error('Failed to save card set to database');
  }
}
export async function verifyExistingTiles(zoom: number, tiles: Tile[]): Promise<TileResponse> {
  try {
    const method = 'POST';
    const endpoint = `${API_URL}/verifyTiles`;
    const response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        zoom,
        tiles
      }),
    });
    const data = await response.json();
    console.log('Data in verifyTiles (index.ts)', data);
    return data;
  } catch (error) {
    console.error('Failed to verify existing tiles:', error);
    throw new Error('Failed to verify existing tiles');
  }
}