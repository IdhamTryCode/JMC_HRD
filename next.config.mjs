/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
    serverComponentsExternalPackages: [
      "knex",
      "pg",
      "pg-native",
      "argon2",
      "nodemailer",
      "ioredis",
      "pdfkit",
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // pastikan semua node: built-in scheme dikenali
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : [config.externals].filter(Boolean)),
        ({ request }, callback) => {
          if (request && request.startsWith("node:")) {
            return callback(null, `commonjs ${request.replace("node:", "")}`);
          }
          callback();
        },
      ];
    }
    return config;
  },
};

export default nextConfig;
