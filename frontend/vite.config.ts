import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '')
	const gatewayUrl = env.VITE_API_GATEWAY_URL
	if (!gatewayUrl) throw new Error('VITE_API_GATEWAY_URL must be set in the frontend environment')
	return {
		plugins: [react()],
		server: {
			proxy: {
				'/api': {
					target: gatewayUrl,
					changeOrigin: true,
				},
			},
		},
	}
})
