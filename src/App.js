import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { initDb, addEntry, getEntries, exportDatabase, importDatabase } from './utils/database';

// Styled Components (existing styles)
const Container = styled.div`
  background: linear-gradient(to right, #ece9e6, #ffffff);
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const DiaryBox = styled.div`
  background: #f8f9fa;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 90%;
  max-width: 600px;
`;

const Title = styled.h1`
  text-align: center;
  color: #343a40;
  margin-bottom: 20px;
`;

const TextArea = styled.textarea`
  width: 100%;
  height: 200px;
  padding: 12px;
  border: 2px solid #ced4da;
  border-radius: 8px;
  resize: vertical;
  font-size: 16px;
  font-family: inherit;
  margin-bottom: 20px;
  &:focus {
    outline: none;
    border-color: #495057;
  }
`;

const Button = styled.button`
  width: 48%;
  padding: 12px;
  background-color: #495057;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  margin-right: 4%;
  &:hover {
    background-color: #343a40;
  }
  &:disabled {
    background-color: #adb5bd;
    cursor: not-allowed;
  }
`;

const ImportButton = styled.button`
  width: 48%;
  padding: 12px;
  background-color: #007bff;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  &:hover {
    background-color: #0056b3;
  }
`;

const Message = styled.p`
  text-align: center;
  color: ${props => (props.error ? '#dc3545' : '#28a745')};
  margin-top: 15px;
`;

const EntryList = styled.div`
  margin-top: 30px;
`;

const EntryItem = styled.div`
  background: #ffffff;
  padding: 15px;
  border-left: 4px solid #495057;
  margin-bottom: 10px;
  border-radius: 4px;
`;

const EntryDate = styled.span`
  display: block;
  font-size: 12px;
  color: #6c757d;
  margin-bottom: 5px;
`;

// Hidden file input for importing
const HiddenFileInput = styled.input`
  display: none;
`;

function App() {
  const [content, setContent] = useState('');
  const [message, setMessage] = useState(null); // { text: '', error: boolean }
  const [entries, setEntries] = useState([]);
  const [dbInitialized, setDbInitialized] = useState(false);

  // Reference to the hidden file input
  const fileInputRef = React.createRef();

  // Initialize the database and fetch existing entries on component mount
  useEffect(() => {
    const initialize = async () => {
      try {
        await initDb();
        setDbInitialized(true);
        const allEntries = getEntries();
        setEntries(allEntries);
      } catch (error) {
        console.error('Database initialization failed:', error);
        setMessage({ text: 'Failed to initialize the database.', error: true });
      }
    };
    initialize();
  }, []);

  const handleSubmit = async () => {
    if (content.trim() === '') {
      setMessage({ text: 'Please enter some content.', error: true });
      return;
    }

    try {
      // Add entry to local SQLite database
      addEntry(content);
      const allEntries = getEntries();
      setEntries(allEntries);
      setContent('');
      setMessage({ text: 'Diary entry saved locally.', error: false });

      // Send POST request to FastAPI server
      const response = await fetch('http://localhost:8000/answer', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json'
        },
        body: JSON.stringify({ question: content })
      });

      const data = await response.json();

      if (response.ok) {
        // Optionally update message or handle response
        console.log('Server Response:', data);
      } else {
        setMessage({ text: data.detail || 'Failed to send to server.', error: true });
      }
    } catch (error) {
      setMessage({ text: 'Failed to connect to the server.', error: true });
      console.error('Error:', error);
    }
  };

  const handleExport = () => {
    exportDatabase();
    setMessage({ text: 'Database exported successfully.', error: false });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        await importDatabase(file);
        const allEntries = getEntries();
        setEntries(allEntries);
        setMessage({ text: 'Database imported successfully.', error: false });
      } catch (error) {
        setMessage({ text: 'Failed to import the database.', error: true });
      } finally {
        // Reset the file input
        event.target.value = null;
        setTimeout(() => setMessage(null), 3000);
      }
    }
  };

  return (
    <Container>
      <DiaryBox>
        <Title>My Diary</Title>
        <TextArea
          placeholder="Write your thoughts here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button onClick={handleSubmit} disabled={!dbInitialized}>
            Save Entry
          </Button>
          <ImportButton onClick={handleImportClick}>
            Import Database
          </ImportButton>
          <HiddenFileInput
            type="file"
            accept=".db,.sqlite"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
        </div>
        <div style={{ marginTop: '10px', textAlign: 'center' }}>
          <Button onClick={handleExport} disabled={!dbInitialized}>
            Export Database
          </Button>
        </div>
        {message && <Message error={message.error}>{message.text}</Message>}

        {/* Display Entries */}
        <EntryList>
          <h2>Previous Entries</h2>
          {entries.length === 0 && <p>No entries yet.</p>}
          {entries.map(entry => (
            <EntryItem key={entry.id}>
              <EntryDate>{new Date(entry.created_at).toLocaleString()}</EntryDate>
              <p style={{ whiteSpace: 'pre-wrap' }}>{entry.content}</p>
            </EntryItem>
          ))}
        </EntryList>
      </DiaryBox>
    </Container>
  );
}

export default App;