import * as React from 'react'
import { Button, Heading, Link, Text } from '@react-email/components'
import { BrandLayout, styles } from './_layout'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({ siteName, siteUrl, confirmationUrl }: InviteEmailProps) => (
  <BrandLayout preview={`You've been invited to join ${siteName}`} siteName={siteName}>
    <Heading style={styles.h1}>You've been invited</Heading>
    <Text style={styles.text}>
      You've been invited to join{' '}
      <Link href={siteUrl} style={styles.link}>
        <strong>{siteName}</strong>
      </Link>
      . Click the button below to accept the invitation and create your account.
    </Text>
    <Button style={styles.button} href={confirmationUrl}>
      Accept Invitation
    </Button>
    <Text style={styles.footer}>
      If you weren't expecting this invitation, you can safely ignore this email.
    </Text>
  </BrandLayout>
)

export default InviteEmail
