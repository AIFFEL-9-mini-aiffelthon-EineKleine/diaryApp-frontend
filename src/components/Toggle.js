import styled, { css } from 'styled-components';

export const ToggleContainer = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  align-items: center;
`;

export const ToggleLabel = styled.label`
  margin-left: 10px;
  font-size: 14px;
  color: #343a40;
`;

export const ToggleSwitch = styled.input.attrs({ type: 'checkbox' })`
  width: 40px;
  height: 20px;
  -webkit-appearance: none;
  background: #c6c6c6;
  outline: none;
  border-radius: 20px;
  box-shadow: inset 0 0 5px rgba(0,0,0,0.2);
  transition: 0.3s;
  cursor: pointer;
  position: relative;

  &:checked {
    background: #495057;
  }

  &:before {
    content: '';
    position: absolute;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    top: 1px;
    left: 1px;
    background: white;
    transition: 0.3s;
  }

  &:checked:before {
    transform: translateX(20px);
  }
`;

export default { ToggleContainer, ToggleLabel, ToggleSwitch };