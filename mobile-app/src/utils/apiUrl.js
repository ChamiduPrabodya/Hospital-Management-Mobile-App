const DEFAULT_API_PORT = 5000;
const DEFAULT_API_PATH = '/api';

export const stripTrailingSlash = (value) => String(value).replace(/\/+$/, '');

export const getHostFromUri = (value) => {
  if (!value) {
    return null;
  }

  const normalized = String(value).trim().replace(/^[a-z]+:\/\//i, '');
  const [host] = normalized.split(':');

  return host || null;
};

export const resolveApiBaseUrl = ({
  envUrl,
  expoHostUri,
  expoDebuggerHost,
  fallbackHost = 'localhost',
  port = DEFAULT_API_PORT,
  apiPath = DEFAULT_API_PATH,
} = {}) => {
  if (envUrl) {
    return stripTrailingSlash(envUrl);
  }

  const detectedHost =
    getHostFromUri(expoHostUri) ||
    getHostFromUri(expoDebuggerHost) ||
    fallbackHost;

  return `http://${detectedHost}:${port}${apiPath}`;
};

