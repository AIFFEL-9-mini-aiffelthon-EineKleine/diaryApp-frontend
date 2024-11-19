import styled from 'styled-components';

export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
`;

export const ModalContent = styled.div`
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  width: 300px;
  position: relative;
`;

export const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 18px;
  position: absolute;
  top: 10px;
  right: 20px;
  cursor: pointer;
`;

export default { ModalOverlay, ModalContent, CloseButton };