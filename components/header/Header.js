import {
  HeaderContainer,
  H1,
  Lead,
  LeftContainer,
  RightContainer,
  Image,
  Emphasize,
  Pattern,
} from './styles'

import { Button } from '../shared/elements'

export function Header() {
  return (
    <HeaderContainer>
      <Pattern src="./images/pattern.svg" />
      <LeftContainer>
        <H1 style={{ marginBottom: '10px' }}>Merhaba</H1>
        <Lead style={{ marginBottom: '3px' }}>My name is Buğra</Lead>
        <Lead style={{ marginBottom: '40px' }}>
          I am a <Emphasize>Front-end Engineer</Emphasize> based in Munich
        </Lead>
        <Button>GET IN TOUCH</Button>
      </LeftContainer>
      <RightContainer>
        <Image src="./images/pp.png" />
      </RightContainer>
    </HeaderContainer>
  )
}
