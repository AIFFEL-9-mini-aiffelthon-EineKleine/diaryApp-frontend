import React, { useState, useEffect, useRef } from 'react';
import styled, { css } from 'styled-components';
import { 
  initDb, 
  addEntry, 
  getEntries, 
  exportDatabase, 
  importDatabase,
  addTag,
  getTagsForEntry,
  deleteTag
} from './utils/database';
import { splitIntoSentences } from './utils/helpers';

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
  position: relative;
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

const ToggleContainer = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  align-items: center;
`;

const ToggleLabel = styled.label`
  margin-left: 10px;
  font-size: 14px;
  color: #343a40;
`;

const ToggleSwitch = styled.input.attrs({ type: 'checkbox' })`
  width: 40px;
  height: 20px;
  -webkit-appearance: none;
  background: #c6c6c6;
  outline: none;
  border-radius: 20px;
  box-shadow: inset 0 0 5px rgba(0,0,0,0.2);
  transition: 0.3s;
  cursor: pointer;
  position: relative;

  &:checked {
    background: #495057;
  }

  &:before {
    content: '';
    position: absolute;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    top: 1px;
    left: 1px;
    background: white;
    transition: 0.3s;
  }

  &:checked:before {
    transform: translateX(20px);
  }
`;

const ServerInputContainer = styled.div`
  overflow: hidden;
  max-height: 0;
  transition: max-height 0.5s ease-out;
  ${({ isOpen }) =>
    isOpen &&
    css`
      max-height: 100px; /* Adjust based on content */
      transition: max-height 0.5s ease-in;
    `}
  margin-top: 20px;
`;

const ServerInput = styled.input`
  width: 100%;
  padding: 10px;
  border: 2px solid #ced4da;
  border-radius: 8px;
  font-size: 16px;
  font-family: inherit;
  &:focus {
    outline: none;
    border-color: #495057;
  }
`;

const ExportButton = styled.button`
  width: 100%;
  padding: 12px;
  background-color: #28a745;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  margin-top: 10px;
  &:hover {
    background-color: #218838;
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

// Hidden file input for importing
const HiddenFileInput = styled.input`
  display: none;
`;

// -- Additional styled components for tagging --
const Sentence = styled.span`
  position: relative;
  cursor: pointer;
  &:hover {
    background-color: rgba(73, 80, 87, 0.3); /* Half-transparent highlight */
  }
`;

const Tooltip = styled.div`
  visibility: hidden;
  background-color: #343a40;
  color: #fff;
  text-align: center;
  border-radius: 6px;
  padding: 5px;
  position: absolute;
  z-index: 1;
  bottom: 125%; /* Position above the sentence */
  left: 50%;
  transform: translateX(-50%);
  opacity: 0;
  transition: opacity 0.3s;
  width: max-content;

  ${Sentence}:hover & {
    visibility: visible;
    opacity: 1;
  }
`;

// Modal for adding tags (simplified)
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ModalContent = styled.div`
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  width: 300px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 18px;
  position: absolute;
  top: 10px;
  right: 20px;
  cursor: pointer;
`;

// Add styled component for delete button
const DeleteTagButton = styled.button`
  background: none;
  border: none;
  color: #dc3545;
  font-weight: bold;
  margin-left: 10px;
  cursor: pointer;
  &:hover {
    color: #a71d2a;
  }
`;

function App() {
  // Existing state variables
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
      } catch (error) {
        console.error('Database initialization failed:', error);
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

      // Confirm overwrite
      const proceed = window.confirm('Importing a database will overwrite your current entries. Do you wish to continue?');
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
      await addTag(currentEntryId, currentSentenceIndex, currentTag);
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
      await deleteTag(tagId);
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
                  const tag = entryTags.find(t => t.sentenceIndex === index);
                  return (
                    <Sentence 
                      key={index} 
                      onDoubleClick={() => handleAddTag(entry.id, index)}
                    >
                      {sentence.trim() + ' '}
                      {tag && (
                        <Tooltip>
                          {tag.tag}
                          <DeleteTagButton onClick={() => handleDeleteTag(entry.id, tag.id)}>✕</DeleteTagButton>
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
              <Button onClick={handleSaveTag} style={{ width: '100%' }}>
                Save Tag
              </Button>
            </ModalContent>
          </ModalOverlay>
        )}
      </DiaryBox>
    </Container>
  );
}

export default App;