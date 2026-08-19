/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  outputFileTracingIncludes: {
    '/*': ['./index.html', './assets/**/*'],
  },
};

export default nextConfig;
