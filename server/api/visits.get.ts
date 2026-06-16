import { getVisits } from '../utils/db'

export default defineEventHandler(async () => {
  return await getVisits()
})
