/** @type {import('next').NextConfig} */
const nextConfig = {
  // ESLint and tsc both pass clean — a failing build should stay failing.
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
