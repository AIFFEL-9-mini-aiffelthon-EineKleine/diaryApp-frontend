// src/App.js

import React, { useState, useEffect, useRef } from 'react';
import Container from './components/Container';
import DiaryBox from './components/DiaryBox';
import Title from './components/Title';
import TextArea from './components/TextArea';
import { SaveButton, ImportButton, ExportButton } from './components/Buttons';
import { ToggleContainer, ToggleLabel, ToggleSwitch } from './components/Toggle';
import { ServerInputContainer, ServerInput } from './components/ServerInput';
import Message from './components/Message';
import { EntryList, EntryItem, EntryDate } from './components/EntryList';
import SentenceWithTooltip from './components/SentenceWithTooltip';
import TagList from './components/TagList';
import EditKeywordsModal from './components/EditKeywordsModal'; // New import

import {
  initDb,
  addEntry,
  getEntries,
  exportDatabase,
  importDatabase,
  addTag,
  getTagsForEntry,
  deleteTag,
  syncWithServer,
  fetchAllTagsFromServer,
  updateLocalTags,
  fetchAllKeywordsFromServer,
  updateLocalKeywords,
  updateEntryKeywords, // New import
} from './utils/database';
import { splitIntoSentences } from './utils/helpers';

function App() {
  // State variables
  const [content, setContent] = useState('');
  const [keywords, setKeywords] = useState('');
  const [message, setMessage] = useState(null);
  const [entries, setEntries] = useState([]);
  const [dbInitialized, setDbInitialized] = useState(false);
  const [isServerMode, setIsServerMode] = useState(false);
  const [serverOrigin, setServerOrigin] = useState('');
  const [isServerInputVisible, setIsServerInputVisible] = useState(false);
  const [tagsMap, setTagsMap] = useState({});
  const [editingKeywordsEntryId, setEditingKeywordsEntryId] = useState(null); // New state
  const [editingKeywords, setEditingKeywords] = useState(''); // New state

  const fileInputRef = useRef(null);

  // Initialize database and synchronize with server if needed
  useEffect(() => {
    const initialize = async () => {
      try {
        await initDb(isServerMode, serverOrigin);
        setDbInitialized(true);
        const allEntries = getEntries();
        setEntries(allEntries);

        // Fetch tags for all entries
        const allTags = {};
        for (let entry of allEntries) {
          const tags = getTagsForEntry(entry.id);
          allTags[entry.id] = tags;
        }
        setTagsMap(allTags);

        // If server mode is on, synchronize local changes with the server
        if (isServerMode) {
          await syncWithServer(serverOrigin);
          const updatedEntries = getEntries();
          setEntries(updatedEntries);

          // Fetch all tags and keywords from server after synchronization
          const updatedTagsFromServer = await fetchAllTagsFromServer(serverOrigin);
          await updateLocalTags(updatedTagsFromServer, isServerMode, serverOrigin);

          const updatedKeywordsFromServer = await fetchAllKeywordsFromServer(serverOrigin);
          await updateLocalKeywords(updatedKeywordsFromServer, isServerMode, serverOrigin);

          // Update tagsMap after synchronization
          const updatedTagsMap = {};
          for (let entry of updatedEntries) {
            const tags = getTagsForEntry(entry.id);
            updatedTagsMap[entry.id] = tags;
          }
          setTagsMap(updatedTagsMap);
        }
      } catch (error) {
        console.error('Initialization failed:', error);
        setMessage({ text: 'Failed to initialize the database.', error: true });
      }
    };
    initialize();
  }, [isServerMode, serverOrigin]);

  const handleSubmit = async () => {
    if (content.trim() === '') {
      setMessage({ text: 'Please enter some content.', error: true });
      return;
    }

    try {
      const keywordList = keywords.split(',').map(kw => kw.trim()).filter(kw => kw);
      await addEntry(content, keywordList, isServerMode, serverOrigin);
      const allEntries = getEntries();
      setEntries(allEntries);

      // Fetch tags for all entries
      const allTags = {};
      for (let entry of allEntries) {
        const tags = getTagsForEntry(entry.id);
        allTags[entry.id] = tags;
      }
      setTagsMap(allTags);

      setContent('');
      setKeywords('');
      setMessage({ text: 'Diary entry saved successfully.', error: false });
    } catch (error) {
      console.error('Failed to save the entry:', error);
      setMessage({ text: 'Failed to save the entry.', error: true });
    }
  };

  const handleExport = () => {
    exportDatabase(isServerMode);
    setMessage({ text: 'Database exported successfully.', error: false });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type and size
      const validTypes = ['application/x-sqlite3', 'application/octet-stream'];
      const validExtensions = ['.db', '.sqlite'];
      const isValidType = validTypes.includes(file.type);
      const isValidExtension = validExtensions.some(ext => file.name.endsWith(ext));

      if (!isValidType || !isValidExtension) {
        setMessage({ text: 'Please upload a valid SQLite .db or .sqlite file.', error: true });
        event.target.value = null;
        return;
      }

      const maxSizeMB = 5;
      if (file.size > maxSizeMB * 1024 * 1024) {
        setMessage({ text: `File size exceeds ${maxSizeMB}MB limit.`, error: true });
        event.target.value = null;
        return;
      }

      // Confirm overwrite and synchronization
      const proceed = window.confirm('Importing a database will overwrite your current entries and synchronize with the server. Do you wish to continue?');
      if (!proceed) {
        event.target.value = null;
        return;
      }

      try {
        await importDatabase(file, isServerMode, serverOrigin);
        const allEntries = getEntries();
        setEntries(allEntries);

        // Fetch all tags and keywords from server and update local database
        if (isServerMode) {
          const allTagsFromServer = await fetchAllTagsFromServer(serverOrigin);
          await updateLocalTags(allTagsFromServer, isServerMode, serverOrigin);

          const allKeywordsFromServer = await fetchAllKeywordsFromServer(serverOrigin);
          await updateLocalKeywords(allKeywordsFromServer, isServerMode, serverOrigin);
        } else {
          // Fetch tags for all entries from local database
          const allTags = {};
          for (let entry of allEntries) {
            const tags = getTagsForEntry(entry.id);
            allTags[entry.id] = tags;
          }
          setTagsMap(allTags);
        }

        // If server mode is on, synchronize after import
        if (isServerMode) {
          await syncWithServer(serverOrigin);
          const updatedEntries = getEntries();
          setEntries(updatedEntries);

          // Fetch all tags and keywords from server again after synchronization
          const updatedTagsFromServer = await fetchAllTagsFromServer(serverOrigin);
          await updateLocalTags(updatedTagsFromServer, isServerMode, serverOrigin);

          const updatedKeywordsFromServer = await fetchAllKeywordsFromServer(serverOrigin);
          await updateLocalKeywords(updatedKeywordsFromServer, isServerMode, serverOrigin);

          // Update tagsMap after synchronization
          const updatedTagsMap = {};
          for (let entry of updatedEntries) {
            const tags = getTagsForEntry(entry.id);
            updatedTagsMap[entry.id] = tags;
          }
          setTagsMap(updatedTagsMap);
        }

        setMessage({ text: 'Database imported successfully.', error: false });
      } catch (error) {
        console.error('Failed to import the database:', error);
        setMessage({ text: 'Failed to import the database.', error: true });
      } finally {
        // Reset the file input
        event.target.value = null;
        setTimeout(() => setMessage(null), 3000);
      }
    }
  };

  const handleToggleChange = () => {
    setIsServerMode(prev => !prev);
    setIsServerInputVisible(!isServerMode);
  };

  const handleServerOriginChange = (e) => {
    setServerOrigin(e.target.value);
  };

  const handleAddTag = async (entryId, sentenceIndex, tag) => {
    try {
      await addTag(entryId, sentenceIndex, tag, isServerMode, serverOrigin);

      // Update tagsMap after adding a tag
      const updatedTags = getTagsForEntry(entryId);
      setTagsMap(prev => ({ ...prev, [entryId]: updatedTags }));

      setMessage({ text: 'Tag added successfully.', error: false });
    } catch (error) {
      console.error('Failed to add tag:', error);
      setMessage({ text: 'Failed to add tag.', error: true });
    }
  };

  const handleDeleteTag = async (tagId, entryId) => {
    try {
      await deleteTag(tagId, isServerMode, serverOrigin);

      // Update tagsMap after deleting a tag
      const updatedTags = getTagsForEntry(entryId);
      setTagsMap(prev => ({ ...prev, [entryId]: updatedTags }));

      setMessage({ text: 'Tag deleted successfully.', error: false });
    } catch (error) {
      console.error('Failed to delete tag:', error);
      setMessage({ text: 'Failed to delete tag.', error: true });
    }
  };

  const handleEditKeywordsClick = (entryId, currentKeywords) => {
    setEditingKeywordsEntryId(entryId);
    setEditingKeywords(currentKeywords.join(', '));
  };

  const handleKeywordsChange = (e) => {
    setEditingKeywords(e.target.value);
  };

  const handleSaveKeywords = async () => {
    try {
      const keywordList = editingKeywords.split(',').map(kw => kw.trim()).filter(kw => kw);
      await updateEntryKeywords(editingKeywordsEntryId, keywordList, isServerMode, serverOrigin);

      // Update entries state
      const updatedEntries = getEntries();
      setEntries(updatedEntries);

      setEditingKeywordsEntryId(null);
      setEditingKeywords('');
      setMessage({ text: 'Keywords updated successfully.', error: false });
    } catch (error) {
      console.error('Failed to update keywords:', error);
      setMessage({ text: 'Failed to update keywords.', error: true });
    }
  };

  const handleCancelEditKeywords = () => {
    setEditingKeywordsEntryId(null);
    setEditingKeywords('');
  };

  return (
    <Container>
      <DiaryBox>
        {/* Existing components */}
        <ToggleContainer>
          <ToggleSwitch
            checked={isServerMode}
            onChange={handleToggleChange}
            aria-label="Toggle server mode"
          />
          <ToggleLabel>Server Mode</ToggleLabel>
        </ToggleContainer>
        <ServerInputContainer isOpen={isServerInputVisible}>
          <ServerInput
            type="text"
            placeholder="Enter SQLite server origin (e.g., http://localhost:8000)"
            value={serverOrigin}
            onChange={handleServerOriginChange}
            aria-label="SQLite server origin input"
          />
        </ServerInputContainer>
        <Title>My Diary</Title>
        <TextArea
          placeholder="Write your thoughts here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          aria-label="Diary entry textarea"
        />
        {/* New input field for keywords */}
        <input
          type="text"
          placeholder="Enter keywords separated by commas"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          aria-label="Keywords input"
          style={{
            width: '100%',
            padding: '10px',
            marginTop: '10px',
            borderRadius: '8px',
            border: '2px solid #ced4da',
            fontSize: '16px',
            fontFamily: 'inherit',
          }}
        />
        {/* Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
          <SaveButton onClick={handleSubmit} disabled={!dbInitialized}>
            Save Entry
          </SaveButton>
          <ImportButton onClick={handleImportClick}>
            Import Database
          </ImportButton>
          <input
            type="file"
            accept=".db,.sqlite"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
            aria-hidden="true"
          />
        </div>
        <div style={{ marginTop: '10px', textAlign: 'center' }}>
          <ExportButton onClick={handleExport} disabled={!dbInitialized}>
            Export Database
          </ExportButton>
        </div>
        {message && <Message error={message.error}>{message.text}</Message>}

        {/* Display Entries */}
        <EntryList>
          <h2>Previous Entries</h2>
          {entries.length === 0 && <p>No entries yet.</p>}
          {entries.map(entry => (
            <EntryItem key={entry.id}>
              <EntryDate>{new Date(entry.created_at).toLocaleString()}</EntryDate>
              {/* Display keywords */}
              <div style={{ marginTop: '5px', marginBottom: '10px' }}>
                <strong>Emotions:</strong> {entry.keywords.join(', ')}
                <button
                  style={{
                    marginLeft: '10px',
                    padding: '5px 10px',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleEditKeywordsClick(entry.id, entry.keywords)}
                >
                  Edit Emotions
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'row', marginTop: '10px' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ whiteSpace: 'pre-wrap' }}>
                    {splitIntoSentences(entry.content).map((sentence, index) => {
                      const entryTags = tagsMap[entry.id] || [];
                      const tagsForSentence = entryTags.filter(t => t.sentenceIndex === index);
                      return (
                        <SentenceWithTooltip
                          key={index}
                          sentence={sentence}
                          entryId={entry.id}
                          sentenceIndex={index}
                          existingTags={tagsForSentence}
                          onAddTag={handleAddTag}
                        />
                      );
                    })}
                  </p>
                </div>
                <div style={{ width: '200px', marginLeft: '20px' }}>
                  <TagList
                    tags={tagsMap[entry.id] || []}
                    onDeleteTag={(tagId) => handleDeleteTag(tagId, entry.id)}
                  />
                </div>
              </div>
            </EntryItem>
          ))}
        </EntryList>
      </DiaryBox>

      {/* Edit Keywords Modal */}
      {editingKeywordsEntryId !== null && (
        <EditKeywordsModal
          keywords={editingKeywords}
          onKeywordsChange={handleKeywordsChange}
          onSave={handleSaveKeywords}
          onCancel={handleCancelEditKeywords}
        />
      )}
    </Container>
  );
}

export default App;