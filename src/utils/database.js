import initSqlJs from 'sql.js';

const DATABASE_NAME = 'diary.db';

let dbInstance = null;

// Function to initialize the database
export const initDb = async () => {
  if (dbInstance) return dbInstance;

  try {
    const SQL = await initSqlJs({
      locateFile: file => '/sql-wasm.wasm' // Path to the Wasm file in public/
    });

    // Load the saved database from localStorage if it exists
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
      saveDb(); // Save the new database to localStorage
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
  saveDb(); // Save the updated database to localStorage
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

// Function to export the database and trigger a download
export const exportDatabase = () => {
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
    a.download = 'diary.db'; // Default file name
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export the database:', error);
  }
};

// Function to import a database from a File object
export const importDatabase = async (file) => {
  if (!(file instanceof File)) {
    console.error('Invalid file.');
    return;
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const uInt8Array = new Uint8Array(arrayBuffer);
    const SQL = await initSqlJs({
      locateFile: file => '/sql-wasm.wasm' // Ensure correct path
    });

    // Initialize the database with the imported data
    dbInstance = new SQL.Database(uInt8Array);

    // Optional: Verify the structure (e.g., check if 'entries' table exists)
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

    saveDb(); // Save the imported database to localStorage
    console.log('Database imported successfully.');
  } catch (error) {
    console.error('Failed to import the database:', error);
    throw error;
  }
};
