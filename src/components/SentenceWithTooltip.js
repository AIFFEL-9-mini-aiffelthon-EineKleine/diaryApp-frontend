import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import TagTooltip from './TagTooltip';
import { Sentence } from './Tagging';

const Wrapper = styled.span`
  position: relative;
  display: inline-block;
`;

function SentenceWithTooltip({ sentence, entryId, sentenceIndex, existingTags, onAddTag }) {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const wrapperRef = useRef(null);
  const hideTimeoutRef = useRef(null);

  // Handle mouse entering the wrapper (sentence or tooltip)
  const handleMouseEnter = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setIsTooltipVisible(true);
  };

  // Handle mouse leaving the wrapper
  const handleMouseLeave = (event) => {
    // Check if the mouse is still within the wrapper
    if (wrapperRef.current && !wrapperRef.current.contains(event.relatedTarget)) {
      hideTimeoutRef.current = setTimeout(() => {
        if (!isInteracting) {
          setIsTooltipVisible(false);
        }
      }, 300); // Increased delay to accommodate interactions
    }
  };

  // Handle interactions within the tooltip
  const handleInteractionStart = () => {
    setIsInteracting(true);
    // Allow interaction to complete before resetting the flag
    setTimeout(() => setIsInteracting(false), 300);
  };

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Wrapper
      ref={wrapperRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Sentence>
        {sentence.trim() + ' '}
      </Sentence>
      {isTooltipVisible && (
        <TagTooltip
          existingTags={existingTags}
          onAddTag={(tag) => onAddTag(entryId, sentenceIndex, tag)}
          onClose={() => setIsTooltipVisible(false)}
          onMouseDown={handleInteractionStart}
        />
      )}
    </Wrapper>
  );
}

export default SentenceWithTooltip;