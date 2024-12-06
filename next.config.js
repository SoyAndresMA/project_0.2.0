/** @type {import('next').NextConfig} */

const packageJson = require('./package.json');

const nextConfig = {
    // Habilitar CORS para rutas API
    async headers() {
        return [
            {
                source: "/api/:path*",
                headers: [
                    { key: "Access-Control-Allow-Origin", value: "*" },
                    { key: "Access-Control-Allow-Methods", value: "POST, OPTIONS" },
                    { key: "Access-Control-Allow-Headers", value: "Content-Type" }
                ]
            }
        ]
    },
    // Variables de entorno
    env: {
        MIRAS_APP_NAME: packageJson.name,
        MIRAS_APP_VERSION: packageJson.version
    }
}

module.exports = nextConfig
