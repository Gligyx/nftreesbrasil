/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [ "ipfs.io" ],
    deviceSizes: [320, 640, 768, 1024, 1280, 1600]
  }
}

module.exports = nextConfig
