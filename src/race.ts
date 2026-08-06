import type {
  LanguageModelV4CallOptions,
  LanguageModelV4StreamPart,
  LanguageModelV4StreamResult,
} from '@ai-sdk/provider'
import type { Result } from 'neverthrow'
import type { Lane } from './types'
import { err, ok } from 'neverthrow'
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

export interface StreamWinner {
  lane: Lane<LanguageModelV4StreamResult>
  result: LanguageModelV4StreamResult
  reader: ReadableStreamDefaultReader<LanguageModelV4StreamPart>
  firstChunk: LanguageModelV4StreamPart
}

export function raceFirstValidChunk(
  lanes: Lane<LanguageModelV4StreamResult>[],
): Promise<Result<StreamWinner, unknown>> {
  return new Promise((resolve) => {
    let remaining = lanes.length
    const errors: unknown[] = []
    let settled = false

    const failLane = (e: unknown): void => {
      if (settled)
        return
      if (e !== undefined)
        errors.push(e)
      if (--remaining === 0)
        resolve(err(aggregateError(errors)))
    }

    for (const lane of lanes) {
      lane.promise
        .then(async (result): Promise<void> => {
          if (settled) {
            lane.ac.abort()
            return
          }
          if (!result.stream) {
            failLane(undefined)
            return
          }
          const reader = result.stream.getReader()
          try {
            const { value, done } = await reader.read()
            if (done) {
              failLane(undefined)
              return
            }
            if (value && value.type !== 'error') {
              settled = true
              resolve(ok({ lane, result, reader, firstChunk: value }))
              return
            }
            failLane(value)
          }
          catch (readErr) {
            failLane(readErr)
          }
        })
        .catch((e) => {
          failLane(e)
        })
    }
  })
}

export function rejoinStream(
  reader: ReadableStreamDefaultReader<LanguageModelV4StreamPart>,
  firstChunk: LanguageModelV4StreamPart,
): ReadableStream<LanguageModelV4StreamPart> {
  return new ReadableStream<LanguageModelV4StreamPart>({
    start(controller) {
      try {
        controller.enqueue(firstChunk)
      }
      catch {
      }
      pump()
      async function pump(): Promise<void> {
        try {
          while (true) {
            const { value, done } = await reader.read()
            if (done) {
              controller.close()
              return
            }
            if (value)
              controller.enqueue(value)
          }
        }
        catch (e) {
          controller.enqueue({ type: 'error', error: e } as LanguageModelV4StreamPart)
          controller.close()
        }
      }
    },
    cancel(reason) {
      return reader.cancel(reason)
    },
  })
}
