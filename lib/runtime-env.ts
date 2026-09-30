const CLOUDFLARE_CONTEXT = Symbol.for('__cloudflare-context__')

type CloudflareContext = {
  env?: Record<string, unknown>
  ctx?: {
    waitUntil?: (promise: Promise<unknown>) => void
  }
}

function getCloudflareContext(): CloudflareContext | undefined {
  return (globalThis as unknown as { [CLOUDFLARE_CONTEXT]?: CloudflareContext })[
    CLOUDFLARE_CONTEXT
  ]
}

export function getRuntimeEnv(name: string): string | undefined {
  const fromProcess = process.env[name]
  if (fromProcess) return fromProcess

  const fromCf = getCloudflareContext()?.env?.[name]
  if (typeof fromCf === 'string' && fromCf.length > 0) return fromCf

  return undefined
}

export function waitUntil(promise: Promise<unknown>) {
  const wait = getCloudflareContext()?.ctx?.waitUntil
  if (wait) {
    wait(promise)
    return
  }
  return promise
}
