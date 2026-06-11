export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const form = await readMultipartFormData(event)
  if (!form) throw createError({ statusCode: 400, message: 'No form data' })

  const scanField = form.find(f => f.name === 'scan')
  const modalityField = form.find(f => f.name === 'modality')
  if (!scanField) throw createError({ statusCode: 400, message: 'No scan file' })

  const modality = modalityField?.data.toString() || 'T1w'

  // Encode file as data URI (avoids Replicate Files API complexity)
  const base64 = scanField.data.toString('base64')
  const dataUri = `data:application/octet-stream;base64,${base64}`

  // Create prediction
  const predRes = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.replicateApiToken}`,
      'Content-Type': 'application/json',
      'Prefer': 'wait=60',
    },
    body: JSON.stringify({
      version: config.replicateVersion,
      input: { scan: dataUri, modality },
    }),
  })

  if (!predRes.ok) {
    const err = await predRes.text()
    throw createError({ statusCode: 500, message: `Prediction failed: ${err}` })
  }

  let result = await predRes.json()

  // Poll until done
  while (result.status !== 'succeeded' && result.status !== 'failed' && result.status !== 'canceled') {
    await new Promise(r => setTimeout(r, 3000))
    const poll = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
      headers: { Authorization: `Bearer ${config.replicateApiToken}` },
    })
    result = await poll.json()
  }

  if (result.status !== 'succeeded') {
    throw createError({ statusCode: 500, message: result.error || 'Prediction failed' })
  }

  return { segUrl: result.output }
})
