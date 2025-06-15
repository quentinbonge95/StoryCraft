import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory
  const env = loadEnv(mode, process.cwd(), '');
  
  // Get backend URL from environment with fallback
  const backendUrl = env.VITE_BACKEND_URL || 'http://localhost:8000';
  console.log(`Configuring proxy to backend: ${backendUrl}`);
  
  return {
    plugins: [react()],
    server: {
      port: 3000,
      proxy: {
        // Proxy API requests to the backend server in development
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, ''),
          // Handle WebSocket if needed
          ws: true,
          // Configure proxy to handle self-signed certificates if needed
          // This is useful for local development with HTTPS
          ...(backendUrl.startsWith('https') && {
            secure: false,
            rejectUnauthorized: false
          })
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    // Ensure environment variables are available in the client
    define: {
      'process.env': {},
    },
  };
});