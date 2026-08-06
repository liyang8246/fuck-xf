import type {
  LanguageModelV4CallOptions,
} from '@ai-sdk/provider'
import type { Result } from 'neverthrow'
import type { Lane } from './types'
import { ok } from 'neverthrow'
import { aggregateError } from './error'
import { mergeSignals } from './signal'

export function buildLanes<T>(
  fn: (opts: LanguageModelV4CallOptions) => PromiseLike<T>,
  options: LanguageModelV4CallOptions,
  n: number,
): Lane<T>[] {
  const lanes: Lane<T>[] = []
  for (let i = 0; i < n; i++) {
    const ac = new AbortController()
    const merged = mergeSignals(options.abortSignal, ac.signal)
    const promise = Promise.resolve(fn({ ...options, abortSignal: merged }))
    lanes.push({ ac, promise })
  }
  return lanes
}

export function abortLosers<T>(lanes: Lane<T>[], winner: Lane<T> | null): void {
  for (const lane of lanes) {
    if (lane === winner)
      continue
    try {
      lane.ac.abort()
    }
    catch {
    }
  }
}

export function raceFirstResolve<T>(
  lanes: Lane<T>[],
): Promise<Result<{ lane: Lane<T>, result: T }, unknown>> {
  return new Promise((resolve) => {
    let remaining = lanes.length
    const errors: unknown[] = []
    let settled = false

    for (const lane of lanes) {
      lane.promise
        .then((result): void => {
          if (settled)
            return
          settled = true
          resolve(ok({ lane, result }))
        })
        .catch((err): void => {
          if (settled)
            return
          errors.push(err)
          if (--remaining === 0)
            resolve(err(aggregateError(errors)))
        })
    }
  })
}
