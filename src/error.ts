import { APICallError } from '@ai-sdk/provider'
import { ALL_LANES_FAILED_MESSAGE, RETRY_AFTER_MS } from './constants'

export function toRetryableError(err: unknown): APICallError {
  const errors = unwrapAggregate(err)
  const best = errors.find((e): e is APICallError => APICallError.isInstance(e))

  if (best) {
    return new APICallError({
      message: best.message,
      url: best.url,
      requestBodyValues: best.requestBodyValues,
      statusCode: 503,
      responseHeaders: {
        ...(best.responseHeaders ?? {}),
        'retry-after-ms': RETRY_AFTER_MS,
      },
      responseBody: best.responseBody,
      isRetryable: true,
      data: best.data,
      cause: best.cause,
    })
  }

  return new APICallError({
    message: errors.length > 0 ? errors.map(describe).join('; ') : ALL_LANES_FAILED_MESSAGE,
    url: '',
    requestBodyValues: {},
    statusCode: 503,
    responseHeaders: { 'retry-after-ms': RETRY_AFTER_MS },
    responseBody: undefined,
    isRetryable: true,
    cause: err,
  })
}

function unwrapAggregate(err: unknown): unknown[] {
  if (err && typeof err === 'object' && 'errors' in err) {
    const list = (err as { errors: unknown[] }).errors
    if (Array.isArray(list))
      return list
  }
  return [err]
}

function describe(e: unknown): string {
  if (e instanceof Error)
    return e.message
  try {
    return JSON.stringify(e)
  }
  catch {
    return String(e)
  }
}

export function aggregateError(errors: unknown[]): unknown {
  if (errors.length === 1)
    return errors[0]
  return new AggregateError(
    errors.map(e => (e instanceof Error ? e : new Error(describe(e)))),
    `${ALL_LANES_FAILED_MESSAGE} (${errors.length} lanes)`,
  )
}
