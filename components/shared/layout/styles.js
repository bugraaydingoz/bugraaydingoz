import styled from 'styled-components'

export const Flex = styled.div`
  display: flex;
  flex-direction: ${({ direction }) => direction || 'unset'};
  align-items: ${({ align }) => align || 'unset'};
  justify-content: ${({ justify }) => justify || 'unset'};
`
