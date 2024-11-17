import initSqlJs from 'sql.js';

const LOCAL_DB_NAME = 'diary_local.db';
const SERVER_DB_NAME = 'diary_server.db';

let dbInstance = null;
let serverOrigin = '';

// Initialize the database
export const initDb = async (isServerMode = false, origin = '') => {
  if (dbInstance) return dbInstance;

  try {
    const SQL = await initSqlJs({
      locateFile: file => '/sql-wasm.wasm'
    });

    if (isServerMode && origin) {
      // Fetch data from server
      const response = await fetch(`${origin}/api/diary`);
      if (!response.ok) {
        throw new Error('Failed to fetch data from server.');
      }
      const entries = await response.json();

      // Initialize in-memory DB and insert entries
      dbInstance = new SQL.Database();
      dbInstance.run(`
        CREATE TABLE IF NOT EXISTS entries (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          content TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
      dbInstance.run(`
        CREATE TABLE IF NOT EXISTS tags (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          entry_id INTEGER NOT NULL,
          sentence_index INTEGER NOT NULL,
          tag TEXT NOT NULL,
          FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE
        );
      `);
      const stmt = dbInstance.prepare("INSERT INTO entries (id, content, created_at) VALUES (?, ?, ?)");
      entries.forEach(entry => {
        stmt.run([entry.id, entry.content, entry.created_at]);
      });
      stmt.free();

      // Fetch tags for each entry
      for (let entry of entries) {
        const tagResponse = await fetch(`${origin}/api/tags/${entry.id}`);
        if (tagResponse.ok) {
          const tags = await tagResponse.json();
          tags.forEach(tag => {
            dbInstance.run("INSERT INTO tags (entry_id, sentence_index, tag) VALUES (?, ?, ?)", [entry.id, tag.sentence_index, tag.tag]);
          });
        }
      }

      // Update localStorage as cache
      saveDb(false); // false indicates it's server data
    } else {
      // Local-only mode
      const savedDb = localStorage.getItem(LOCAL_DB_NAME);
      if (savedDb) {
        const uInt8Array = Uint8Array.from(atob(savedDb), c => c.charCodeAt(0));
        dbInstance = new SQL.Database(uInt8Array);
      } else {
        dbInstance = new SQL.Database();
        // Create the entries and tags tables
        dbInstance.run(`
          CREATE TABLE IF NOT EXISTS entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `);
        dbInstance.run(`
          CREATE TABLE IF NOT EXISTS tags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            entry_id INTEGER NOT NULL,
            sentence_index INTEGER NOT NULL,
            tag TEXT NOT NULL,
            FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE
          );
        `);
        saveDb(); // Save the new local database to localStorage
      }
    }

    return dbInstance;
  } catch (error) {
    console.error('Failed to initialize SQL.js:', error);
    throw error;
  }
};

// Save the database to localStorage
// isLocal: boolean indicating if saving to localStorage (true) or server cache (false)
export const saveDb = (isLocal = true) => {
  if (!dbInstance) return;
  const binaryArray = dbInstance.export();
  const binaryString = String.fromCharCode(...binaryArray);
  const base64 = btoa(binaryString);
  if (isLocal) {
    localStorage.setItem(LOCAL_DB_NAME, base64);
  } else {
    localStorage.setItem(SERVER_DB_NAME, base64);
  }
};

// CRUD Operations
export const addEntry = async (content, isServerMode = false, origin = '') => {
  if (!dbInstance) return;

  try {
    const stmt = dbInstance.prepare("INSERT INTO entries (content) VALUES (?)");
    stmt.run([content]);
    stmt.free();
    saveDb(!isServerMode);

    if (isServerMode && origin) {
      // Send to server
      const response = await fetch(`${origin}/api/diary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content })
      });

      if (!response.ok) {
        throw new Error('Failed to save entry to server.');
      }

      const data = await response.json();
      console.log('Server Response:', data);
    }
  } catch (error) {
    console.error('Failed to add entry:', error);
    throw error;
  }
};

export const getEntries = () => {
  if (!dbInstance) return [];
  const stmt = dbInstance.prepare("SELECT * FROM entries ORDER BY created_at DESC");
  const entries = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    entries.push(row);
  }
  stmt.free();
  return entries;
};

// Tagging Functions
export const addTag = (entryId, sentenceIndex, tag) => {
  if (!dbInstance) return;

  try {
    const stmt = dbInstance.prepare("INSERT INTO tags (entry_id, sentence_index, tag) VALUES (?, ?, ?)");
    stmt.run([entryId, sentenceIndex, tag]);
    stmt.free();
    saveDb();
  } catch (error) {
    console.error('Failed to add tag:', error);
    throw error;
  }
};

export const getTagsForEntry = (entryId) => {
  if (!dbInstance) return [];
  const stmt = dbInstance.prepare("SELECT id, sentence_index, tag FROM tags WHERE entry_id = ?");
  stmt.run([entryId]);
  const tags = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    tags.push({ id: row.id, sentenceIndex: row.sentence_index, tag: row.tag });
  }
  stmt.free();
  return tags;
};

export const deleteTag = (tagId) => {
  if (!dbInstance) return;

  try {
    const stmt = dbInstance.prepare("DELETE FROM tags WHERE id = ?");
    stmt.run([tagId]);
    stmt.free();
    saveDb();
  } catch (error) {
    console.error('Failed to delete tag:', error);
    throw error;
  }
};

// Export and Import Functions
export const exportDatabase = (isServerMode = false) => {
  if (!dbInstance) {
    console.error('Database not initialized.');
    return;
  }

  try {
    const binaryArray = dbInstance.export();
    const blob = new Blob([binaryArray], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = isServerMode ? 'diary_server.db' : 'diary_local.db'; // Differentiate file names
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export the database:', error);
  }
};

export const importDatabase = async (file, isServerMode = false, origin = '') => {
  if (!(file instanceof File)) {
    console.error('Invalid file.');
    return;
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const uInt8Array = new Uint8Array(arrayBuffer);
    const SQL = await initSqlJs({
      locateFile: file => '/sql-wasm.wasm'
    });

    // Initialize the database with the imported data
    dbInstance = new SQL.Database(uInt8Array);

    // Verify the structure
    const tablesStmt = dbInstance.prepare(`
      SELECT name FROM sqlite_master WHERE type='table';
    `);
    const tables = [];
    while (tablesStmt.step()) {
      const row = tablesStmt.getAsObject();
      tables.push(row.name);
    }
    tablesStmt.free();

    if (!tables.includes('entries')) {
      throw new Error('Invalid database file: Missing "entries" table.');
    }

    if (!tables.includes('tags')) {
      // Create tags table if not present
      dbInstance.run(`
        CREATE TABLE IF NOT EXISTS tags (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          entry_id INTEGER NOT NULL,
          sentence_index INTEGER NOT NULL,
          tag TEXT NOT NULL,
          FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE
        );
      `);
    }

    saveDb(!isServerMode);
    console.log('Database imported successfully.');

    if (isServerMode && origin) {
      // Optionally, synchronize with the server
      // This depends on your synchronization strategy
    }
  } catch (error) {
    console.error('Failed to import the database:', error);
    throw error;
  }
};