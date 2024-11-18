import styled from 'styled-components';

const Message = styled.p`
  text-align: center;
  color: ${props => (props.error ? '#dc3545' : '#28a745')};
  margin-top: 15px;
`;

export default Message;