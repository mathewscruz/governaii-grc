import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface PasswordResetEmailProps {
  userName: string
  userEmail: string
  temporaryPassword: string
  loginUrl: string
}

export const PasswordResetEmail = ({
  userName,
  userEmail,
  temporaryPassword,
  loginUrl,
}: PasswordResetEmailProps) => (
  <Html>
    <Head />
    <Preview>Sua nova senha temporária para o GovernAII</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoContainer}>
          <Img
            src="https://lnlkahtugwmkznasapfd.supabase.co/storage/v1/object/sign/logotipo/Governiaa%20(500%20x%20200%20px)%20(20).png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82NTdhMjYzYS1jZjc1LTQ3OGYtYjNkMy01NWM2ODViMTQ0MTEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJsb2dvdGlwby9Hb3Zlcm5pYWEgKDUwMCB4IDIwMCBweCkgKDIwKS5wbmciLCJpYXQiOjE3NTMyMDc1MTUsImV4cCI6MTc4NDc0MzUxNX0.5wdMpRQlszuUk9MaPw15_rq2xS83F8e-YfI3cKgSyTY"
            width="250"
            height="100"
            alt="GovernAII Logo"
            style={logo}
          />
        </Section>
        
        <Heading style={h1}>Redefinição de Senha</Heading>
        
        <Text style={text}>
          Olá <strong>{userName}</strong>,
        </Text>
        
        <Text style={text}>
          Uma nova senha temporária foi gerada para sua conta no GovernAII:
        </Text>
        
        <Section style={credentialsBox}>
          <Text style={credentialLabel}>E-mail:</Text>
          <Text style={credentialValue}>{userEmail}</Text>
          
          <Text style={credentialLabel}>Nova senha temporária:</Text>
          <Text style={credentialValue}>{temporaryPassword}</Text>
        </Section>
        
        <Section style={buttonContainer}>
          <Link
            href={loginUrl}
            target="_blank"
            style={button}
          >
            Acessar o GovernAII
          </Link>
        </Section>
        
        <Text style={importantNote}>
          <strong>🔐 Importante:</strong> Por segurança, recomendamos que você altere esta senha temporária após fazer login no sistema.
        </Text>
        
        <Text style={text}>
          Se você não solicitou esta redefinição de senha, entre em contato conosco imediatamente para investigarmos a situação.
        </Text>
        
        <Section style={divider}></Section>
        
        <Text style={footer}>
          Atenciosamente,<br />
          <strong>Equipe GovernAII</strong><br />
          <span style={footerSubtext}>Governança Inteligente para o Futuro</span>
        </Text>
      </Container>
    </Body>
  </Html>
)

export default PasswordResetEmail

const main = {
  backgroundColor: '#f8fafc',
  fontFamily: '"Inter", "Segoe UI", Roboto, sans-serif',
  padding: '20px',
}

const container = {
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '16px',
  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  margin: '40px auto',
  padding: '48px',
  width: '600px',
  maxWidth: '100%',
}

const logoContainer = {
  textAlign: 'center' as const,
  marginBottom: '40px',
  padding: '20px 0',
}

const logo = {
  margin: '0 auto',
  borderRadius: '8px',
}

const h1 = {
  background: 'linear-gradient(135deg, #dc2626, #ef4444)',
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  fontSize: '32px',
  fontWeight: '700',
  margin: '0 0 32px',
  textAlign: 'center' as const,
  letterSpacing: '-0.025em',
}

const text = {
  color: '#475569',
  fontSize: '16px',
  lineHeight: '28px',
  margin: '0 0 20px',
}

const credentialsBox = {
  background: 'linear-gradient(145deg, #fef2f2, #fee2e2)',
  border: '2px solid #fecaca',
  borderRadius: '12px',
  padding: '32px',
  margin: '32px 0',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
}

const credentialLabel = {
  color: '#64748b',
  fontSize: '12px',
  fontWeight: '700',
  margin: '0 0 8px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
}

const credentialValue = {
  color: '#1e293b',
  fontSize: '20px',
  fontWeight: '700',
  margin: '0 0 24px',
  fontFamily: '"JetBrains Mono", Monaco, monospace',
  padding: '12px 16px',
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
}

const buttonContainer = {
  margin: '40px 0',
  textAlign: 'center' as const,
}

const button = {
  background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
  border: 'none',
  borderRadius: '12px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: '600',
  padding: '16px 32px',
  textAlign: 'center' as const,
  textDecoration: 'none',
  transition: 'all 0.3s ease',
  boxShadow: '0 4px 14px 0 rgba(220, 38, 38, 0.35)',
  letterSpacing: '0.025em',
}

const importantNote = {
  background: 'linear-gradient(145deg, #fef2f2, #fee2e2)',
  border: '1px solid #ef4444',
  borderRadius: '12px',
  color: '#b91c1c',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '32px 0',
  padding: '20px',
  borderLeft: '4px solid #ef4444',
}

const divider = {
  height: '1px',
  background: 'linear-gradient(90deg, transparent, #e2e8f0, transparent)',
  margin: '40px 0',
}

const footer = {
  color: '#64748b',
  fontSize: '14px',
  lineHeight: '24px',
  marginTop: '32px',
  textAlign: 'center' as const,
}

const footerSubtext = {
  color: '#94a3b8',
  fontSize: '12px',
  fontStyle: 'italic',
}