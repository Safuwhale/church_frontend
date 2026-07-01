import { secureFetch } from './api';

export const submitAttendanceCheckIn = async (endpoint, payload) => {
  const response = await secureFetch(endpoint, {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => null);

  return { response, data };
};