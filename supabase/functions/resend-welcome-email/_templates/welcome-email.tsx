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

interface WelcomeEmailProps {
  userName: string
  userEmail: string
  temporaryPassword: string
  loginUrl: string
}

export const WelcomeEmail = ({
  userName,
  userEmail,
  temporaryPassword,
  loginUrl,
}: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>Bem-vindo ao GovernAII! Aqui estão seus dados de acesso</Preview>
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
        
        <Heading style={h1}>Bem-vindo ao GovernAII!</Heading>
        
        <Text style={text}>
          Olá <strong>{userName}</strong>,
        </Text>
        
        <Text style={text}>
          Sua conta foi criada com sucesso! Aqui estão seus dados de acesso:
        </Text>
        
        <Section style={credentialsBox}>
          <Text style={credentialLabel}>E-mail:</Text>
          <Text style={credentialValue}>{userEmail}</Text>
          
          <Text style={credentialLabel}>Senha temporária:</Text>
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
          <strong>🔐 Importante:</strong> Esta é uma senha temporária que deve ser alterada no seu primeiro acesso ao sistema para garantir a segurança da sua conta.
        </Text>
        
        <Text style={text}>
          Se você tiver alguma dúvida ou precisar de assistência, nossa equipe de suporte está sempre disponível para ajudar.
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

export default WelcomeEmail

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
  background: 'linear-gradient(135deg, #1e293b, #475569)',
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
  background: 'linear-gradient(145deg, #f8fafc, #f1f5f9)',
  border: '2px solid #e2e8f0',
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
  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
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
  boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.35)',
  letterSpacing: '0.025em',
}

const importantNote = {
  background: 'linear-gradient(145deg, #fef3c7, #fde68a)',
  border: '1px solid #f59e0b',
  borderRadius: '12px',
  color: '#92400e',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '32px 0',
  padding: '20px',
  borderLeft: '4px solid #f59e0b',
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