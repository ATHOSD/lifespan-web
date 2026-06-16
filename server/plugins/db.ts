import { initDb } from '../utils/db'

export default defineNitroPlugin(async () => {
  await initDb().catch(e => console.error('[db] init failed:', e.message))
})
