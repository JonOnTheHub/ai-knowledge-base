import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@huggingface/transformers'],
  },
}

export default nextConfig