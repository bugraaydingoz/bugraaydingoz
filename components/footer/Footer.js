// Components
import LinkedinIcon from '../shared/icons/linkedin.svg'
import GithubIcon from '../shared/icons/github.svg'
import TwitterIcon from '../shared/icons/twitter.svg'

// Styles
import { FooterContainer, Email } from './styles'
import { Text } from '../shared/typography'
import { Flex } from '../shared/layout'

export function Footer() {
  return (
    <FooterContainer>
      <h4 style={{ marginBottom: 'var(--space-sm)' }}>GET IN TOUCH</h4>
      <Text style={{ marginBottom: 'var(--space-xxs)' }}>Don’t be shy.</Text>
      <Text style={{ marginBottom: 'var(--space-sm)' }}>
        I am looking forward to hearing from you.
      </Text>
      <Email
        style={{ marginBottom: 'var(--space-lg)' }}
        href="mailto:hello@bugraaydingoz.com"
      >
        hello@bugraaydingoz.com
      </Email>
      <Flex>
        <LinkedinIcon />
        <GithubIcon />
        <TwitterIcon />
      </Flex>
    </FooterContainer>
  )
}
