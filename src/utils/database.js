// src/utils/database.js

import initSqlJs from 'sql.js';

const DATABASE_NAME = 'diary.db';

let dbInstance = null;

// Function to initialize the database
export const initDb = async () => {
  if (dbInstance) return dbInstance;

  try {
    const SQL = await initSqlJs({
      locateFile: file => '/sql-wasm.wasm' // Path to the .wasm file in the public folder
    });

    // Load existing database from localStorage or create a new one
    const savedDb = localStorage.getItem(DATABASE_NAME);
    if (savedDb) {
      const uInt8Array = Uint8Array.from(atob(savedDb), c => c.charCodeAt(0));
      dbInstance = new SQL.Database(uInt8Array);
    } else {
      dbInstance = new SQL.Database();
      // Create the entries table
      dbInstance.run(`
        CREATE TABLE IF NOT EXISTS entries (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          content TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
      saveDb();
    }

    return dbInstance;
  } catch (error) {
    console.error('Failed to initialize SQL.js:', error);
    throw error;
  }
};

// Function to save the database to localStorage
export const saveDb = () => {
  if (!dbInstance) return;
  const binaryArray = dbInstance.export();
  const binaryString = String.fromCharCode(...binaryArray);
  const base64 = btoa(binaryString);
  localStorage.setItem(DATABASE_NAME, base64);
};

// Function to add a new entry
export const addEntry = (content) => {
  if (!dbInstance) return;
  const stmt = dbInstance.prepare("INSERT INTO entries (content) VALUES (?)");
  stmt.run([content]);
  stmt.free();
  saveDb();
};

// Function to get all entries
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
