/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  outputFileTracingIncludes: {
    '/*': ['./assets/**/*'],
  },
};

export default nextConfig;
