let authState = {
  accessToken: null,
  role: null,
  user: null,
  hydrated: false,
};

const listeners = new Set();

const emit = () => {
  listeners.forEach((listener) => listener());
};

export const getAuthState = () => authState;

export const setAuthState = (patch) => {
  authState = { ...authState, ...patch };
  emit();
};

export const setAccessToken = (accessToken) => {
  setAuthState({ accessToken, hydrated: true });
};

export const clearAuthState = () => {
  authState = {
    accessToken: null,
    role: null,
    user: null,
    hydrated: false,
  };
  emit();
};

export const subscribeAuthState = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
