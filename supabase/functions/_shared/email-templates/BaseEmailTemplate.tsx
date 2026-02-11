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

const AKURIS_LOGO_URL = 'https://id-preview--e64d00f7-1631-421a-bcc8-86aa27d8fb2a.lovable.app/akuris-logo.png';

const COLORS = {
  primary: '#7552ff',
  primaryDark: '#5a3fd6',
  primaryLight: '#f0eeff',
  secondary: '#0a1628',
  text: '#3c4149',
  textLight: '#64748b',
  textMuted: '#8898aa',
  background: '#f0f2f5',
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
          {/* Violet Header with Logo */}
          <Section style={headerSection}>
            <table cellPadding="0" cellSpacing="0" style={{ width: '100%' }}>
              <tr>
                <td style={{ textAlign: 'center' as const }}>
                  {logoUrl ? (
                    <Img
                      src={logoUrl}
                      alt={companyName}
                      style={logoStyle}
                    />
                  ) : null}
                  <Text style={headerCompanyName}>{companyName}</Text>
                </td>
              </tr>
            </table>
          </Section>

          {/* Title */}
          <Section style={titleSection}>
            <Heading style={h1}>{title}</Heading>
            <div style={titleDivider} />
          </Section>

          {/* Content */}
          <Section style={content}>
            {children}
          </Section>

          {/* Footer */}
          {showFooter && (
            <Section style={footer}>
              <table cellPadding="0" cellSpacing="0" style={{ width: '100%' }}>
                <tr>
                  <td style={{ textAlign: 'center' as const, paddingBottom: '16px' }}>
                    <Text style={footerBrand}>
                      <Link href="https://akuris.com.br" style={{ color: COLORS.primary, textDecoration: 'none', fontWeight: '600' }}>
                        Akuris
                      </Link>
                    </Text>
                    <Text style={footerTagline}>
                      Plataforma de Governança, Risco e Compliance
                    </Text>
                  </td>
                </tr>
                <tr>
                  <td style={{ textAlign: 'center' as const }}>
                    <Text style={footerCopy}>
                      Este é um e-mail automático. Em caso de dúvidas, entre em contato conosco.
                    </Text>
                    <Text style={footerCopy}>
                      © {new Date().getFullYear()} Akuris. Todos os direitos reservados.
                    </Text>
                  </td>
                </tr>
              </table>
            </Section>
          )}
        </Container>
      </Body>
    </Html>
  );
};

export default BaseEmailTemplate;

// ─── Styles ──────────────────────────────────────────────

const main = {
  backgroundColor: COLORS.background,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  padding: '40px 0',
};

const container = {
  backgroundColor: COLORS.surface,
  margin: '0 auto',
  maxWidth: '600px',
  borderRadius: '16px',
  overflow: 'hidden' as const,
  boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
};

const headerSection = {
  backgroundColor: COLORS.primary,
  padding: '32px 40px 28px',
  textAlign: 'center' as const,
};

const logoStyle = {
  maxHeight: '44px',
  maxWidth: '180px',
  margin: '0 auto',
  filter: 'brightness(0) invert(1)',
};

const headerCompanyName = {
  color: 'rgba(255,255,255,0.85)',
  fontSize: '13px',
  fontWeight: '500',
  margin: '8px 0 0',
  letterSpacing: '0.5px',
  display: 'none' as const,
};

const titleSection = {
  padding: '32px 40px 0',
};

const h1 = {
  color: COLORS.secondary,
  fontSize: '22px',
  fontWeight: '700',
  lineHeight: '30px',
  margin: '0 0 16px',
};

const titleDivider = {
  width: '48px',
  height: '3px',
  backgroundColor: COLORS.primary,
  borderRadius: '2px',
  margin: '0 0 24px',
};

const content = {
  padding: '0 40px 32px',
};

const footer = {
  backgroundColor: '#f8f9fb',
  borderTop: `1px solid ${COLORS.border}`,
  padding: '24px 40px',
};

const footerBrand = {
  fontSize: '15px',
  margin: '0 0 2px',
};

const footerTagline = {
  color: COLORS.textMuted,
  fontSize: '12px',
  margin: '0 0 12px',
};

const footerCopy = {
  color: COLORS.textMuted,
  fontSize: '11px',
  lineHeight: '18px',
  margin: '2px 0',
};

// ─── Reusable Styles ────────────────────────────────────

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
    borderRadius: '10px',
    color: '#ffffff',
    display: 'inline-block',
    fontSize: '14px',
    fontWeight: '600',
    lineHeight: '24px',
    padding: '14px 36px',
    textDecoration: 'none',
    textAlign: 'center' as const,
    boxShadow: '0 2px 8px rgba(117, 82, 255, 0.3)',
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    border: `2px solid ${COLORS.primary}`,
    borderRadius: '10px',
    color: COLORS.primary,
    display: 'inline-block',
    fontSize: '14px',
    fontWeight: '600',
    lineHeight: '24px',
    padding: '12px 34px',
    textDecoration: 'none',
    textAlign: 'center' as const,
  },
  buttonSection: {
    margin: '24px 0',
    textAlign: 'center' as const,
  },

  infoBox: {
    backgroundColor: COLORS.primaryLight,
    border: `1px solid ${COLORS.primary}20`,
    borderLeft: `4px solid ${COLORS.primary}`,
    borderRadius: '10px',
    padding: '20px',
    margin: '20px 0',
  },
  warningBox: {
    backgroundColor: '#fffbeb',
    border: '1px solid #fcd34d',
    borderLeft: '4px solid #f59e0b',
    borderRadius: '10px',
    padding: '20px',
    margin: '20px 0',
  },
  successBox: {
    backgroundColor: '#f0fdf4',
    border: '1px solid #86efac',
    borderLeft: '4px solid #16a34a',
    borderRadius: '10px',
    padding: '20px',
    margin: '20px 0',
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderLeft: '4px solid #dc2626',
    borderRadius: '10px',
    padding: '20px',
    margin: '20px 0',
  },
  neutralBox: {
    backgroundColor: COLORS.borderLight,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '10px',
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
    borderRadius: '8px',
    color: COLORS.secondary,
    fontFamily: 'Monaco, Consolas, "Courier New", monospace',
    fontSize: '18px',
    fontWeight: '700',
    padding: '16px 24px',
    display: 'inline-block',
    letterSpacing: '2px',
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
