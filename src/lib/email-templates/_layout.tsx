import * as React from 'react'
import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface BrandLayoutProps {
  preview: string
  siteName: string
  children: React.ReactNode
}

export const BrandLayout = ({ preview, siteName, children }: BrandLayoutProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{preview}</Preview>
    <Body style={main}>
      <Container style={outer}>
        <Section style={header}>
          <Text style={brand}>{siteName}</Text>
          <Text style={tagline}>Land your next role, faster.</Text>
        </Section>
        <Container style={card}>{children}</Container>
        <Section style={footerSection}>
          <Text style={footerText}>
            © {new Date().getFullYear()} {siteName} · thecareerboost.com
          </Text>
          <Text style={footerSmall}>
            You're receiving this email because an account action was requested.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  margin: 0,
  padding: '24px 0',
}
const outer = { maxWidth: '560px', margin: '0 auto', padding: '0 16px' }
const header = {
  background:
    'linear-gradient(135deg, #064e3b 0%, #0d7a5f 60%, #c9a84c 100%)',
  borderRadius: '16px 16px 0 0',
  padding: '32px 28px',
  textAlign: 'center' as const,
}
const brand = {
  color: '#ffffff',
  fontSize: '22px',
  fontWeight: 700 as const,
  letterSpacing: '-0.01em',
  margin: 0,
}
const tagline = {
  color: 'rgba(255,255,255,0.85)',
  fontSize: '13px',
  margin: '6px 0 0',
}
const card = {
  backgroundColor: '#ffffff',
  border: '1px solid #e6e8eb',
  borderTop: 'none',
  borderRadius: '0 0 16px 16px',
  padding: '32px 28px',
}
const footerSection = { padding: '24px 8px 8px', textAlign: 'center' as const }
const footerText = { color: '#6b7280', fontSize: '12px', margin: 0 }
const footerSmall = { color: '#9ca3af', fontSize: '11px', margin: '6px 0 0' }

export const styles = {
  h1: {
    fontSize: '22px',
    fontWeight: 700 as const,
    color: '#064e3b',
    margin: '0 0 16px',
    letterSpacing: '-0.01em',
  },
  text: {
    fontSize: '15px',
    color: '#374151',
    lineHeight: '1.6',
    margin: '0 0 20px',
  },
  button: {
    backgroundColor: '#064e3b',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: 600 as const,
    borderRadius: '10px',
    padding: '14px 28px',
    textDecoration: 'none',
    display: 'inline-block',
  },
  link: { color: '#0d7a5f', textDecoration: 'underline' },
  footer: {
    fontSize: '13px',
    color: '#6b7280',
    margin: '28px 0 0',
    lineHeight: '1.5',
  },
  code: {
    display: 'inline-block',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: '26px',
    fontWeight: 700 as const,
    color: '#064e3b',
    letterSpacing: '0.3em',
    backgroundColor: '#f3f6f4',
    border: '1px solid #d6e0db',
    borderRadius: '10px',
    padding: '14px 22px',
    margin: '0 0 24px',
  },
}
