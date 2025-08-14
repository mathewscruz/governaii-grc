import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Button,
  Section,
  Hr,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface InvitationReminderEmailProps {
  userName: string
  userEmail: string
  companyName: string
  loginUrl: string
  reminderNumber: number
  maxReminders: number
}

export const InvitationReminderEmail = ({
  userName,
  userEmail,
  companyName,
  loginUrl,
  reminderNumber,
  maxReminders,
}: InvitationReminderEmailProps) => (
  <Html>
    <Head />
    <Preview>Lembre-se: Seu acesso ao GovernAI está aguardando - {companyName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <img
          src="https://governaii.com.br/governaii-logo.png"
          width="200"
          height="60"
          alt="GovernAI"
          style={logo}
        />
        
        <Heading style={h1}>
          Olá, {userName}! 👋
        </Heading>
        
        <Text style={text}>
          Esperamos que esteja bem! Este é um lembrete amigável de que você foi convidado para 
          acessar a plataforma <strong>GovernAI</strong> da empresa <strong>{companyName}</strong>.
        </Text>

        <Text style={text}>
          Notamos que você ainda não fez seu primeiro acesso. A GovernAI é uma plataforma 
          completa de governança, riscos e compliance que irá facilitar muito o seu dia a dia.
        </Text>

        <Section style={benefitsSection}>
          <Heading style={h2}>🚀 O que você pode fazer com a GovernAI:</Heading>
          <Text style={bulletPoint}>• Gerenciar riscos de forma inteligente</Text>
          <Text style={bulletPoint}>• Controlar auditorias e compliance</Text>
          <Text style={bulletPoint}>• Organizar documentos e evidências</Text>
          <Text style={bulletPoint}>• Acompanhar controles internos</Text>
          <Text style={bulletPoint}>• Muito mais!</Text>
        </Section>

        <Section style={ctaSection}>
          <Button href={loginUrl} style={button}>
            Acessar GovernAI Agora
          </Button>
        </Section>

        <Text style={credentials}>
          <strong>Seus dados de acesso:</strong><br />
          E-mail: {userEmail}<br />
          Senha: Use a senha temporária enviada no primeiro e-mail
        </Text>

        <Hr style={hr} />

        <Text style={helpText}>
          Precisa de ajuda? Nossa equipe está sempre disponível para auxiliá-lo.
          Responda este e-mail ou entre em contato conosco.
        </Text>

        {reminderNumber < maxReminders && (
          <Text style={reminderInfo}>
            Este é o lembrete {reminderNumber} de {maxReminders}. 
            Não perca a oportunidade de otimizar seus processos!
          </Text>
        )}

        {reminderNumber === maxReminders && (
          <Text style={lastReminderInfo}>
            ⚠️ Este é nosso último lembrete. Após este, você precisará solicitar 
            um novo convite ao administrador da {companyName}.
          </Text>
        )}

        <Text style={footer}>
          GovernAI - Plataforma de Governança, Riscos e Compliance<br />
          <Link href="https://governaii.com.br" style={link}>
            www.governaii.com.br
          </Link>
        </Text>
      </Container>
    </Body>
  </Html>
)

export default InvitationReminderEmail

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
}

const logo = {
  margin: '0 auto',
  marginBottom: '32px',
}

const h1 = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
  textAlign: 'center' as const,
}

const h2 = {
  color: '#374151',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '20px 0 15px',
}

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
  padding: '0 40px',
}

const benefitsSection = {
  padding: '0 40px',
  margin: '30px 0',
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '20px 40px',
}

const bulletPoint = {
  color: '#4b5563',
  fontSize: '14px',
  margin: '8px 0',
  paddingLeft: '10px',
}

const ctaSection = {
  textAlign: 'center' as const,
  margin: '40px 0',
}

const button = {
  backgroundColor: '#3b82f6',
  borderRadius: '5px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 30px',
}

const credentials = {
  backgroundColor: '#f3f4f6',
  border: '1px solid #e5e7eb',
  borderRadius: '5px',
  color: '#374151',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '20px 40px',
  padding: '15px',
}

const hr = {
  borderColor: '#e5e7eb',
  margin: '40px 0',
}

const helpText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  padding: '0 40px',
  textAlign: 'center' as const,
}

const reminderInfo = {
  backgroundColor: '#eff6ff',
  border: '1px solid #bfdbfe',
  borderRadius: '5px',
  color: '#1e40af',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '20px 40px',
  padding: '15px',
  textAlign: 'center' as const,
}

const lastReminderInfo = {
  backgroundColor: '#fef3c7',
  border: '1px solid #f59e0b',
  borderRadius: '5px',
  color: '#92400e',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '20px 40px',
  padding: '15px',
  textAlign: 'center' as const,
}

const footer = {
  color: '#9ca3af',
  fontSize: '12px',
  lineHeight: '16px',
  padding: '0 40px',
  textAlign: 'center' as const,
}

const link = {
  color: '#3b82f6',
  textDecoration: 'underline',
}