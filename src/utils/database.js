// src/utils/database.js

import initSqlJs from 'sql.js';

// Constants
const LOCAL_DB_NAME = 'diary_local.db';
const SERVER_DB_NAME = 'diary_server.db';

let dbInstance = null;
let SQLInstance = null;

// Initialize SQL.js once
const initializeSQL = async () => {
  if (SQLInstance) return SQLInstance;
  try {
    SQLInstance = await initSqlJs({
      locateFile: file => `${process.env.PUBLIC_URL}/sql-wasm.wasm`
    });
    return SQLInstance;
  } catch (error) {
    console.error('Failed to initialize SQL.js:', error);
    throw error;
  }
};

// Initialize the database
export const initDb = async (isServerMode = false, origin = '') => {
  const SQL = await initializeSQL();

  if (isServerMode && origin) {
    // Initialize from server
    try {
      const response = await fetch(`${origin}/api/diary`);
      if (!response.ok) {
        throw new Error('Failed to fetch data from server.');
      }
      const entries = await response.json();

      // Initialize in-memory DB and insert entries
      dbInstance = new SQL.Database();
      createTables(dbInstance);
      insertEntries(dbInstance, entries);

      // Fetch and insert all tags from server
      const allTags = await fetchAllTagsFromServer(origin);
      insertTags(dbInstance, allTags);

      // Fetch and insert all keywords from server
      const allKeywords = await fetchAllKeywordsFromServer(origin);
      insertKeywords(dbInstance, allKeywords);

      // Save to localStorage as cache
      saveDb(false);
    } catch (error) {
      console.error('Failed to initialize from server:', error);
      // Fallback to local
      await initLocalDb();
    }
  } else {
    // Initialize local-only mode
    await initLocalDb();
  }

  return dbInstance;
};

// Initialize local database
const initLocalDb = async () => {
  const SQL = await initializeSQL();
  const savedDb = localStorage.getItem(LOCAL_DB_NAME);
  if (savedDb) {
    const uInt8Array = Uint8Array.from(atob(savedDb), c => c.charCodeAt(0));
    dbInstance = new SQL.Database(uInt8Array);
  } else {
    dbInstance = new SQL.Database();
    createTables(dbInstance);
    saveDb(); // Save the new local database to localStorage
  }
};

// Create necessary tables
const createTables = (db) => {
  db.run(`
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entry_id INTEGER NOT NULL,
      sentence_index INTEGER NOT NULL,
      tag TEXT NOT NULL,
      FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE
    );
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS keywords (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entry_id INTEGER NOT NULL,
      keyword TEXT NOT NULL,
      FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE
    );
  `);
};

// Insert entries into the database
const insertEntries = (db, entries) => {
  const stmt = db.prepare("INSERT INTO entries (id, content, created_at) VALUES (?, ?, ?)");
  for (let entry of entries) {
    stmt.run([entry.id, entry.content, entry.created_at]);
  }
  stmt.free();
};

// Insert tags into the database
const insertTags = (db, tags) => {
  const stmt = db.prepare("INSERT INTO tags (id, entry_id, sentence_index, tag) VALUES (?, ?, ?, ?)");
  for (let tag of tags) {
    stmt.run([tag.id, tag.entry_id, tag.sentence_index, tag.tag]);
  }
  stmt.free();
};

// Insert keywords into the database
const insertKeywords = (db, keywords) => {
  const stmt = db.prepare("INSERT INTO keywords (id, entry_id, keyword) VALUES (?, ?, ?)");
  for (let kw of keywords) {
    stmt.run([kw.id, kw.entry_id, kw.keyword]);
  }
  stmt.free();
};

// Save the database to localStorage
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

// CRUD Operations for Entries
export const addEntry = async (content, keywords = [], isServerMode = false, origin = '') => {
  if (!dbInstance) return;

  try {
    const stmt = dbInstance.prepare("INSERT INTO entries (content) VALUES (?)");
    stmt.run([content]);
    const entryId = dbInstance.exec("SELECT last_insert_rowid() as id;")[0].values[0][0];
    stmt.free();

    // Insert keywords into local DB
    const keywordStmt = dbInstance.prepare("INSERT INTO keywords (entry_id, keyword) VALUES (?, ?)");
    for (let kw of keywords) {
      keywordStmt.run([entryId, kw]);
    }
    keywordStmt.free();

    saveDb(!isServerMode);

    if (isServerMode && origin) {
      // Send to server
      const response = await fetch(`${origin}/api/diary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content, keywords })
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
    entries.push({ ...row, keywords: getKeywordsForEntry(row.id) });
  }
  stmt.free();
  return entries;
};

// Function to get keywords for an entry
export const getKeywordsForEntry = (entryId) => {
  if (!dbInstance) return [];
  const stmt = dbInstance.prepare("SELECT keyword FROM keywords WHERE entry_id = ?");
  stmt.bind([entryId]);
  const keywords = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    keywords.push(row.keyword);
  }
  stmt.free();
  return keywords;
};

// Tagging Functions
export const addTag = async (entryId, sentenceIndex, tag, isServerMode = false, origin = '') => {
  if (!dbInstance) return;

  try {
    const stmt = dbInstance.prepare("INSERT INTO tags (entry_id, sentence_index, tag) VALUES (?, ?, ?)");
    stmt.run([entryId, sentenceIndex, tag]);
    stmt.free();
    saveDb(!isServerMode);

    if (isServerMode && origin) {
      // Send tag to server
      const response = await fetch(`${origin}/api/tags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ entry_id: entryId, sentence_index: sentenceIndex, tag })
      });

      if (!response.ok) {
        throw new Error('Failed to save tag to server.');
      }

      const data = await response.json();
      console.log('Server Tag Response:', data);
    }
  } catch (error) {
    console.error('Failed to add tag:', error);
    throw error;
  }
};

export const getTagsForEntry = (entryId) => {
  if (!dbInstance) return [];
  const stmt = dbInstance.prepare("SELECT id, sentence_index, tag FROM tags WHERE entry_id = ?");
  stmt.bind([entryId]);
  const tags = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    tags.push({ id: row.id, sentenceIndex: row.sentence_index, tag: row.tag });
  }
  stmt.free();
  return tags;
};

export const deleteTag = async (tagId, isServerMode = false, origin = '') => {
  if (!dbInstance) return;

  try {
    const stmt = dbInstance.prepare("DELETE FROM tags WHERE id = ?");
    stmt.run([tagId]);
    stmt.free();
    saveDb(!isServerMode);

    if (isServerMode && origin) {
      // Notify server about tag deletion
      const response = await fetch(`${origin}/api/tags/${tagId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete tag from server.');
      }

      console.log('Server Tag Deletion Response:', response.status);
    }
  } catch (error) {
    console.error('Failed to delete tag:', error);
    throw error;
  }
};

// Update keywords for an entry
export const updateEntryKeywords = async (entryId, keywords = [], isServerMode = false, origin = '') => {
  if (!dbInstance) return;

  try {
    // Delete existing keywords for the entry
    const deleteStmt = dbInstance.prepare("DELETE FROM keywords WHERE entry_id = ?");
    deleteStmt.run([entryId]);
    deleteStmt.free();

    // Insert new keywords
    const insertStmt = dbInstance.prepare("INSERT INTO keywords (entry_id, keyword) VALUES (?, ?)");
    for (let kw of keywords) {
      insertStmt.run([entryId, kw]);
    }
    insertStmt.free();

    saveDb(!isServerMode);

    if (isServerMode && origin) {
      // Send updated keywords to server
      const response = await fetch(`${origin}/api/diary/${entryId}/keywords`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ keywords })
      });

      if (!response.ok) {
        throw new Error('Failed to update keywords on the server.');
      }

      console.log('Server Keywords Update Response:', await response.json());
    }
  } catch (error) {
    console.error('Failed to update entry keywords:', error);
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
    a.download = isServerMode ? 'diary_server.db' : 'diary_local.db';
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
    const SQL = await initializeSQL();

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

    if (!tables.includes('keywords')) {
      // Create keywords table if not present
      dbInstance.run(`
        CREATE TABLE IF NOT EXISTS keywords (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          entry_id INTEGER NOT NULL,
          keyword TEXT NOT NULL,
          FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE
        );
      `);
    }

    saveDb(!isServerMode);
    console.log('Database imported successfully.');

    if (isServerMode && origin) {
      // Optionally, synchronize with the server
      await syncWithServer(origin);
    }
  } catch (error) {
    console.error('Failed to import the database:', error);
    throw error;
  }
};

// Synchronize local database with the server
export const syncWithServer = async (origin) => {
  if (!origin) {
    console.error('Server origin not provided.');
    return;
  }

  try {
    // Push local entries to server
    const localEntries = getEntries();
    for (let entry of localEntries) {
      const response = await fetch(`${origin}/api/diary/${entry.id}`);
      if (response.status === 404) {
        // Entry does not exist on server, push it
        const pushResponse = await fetch(`${origin}/api/diary`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ content: entry.content, created_at: entry.created_at, keywords: entry.keywords })
        });

        if (!pushResponse.ok) {
          console.error(`Failed to push entry ID ${entry.id} to server.`);
        } else {
          const data = await pushResponse.json();
          console.log(`Pushed entry ID ${entry.id} to server with server ID ${data.entry_id}.`);
        }
      } else {
        // Entry exists, check for keyword updates
        const serverEntry = await response.json();
        if (JSON.stringify(serverEntry.keywords) !== JSON.stringify(entry.keywords)) {
          // Update keywords on the server
          const updateResponse = await fetch(`${origin}/api/diary/${entry.id}/keywords`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ keywords: entry.keywords })
          });

          if (!updateResponse.ok) {
            console.error(`Failed to update keywords for entry ID ${entry.id} on server.`);
          } else {
            console.log(`Updated keywords for entry ID ${entry.id} on server.`);
          }
        }
      }
    }

    // Fetch all tags and keywords from server
    const allTagsFromServer = await fetchAllTagsFromServer(origin);
    await updateLocalTags(allTagsFromServer, true, origin);

    const allKeywordsFromServer = await fetchAllKeywordsFromServer(origin);
    await updateLocalKeywords(allKeywordsFromServer, true, origin);

    // Update local cache
    saveDb(false);
  } catch (error) {
    console.error('Synchronization failed:', error);
    throw error;
  }
};

// Fetch all tags from server
export const fetchAllTagsFromServer = async (origin) => {
  try {
    const response = await fetch(`${origin}/api/tags`);
    if (!response.ok) {
      throw new Error('Failed to fetch tags from server.');
    }
    const tags = await response.json();
    return tags;
  } catch (error) {
    console.error('Error fetching all tags from server:', error);
    throw error;
  }
};

// Update local database with fetched tags
export const updateLocalTags = async (tags, isServerMode = false, origin = '') => {
  if (!dbInstance) return;

  try {
    // Clear existing tags
    dbInstance.run("DELETE FROM tags");

    // Insert fetched tags
    const stmt = dbInstance.prepare("INSERT INTO tags (id, entry_id, sentence_index, tag) VALUES (?, ?, ?, ?)");
    for (let tag of tags) {
      stmt.run([tag.id, tag.entry_id, tag.sentence_index, tag.tag]);
    }
    stmt.free();

    saveDb(!isServerMode);

    console.log('Local tags updated with server tags.');
  } catch (error) {
    console.error('Failed to update local tags:', error);
    throw error;
  }
};

// Fetch all keywords from server
export const fetchAllKeywordsFromServer = async (origin) => {
  try {
    const response = await fetch(`${origin}/api/keywords`);
    if (!response.ok) {
      throw new Error('Failed to fetch keywords from server.');
    }
    const keywords = await response.json();
    return keywords;
  } catch (error) {
    console.error('Error fetching all keywords from server:', error);
    throw error;
  }
};

// Update local database with fetched keywords
export const updateLocalKeywords = async (keywords, isServerMode = false, origin = '') => {
  if (!dbInstance) return;

  try {
    // Clear existing keywords
    dbInstance.run("DELETE FROM keywords");

    // Insert fetched keywords
    const stmt = dbInstance.prepare("INSERT INTO keywords (id, entry_id, keyword) VALUES (?, ?, ?)");
    for (let kw of keywords) {
      stmt.run([kw.id, kw.entry_id, kw.keyword]);
    }
    stmt.free();

    saveDb(!isServerMode);
    console.log('Local keywords updated with server keywords.');
  } catch (error) {
    console.error('Failed to update local keywords:', error);
    throw error;
  }
};