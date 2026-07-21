import { openRouterHeroProvider } from "./providers/openRouterHeroProvider";

const providers = [openRouterHeroProvider];

export function getHeroPhotographyProvider(providerId = openRouterHeroProvider.id) {
  const provider = providers.find(item => item.id === providerId);
  if (!provider) throw new Error(`Hero Photography provider not found: ${providerId}`);
  return provider;
}

export function listHeroPhotographyProviders() {
  return providers.map(({ id, name }) => ({ id, name }));
}