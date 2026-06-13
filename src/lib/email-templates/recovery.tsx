import * as React from 'react'
import { Button, Heading, Text } from '@react-email/components'
import { BrandLayout, styles } from './_layout'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({ siteName, confirmationUrl }: RecoveryEmailProps) => (
  <BrandLayout preview={`Reset your password for ${siteName}`} siteName={siteName}>
    <Heading style={styles.h1}>Reset your password</Heading>
    <Text style={styles.text}>
      We received a request to reset your password for <strong>{siteName}</strong>. Click the button below to choose a new password.
    </Text>
    <Button style={styles.button} href={confirmationUrl}>
      Reset Password
    </Button>
    <Text style={styles.footer}>
      If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
    </Text>
  </BrandLayout>
)

export default RecoveryEmail
