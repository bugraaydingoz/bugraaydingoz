import styled from 'styled-components'

export const HeaderContainer = styled.header`
  display: flex;
  min-height: 100vh;
  justify-content: space-between;
  align-items: center;
`

export const H1 = styled.h1`
  margin: 0;
  font-weight: 600;
  font-size: 52px;
  line-height: 78px;
`

export const Lead = styled.p`
  margin: 0;
  font-size: 26px;
  line-height: 39px;
`

export const Emphasize = styled.span`
  font-weight: 600;
  color: var(--primary-color);
`

export const LeftContainer = styled.div`
  display: flex;
  flex-direction: column;
`
export const RightContainer = styled.div`
  display: flex;
  flex-direction: column;
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
