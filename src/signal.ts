export function isAbortError(err: unknown): boolean {
  if (!err || typeof err !== 'object')
    return false
  const name = (err as { name?: string }).name
  if (name === 'AbortError')
    return true
  if (typeof DOMException !== 'undefined' && err instanceof DOMException)
    return err.name === 'AbortError'
  return false
}

export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal?.aborted) {
      resolve()
      return
    }
    let timer: ReturnType<typeof setTimeout>
    const onAbort = (): void => {
      clearTimeout(timer)
      resolve()
    }
    timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

export function mergeSignals(a: AbortSignal | undefined, b: AbortSignal | undefined): AbortSignal | undefined {
  if (!a)
    return b
  if (!b)
    return a
  if (a.aborted)
    return a
  if (b.aborted)
    return b
  const merged = new AbortController()
  const forward = (src: AbortSignal): void => {
    merged.abort(
      typeof src.reason !== 'undefined'
        ? src.reason
        : new DOMException('Aborted', 'AbortError'),
    )
  }
  a.addEventListener('abort', () => forward(a), { once: true })
  b.addEventListener('abort', () => forward(b), { once: true })
  return merged.signal
}
