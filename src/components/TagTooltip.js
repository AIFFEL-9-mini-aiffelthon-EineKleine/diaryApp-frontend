// TagTooltip.js

import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { SaveButton, DeleteTagButton } from './Buttons';

// Styled Components
const TooltipContainer = styled.div`
  position: absolute;
  bottom: 100%; /* Positions above the sentence */
  left: 50%;
  transform: translate(-50%); /* 5px offset removed for UX */
  background: #343a40;
  color: #fff;
  padding: 10px;
  border-radius: 6px;
  z-index: 1000;
  width: 220px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  pointer-events: auto; /* Allows interaction */

  /* Arrow pointing downwards towards the sentence */
  &::after {
    content: '';
    position: absolute;
    top: 100%; /* Positions the arrow at the bottom of the tooltip */
    left: 50%;
    transform: translateX(-50%);
    border-width: 5px;
    border-style: solid;
    border-color: #343a40 transparent transparent transparent;
  }
`;

const TagItem = styled.span`
  background: #495057;
  color: #fff;
  padding: 3px 8px;
  border-radius: 12px;
  margin: 2px 2px 2px 0;
  display: inline-block;
  font-size: 12px;
`;

const TagInput = styled.input`
  width: calc(100% - 16px);
  padding: 5px;
  margin-top: 5px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
`;

const TagActions = styled.div`
  margin-top: 5px;
  display: flex;
  justify-content: flex-end;
`;

const CancelButton = styled.button`
  background: none;
  border: none;
  color: #adb5bd;
  cursor: pointer;
  font-size: 14px;
  margin-right: 10px;

  &:hover {
    color: #6c757d;
  }
`;

// TagTooltip Component
function TagTooltip({
  existingTags,
  onAddTag,
  onClose,
  onFocusInput, // New Prop
  onBlurInput,  // New Prop
}) {
  const [newTag, setNewTag] = useState('');
  const inputRef = useRef(null);

  const handleAdd = () => {
    if (newTag.trim() !== '') {
      onAddTag(newTag.trim());
      setNewTag('');
    }
  };

  // useEffect to handle focus and blur events on the input
  useEffect(() => {
    const inputElement = inputRef.current;
    if (!inputElement) return;

    const handleFocus = () => {
      if (onFocusInput) onFocusInput();
    };

    const handleBlur = () => {
      if (onBlurInput) onBlurInput();
    };

    inputElement.addEventListener('focus', handleFocus);
    inputElement.addEventListener('blur', handleBlur);

    // Cleanup event listeners on unmount
    return () => {
      inputElement.removeEventListener('focus', handleFocus);
      inputElement.removeEventListener('blur', handleBlur);
    };
  }, [onFocusInput, onBlurInput]);

  return (
    <TooltipContainer role="dialog" aria-labelledby="tag-tooltip-title">
      <div>
        <strong id="tag-tooltip-title">Tags:</strong>
        <div>
          {existingTags.map(tag => (
            <TagItem key={tag.id}>{tag.tag}</TagItem>
          ))}
        </div>
      </div>
      <TagInput
        ref={inputRef}
        type="text"
        placeholder="Add a tag..."
        value={newTag}
        onChange={(e) => setNewTag(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleAdd();
          }
        }}
        aria-label="Add a new tag"
        list="predefined-tags"
      />
      <datalist id="predefined-tags">
        {/* Optional: Add predefined tag options */}
        <option value="Work" />
        <option value="Personal" />
        <option value="Ideas" />
        <option value="Important" />
        <option value="⭐" />
      </datalist>
      <TagActions>
        <CancelButton onClick={onClose} aria-label="Cancel adding tag">
          Cancel
        </CancelButton>
        <SaveButton
          onClick={handleAdd}
          style={{ padding: '5px 10px', fontSize: '14px' }}
          aria-label="Add tag"
        >
          Add
        </SaveButton>
      </TagActions>
    </TooltipContainer>
  );
}

export default TagTooltip;