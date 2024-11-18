import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import TagTooltip from './TagTooltip';
import { Sentence } from './Tagging';

const Wrapper = styled.span`
  position: relative;
  display: inline-block;
`;

function SentenceWithTooltip({
  sentence,
  entryId,
  sentenceIndex,
  existingTags,
  onAddTag,
}) {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const wrapperRef = useRef(null);
  const hideTimeoutRef = useRef(null);

  // Handle mouse entering the wrapper (sentence)
  const handleMouseEnter = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setIsTooltipVisible(true);
  };

  // Handle mouse leaving the wrapper (sentence)
  const handleMouseLeave = (event) => {
    // Check if the mouse is still within the wrapper
    if (
      wrapperRef.current &&
      !wrapperRef.current.contains(event.relatedTarget)
    ) {
      hideTimeoutRef.current = setTimeout(() => {
        if (!isInteracting && !isInputFocused) { // Updated condition to check input focus
          setIsTooltipVisible(false);
        }
      }, 0); // Increase delay to accommodate interactions
    }
  };

  // Handle interactions within the tooltip
  const handleInteractionStart = () => {
    setIsInteracting(true);
    // Allow interaction to complete before resetting the flag
    setTimeout(() => setIsInteracting(false), 300);
  };

  // Handle input focus within the tooltip
  const handleInputFocus = () => {
    setIsInputFocused(true);
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };

  // Handle input blur within the tooltip
  const handleInputBlur = () => {
    setIsInputFocused(false);
    // Hide the tooltip after a short delay to allow any pending interactions
    hideTimeoutRef.current = setTimeout(() => {
      setIsTooltipVisible(false);
    }, 50);
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
          onFocusInput={handleInputFocus} // Pass the focus handler -- ⭐ for tooltip remaining (commit 810699...)
          onBlurInput={handleInputBlur}   // Pass the blur handler  -- ⭐ for tooltip remaining (commit 810699...)
        />
      )}
    </Wrapper>
  );
}

export default SentenceWithTooltip;