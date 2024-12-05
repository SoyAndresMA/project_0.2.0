/** @type {import('next').NextConfig} */

const packageJson = require('./package.json');

const nextConfig = {
    env: {
        MIRAS_APP_NAME: packageJson.name,
        MIRAS_APP_VERSION: packageJson.version
    }
}

module.exports = nextConfig
