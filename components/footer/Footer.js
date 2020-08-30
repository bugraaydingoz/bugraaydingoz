// Components
import LinkedinIcon from '../shared/icons/linkedin.svg'
import GithubIcon from '../shared/icons/github.svg'
import TwitterIcon from '../shared/icons/twitter.svg'

// Styles
import { FooterContainer, Email, Link } from './styles'
import { Text } from '../shared/typography'
import { Flex } from '../shared/layout'

export function Footer() {
  return (
    <FooterContainer>
      <Text
        size="22px"
        weight="600"
        style={{ marginBottom: 'var(--space-sm)' }}
      >
        GET IN TOUCH
      </Text>
      <Text size="18px" style={{ marginBottom: 'var(--space-xxs)' }}>
        Have an idea?
      </Text>
      <Text size="18px" style={{ marginBottom: 'var(--space-sm)' }}>
        I am looking forward to discussing it
      </Text>
      <Email
        style={{ marginBottom: 'var(--space-lg)' }}
        href="mailto:hello@bugraaydingoz.com"
      >
        hello@bugraaydingoz.com
      </Email>
      <Flex>
        <Link href="https://linkedin.com/in/bugraaydingoz" target="_blank">
          <LinkedinIcon />
        </Link>
        <Link href="https://github.com/bugraaydingoz" target="_blank">
          <GithubIcon />
        </Link>
        <Link href="https://twitter.com/bugraaydingoz" target="_blank">
          <TwitterIcon />
        </Link>
      </Flex>
    </FooterContainer>
  )
}
