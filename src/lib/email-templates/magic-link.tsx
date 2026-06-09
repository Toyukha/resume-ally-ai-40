import * as React from 'react'
import { Button, Heading, Text } from '@react-email/components'
import { BrandLayout, styles } from './_layout'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({ siteName, confirmationUrl }: MagicLinkEmailProps) => (
  <BrandLayout preview={`Your login link for ${siteName}`} siteName={siteName}>
    <Heading style={styles.h1}>Your login link</Heading>
    <Text style={styles.text}>
      Click the button below to log in to <strong>{siteName}</strong>. This link
      will expire shortly.
    </Text>
    <Button style={styles.button} href={confirmationUrl}>
      Log In
    </Button>
    <Text style={styles.footer}>
      If you didn't request this link, you can safely ignore this email.
    </Text>
  </BrandLayout>
)

export default MagicLinkEmail
