export const config = {
  demo:
    import.meta.env.VITE_DEMO_MODE === 'true' ||
    (import.meta.env.VITE_DEMO_MODE !== 'false' && import.meta.env.VITE_DATA_MODE !== 'live'),
  gatewayUrl: import.meta.env.DEV ? '' : import.meta.env.VITE_API_GATEWAY_URL ?? 'http://localhost:8090',
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL as string | undefined,
  supabaseKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined,
}
