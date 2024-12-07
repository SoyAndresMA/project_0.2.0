/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    instrumentationHook: true
  },
  env: {
    NEXT_PUBLIC_MIRAS_APP_VERSION: '0.2.0'
  }
}

export default nextConfig
