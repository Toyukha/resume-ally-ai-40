import * as React from 'react'
import { Heading, Text } from '@react-email/components'
import { BrandLayout, styles } from './_layout'

interface ReauthenticationEmailProps {
  token: string
  siteName?: string
}

export const ReauthenticationEmail = ({
  token,
  siteName = 'Career Boost',
}: ReauthenticationEmailProps) => (
  <BrandLayout preview="Your verification code" siteName={siteName}>
    <Heading style={styles.h1}>Confirm reauthentication</Heading>
    <Text style={styles.text}>Use the code below to confirm your identity:</Text>
    <Text style={styles.code}>{token}</Text>
    <Text style={styles.footer}>
      This code will expire shortly. If you didn't request this, you can safely
      ignore this email.
    </Text>
  </BrandLayout>
)

export default ReauthenticationEmail
