import * as React from 'react'
import { Button, Heading, Link, Text } from '@react-email/components'
import { BrandLayout, styles } from './_layout'

interface EmailChangeEmailProps {
  siteName: string
  oldEmail: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  oldEmail,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <BrandLayout preview={`Confirm your email change for ${siteName}`} siteName={siteName}>
    <Heading style={styles.h1}>Confirm your email change</Heading>
    <Text style={styles.text}>
      You requested to change your email address for <strong>{siteName}</strong> from{' '}
      <Link href={`mailto:${oldEmail}`} style={styles.link}>{oldEmail}</Link>{' '}
      to{' '}
      <Link href={`mailto:${newEmail}`} style={styles.link}>{newEmail}</Link>.
    </Text>
    <Text style={styles.text}>Click the button below to confirm this change:</Text>
    <Button style={styles.button} href={confirmationUrl}>
      Confirm Email Change
    </Button>
    <Text style={styles.footer}>
      If you didn't request this change, please secure your account immediately.
    </Text>
  </BrandLayout>
)

export default EmailChangeEmail
