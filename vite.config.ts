import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 5173,
        host: '0.0.0.0',
        strictPort: false,
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        // Otimizações de bundle
        rollupOptions: {
          output: {
            // Separar dependências em chunks específicos
            manualChunks: {
              // React core
              'vendor-react': ['react', 'react-dom'],
              // Gráficos (separados por serem pesados)
              'vendor-charts-recharts': ['recharts'],
              'vendor-charts-echarts': ['echarts', 'echarts-for-react'],
              // Supabase
              'vendor-supabase': ['@supabase/supabase-js'],
              // UI e ícones
              'vendor-ui': ['lucide-react'],
              // Exportação (PDFs, DOCX, PPTX)
              'vendor-export': ['pdfmake', 'docx', 'pptxgenjs', 'file-saver'],
              // IA (usado apenas em views específicas)
              'vendor-ai': ['@anthropic-ai/sdk', '@google/genai', '@google/generative-ai', 'groq-sdk'],
              // Utilitários
              'vendor-utils': ['lodash.debounce', 'xlsx', 'zod']
            }
          }
        },
        // Aumentar limite de warning (já otimizado com chunks)
        chunkSizeWarningLimit: 600,
        // Minificação
        minify: 'esbuild',
        // Source maps apenas em dev
        sourcemap: false
      },
      // Otimizações de dependências
      optimizeDeps: {
        include: [
          'react',
          'react-dom',
          'recharts',
          'lucide-react',
          '@supabase/supabase-js'
        ],
        exclude: [
          // Excluir pacotes grandes que são lazy-loaded
          '@anthropic-ai/sdk',
          'groq-sdk'
        ]
      }
    };
});
