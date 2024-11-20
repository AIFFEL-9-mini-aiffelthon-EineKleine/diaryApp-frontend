# Diary Application (front-end)

> This is the frontend of a diary application that allows users to write diary entries, associate keywords (emotions) with entries, and tag specific sentences within entries. The application is built with React and utilizes `sql.js` to handle an in-browser SQLite database. It supports both local storage and synchronization with a backend server.

## 1. Quick Start

### 1.1 Prerequisites

- **Node.js**: Version 12 or higher
- **npm**: Comes with Node.js

### 1.2 Steps

1. **Clone the Repository**
    ```bash
    git clone https://github.com/AIFFEL-9-mini-aiffelthon-EineKleine/diaryApp-frontend
    cd diaryApp-frontend
    ```
2. **Install Dependencies**
    ```bash
    npm install
    ```
3. **Place `sql-wasm.wasm` File**
    - Download `sql-wasm.wasm` from the [SQL.js GitHub repo](https://github.com/sql-js/sql.js/releases) (choose wasm version).
	    - For direct download, click [here (v1.12.0)](https://github.com/sql-js/sql.js/releases/download/v1.12.0/sqljs-wasm.zip).
    - Place the `sql-wasm.wasm` file in the `public` directory of the frontend project.
    - **OR**, since `sql-wasm.wasm` comes with the node package installation,  
      executing the script below will conclude to the same result.
      ```bash
      cp node_modules/sql.js/dist/sql-wasm.wasm public/sql-wasm.wasm
      ```
4. **Start the React Application**
    ```bash
    npm start
    ```
    - The application will open in your default browser at `http://localhost:3000`.

## 2. Features

- **Add Diary Entries**: Write and save diary entries with optional keywords (emotions).
- **Edit Keywords**: Modify the keywords associated with each diary entry directly from the UI.
- **Sentence Tagging**: Tag specific sentences within diary entries.
- **Local and Server Modes**: Operate in local mode (data stored in browser) or server mode (data synchronized with backend server).
- **Import/Export Database**: Import an existing SQLite database or export the current database.
- **Synchronization**: Synchronize local changes with the backend server in server mode.
- **Responsive UI**: User-friendly interface built with React and styled-components.

## 3. Technologies Used

- **React**: JavaScript library for building user interfaces.
	- **styled-components**: CSS-in-JS library for styling React components.
- **SQL.js**: JavaScript library that runs SQLite databases directly in the browser.
	- **WebAssembly**: Used by SQL.js via `sql-wasm.wasm` for efficient database operations.

## 4. Configuration

### 4.1 Server Origin

- When running in server mode, input the backend server's origin (e.g., `http://localhost:8000`) in the application.

### 4.2 CORS Settings

- Ensure that the backend server's CORS settings allow requests from the frontend's origin (`http://localhost:3000` by default).

## 5. Usage

1. **Local Mode**
    - By default, the application operates in local mode.
    - Entries, keywords, and tags are stored in the browser's local storage.
2. **Server Mode**
    - Toggle the "Server Mode" switch in the application.
    - Enter the backend server's origin (e.g., `http://localhost:8000`).
    - The application will synchronize data with the backend server.
3. **Adding Entries**
    - Write your diary entry in the text area.
    - Optionally, add keywords separated by commas.
    - Click **Save Entry** to save.
4. **Editing Keywords**
    - In the list of entries, click **Edit Keywords** next to the entry you wish to modify.
    - Update the keywords and click **Save**.
5. **Tagging Sentences**
    - Hover over a sentence in an entry to display the tagging tooltip.
    - Add tags to specific sentences.
6. **Importing/Exporting Database**
    - **Import**: Click **Import Database** and select a `.db` or `.sqlite` file.
    - **Export**: Click **Export Database** to download the current database.

## 6. Project Structure

```text
diary-app-frontend/
├── public/
│   ├── index.html
│   └── sql-wasm.wasm
├── src/
│   ├── components/
│   ├── utils/
│   ├── App.js
│   └── index.js
├── package.json
└── README.md
```


---
## License

This project is licensed under the MIT License.

## Acknowledgments

- SQL.js for providing SQLite functionality in the browser.
- [React](https://reactjs.org/) for the frontend framework.