import { QueryClient } from '@tanstack/react-query';


export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: 0, // no retries — prevents SDK User/me interceptor from firing twice per failed entity call
		},
	},
});