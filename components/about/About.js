// Styles
import { AboutContainer } from './styles'
import { Body1, Body2 } from '../shared/typography'
import { Flex } from '../shared/layout'

export function About() {
  return (
    <AboutContainer>
      <Flex>
        <Body1 style={{ width: '560px' }}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Non molestie
          tincidunt nisi cursus eget leo volutpat morbi risus. Sed erat vitae
          habitant tincidunt.
        </Body1>
      </Flex>
      <Flex>
        <Body2 style={{ width: '490px' }}>
          Quis habitasse auctor aliquam aliquam velit. Et commodo, bibendum
          libero, sed lobortis tellus. Eget ullamcorper nunc adipiscing cras
          ornare maecenas donec. Ridiculus vestibulum, quis mauris metus cras
          orci sed. Turpis proin amet, ullamcorper convallis non dolor. Sed
          commodo iaculis massa scelerisque ac mauris mi tempus. Duis sed nisi,
          arcu turpis fringilla tristique metus, elit.
        </Body2>
      </Flex>
    </AboutContainer>
  )
}
