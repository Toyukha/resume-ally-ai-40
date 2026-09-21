import * as React from 'react'
import { createHash } from 'crypto'
import { createAuthEmailHandler, type AuthEmailHookData } from '@lovable.dev/email-js'
import { createFileRoute } from '@tanstack/react-router'
import { SignupEmail } from '@/lib/email-templates/signup'
import { InviteEmail } from '@/lib/email-templates/invite'
import { MagicLinkEmail } from '@/lib/email-templates/magic-link'
import { RecoveryEmail } from '@/lib/email-templates/recovery'
import { EmailChangeEmail } from '@/lib/email-templates/email-change'
import { ReauthenticationEmail } from '@/lib/email-templates/reauthentication'

// Configuration
const SITE_NAME = 'Career Boost'
const SENDER_DOMAIN = 'notify.thecareerboost.com'
const ROOT_DOMAIN = 'thecareerboost.com'
const FROM_DOMAIN = 'thecareerboost.com'

function sha256Hex(input: string): string {
  return createHash('sha256').update(input.trim().toLowerCase()).digest('hex')
}

function baseProps(data: AuthEmailHookData) {
  return {
    siteName: SITE_NAME,
    siteUrl: `https://${ROOT_DOMAIN}`,
    recipient: data.email,
    confirmationUrl: data.url,
    token: data.token,
    email: data.email,
    oldEmail: data.old_email,
    newEmail: data.new_email,
  }
}

const handler = createAuthEmailHandler({
  apiKey: process.env.LOVABLE_API_KEY ?? '',
  from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
  senderDomain: SENDER_DOMAIN,
  sendUrl: process.env.LOVABLE_SEND_URL,
  emails: {
    signup: {
      subject: 'Confirm your email',
      render: (data) => {
        // Open-tracking pixel used by the signup verification analytics.
        const pixelUrl = data.email
          ? `https://${ROOT_DOMAIN}/api/public/hooks/email-pixel?e=${sha256Hex(data.email)}&t=signup`
          : undefined
        return React.createElement(SignupEmail, { ...baseProps(data), pixelUrl })
      },
    },
    invite: {
      subject: "You've been invited",
      render: (data) => React.createElement(InviteEmail, baseProps(data)),
    },
    magiclink: {
      subject: 'Your login link',
      render: (data) => React.createElement(MagicLinkEmail, baseProps(data)),
    },
    recovery: {
      subject: 'Reset your password',
      render: (data) => React.createElement(RecoveryEmail, baseProps(data)),
    },
    email_change: {
      subject: 'Confirm your new email',
      render: (data) => React.createElement(EmailChangeEmail, baseProps(data)),
    },
    reauthentication: {
      subject: 'Your verification code',
      render: (data) => React.createElement(ReauthenticationEmail, baseProps(data)),
    },
  },
})

export const Route = createFileRoute('/lovable/email/auth/webhook')({
  server: {
    handlers: {
      POST: ({ request }) => handler(request),
    },
  },
})
