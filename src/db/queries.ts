export const QUERIES = {
  CREATE_TABLES: `
    CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY,
      set_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      position_x INTEGER NOT NULL,
      position_y INTEGER NOT NULL,
      color TEXT NOT NULL,
      is_expanded INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (set_id) REFERENCES card_sets(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS card_sets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS connections (
      start_id TEXT NOT NULL,
      end_id TEXT NOT NULL,
      set_id TEXT NOT NULL,
      style TEXT NOT NULL,
      color TEXT NOT NULL,
      PRIMARY KEY (start_id, end_id, set_id),
      FOREIGN KEY (start_id) REFERENCES cards(id) ON DELETE CASCADE,
      FOREIGN KEY (end_id) REFERENCES cards(id) ON DELETE CASCADE,
      FOREIGN KEY (set_id) REFERENCES card_sets(id) ON DELETE CASCADE
    );
  `,
  SELECT_ALL_SETS: 'SELECT * FROM card_sets ORDER BY created_at DESC',
  SELECT_CARDS_BY_SET: 'SELECT * FROM cards WHERE set_id = ?',
  SELECT_CONNECTIONS_BY_SET: 'SELECT * FROM connections WHERE set_id = ?',
  INSERT_SET: 'INSERT INTO card_sets (id, name, created_at) VALUES (?, ?, ?)',
  INSERT_CARD: `
    INSERT INTO cards (id, set_id, title, content, position_x, position_y, color, is_expanded)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `,
  INSERT_CONNECTION: `
    INSERT INTO connections (start_id, end_id, set_id, style, color)
    VALUES (?, ?, ?, ?, ?)
  `
} as const;