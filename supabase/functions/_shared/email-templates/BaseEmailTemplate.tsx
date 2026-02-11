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

const AKURIS_LOGO_URL = 'https://akuris.com.br/akuris-logo.png';

// Paleta de cores corporativa - Violet
const COLORS = {
  primary: '#7552ff',
  primaryDark: '#5a3fd6',
  secondary: '#0a1628',
  text: '#3c4149',
  textLight: '#64748b',
  textMuted: '#8898aa',
  background: '#f5f7fa',
  surface: '#ffffff',
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  success: '#16a34a',
  warning: '#f59e0b',
  error: '#dc2626',
  info: '#7552ff',
};

export const BaseEmailTemplate = ({
  previewText,
  title,
  children,
  companyName = 'Akuris',
  companyLogoUrl,
  showFooter = true,
}: BaseEmailTemplateProps) => {
  const logoUrl = companyLogoUrl || AKURIS_LOGO_URL;
  
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Logo Section */}
          <Section style={logoSection}>
            {logoUrl ? (
              <Img
                src={logoUrl}
                alt={companyName}
                style={logo}
                onError="this.style.display='none'"
              />
            ) : null}
            <Text style={logoTextFallback}>
              <span style={{ color: COLORS.primary, fontWeight: '700' }}>{companyName}</span>
            </Text>
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
                Este é um e-mail automático do {companyName}.
                <br />
                Em caso de dúvidas, entre em contato conosco.
              </Text>
              <Text style={footerText}>
                <Link href="https://akuris.com.br" style={link}>
                  Akuris
                </Link>
                {' '}• Plataforma de Governança, Risco e Compliance
              </Text>
              <Text style={footerText}>
                © {new Date().getFullYear()} Akuris. Todos os direitos reservados.
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
  backgroundColor: COLORS.background,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

const container = {
  backgroundColor: COLORS.surface,
  margin: '0 auto',
  padding: '0',
  marginBottom: '64px',
  maxWidth: '600px',
  borderRadius: '12px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
};

const logoSection = {
  padding: '32px 32px 24px',
  textAlign: 'center' as const,
  borderBottom: `1px solid ${COLORS.border}`,
};

const logo = {
  maxHeight: '60px',
  maxWidth: '200px',
  margin: '0 auto',
};

const logoTextFallback = {
  fontSize: '24px',
  fontWeight: '700',
  margin: '0',
  display: 'none',
};

const h1 = {
  color: COLORS.secondary,
  fontSize: '22px',
  fontWeight: '600',
  lineHeight: '28px',
  margin: '32px 32px 16px',
  padding: '0',
};

const content = {
  padding: '0 32px 32px',
};

const footer = {
  borderTop: `1px solid ${COLORS.border}`,
  margin: '0 32px',
  padding: '24px 0',
};

const footerText = {
  color: COLORS.textMuted,
  fontSize: '12px',
  lineHeight: '18px',
  margin: '8px 0',
  textAlign: 'center' as const,
};

const link = {
  color: COLORS.primary,
  textDecoration: 'none',
};

// Reusable component styles exportados para uso em outros templates
export const emailStyles = {
  colors: COLORS,
  
  text: {
    color: COLORS.text,
    fontSize: '15px',
    lineHeight: '24px',
    margin: '0 0 16px',
  },
  textSmall: {
    color: COLORS.textLight,
    fontSize: '13px',
    lineHeight: '20px',
    margin: '0 0 12px',
  },
  textBold: {
    fontWeight: '600',
  },
  greeting: {
    color: COLORS.text,
    fontSize: '15px',
    lineHeight: '24px',
    margin: '0 0 20px',
  },
  
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: '8px',
    color: '#ffffff',
    display: 'inline-block',
    fontSize: '14px',
    fontWeight: '600',
    lineHeight: '24px',
    padding: '14px 32px',
    textDecoration: 'none',
    textAlign: 'center' as const,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    border: `2px solid ${COLORS.primary}`,
    borderRadius: '8px',
    color: COLORS.primary,
    display: 'inline-block',
    fontSize: '14px',
    fontWeight: '600',
    lineHeight: '24px',
    padding: '12px 30px',
    textDecoration: 'none',
    textAlign: 'center' as const,
  },
  buttonSection: {
    margin: '24px 0',
    textAlign: 'center' as const,
  },
  
  infoBox: {
    backgroundColor: '#f0eeff',
    border: `1px solid ${COLORS.primary}20`,
    borderLeft: `4px solid ${COLORS.primary}`,
    borderRadius: '8px',
    padding: '20px',
    margin: '20px 0',
  },
  warningBox: {
    backgroundColor: '#fffbeb',
    border: '1px solid #fcd34d',
    borderLeft: '4px solid #f59e0b',
    borderRadius: '8px',
    padding: '20px',
    margin: '20px 0',
  },
  successBox: {
    backgroundColor: '#f0fdf4',
    border: '1px solid #86efac',
    borderLeft: '4px solid #16a34a',
    borderRadius: '8px',
    padding: '20px',
    margin: '20px 0',
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderLeft: '4px solid #dc2626',
    borderRadius: '8px',
    padding: '20px',
    margin: '20px 0',
  },
  neutralBox: {
    backgroundColor: COLORS.borderLight,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '8px',
    padding: '16px',
    margin: '16px 0',
  },
  
  field: {
    marginBottom: '12px',
  },
  fieldLabel: {
    fontSize: '13px',
    color: COLORS.textLight,
    fontWeight: '600',
    margin: '0 0 4px',
  },
  fieldValue: {
    fontSize: '15px',
    color: COLORS.secondary,
    margin: '0',
  },
  
  code: {
    backgroundColor: COLORS.borderLight,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '6px',
    color: COLORS.secondary,
    fontFamily: 'Monaco, Consolas, "Courier New", monospace',
    fontSize: '16px',
    fontWeight: '600',
    padding: '14px 20px',
    display: 'inline-block',
    letterSpacing: '1px',
    textAlign: 'center' as const,
  },
  
  badge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
  },
  badgePrimary: {
    backgroundColor: `${COLORS.primary}15`,
    color: COLORS.primary,
  },
  badgeSuccess: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  badgeWarning: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  badgeError: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  
  divider: {
    borderTop: `1px solid ${COLORS.border}`,
    margin: '24px 0',
  },
  
  link: {
    color: COLORS.primary,
    textDecoration: 'underline',
  },
  linkMuted: {
    color: COLORS.textMuted,
    textDecoration: 'underline',
  },
  
  list: {
    paddingLeft: '20px',
    margin: '16px 0',
  },
  listItem: {
    color: COLORS.text,
    fontSize: '14px',
    lineHeight: '24px',
    margin: '0 0 8px',
  },
};
