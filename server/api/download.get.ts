export default defineEventHandler(async (event) => {
  const { url } = getQuery(event)
  if (!url || typeof url !== 'string') {
    throw createError({ statusCode: 400, message: 'Missing url' })
  }

  const res = await fetch(url)
  if (!res.ok) throw createError({ statusCode: 502, message: 'Failed to fetch file' })

  const buffer = await res.arrayBuffer()
  setHeader(event, 'Content-Type', 'application/octet-stream')
  setHeader(event, 'Content-Disposition', 'attachment; filename="seg.nii.gz"')
  setHeader(event, 'Access-Control-Allow-Origin', '*')
  return new Uint8Array(buffer)
})
