export default defineNuxtConfig({
  ssr: false,
  modules: ['@nuxt/ui'],
  runtimeConfig: {
    replicateApiToken: process.env.REPLICATE_API_TOKEN,
    replicateVersion: process.env.REPLICATE_VERSION || 'fb0ec1932828ca3348a57f38ec7086ac128e76413726ac15534424474b807934',
  },
  nitro: {
    preset: 'node-server',
    serveStatic: 'node',
  },
  colorMode: {
    preference: 'dark',
  },
  vite: {
    optimizeDeps: {
      include: ['@niivue/niivue'],
    },
  },
})
