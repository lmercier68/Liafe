export interface DbCardSet {
  id: string;
  name: string;
  created_at: number;
}

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
  card_type: 'standard' | 'budget' | 'image' | 'contact';
  budget_type: string | null;
  budget_data: string | null;
  image_data: string | null;
  mime_type: string | null;
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