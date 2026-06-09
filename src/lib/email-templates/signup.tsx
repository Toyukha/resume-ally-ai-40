import * as React from 'react'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email to activate your {siteName} account</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandBar}>
          <Text style={brand}>The Career Boost</Text>
        </Section>
        <Heading style={h1}>Confirm your email</Heading>
        <Text style={text}>
          Welcome to{' '}
          <Link href={siteUrl} style={brandLink}>
            <strong>{siteName}</strong>
          </Link>
          ! We're excited to help you land that job.
        </Text>
        <Text style={text}>
          Please confirm your email address (
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ) by clicking the button below to activate your account:
        </Text>
        <Section style={{ textAlign: 'center', margin: '32px 0' }}>
          <Button style={button} href={confirmationUrl}>
            Activate my account
          </Button>
        </Section>
        <Text style={text}>
          Once confirmed, you'll be redirected to sign in at{' '}
          <Link href="https://thecareerboost.com/auth" style={link}>
            thecareerboost.com
          </Link>
          .
        </Text>
        <Text style={footer}>
          If you didn't create an account with The Career Boost, you can safely
          ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Urbanist, Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const brandBar = { padding: '0 0 24px', borderBottom: '1px solid #eeeeee', marginBottom: '24px' }
const brand = {
  fontSize: '18px',
  fontWeight: 800 as const,
  letterSpacing: '-0.01em',
  color: '#0f172a',
  margin: 0,
}
const h1 = {
  fontSize: '24px',
  fontWeight: 800 as const,
  color: '#0f172a',
  margin: '0 0 20px',
}
const text = {
  fontSize: '15px',
  color: '#475569',
  lineHeight: '1.6',
  margin: '0 0 16px',
}
const link = { color: '#0f172a', textDecoration: 'underline' }
const brandLink = { color: '#0f172a', textDecoration: 'none' }
const button = {
  backgroundColor: '#0f172a',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 600 as const,
  borderRadius: '10px',
  padding: '14px 28px',
  textDecoration: 'none',
  display: 'inline-block',
}
const footer = { fontSize: '12px', color: '#94a3b8', margin: '32px 0 0', lineHeight: '1.5' }
