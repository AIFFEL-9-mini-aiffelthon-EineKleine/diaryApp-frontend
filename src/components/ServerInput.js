import styled, { css } from 'styled-components';

export const ServerInputContainer = styled.div`
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

export const ServerInput = styled.input`
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

export default { ServerInputContainer, ServerInput };