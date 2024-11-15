// src/App.js

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { initDb, addEntry, getEntries } from './utils/database';

// Styled Components
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
  width: 100%;
  padding: 12px;
  background-color: #495057;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  &:hover {
    background-color: #343a40;
  }
  &:disabled {
    background-color: #adb5bd;
    cursor: not-allowed;
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

function App() {
  const [content, setContent] = useState('');
  const [message, setMessage] = useState(null); // { text: '', error: boolean }
  const [entries, setEntries] = useState([]);
  const [dbInitialized, setDbInitialized] = useState(false);

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
      const response = await fetch('http://localhost:8000/api/diary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content })
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

  return (
    <Container>
      <DiaryBox>
        <Title>My Diary</Title>
        <TextArea
          placeholder="Write your thoughts here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <Button onClick={handleSubmit} disabled={!dbInitialized}>
          Save Entry
        </Button>
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