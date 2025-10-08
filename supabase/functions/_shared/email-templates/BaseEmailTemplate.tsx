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
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface BaseEmailTemplateProps {
  previewText: string;
  title: string;
  children: React.ReactNode;
  companyName?: string;
  companyLogoUrl?: string;
  showFooter?: boolean;
}

const GOVERNAII_LOGO_URL = 'https://lnlkahtugwmkznasapfd.supabase.co/storage/v1/object/public/public-assets/governaii-logo.png';

export const BaseEmailTemplate = ({
  previewText,
  title,
  children,
  companyName = 'GovernAII',
  companyLogoUrl,
  showFooter = true,
}: BaseEmailTemplateProps) => {
  const logoUrl = companyLogoUrl || GOVERNAII_LOGO_URL;
  
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Logo Section */}
          <Section style={logoSection}>
            <Img
              src={logoUrl}
              alt={companyName}
              style={logo}
            />
          </Section>

          {/* Title */}
          <Heading style={h1}>{title}</Heading>

          {/* Content */}
          <Section style={content}>
            {children}
          </Section>

          {/* Footer */}
          {showFooter && (
            <Section style={footer}>
              <Text style={footerText}>
                Este é um e-mail automático de <strong>{companyName}</strong>.
                <br />
                Em caso de dúvidas, entre em contato conosco.
              </Text>
              <Text style={footerText}>
                <Link href="https://governaii.com.br" style={link}>
                  GovernAII
                </Link>
                {' '}• Plataforma de Governança, Risco e Compliance
              </Text>
            </Section>
          )}
        </Container>
      </Body>
    </Html>
  );
};

export default BaseEmailTemplate;

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: 'Arial, "Helvetica Neue", Helvetica, sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const logoSection = {
  padding: '32px 32px 24px',
  textAlign: 'center' as const,
  borderBottom: '1px solid #e6ebf1',
};

const logo = {
  maxHeight: '60px',
  maxWidth: '200px',
  margin: '0 auto',
};

const h1 = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '32px',
  margin: '32px 32px 16px',
  padding: '0',
};

const content = {
  padding: '0 32px',
};

const footer = {
  borderTop: '1px solid #e6ebf1',
  margin: '32px 32px 0',
  padding: '24px 0 0',
};

const footerText = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '8px 0',
  textAlign: 'center' as const,
};

const link = {
  color: '#2563eb',
  textDecoration: 'none',
};

// Reusable component styles
export const emailStyles = {
  text: {
    color: '#3c4149',
    fontSize: '14px',
    lineHeight: '24px',
    margin: '0 0 16px',
  },
  textBold: {
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: '6px',
    color: '#ffffff',
    display: 'inline-block',
    fontSize: '14px',
    fontWeight: '600',
    lineHeight: '24px',
    padding: '12px 24px',
    textDecoration: 'none',
    textAlign: 'center' as const,
  },
  buttonSection: {
    margin: '24px 0',
    textAlign: 'center' as const,
  },
  infoBox: {
    backgroundColor: '#f6f9fc',
    border: '1px solid #e6ebf1',
    borderRadius: '6px',
    padding: '16px',
    margin: '16px 0',
  },
  warningBox: {
    backgroundColor: '#fff8e6',
    border: '1px solid '#ffd666',
    borderLeft: '4px solid #faad14',
    borderRadius: '6px',
    padding: '16px',
    margin: '16px 0',
  },
  successBox: {
    backgroundColor: '#f0fdf4',
    border: '1px solid #86efac',
    borderLeft: '4px solid #16a34a',
    borderRadius: '6px',
    padding: '16px',
    margin: '16px 0',
  },
  code: {
    backgroundColor: '#f6f9fc',
    border: '1px solid #e6ebf1',
    borderRadius: '4px',
    color: '#1a1a1a',
    fontFamily: 'Courier, "Courier New", monospace',
    fontSize: '14px',
    fontWeight: '600',
    padding: '12px 16px',
    display: 'inline-block',
    letterSpacing: '0.5px',
  },
  divider: {
    borderTop: '1px solid #e6ebf1',
    margin: '24px 0',
  },
};