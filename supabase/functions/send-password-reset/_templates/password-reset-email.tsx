import { Link, Section, Text } from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';
import { BaseEmailTemplate, emailStyles } from '../../_shared/email-templates/BaseEmailTemplate.tsx';

interface PasswordResetEmailProps {
  userName: string;
  userEmail: string;
  temporaryPassword: string;
  loginUrl: string;
  companyName?: string;
  companyLogoUrl?: string;
}

export const PasswordResetEmail = ({
  userName,
  userEmail,
  temporaryPassword,
  loginUrl,
  companyName,
  companyLogoUrl,
}: PasswordResetEmailProps) => (
  <BaseEmailTemplate
    previewText="Sua senha foi redefinida"
    title="Redefinição de Senha"
    companyLogoUrl={companyLogoUrl}
  >
    <Text style={emailStyles.text}>
      Olá <strong>{userName}</strong>,
    </Text>

    <Text style={emailStyles.text}>
      Sua senha foi redefinida com sucesso. Use as credenciais abaixo para acessar:
    </Text>

    <Section style={emailStyles.infoBox}>
      <Text style={{ ...emailStyles.text, margin: '0 0 8px' }}>
        <strong>E-mail:</strong> {userEmail}
      </Text>
      <Text style={{ ...emailStyles.text, margin: '0 0 8px' }}>
        <strong>Nova senha temporária:</strong>
      </Text>
      <Text style={{ ...emailStyles.code, display: 'block', textAlign: 'center' }}>
        {temporaryPassword}
      </Text>
    </Section>

    <Section style={emailStyles.buttonSection}>
      <Link href={loginUrl} style={emailStyles.button}>
        Fazer Login
      </Link>
    </Section>

    <Section style={emailStyles.warningBox}>
      <Text style={{ ...emailStyles.text, margin: '0', fontSize: '13px' }}>
        <strong>Importante:</strong> Por segurança, você será solicitado a alterar sua senha após o login.
      </Text>
    </Section>

    <Text style={emailStyles.text}>
      Se você não solicitou esta redefinição, por favor entre em contato com o suporte imediatamente.
    </Text>
  </BaseEmailTemplate>
);

export default PasswordResetEmail;