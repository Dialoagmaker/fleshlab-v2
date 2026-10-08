// The migration deliberately does not accept bearer tokens in query parameters.
// Authentication is an HttpOnly same-site session managed by the self-hosted API.
export const appParams = {
  token: null,
  appId: null,
  fromUrl: typeof window === 'undefined' ? '/' : window.location.href
};
