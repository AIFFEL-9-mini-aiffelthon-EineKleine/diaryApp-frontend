import React from 'react';
import styled from 'styled-components';
import { DeleteTagButton } from './Buttons';

const TagListContainer = styled.div`
  margin-top: 10px;
  border-top: 1px solid #ced4da;
  padding-top: 10px;
`;

const TagItem = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 5px;
`;

const TagLabel = styled.span`
  background: #17a2b8;
  color: #fff;
  padding: 5px 10px;
  border-radius: 12px;
  margin-right: 10px;
  font-size: 14px;
`;

const TagDetails = styled.div`
  display: flex;
  flex-direction: column;
`;

function TagList({ tags, onDeleteTag }) {
  return (
    <TagListContainer>
      <strong>All Tags:</strong>
      {tags.length === 0 && <p>No tags added.</p>}
      {tags.map(tag => (
        <TagItem key={tag.id}>
          <TagLabel>{tag.tag}</TagLabel>
          <TagDetails>
            <span>Sentence: {tag.sentenceIndex + 1}</span>
            <DeleteTagButton onClick={() => onDeleteTag(tag.id)}>Delete</DeleteTagButton>
          </TagDetails>
        </TagItem>
      ))}
    </TagListContainer>
  );
}

export default TagList;