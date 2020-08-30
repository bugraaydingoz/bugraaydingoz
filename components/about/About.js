// Styles
import { AboutContainer } from './styles'
import { Body1, Body2 } from '../shared/typography'
import { Flex } from '../shared/layout'

export function About() {
  return (
    <AboutContainer>
      <Flex>
        <Body1 style={{ maxWidth: '560px' }}>
          I am a dedicated software engineer with a passion for design and tech.
          I specialize in front-end development and I bring value by creating
          beautiful and meaningful user experiences.
        </Body1>
      </Flex>
      <Flex>
        <Body2 style={{ maxWidth: '490px' }}>
          I started programming by creating small games when I was in middle
          school and it got stuck with me. I love creating and solving problems.
          I am super lucky to be in this field since learning never stops. I
          believe as an engineer and a human, constant learning is the path to
          success. Besides work, I like cycling and playing table tennis.
        </Body2>
      </Flex>
    </AboutContainer>
  )
}
