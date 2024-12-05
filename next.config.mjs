/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    instrumentationHook: true
  },
  env: {
    NEXT_PUBLIC_MIRAS_APP_VERSION: '0.2.0'
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ]
  },
  async rewrites() {
    console.log('Rewrites triggered');
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
        has: [
          {
            type: 'header',
            key: 'x-debug',
            value: '(?<debug>.*)',
          },
        ],
        missing: [
          {
            type: 'header',
            key: 'x-no-debug',
          },
        ],
      }
    ]
  }
}

export default nextConfig;
