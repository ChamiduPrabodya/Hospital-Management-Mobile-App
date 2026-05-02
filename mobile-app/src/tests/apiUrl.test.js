import { getHostFromUri, resolveApiBaseUrl, stripTrailingSlash } from '../utils/apiUrl';

describe('mobile-app utils/apiUrl', () => {
  it('uses EXPO_PUBLIC_API_URL when provided', () => {
    expect(
      resolveApiBaseUrl({
        envUrl: 'http://192.168.1.8:5001/api/',
        hostCandidates: ['192.168.1.99:8081'],
      })
    ).toBe('http://192.168.1.8:5001/api');
  });

  it('derives the backend host from the Expo host URI', () => {
    expect(
      resolveApiBaseUrl({
        hostCandidates: ['172.28.20.43:8081'],
      })
    ).toBe('http://172.28.20.43:5000/api');
  });

  it('falls back to the Expo debugger host when hostUri is unavailable', () => {
    expect(
      resolveApiBaseUrl({
        hostCandidates: [null, '192.168.0.15:8081'],
      })
    ).toBe('http://192.168.0.15:5000/api');
  });

  it('can derive the backend host from a Metro bundle script URL', () => {
    expect(
      resolveApiBaseUrl({
        hostCandidates: [
          null,
          'http://10.18.108.124:8081/node_modules/expo/AppEntry.bundle?platform=ios',
        ],
      })
    ).toBe('http://10.18.108.124:5000/api');
  });

  it('uses the configured fallback host when Expo host data is unavailable', () => {
    expect(
      resolveApiBaseUrl({
        fallbackHost: '10.0.2.2',
      })
    ).toBe('http://10.0.2.2:5000/api');
  });

  it('extracts a host from URIs with or without protocol', () => {
    expect(getHostFromUri('http://192.168.1.4:8081')).toBe('192.168.1.4');
    expect(getHostFromUri('192.168.1.4:8081')).toBe('192.168.1.4');
    expect(getHostFromUri('exp://10.18.108.124:8081')).toBe('10.18.108.124');
  });

  it('removes only trailing slashes from explicit URLs', () => {
    expect(stripTrailingSlash('http://localhost:5001/api///')).toBe('http://localhost:5001/api');
  });
});
