import { Link, Section, Text } from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';
import { BaseEmailTemplate, emailStyles } from '../../_shared/email-templates/BaseEmailTemplate.tsx';

interface InvitationReminderEmailProps {
  userName: string;
  userEmail: string;
  companyName: string;
  loginUrl: string;
  reminderNumber: number;
  maxReminders: number;
  companyLogoUrl?: string;
}

export const InvitationReminderEmail = ({
  userName,
  userEmail,
  companyName,
  loginUrl,
  reminderNumber,
  maxReminders,
  companyLogoUrl,
}: InvitationReminderEmailProps) => (
  <BaseEmailTemplate
    previewText={`Lembrete ${reminderNumber}/${maxReminders}: Complete seu cadastro`}
    title={`Lembrete: Complete seu cadastro`}
    companyName={companyName}
    companyLogoUrl={companyLogoUrl}
  >
    <Text style={emailStyles.text}>
      Olá <strong>{userName}</strong>,
    </Text>

    <Text style={emailStyles.text}>
      Notamos que você ainda não concluiu seu primeiro acesso à plataforma <strong>{companyName}</strong>.
    </Text>

    <Section style={emailStyles.warningBox}>
      <Text style={{ ...emailStyles.text, margin: '0 0 8px', fontSize: '13px' }}>
        <strong>Este é o lembrete {reminderNumber} de {maxReminders}.</strong>
      </Text>
      <Text style={{ ...emailStyles.text, margin: '0', fontSize: '13px' }}>
        Complete seu cadastro o quanto antes para não perder o acesso.
      </Text>
    </Section>

    <Text style={emailStyles.text}>
      A plataforma oferece:
    </Text>

    <Section style={emailStyles.infoBox}>
      <Text style={{ ...emailStyles.text, margin: '0 0 8px', fontSize: '13px' }}>
        • Gestão completa de riscos e compliance
      </Text>
      <Text style={{ ...emailStyles.text, margin: '0 0 8px', fontSize: '13px' }}>
        • Controle de documentos e contratos
      </Text>
      <Text style={{ ...emailStyles.text, margin: '0 0 8px', fontSize: '13px' }}>
        • Auditorias e gap analysis
      </Text>
      <Text style={{ ...emailStyles.text, margin: '0', fontSize: '13px' }}>
        • Due diligence de fornecedores
      </Text>
    </Section>

    <Section style={emailStyles.buttonSection}>
      <Link href={loginUrl} style={emailStyles.button}>
        Completar Cadastro
      </Link>
    </Section>

    <Section style={emailStyles.infoBox}>
      <Text style={{ ...emailStyles.text, margin: '0 0 8px', fontSize: '13px' }}>
        <strong>E-mail:</strong> {userEmail}
      </Text>
      <Text style={{ ...emailStyles.text, margin: '0', fontSize: '13px' }}>
        Use a senha temporária enviada no e-mail de boas-vindas.
      </Text>
    </Section>

    {reminderNumber === maxReminders && (
      <Section style={{ ...emailStyles.warningBox, backgroundColor: '#fff1f0', borderLeftColor: '#cf1322' }}>
        <Text style={{ ...emailStyles.text, margin: '0', fontSize: '13px', color: '#cf1322' }}>
          <strong>Atenção:</strong> Este é o último lembrete. Após este aviso, seu acesso poderá ser desativado.
        </Text>
      </Section>
    )}

    <Text style={emailStyles.text}>
      Precisa de ajuda? Entre em contato com o suporte.
    </Text>
  </BaseEmailTemplate>
);

export default InvitationReminderEmail;