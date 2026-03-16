import DOMPurify from 'dompurify';

/**
 * Centralized DOMPurify configuration for the entire application.
 * Use this instead of calling DOMPurify.sanitize() directly.
 */

const SANITIZE_CONFIG = {
  ALLOWED_TAGS: ['strong', 'em', 'br', 'p', 'ul', 'ol', 'li', 'span', 'a', 'b', 'i', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'code', 'pre', 'blockquote', 'table', 'thead', 'tbody', 'tr', 'th', 'td'],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
  ALLOW_DATA_ATTR: false,
};

/** Strict config for inline markdown (chatbot, comments) */
const STRICT_CONFIG = {
  ALLOWED_TAGS: ['strong', 'em', 'br', 'p', 'ul', 'ol', 'li', 'span'],
  ALLOWED_ATTR: [] as string[],
  ALLOW_DATA_ATTR: false,
};

/**
 * Sanitize HTML with the standard config (for rich content like documents).
 */
export function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, SANITIZE_CONFIG) as unknown as string;
}

/**
 * Sanitize HTML with strict config (for inline markdown, chatbot, comments).
 * No links, no attributes, minimal tags.
 */
export function sanitizeStrict(html: string): string {
  return DOMPurify.sanitize(html, STRICT_CONFIG) as unknown as string;
}
