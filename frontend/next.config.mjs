/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone режим для Docker
  output: 'standalone',
  
  // Оптимизация изображений
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
  
  // Сжатие
  compress: true,
  
  // Оптимизация сборки (удалено swcMinify - устарело в Next.js 15)
  
  // Кэширование
  experimental: {
    // optimizeCss: true, // Отключено из-за проблем с зависимостями
  },
  
  // ESLint настройки
  eslint: {
    ignoreDuringBuilds: true, // Игнорируем ошибки ESLint при сборке
  },
  
  // Заголовки для кэширования
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=300',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
