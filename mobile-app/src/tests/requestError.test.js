import { formatRequestErrorMessage } from '../utils/requestError';

describe('mobile-app utils/requestError', () => {
  const fallbackMessage = {
    timeout: 'Timed out',
    network: 'Network issue',
    default: 'Something went wrong',
  };

  it('prefers the API message when the server responds with one', () => {
    expect(
      formatRequestErrorMessage(
        {
          response: {
            data: {
              message: 'Invalid credentials',
            },
          },
        },
        fallbackMessage
      )
    ).toBe('Invalid credentials');
  });

  it('returns the timeout message for aborted requests', () => {
    expect(
      formatRequestErrorMessage(
        {
          code: 'ECONNABORTED',
        },
        fallbackMessage
      )
    ).toBe('Timed out');
  });

  it('returns the network message when the request was sent but no response arrived', () => {
    expect(
      formatRequestErrorMessage(
        {
          request: {},
        },
        fallbackMessage
      )
    ).toBe('Network issue');
  });

  it('falls back to the thrown message before using the default', () => {
    expect(
      formatRequestErrorMessage(
        {
          message: 'Unexpected client error',
        },
        fallbackMessage
      )
    ).toBe('Unexpected client error');
  });

  it('uses the default fallback when no better details exist', () => {
    expect(formatRequestErrorMessage({}, fallbackMessage)).toBe('Something went wrong');
  });
});
