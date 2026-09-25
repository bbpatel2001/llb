import clsx, { type ClassValue } from 'clsx';

/**
 * Combine Tailwind classnames
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * Format date
 */
export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format date time
 */
export function formatDateTime(date: string | Date) {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Truncate text
 */
export function truncate(text: string, length: number = 100) {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

/**
 * Capitalize first letter
 */
export function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Parse error message
 */
export function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error;

  if (error && typeof error === 'object') {
    const candidate = error as {
      message?: unknown;
      response?: { data?: { error?: unknown; message?: unknown } };
    };
    const responseError = candidate.response?.data?.error;
    const responseMessage = candidate.response?.data?.message;

    if (typeof responseError === 'string') return responseError;
    if (typeof responseMessage === 'string') return responseMessage;
    if (typeof candidate.message === 'string') return candidate.message;
  }

  return 'An error occurred';
}

/**
 * Delay (for testing)
 */
export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
