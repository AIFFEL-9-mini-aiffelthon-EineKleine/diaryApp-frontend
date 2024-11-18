import React, { useState, useEffect, useRef } from 'react';
import styled, { css } from 'styled-components';
import Container from './components/Container';
import DiaryBox from './components/DiaryBox';
import Title from './components/Title';
import TextArea from './components/TextArea';
import { SaveButton, ImportButton, ExportButton, DeleteTagButton } from './components/Buttons';
import { ToggleContainer, ToggleLabel, ToggleSwitch } from './components/Toggle';
import { ServerInputContainer, ServerInput } from './components/ServerInput';
import Message from './components/Message';
import { EntryList, EntryItem, EntryDate } from './components/EntryList';
import { Sentence, Tooltip } from './components/Tagging';
import { ModalOverlay, ModalContent, CloseButton } from './components/Modal';

import { 
  initDb, 
  addEntry, 
  getEntries, 
  exportDatabase, 
  importDatabase,
  addTag,
  getTagsForEntry,
  deleteTag,
  syncWithServer
} from './utils/database';
import { splitIntoSentences } from './utils/helpers';

function App() {
  // State variables
  const [content, setContent] = useState('');
  const [message, setMessage] = useState(null); // { text: '', error: boolean }
  const [entries, setEntries] = useState([]);
  const [dbInitialized, setDbInitialized] = useState(false);
  const [isServerMode, setIsServerMode] = useState(false);
  const [serverOrigin, setServerOrigin] = useState('');
  const [isServerInputVisible, setIsServerInputVisible] = useState(false);
  const [currentEntryId, setCurrentEntryId] = useState(null);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(null);
  const [currentTag, setCurrentTag] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [tagsMap, setTagsMap] = useState({}); // { entryId: [{id, sentenceIndex, tag}, ...], ... }

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
          // Update tagsMap again after synchronization
          const updatedTags = {};
          for (let entry of updatedEntries) {
            const tags = getTagsForEntry(entry.id);
            updatedTags[entry.id] = tags;
          }
          setTagsMap(updatedTags);
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
      await addEntry(content, isServerMode, serverOrigin);
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
      setMessage({ text: 'Diary entry saved successfully.', error: false });
    } catch (error) {
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

        // Fetch tags for all entries
        const allTags = {};
        for (let entry of allEntries) {
          const tags = getTagsForEntry(entry.id);
          allTags[entry.id] = tags;
        }
        setTagsMap(allTags);

        // If server mode is on, synchronize after import
        if (isServerMode) {
          await syncWithServer(serverOrigin);
          const updatedEntries = getEntries();
          setEntries(updatedEntries);
          const updatedTags = {};
          for (let entry of updatedEntries) {
            const tags = getTagsForEntry(entry.id);
            updatedTags[entry.id] = tags;
          }
          setTagsMap(updatedTags);
        }

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

  const handleToggleChange = () => {
    setIsServerMode(prev => !prev);
    setIsServerInputVisible(!isServerMode);
  };

  const handleServerOriginChange = (e) => {
    setServerOrigin(e.target.value);
  };

  const handleAddTag = (entryId, sentenceIndex) => {
    setCurrentEntryId(entryId);
    setCurrentSentenceIndex(sentenceIndex);
    setCurrentTag('');
    setShowModal(true);
  };

  const handleSaveTag = async () => {
    if (currentTag.trim() === '') {
      setMessage({ text: 'Tag cannot be empty.', error: true });
      return;
    }

    try {
      await addTag(currentEntryId, currentSentenceIndex, currentTag, isServerMode, serverOrigin);
      const tags = getTagsForEntry(currentEntryId);
      setTagsMap(prev => ({ ...prev, [currentEntryId]: tags }));
      setMessage({ text: 'Tag added successfully.', error: false });
      setShowModal(false);
    } catch (error) {
      setMessage({ text: 'Failed to add tag.', error: true });
    }
  };

  const handleDeleteTag = async (entryId, tagId) => {
    try {
      await deleteTag(tagId, isServerMode, serverOrigin);
      const tags = getTagsForEntry(entryId);
      setTagsMap(prev => ({ ...prev, [entryId]: tags }));
      setMessage({ text: 'Tag deleted successfully.', error: false });
    } catch (error) {
      setMessage({ text: 'Failed to delete tag.', error: true });
    }
  };

  return (
    <Container>
      <DiaryBox>
        <ToggleContainer>
          <ToggleSwitch 
            checked={isServerMode} 
            onChange={handleToggleChange} 
          />
          <ToggleLabel>Server Mode</ToggleLabel>
        </ToggleContainer>
        <Title>My Diary</Title>
        <TextArea
          placeholder="Write your thoughts here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
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
          />
        </div>
        <ServerInputContainer isOpen={isServerInputVisible}>
          <ServerInput
            type="text"
            placeholder="Enter SQLite server origin (e.g., http://localhost:8000)"
            value={serverOrigin}
            onChange={handleServerOriginChange}
          />
        </ServerInputContainer>
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
              <p style={{ whiteSpace: 'pre-wrap' }}>
                {splitIntoSentences(entry.content).map((sentence, index) => {
                  const entryTags = tagsMap[entry.id] || [];
                  const tag = entryTags.filter(t => t.sentenceIndex === index);
                  return (
                    <Sentence 
                      key={index} 
                      onDoubleClick={() => handleAddTag(entry.id, index)}
                    >
                      {sentence.trim() + ' '}
                      {tag.length > 0 && (
                        <Tooltip>
                          {tag.map(t => (
                            <span key={t.id}>
                              {t.tag}
                              <DeleteTagButton onClick={() => handleDeleteTag(entry.id, t.id)}>✕</DeleteTagButton>
                              <br/>
                            </span>
                          ))}
                        </Tooltip>
                      )}
                    </Sentence>
                  );
                })}
              </p>
            </EntryItem>
          ))}
        </EntryList>

        {/* Tag Modal */}
        {showModal && (
          <ModalOverlay onClick={() => setShowModal(false)}>
            <ModalContent onClick={e => e.stopPropagation()}>
              <CloseButton onClick={() => setShowModal(false)}>×</CloseButton>
              <h3>Add Tag</h3>
              <input
                type="text"
                placeholder="Enter tag"
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
              />
              <SaveButton onClick={handleSaveTag} style={{ width: '100%' }}>
                Save Tag
              </SaveButton>
            </ModalContent>
          </ModalOverlay>
        )}
      </DiaryBox>
    </Container>
  );
}

export default App;