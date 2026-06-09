import * as React from 'react'
import { Button, Heading, Link, Text } from '@react-email/components'
import { BrandLayout, styles } from './_layout'

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
  <BrandLayout preview={`Confirm your email for ${siteName}`} siteName={siteName}>
    <Heading style={styles.h1}>Confirm your email</Heading>
    <Text style={styles.text}>
      Welcome to{' '}
      <Link href={siteUrl} style={styles.link}>
        <strong>{siteName}</strong>
      </Link>
      ! We're excited to help you land your next role.
    </Text>
    <Text style={styles.text}>
      Please confirm{' '}
      <Link href={`mailto:${recipient}`} style={styles.link}>
        {recipient}
      </Link>{' '}
      by clicking the button below:
    </Text>
    <Button style={styles.button} href={confirmationUrl}>
      Verify Email
    </Button>
    <Text style={styles.footer}>
      If you didn't create an account, you can safely ignore this email.
    </Text>
  </BrandLayout>
)

export default SignupEmail
