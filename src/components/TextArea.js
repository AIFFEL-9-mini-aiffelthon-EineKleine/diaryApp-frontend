import styled from 'styled-components';

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

export default TextArea;