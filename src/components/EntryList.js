import styled from 'styled-components';

export const EntryList = styled.div`
  margin-top: 30px;
`;

export const EntryItem = styled.div`
  background: #ffffff;
  padding: 15px;
  border-left: 4px solid #495057;
  margin-bottom: 10px;
  border-radius: 4px;
`;

export const EntryDate = styled.span`
  display: block;
  font-size: 12px;
  color: #6c757d;
  margin-bottom: 5px;
`;

export default { EntryList, EntryItem, EntryDate };