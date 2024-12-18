import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import bodyParser from 'body-parser';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
let db = null;
let dbConfig = null;

//adresse definissant le path en Db pour les fichier images de tile des map
const SERVER_ADDRESS = process.env.SERVER_ADDRESS || 'http://localhost:5174';


async function loadDbConfig() {
  try {
    // Try to load config from file
    const fs = await import('fs');
    const path = await import('path');
    const configPath = path.join(process.cwd(), 'db-config.json');
    
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, 'utf8');
      dbConfig = JSON.parse(configData);
    } else {
      // Use default config
      dbConfig = {
        host: 'localhost',
        user: 'root',
        password: '',
        port: 3306
      };
      // Save default config
      fs.writeFileSync(configPath, JSON.stringify(dbConfig, null, 2));
    }
  } catch (error) {
    console.error('Error loading database config:', error);
    dbConfig = {
      host: 'localhost',
      user: 'root',
      password: '',
      port: 3306
    };
  }
}

async function initializeDatabase(config) {
  try {
    db = await mysql.createConnection({
      host: config.host,
      user: config.user,
      password: config.password,
      port: config.port
    });
  
  // Create database and tables if they don't exist
  await db.query(`CREATE DATABASE IF NOT EXISTS card_manager`);
  await db.query(`USE card_manager`);
  
  // Create app_params table for storing application settings
  await db.query(`
    CREATE TABLE IF NOT EXISTS app_params (
      id VARCHAR(36) PRIMARY KEY,
      param_key VARCHAR(50) NOT NULL UNIQUE,
      param_value TEXT NOT NULL,
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL
    )
  `);

  // Create tables
  await db.query(`
    CREATE TABLE IF NOT EXISTS color_legends (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      color_mappings JSON NOT NULL,
      created_at BIGINT NOT NULL
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS card_sets (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at BIGINT NOT NULL
  )
  `);

await db.query(`
  CREATE TABLE IF NOT EXISTS cards (
    id VARCHAR(36) PRIMARY KEY,
    set_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    position_x INT NOT NULL,
    position_y INT NOT NULL,
    color VARCHAR(50) NOT NULL,
    is_expanded BOOLEAN NOT NULL DEFAULT FALSE,
    due_date VARCHAR(50),
    status VARCHAR(20),
    budget_type VARCHAR(20),
    budget_data JSON,
    card_type VARCHAR(50),
    FOREIGN KEY (set_id) REFERENCES card_sets(id) ON DELETE CASCADE
  )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id VARCHAR(36) PRIMARY KEY,
      set_id VARCHAR(36) NOT NULL,
      name VARCHAR(255) NOT NULL,
      due_date TIMESTAMP,
      is_completed BOOLEAN DEFAULT FALSE,
      completed_date TIMESTAMP,
      card_id VARCHAR(255) NOT NULL,
      start VARCHAR(36),
      end VARCHAR(36),
      FOREIGN KEY (set_id) REFERENCES card_sets(id) ON DELETE CASCADE
    );
  `);

await db.query(`
  CREATE TABLE IF NOT EXISTS image_cards (
    id VARCHAR(36) PRIMARY KEY,
    card_id VARCHAR(36) NOT NULL,
    image_data MEDIUMBLOB NOT NULL,
    mime_type VARCHAR(50) NOT NULL,
    FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
  )
`);

await db.query(`
  CREATE TABLE IF NOT EXISTS connections (
    start_id VARCHAR(36) NOT NULL,
    end_id VARCHAR(36) NOT NULL,
    set_id VARCHAR(36) NOT NULL,
    style VARCHAR(20) NOT NULL,
    color VARCHAR(50) NOT NULL,
    PRIMARY KEY (start_id, end_id, set_id),
    FOREIGN KEY (start_id) REFERENCES cards(id) ON DELETE CASCADE,
    FOREIGN KEY (end_id) REFERENCES cards(id) ON DELETE CASCADE,
    FOREIGN KEY (set_id) REFERENCES card_sets(id) ON DELETE CASCADE
  )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS tasksConnections (
      set_id VARCHAR(36) NOT NULL,
      start VARCHAR(36) NOT NULL,
      end VARCHAR(36) NOT NULL,
      style VARCHAR(20) NOT NULL,
      color VARCHAR(50) NOT NULL,
      FOREIGN KEY (set_id) REFERENCES card_sets(id) ON DELETE CASCADE
    )
    `);
  

await db.query(`
  CREATE TABLE IF NOT EXISTS documents (
    id VARCHAR(36) PRIMARY KEY,
    set_id VARCHAR(36) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    comment TEXT,
    created_at BIGINT NOT NULL,
    FOREIGN KEY (set_id) REFERENCES card_sets(id) ON DELETE CASCADE
  )
  `);

await db.query(`
  CREATE TABLE IF NOT EXISTS contacts (
    id VARCHAR(36) PRIMARY KEY,
    title ENUM('M.', 'Mme.', 'Société') NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    company VARCHAR(255),
    position VARCHAR(255),
    street_number VARCHAR(50),
    street VARCHAR(255),
    postal_code VARCHAR(20),
    city VARCHAR(255),
    country VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50)
  )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS location_cards (
      id VARCHAR(36) PRIMARY KEY,
      card_id VARCHAR(36) NOT NULL,
      location_data JSON NOT NULL,
      FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS itineraire_cards (
      id VARCHAR(36) PRIMARY KEY,
      card_id VARCHAR(36) NOT NULL,
      itineraire_data JSON NOT NULL,
      FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
    )
  `);

await db.query(`
  CREATE TABLE IF NOT EXISTS group_connections (
    start_id VARCHAR(36) NOT NULL,
    end_id VARCHAR(36) NOT NULL,
    set_id VARCHAR(36) NOT NULL,
    style VARCHAR(20) NOT NULL,
    color VARCHAR(50) NOT NULL,
    PRIMARY KEY (start_id, end_id, set_id),
    FOREIGN KEY (set_id) REFERENCES card_sets(id) ON DELETE CASCADE
  )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS map_tiles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      zoom INT NOT NULL,
      bounds_x INT NOT NULL,
      bounds_y INT NOT NULL,
      image_path VARCHAR(50)
    )`);
await db.query(`
  CREATE TABLE IF NOT EXISTS groups_table (
    id VARCHAR(36) PRIMARY KEY,
    set_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    bounds_x INT NOT NULL,
    bounds_y INT NOT NULL,
    bounds_width INT NOT NULL,
    bounds_height INT NOT NULL,
    is_minimized BOOLEAN NOT NULL DEFAULT FALSE,
    original_width INT,
    original_height INT,
    FOREIGN KEY (set_id) REFERENCES card_sets(id) ON DELETE CASCADE
  );
  `);
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

const app = express();
app.use(cors());

// Increase JSON payload limit to 50MB
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

// API Routes
app.get('/api/contacts', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM contacts ORDER BY company, last_name, first_name');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/contacts', async (req, res) => {
  const contact = req.body;
  try {
    await db.query(
      `INSERT INTO contacts (
        id, title, first_name, last_name, company, position,
        street_number, street, postal_code, city, country, email, phone
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        contact.id,
        contact.title,
        contact.firstName,
        contact.lastName,
        contact.company,
        contact.position,
        contact.streetNumber,
        contact.street,
        contact.postalCode,
        contact.city,
        contact.country,
        contact.email,
        contact.phone
      ]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/contacts/:id', async (req, res) => {
  const contact = req.body;
  try {
    await db.query(
      `UPDATE contacts SET 
        title = ?, 
        first_name = ?, 
        last_name = ?, 
        company = ?, 
        position = ?,
        street_number = ?, 
        street = ?, 
        postal_code = ?, 
        city = ?, 
        country = ?, 
        email = ?, 
        phone = ?
      WHERE id = ?`,
      [
        contact.title,
        contact.firstName,
        contact.lastName,
        contact.company,
        contact.position,
        contact.streetNumber,
        contact.street,
        contact.postalCode,
        contact.city,
        contact.country,
        contact.email,
        contact.phone,
        req.params.id
      ]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/sets', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM card_sets ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/sets/:setId', async (req, res) => {
  
  try {
    const [cards] = await db.query('SELECT * FROM cards WHERE set_id = ?', [req.params.setId]);
    
    // Fetch image data for image cards
    for (const card of cards) {
      if (card.card_type === 'image') {
        const [imageData] = await db.query(
          'SELECT image_data, mime_type FROM image_cards WHERE card_id = ?',
          [card.id]
        );
        if (imageData.length > 0) {
          card.image_data = imageData[0].image_data.toString('base64');
          card.mime_type = imageData[0].mime_type;
        }
      }
      
      // Fetch location data for location cards
      if (card.card_type === 'location') {
        const [locationData] = await db.query(
          'SELECT location_data FROM location_cards WHERE card_id = ?',
          [card.id]
        );
        if (locationData.length > 0) {
          card.location_data = locationData[0].location_data;
        }
      }
      if (card.card_type === 'itineraire') {
        const [itineraireData] = await db.query(
          'SELECT itineraire_data FROM itineraire_cards WHERE card_id = ?',
          [card.id]
        );
        if (itineraireData.length > 0) {
          card.itineraire_data = itineraireData[0].itineraire_data;
        }
      }
    }
    
    const [connections] = await db.query('SELECT * FROM connections WHERE set_id = ?', [req.params.setId]);
    const [groups] = await db.query('SELECT * FROM groups_table WHERE set_id = ?', [req.params.setId]);
    const [groupConnections] = await db.query('SELECT * FROM group_connections WHERE set_id = ?', [req.params.setId]);
    
    res.json({ cards, connections, groups, groupConnections });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/documents', async (req, res) => {
  const { setId, displayName, filePath, comment } = req.body;
  const id = crypto.randomUUID();

  try {
    await db.query(
      'INSERT INTO documents (id, set_id, display_name, file_path, comment, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [id, setId, displayName, filePath, comment, Date.now()]
    );
    res.json({ success: true, id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/sets', async (req, res) => {
  const { name, cards, tasks,taskConnections, connections, groups, groupConnections } = req.body;
  const setId = req.body.id;

  try {
    console.log('Starting transaction for set:', setId);
    await db.query('START TRANSACTION');

    console.log('Inserting card set:', { id: setId, name });
    await db.query(
      'INSERT INTO card_sets (id, name, created_at) VALUES (?, ?, ?)',
      [setId, name, Date.now()]
    );

    console.log('Processing cards...');
    for (const card of cards) {
      try {
        console.log('Processing card:', { id: card.id, type: card.card_type });
        
        // Prepare budget data
        const budgetData = card.budget_data ? 
          (typeof card.budget_data === 'string' ? card.budget_data : JSON.stringify(card.budget_data))
          : null;

        // Insert card
        await db.query(
          `INSERT INTO cards (
            id, set_id, title, content, position_x, position_y, 
            color, is_expanded, budget_type, budget_data, card_type
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            card.id,
            setId,
            card.title,
            card.content,
            card.position_x,
            card.position_y,
            card.color,
            card.is_expanded,
            card.budget_type || null,
            budgetData,
            card.card_type || 'standard'
          ]
        );

        // Handle image cards
        if (card.card_type === 'image' && card.image_data) {
          console.log('Processing image data for card:', card.id);
          await db.query(
            'INSERT INTO image_cards (id, card_id, image_data, mime_type) VALUES (?, ?, ?, ?)',
            [
              crypto.randomUUID(),
              card.id,
              Buffer.from(card.image_data, 'base64'),
              card.mime_type
            ]
          );
        }

        // Handle location cards
        if (card.card_type === 'location' && card.location_data) {
          console.log('Processing location data for card:', card.id);
          const locationData = typeof card.location_data === 'string'
            ? card.location_data
            : JSON.stringify(card.location_data);

          await db.query(
            'INSERT INTO location_cards (id, card_id, location_data) VALUES (?, ?, ?)',
            [
              crypto.randomUUID(),
              card.id,
              locationData
            ]
          );
        }

        if (card.card_type === 'itineraire') {
          console.log('Processing itineraire data for card:', card.id);
          const itineraireData = typeof card.itineraireData === 'string'
            ? card.itineraireData
            : JSON.stringify(card.itineraire_data);
        
          await db.query(
            'INSERT INTO itineraire_cards (id, card_id, itineraire_data) VALUES (?, ?, ?)',
            [
              crypto.randomUUID(),
              card.id,
              itineraireData
            ]
          );
        }
      } catch (cardError) {
        console.error('Error processing card:', card.id, cardError);
        throw cardError;
      }
    }
    console.log('Processing tasks...');
    for (const task of tasks) {
      try {
        console.log('Processing task:', { id: task.id, name: task.name, parent_card: task.cardId ,from:task.connectingFrom, To: task.conntecingTo});

        // Insert card
        await db.query(
          `INSERT INTO tasks (
            id, set_id, name, due_date, is_completed, completed_date, 
            card_id, start, end
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            task.id,
            task.set_id,
            task.name,
            task.dueDate,
            task.isCompleted,
            task.completedDate,
            task.cardId,
            task.connectingFrom,
            task.connectingTo
          ]
        );

      } catch (taskError) {
        console.error('Error processing task:', task.id, taskError);
        throw taskError;
      }
    }

    console.log('Processing tasks Connections...');
    console.log('Processing task CONNECTION:',taskConnections);
    for (const taskConnection of taskConnections) {
      try {
        console.log('Processing task connections:', { set_id: taskConnection.set_id,from: taskConnection.start, To: taskConnection.end, style: taskConnection.style ,color:taskConnection.color});
        if( taskConnection.set_id &&
          taskConnection.start &&
          taskConnection.end &&
          taskConnection.style &&
          taskConnection.color){
        // Insert card
        await db.query(
          `INSERT INTO tasksConnections (
            set_id,start, end,style,color
          ) VALUES (?, ?, ?, ?, ?)`,
          [
            taskConnection.set_id,
            taskConnection.start,
            taskConnection.end,
            taskConnection.style,
            taskConnection.color
   
          ]
        );}

      } catch (taskError) {
        console.error('Error processing task connection:', taskConnection.start +  '-' + taskConnection.end, taskError);
        throw taskError;
      }
    }
    console.log('Processing connections...');
    for (const conn of connections) {
      await db.query(
        'INSERT INTO connections (start_id, end_id, set_id, style, color) VALUES (?, ?, ?, ?, ?)',
        [conn.start_id, conn.end_id, setId, conn.style, conn.color]
      );
    }

    console.log('Processing groups...');
    for (const group of groups) {
      await db.query(
        `INSERT INTO groups_table (
          id, set_id, name, bounds_x, bounds_y, bounds_width, bounds_height, 
          is_minimized, original_width, original_height
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          group.id,
          setId,
          group.name,
          group.bounds_x,
          group.bounds_y,
          group.bounds_width,
          group.bounds_height,
          group.is_minimized,
          group.original_width,
          group.original_height
        ]
      );
    }

    console.log('Processing group connections...');
    for (const conn of groupConnections) {
      await db.query(
        'INSERT INTO group_connections (start_id, end_id, set_id, style, color) VALUES (?, ?, ?, ?, ?)',
        [conn.start_id, conn.end_id, setId, conn.style, conn.color]
      );
    }

    console.log('Committing transaction...');
    await db.query('COMMIT');
    console.log('Transaction committed successfully');
    res.json({ success: true, setId });
  } catch (error) {
    console.error('Error saving set:', error);
    try {
      console.log('Rolling back transaction...');
      await db.query('ROLLBACK');
      console.log('Rollback successful');
    } catch (rollbackError) {
      console.error('Rollback failed:', rollbackError);
    }
    res.status(500).json({ 
      error: error.message,
      details: error.stack,
      code: error.code 
    });
  }
});


app.get('/api/tasks/:cardId', async (req, res) => {
  try {
    console.log('Début de la recherche des tâches');

    // Récupérer les tâches de la table `tasks` en fonction de `card_id`
    const [taskRows] = await db.query(
      'SELECT * FROM tasks WHERE card_id = ?',
      [req.params.cardId]
    );

    // Initialiser une constante pour stocker les enregistrements de `tasksConnections`
    let tasksConnectionRows = [];
    console.log(' tasks retournée: ' , {tasks: taskRows})
    

    // Pour chaque tâche trouvée, rechercher les enregistrements correspondants dans `tasksConnections`
    for (const task of taskRows) {
      const [connections] = await db.query(
        'SELECT * FROM tasksConnections WHERE set_id = ? AND (start = ? OR end = ?)',
        [task.set_id, task.id, task.id]
      );
      console.log(' tasks id: ' , {tasks_id: task.id})
      tasksConnectionRows = tasksConnectionRows.concat(connections);
    }
console.log(' tasksConnections retournée: ' , {tasksConnections: tasksConnectionRows})
    // Renvoyer les tâches et les connexions trouvées
    res.json({ tasks: taskRows, tasksConnections: tasksConnectionRows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
async function loadTasksForCard(cardId) {
  try {
    const [rows] = await db.query('SELECT * FROM tasks WHERE card_id = ?', [cardId]);
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      dueDate: row.due_date,
      isCompleted: row.is_completed,
      completedDate: row.completed_date,
      cardId: row.card_id,
      isConnecting: false,
      connectFrom: null,
      incomingConnections: []
    }));
  } catch (error) {
    console.error('Failed to load tasks for card:', error);
    throw error;
  }
}


app.put('/api/sets/:setId', async (req, res) => {
  const { name, cards, tasks,taskConnections, connections, groups, groupConnections } = req.body;
  const setId = req.params.setId;

  try {
    console.log('Starting update transaction for set:', setId);
    await db.query('START TRANSACTION');

    // Update existing set name
    console.log('Updating set name:', name);
    await db.query(
      'UPDATE card_sets SET name = ? WHERE id = ?',
      [name, setId]
    );

    // Delete existing data
    console.log('Deleting existing data...');
    await db.query('DELETE FROM location_cards WHERE card_id IN (SELECT id FROM cards WHERE set_id = ?)', [setId]);
    await db.query('DELETE FROM itineraire_cards WHERE card_id IN (SELECT id FROM cards WHERE set_id = ?)', [setId]);
    await db.query('DELETE FROM image_cards WHERE card_id IN (SELECT id FROM cards WHERE set_id = ?)', [setId]);
    await db.query('DELETE FROM cards WHERE set_id = ?', [setId]);
    await db.query('DELETE FROM connections WHERE set_id = ?', [setId]);
    await db.query('DELETE FROM groups_table WHERE set_id = ?', [setId]);
    await db.query('DELETE FROM group_connections WHERE set_id = ?', [setId]);
    await db.query('DELETE FROM tasksConnections WHERE set_id = ?', [setId]);
    await db.query('DELETE FROM tasks WHERE set_id = ?', [setId]);

    // Insert new data
    console.log('Inserting updated cards...');
    for (const card of cards) {
      try {
        console.log('Processing card:', { id: card.id, type: card.card_type });
        
        const budgetData = card.budget_data ? 
          (typeof card.budget_data === 'string' ? card.budget_data : JSON.stringify(card.budget_data))
          : null;
        //insert to card table
        await db.query(
          `INSERT INTO cards (
            id, set_id, title, content, position_x, position_y, 
            color, is_expanded, budget_type, budget_data, card_type
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            card.id,
            setId,
            card.title,
            card.content,
            card.position_x,
            card.position_y,
            card.color,
            card.is_expanded,
            card.budget_type || null,
            budgetData,
            card.card_type || 'standard'
          ]
        );

        if (card.card_type === 'image' && card.image_data) {
          console.log('Processing image data for card:', card.id);
          await db.query(
            'INSERT INTO image_cards (id, card_id, image_data, mime_type) VALUES (?, ?, ?, ?)',
            [
              crypto.randomUUID(),
              card.id,
              Buffer.from(card.image_data, 'base64'),
              card.mime_type
            ]
          );
        }

        if (card.card_type === 'location' && card.location_data) {
          console.log('Processing location data for card:', card.id);
          const locationData = typeof card.location_data === 'string'
            ? card.location_data
            : JSON.stringify(card.location_data);

          await db.query(
            'INSERT INTO location_cards (id, card_id, location_data) VALUES (?, ?, ?)',
            [
              crypto.randomUUID(),
              card.id,
              locationData
            ]
          );
        }

        if (card.card_type === 'itineraire' && card.itineraire_data) {
          console.log('Processing itineraire data for card:', card.id);
          const itineraireData = typeof card.itineraire_data === 'string'
            ? card.itineraire_data
            : JSON.stringify(card.itineraire_data);

          await db.query(
            'INSERT INTO itineraire_cards (id, card_id, itineraire_data) VALUES (?, ?, ?)',
            [
              crypto.randomUUID(),
              card.id,
              itineraireData
            ]
          );
        }
      } catch (cardError) {
        console.error('Error processing card:', card.id, cardError);
        throw cardError;
      }
    }

    // Insert Task data
    console.log('Processing tasks...');
    console.log('Processing TASKS',tasks);
    for (const task of tasks) {
      try {
        console.log('Processing task:', { id: task.id, name: task.name, parent_card: task.cardId ,from:task.connectingFrom, To: task.conntecingTo});

        // Insert card
        await db.query(
          `INSERT INTO tasks (
            id, set_id, name, due_date, is_completed, completed_date, 
            card_id, start, end
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            task.id,
            task.set_id,
            task.name,
            task.dueDate,
            task.isCompleted,
            task.completedDate,
            task.cardId,
            task.connectingFrom,
            task.connectingTo
          ]
        );

      } catch (taskError) {
        console.error('Error processing task:', task.id, taskError);
        throw taskError;
      }
    }

   // Insert TasksConnection
   console.log('Processing tasks Connections...');
   console.log('Processing task CONNECTION:',taskConnections);
   for (const taskConnection of taskConnections) {
     try {
       console.log('Processing task connections:', { set_id: taskConnection.set_id,from: taskConnection.start, To: taskConnection.end, style: taskConnection.style ,color:taskConnection.color});
       if( taskConnection.set_id &&
         taskConnection.start &&
         taskConnection.end &&
         taskConnection.style &&
         taskConnection.color){
       // Insert card
       await db.query(
         `INSERT INTO tasksConnections (
           set_id,start, end,style,color
         ) VALUES (?, ?, ?, ?, ?)`,
         [
           taskConnection.set_id,
           taskConnection.start,
           taskConnection.end,
           taskConnection.style,
           taskConnection.color
  
         ]
       );}

     } catch (taskError) {
       console.error('Error processing task connection:', taskConnection.start +  '-' + taskConnection.end, taskError);
       throw taskError;
     }
   }

    // Insert other data...
    console.log('Processing connections...');
    for (const conn of connections) {
      await db.query(
        'INSERT INTO connections (start_id, end_id, set_id, style, color) VALUES (?, ?, ?, ?, ?)',
        [conn.start_id, conn.end_id, setId, conn.style, conn.color]
      );
    }

    console.log('Processing groups...');
    for (const group of groups) {
      await db.query(
        `INSERT INTO groups_table (
          id, set_id, name, bounds_x, bounds_y, bounds_width, bounds_height, 
          is_minimized, original_width, original_height
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          group.id,
          setId,
          group.name,
          group.bounds_x,
          group.bounds_y,
          group.bounds_width,
          group.bounds_height,
          group.is_minimized,
          group.original_width,
          group.original_height
        ]
      );
    }

    console.log('Processing group connections...');
    for (const conn of groupConnections) {
      await db.query(
        'INSERT INTO group_connections (start_id, end_id, set_id, style, color) VALUES (?, ?, ?, ?, ?)',
        [conn.start_id, conn.end_id, setId, conn.style, conn.color]
      );
    }

    console.log('Committing transaction...');
    await db.query('COMMIT');
    console.log('Update completed successfully');
    res.json({ success: true, setId });
  } catch (error) {
    console.error('Error updating set:', error);
    try {
      console.log('Rolling back transaction...');
      await db.query('ROLLBACK');
      console.log('Rollback successful');
    } catch (rollbackError) {
      console.error('Rollback failed:', rollbackError);
    }
    res.status(500).json({ 
      error: error.message,
      details: error.stack,
      code: error.code 
    });
  }
});

app.post('/api/verifyTiles', async (req, res) => {
  const { zoom, tiles } = req.body;

  if (!zoom || !Array.isArray(tiles)) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  try {
    // Construire la requête SQL pour vérifier les tuiles présentes et récupérer les chemins
    const placeholders = tiles.map(() => '(?, ?)').join(', ');
    const values = tiles.flatMap(tile => [tile.x, tile.y]);

    console.log('placeholders: ', placeholders);
    console.log('values: ', values);

    const query = `
      SELECT bounds_x, bounds_y, image_path
      FROM map_tiles
      WHERE (bounds_x, bounds_y) IN (${placeholders})
      AND zoom = ?
    `;

    const result = await db.query(query, [...values, zoom]);

    // Vérifiez que la réponse est correctement structurée
    if (!result || !result[0]) {
      console.error('Unexpected database response:', result);
      return res.status(500).json({ error: 'Unexpected database response' });
    }

    // Extraire les tuiles présentes de la réponse
    const existingTiles = result[0].map(row => ({ x: row.bounds_x, y: row.bounds_y, path: row.image_path }));

    // Trouver les tuiles manquantes
    const missingTiles = tiles.filter(tile => !existingTiles.some(existingTile => existingTile.x === tile.x && existingTile.y === tile.y));

    // Télécharger les tuiles manquantes
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const savePath = path.join(__dirname, 'public', 'tiles');
    const downloadPromises = missingTiles.map(tile =>
      downloadTile(zoom, tile.x, tile.y, savePath)
    );

    await Promise.all(downloadPromises);

    // Ajouter les nouvelles tuiles à la base de données
    const insertPromises = missingTiles.map(tile =>
      db.query(
        'INSERT INTO map_tiles ( zoom, bounds_x, bounds_y, image_path) VALUES (?, ?, ?, ?)',
        [
          
          zoom,
          tile.x,
          tile.y,
          `${SERVER_ADDRESS}/tiles/${zoom}/${tile.x}/${tile.y}.png`
        ]
      )
    );

    await Promise.all(insertPromises);

    // Retourner les chemins de toutes les tuiles
    const allTiles = [...existingTiles, ...missingTiles.map(tile => ({ x: tile.x, y: tile.y, path: `${SERVER_ADDRESS}/tiles/${zoom}/${tile.x}/${tile.y}.png` }))];
    res.json({ tiles: allTiles });
  } catch (error) {
    console.error('Error verifying and downloading tiles:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

function downloadTile(z, x, y, savePath) {
  const url = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
  const filePath = path.join(savePath, `${z}`, `${x}`, `${y}.png`);

  return new Promise((resolve, reject) => {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'image/png',
        'Connection': 'keep-alive'
      },
      agent: new https.Agent({ keepAlive: true })
    }, (res) => {
      if (res.statusCode === 200) {
        const fileStream = fs.createWriteStream(filePath);
        res.pipe(fileStream);
        fileStream.on('finish', () => {
          resolve();
        });
        fileStream.on('error', (err) => {
          console.error(`Error writing file for tile ${z}/${x}/${y}:`, err);
          reject(err);
        });
      } else {
        console.error(`Failed to download tile: ${url}, status code: ${res.statusCode}`);
        reject(new Error(`Failed to download tile: ${url}, status code: ${res.statusCode}`));
      }
    });
    req.on('error', (err) => {
      console.error(`Error downloading tile ${z}/${x}/${y}:`, err);
      reject(err);
    });
  });
}

const port = 3000;

async function startServer() {
  await loadDbConfig();
  
  // Use default config initially
  await initializeDatabase(dbConfig);

  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

// Add endpoint to update database connection
app.post('/api/db-config', async (req, res) => {
  try {
    const config = req.body;
    
    // Validate config
    if (!config.host || !config.user || typeof config.port !== 'number') {
      return res.status(400).json({ 
        error: 'Invalid configuration. Host, user and port are required.' 
      });
    }
    
    // Close existing connection if it exists
    if (db) {
      await db.end();
    }

    // Save config to file
    const fs = await import('fs');
    const path = await import('path');
    const configPath = path.join(process.cwd(), 'db-config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    // Update global config
    dbConfig = config;
    
    // Update global config
    dbConfig = config;
    
    // Initialize with new config
    await initializeDatabase(dbConfig);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to update database connection:', error);
    res.status(500).json({ error: error.message || 'Failed to update database connection' });
    
    // Try to reconnect with previous config
    try {
      if (db) {
        await db.end();
      }
      await initializeDatabase(dbConfig);
    } catch (reconnectError) {
      console.error('Failed to reconnect with previous config:', reconnectError);
    }
  }
});

app.post('/api/image-cards', async (req, res) => {
  try {
    const { cardId, imageData, mimeType } = req.body;
    const id = crypto.randomUUID();

    await db.query(
      'INSERT INTO image_cards (id, card_id, image_data, mime_type) VALUES (?, ?, ?, ?)',
      [id, cardId, Buffer.from(imageData, 'base64'), mimeType]
    );

    res.json({ success: true, id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/image-cards/:cardId', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT image_data, mime_type FROM image_cards WHERE card_id = ?',
      [req.params.cardId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const { image_data, mime_type } = rows[0];
    res.json({
      imageData: image_data.toString('base64'),
      mimeType: mime_type
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Color Legend endpoints
app.get('/api/color-legends', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM color_legends ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/color-legends', async (req, res) => {
  try {
    const { name, colorMappings } = req.body;
    const id = crypto.randomUUID();
    
    await db.query(
      'INSERT INTO color_legends (id, name, color_mappings, created_at) VALUES (?, ?, ?, ?)',
      [id, name, JSON.stringify(colorMappings), Date.now()]
    );
    
    res.json({ success: true, id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/color-legends/:id', async (req, res) => {
  try {
    const { name, colorMappings } = req.body;
    
    await db.query(
      'UPDATE color_legends SET name = ?, color_mappings = ? WHERE id = ?',
      [name, JSON.stringify(colorMappings), req.params.id]
    );
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/color-legends/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM color_legends WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Language settings endpoints
app.get('/api/app-params/language', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT param_value FROM app_params WHERE param_key = ?',
      ['language']
    );
    res.json({ language: rows.length > 0 ? rows[0].param_value : 'fr' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/app-params/language', async (req, res) => {
  try {
    const { language } = req.body;
    if (!['fr', 'en', 'es'].includes(language)) {
      return res.status(400).json({ error: 'Invalid language' });
    }
    
    const id = crypto.randomUUID();
    const now = Date.now();
    
    await db.query('START TRANSACTION');
    
    // Delete existing language setting if exists
    await db.query('DELETE FROM app_params WHERE param_key = ?', ['language']);
    
    // Insert new language setting
    await db.query(
      'INSERT INTO app_params (id, param_key, param_value, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      [id, 'language', language, now, now]
    );
    
    await db.query('COMMIT');
    res.json({ success: true });
  } catch (error) {
    await db.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  }
});

// Start the server
startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});