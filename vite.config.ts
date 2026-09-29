import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Using an empty string as the third argument allows loading all variables,
  // including those set in the Netlify UI (which don't have the VITE_ prefix).
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Maps the environment variable to process.env.API_KEY for use in the app
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ''),
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'terser',
      rollupOptions: {
        // Externalize dependencies provided via importmap to ensure clean builds
        external: [
          'react',
          'react-dom',
          '@supabase/supabase-js',
          '@google/genai',
          'jszip',
          'jspdf'
        ],
        output: {
          globals: {
            'react': 'React',
            'react-dom': 'ReactDOM',
            '@supabase/supabase-js': 'supabase',
            '@google/genai': 'googleGenai',
            'jszip': 'JSZip',
            'jspdf': 'jspdf'
          }
        }
      },
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
    }
  };
});