import styled, { css } from 'styled-components';

export const ServerInputContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  overflow: hidden;
  max-height: ${props => (props.isOpen ? '100px' : '0')};
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
  width: 75%;
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