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
  border-radius: var(--border-radius);
  font-weight: bold;
  font-size: 14px;
  line-height: 21px;

  &:hover {
    cursor: pointer;
  }
`

export const Image = styled.img`
  display: flex;
  width: 320px;
  height: 320px;
  filter: drop-shadow(0px 2px 20px rgba(20, 20, 40, 0.1));
`

export const Pattern = styled.img`
  position: absolute;
  right: 60px;
  top: 60px;
`
