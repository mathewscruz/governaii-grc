import { Link, Section, Text } from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';
import { BaseEmailTemplate, emailStyles } from '../../_shared/email-templates/BaseEmailTemplate.tsx';

interface WelcomeEmailProps {
  userName: string;
  userEmail: string;
  temporaryPassword: string;
  loginUrl: string;
  companyName?: string;
  companyLogoUrl?: string;
}

export const WelcomeEmail = ({
  userName,
  userEmail,
  temporaryPassword,
  loginUrl,
  companyName,
  companyLogoUrl,
}: WelcomeEmailProps) => (
  <BaseEmailTemplate
    previewText={`Bem-vindo ao ${companyName || 'GovernAII'}`}
    title={`Bem-vindo, ${userName}!`}
    companyName={companyName}
    companyLogoUrl={companyLogoUrl}
  >
    <Text style={emailStyles.text}>
      Sua conta foi criada com sucesso na plataforma <strong>{companyName || 'GovernAII'}</strong>.
    </Text>

    <Text style={emailStyles.text}>
      Use as credenciais abaixo para fazer seu primeiro acesso:
    </Text>

    <Section style={emailStyles.infoBox}>
      <Text style={{ ...emailStyles.text, margin: '0 0 8px' }}>
        <strong>E-mail:</strong> {userEmail}
      </Text>
      <Text style={{ ...emailStyles.text, margin: '0 0 8px' }}>
        <strong>Senha temporária:</strong>
      </Text>
      <Text style={{ ...emailStyles.code, display: 'block', textAlign: 'center' }}>
        {temporaryPassword}
      </Text>
    </Section>

    <Section style={emailStyles.buttonSection}>
      <Link href={loginUrl} style={emailStyles.button}>
        Acessar Plataforma
      </Link>
    </Section>

    <Section style={emailStyles.warningBox}>
      <Text style={{ ...emailStyles.text, margin: '0', fontSize: '13px' }}>
        <strong>Importante:</strong> Por segurança, você será solicitado a alterar sua senha no primeiro acesso.
      </Text>
    </Section>

    <Text style={emailStyles.text}>
      Se você não solicitou este cadastro, por favor desconsidere este e-mail.
    </Text>
  </BaseEmailTemplate>
);

export default WelcomeEmail;