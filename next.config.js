/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  // Otimizações de performance
  swcMinify: true, // Usar SWC para minificação (mais rápido)
  compress: true, // Compressão Gzip/Brotli
  poweredByHeader: false, // Remover header X-Powered-By por segurança
  // Otimizar imports de pacotes grandes
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-slot', '@radix-ui/react-label'],
  },
  // Ignorar pastas de design/storybook e outros projetos durante o build
  webpack: (config, { isServer, dev }) => {
    // Desabilitar cache do webpack em dev quando em pasta sincronizada (ex.: OneDrive)
    // Evita ENOENT e "incorrect header check" por arquivos .pack.gz corrompidos
    if (dev) {
      config.cache = false
    }

    // Configurar path aliases para Design System
    // NOTA: path.resolve() lida corretamente com espaços no nome da pasta no Linux (Vercel)
    const path = require('path')
    const designNovoPath = path.resolve(__dirname, 'Design novo', 'src')
    
    config.resolve.alias = {
      ...config.resolve.alias,
      '@beautysmile/design-system': path.resolve(designNovoPath, 'index.ts'),
      '@beautysmile/components': path.resolve(designNovoPath, 'components', 'index.ts'),
      '@beautysmile/tokens': path.resolve(designNovoPath, 'tokens', 'index.ts'),
      '@beautysmile/utils': path.resolve(designNovoPath, 'utils'),
      '@beautysmile/templates': path.resolve(designNovoPath, 'templates', 'index.ts'),
    }

    // Ignorar pastas que não devem ser processadas no build
    // NOTA: "Design novo" NÃO está excluído porque componentes de lá são usados via aliases
    config.module.rules.push({
      test: /\.(ts|tsx)$/,
      exclude: [
        /node_modules/,
        /Design\//, // Ignorar pasta Design antiga (Storybook) - NÃO "Design novo"
        /meu-projeto-admin\//, // Ignorar pasta meu-projeto-admin (projeto Vite separado)
        /supabase\/functions\//, // Ignorar Edge Functions do Supabase
        /\.stories\.(ts|tsx)$/, // Ignorar arquivos .stories
        /Design novo\/templates\//, // Ignorar templates (não usados diretamente)
        /Design novo\/docs\//, // Ignorar documentação
      ],
    })
    return config
  },
}

module.exports = nextConfig

