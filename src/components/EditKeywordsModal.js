// src/components/EditKeywordsModal.js

import React from 'react';
import styled from 'styled-components';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ModalContent = styled.div`
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  width: 400px;
`;

const ModalTitle = styled.h3`
  margin-top: 0;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
`;

const ModalButton = styled.button`
  padding: 8px 12px;
  margin-left: 10px;
  font-size: 14px;
  cursor: pointer;
`;

function EditKeywordsModal({ keywords, onKeywordsChange, onSave, onCancel }) {
  return (
    <ModalOverlay>
      <ModalContent>
        <ModalTitle>Edit Emotions</ModalTitle>
        <input
          type="text"
          value={keywords}
          onChange={onKeywordsChange}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '8px',
            border: '2px solid #ced4da',
            fontSize: '16px',
            fontFamily: 'inherit',
          }}
        />
        <ButtonGroup>
          <ModalButton onClick={onCancel}>Cancel</ModalButton>
          <ModalButton onClick={onSave}>Save</ModalButton>
        </ButtonGroup>
      </ModalContent>
    </ModalOverlay>
  );
}

export default EditKeywordsModal;