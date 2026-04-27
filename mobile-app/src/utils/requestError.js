export const formatRequestErrorMessage = (error, fallbackMessage) => {
  const apiMessage = error?.response?.data?.message;
  if (apiMessage) {
    return apiMessage;
  }

  if (error?.code === 'ECONNABORTED') {
    return fallbackMessage.timeout;
  }

  if (error?.request) {
    return fallbackMessage.network;
  }

  return error?.message || fallbackMessage.default;
};
