import styled from 'styled-components'

export const FooterContainer = styled.footer`
  display: flex;
  flex-direction: column;
  padding: var(--space-xl) var(--space-xl);
  background-color: var(--background-color-2);
`

export const Email = styled.a`
  display: flex;
  color: var(--primary-color);
  text-decoration: none;
  font-size: 18px;
  font-weight: 600;
`

export const Link = styled.a`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: var(--space-sm);

  &:hover {
    cursor: pointer;
  }
`
