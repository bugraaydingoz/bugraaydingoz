// Hooks
import { useTheme } from '../../hooks/useTheme'

// Styles
import { HeaderContainer } from './styles'
import { Button, Pattern, Image } from '../shared/elements'
import { H1, Emphasize, Lead } from '../shared/typography'
import { Flex } from '../shared/layout'

export function Header() {
  const { toggle } = useTheme()
  return (
    <HeaderContainer>
      <Pattern src="./images/pattern.svg" />
      <Flex direction="column">
        <H1 style={{ marginBottom: '10px' }}>Merhaba</H1>
        <Lead style={{ marginBottom: '3px' }}>My name is Buğra</Lead>
        <Lead style={{ marginBottom: '40px' }}>
          I am a <Emphasize>Front-end Engineer</Emphasize> based in Munich
        </Lead>
        <Button onClick={() => toggle()}>GET IN TOUCH</Button>
      </Flex>
      <Flex>
        <Image src="./images/pp.png" />
      </Flex>
    </HeaderContainer>
  )
}
