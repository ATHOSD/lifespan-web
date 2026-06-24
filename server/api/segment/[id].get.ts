export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing prediction id' })

  const res = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
    headers: { Authorization: `Bearer ${config.replicateApiToken}` },
  })

  if (!res.ok) {
    const err = await res.text()
    throw createError({ statusCode: 502, message: `Replicate poll failed: ${err}` })
  }

  const result = await res.json()

  if (result.status === 'succeeded') return { status: 'succeeded', segUrl: result.output }
  if (result.status === 'failed' || result.status === 'canceled') {
    throw createError({ statusCode: 500, message: result.error || 'Prediction failed' })
  }

  return { status: result.status }
})
