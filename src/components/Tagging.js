import styled from 'styled-components';

export const Sentence = styled.span`
  position: relative;
  cursor: pointer;
  
  &:hover {
    background-color: rgba(73, 80, 87, 0.3); /* Half-transparent highlight */
  }
`;

export const Tooltip = styled.div`
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

export default { Sentence, Tooltip };