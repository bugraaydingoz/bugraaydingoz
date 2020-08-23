import styled from 'styled-components'

export const Button = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 200px;
  height: 60px;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: bold;
  font-size: 14px;
  line-height: 21px;

  &:hover {
    cursor: pointer;
  }
`
