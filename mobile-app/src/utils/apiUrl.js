const DEFAULT_API_PORT = 5001;
const DEFAULT_API_PATH = '/api';

export const stripTrailingSlash = (value) => String(value).replace(/\/+$/, '');

export const getHostFromUri = (value) => {
  if (!value) {
    return null;
  }

  const normalized = String(value).trim();

  if (!normalized) {
    return null;
  }

  try {
    const parsed = new URL(
      normalized.includes('://') ? normalized : `http://${normalized}`
    );

    return parsed.hostname || null;
  } catch (error) {
    const sanitized = normalized.replace(/^[a-z]+:\/\//i, '').split('/')[0];

    if (!sanitized) {
      return null;
    }

    if (sanitized.startsWith('[')) {
      const ipv6Host = sanitized.slice(1).split(']')[0];
      return ipv6Host || null;
    }

    return sanitized.split(':')[0] || null;
  }
};

export const resolveApiBaseUrl = ({
  envUrl,
  hostCandidates = [],
  fallbackHost = 'localhost',
  port = DEFAULT_API_PORT,
  apiPath = DEFAULT_API_PATH,
} = {}) => {
  if (envUrl) {
    return stripTrailingSlash(envUrl);
  }

  const detectedHost =
    hostCandidates
      .map((candidate) => getHostFromUri(candidate))
      .find(Boolean) ||
    fallbackHost;

  return `http://${detectedHost}:${port}${apiPath}`;
};
