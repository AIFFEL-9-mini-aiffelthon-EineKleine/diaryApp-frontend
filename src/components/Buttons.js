import styled, { css } from 'styled-components';

// Base Button Styles
const ButtonStyles = css`
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
`;

// Save Button
export const SaveButton = styled.button`
  ${ButtonStyles}
  width: 48%;
  background-color: #495057;
  color: #ffffff;
  margin-right: 4%;

  &:hover {
    background-color: #343a40;
  }

  &:disabled {
    background-color: #adb5bd;
    cursor: not-allowed;
  }
`;

// Import Button
export const ImportButton = styled.button`
  ${ButtonStyles}
  width: 48%;
  background-color: #007bff;
  color: #ffffff;

  &:hover {
    background-color: #0056b3;
  }
`;

// Export Button
export const ExportButton = styled.button`
  ${ButtonStyles}
  width: 100%;
  background-color: #28a745;
  color: #ffffff;
  margin-top: 10px;

  &:hover {
    background-color: #218838;
  }

  &:disabled {
    background-color: #adb5bd;
    cursor: not-allowed;
  }
`;

// Delete Tag Button
export const DeleteTagButton = styled.button`
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

export default { SaveButton, ImportButton, ExportButton, DeleteTagButton };