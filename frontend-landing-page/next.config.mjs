/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [{ source: "/accueil", destination: "/", permanent: true }];
  },
  // Option: export statique si hébergement statique
  // output: 'export',
};

export default nextConfig;
