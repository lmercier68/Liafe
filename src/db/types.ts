export interface DbCardSet {
  id: string;
  name: string;
  created_at: number;
}

export interface DbLocationCard {
  id: string;
  card_id: string;
  location_data: string; // JSON string contenant toutes les données de localisation
}

export interface LocationData {
  streetNumber?: string;
  street?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  coordinates?: [number, number];
}
export interface Tile {
  x: number;
  y: number;
}
export interface TileResponse {
  tiles: {
    x: number;
    y: number;
    path: string;
  }[];
}
export interface ItineraireData {
   start: {
      address: string;
      coordinates?: [number, number];
    };
    end: {
      address: string;
      coordinates?: [number, number];
    };
};

export interface DbCard {
  id: string;
  set_id: string;
  title: string;
  content: string;
  position_x: number;
  position_y: number;
  color: string;
  is_expanded: number;
  due_date: string | null;
  status: 'todo' | 'in-progress' | 'done' | null;
  card_type: 'standard' | 'budget' | 'image' | 'contact' | 'location' | 'itineraire' | 'note' | 'checklist';
  budget_type: string | null;
  budget_data: string | null;
  image_data: string | null;
  mime_type: string | null;
  location_data?: string | null;
  itineraire_data?:string | null;
}
export interface DbTask {
    id: string;
    set_id: string;
    name: string;
    dueDate?: string | null;
    isCompleted: boolean | null;
    completedDate?: string | null;
    cardId: string; // Ajout de l'ID de la carte parente
}


export interface DbConnection {
  start_id: string;
  end_id: string;
  set_id: string;
  style: 'solid' | 'dashed';
  color: string;
}

export interface DbGroup {
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
}
