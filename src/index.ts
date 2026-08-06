import type { OpenAICompatibleProviderSettings } from '@ai-sdk/openai-compatible'
import type {
  LanguageModelV4,
  LanguageModelV4CallOptions,
  LanguageModelV4GenerateResult,
  LanguageModelV4StreamResult,
} from '@ai-sdk/provider'
import type { Lane, RaceProvider, RaceProviderSettings } from './types'
import {
  createOpenAICompatible,

} from '@ai-sdk/openai-compatible'
import { DEFAULT_BASE_URL, DEFAULT_CONCURRENCY, RETRY_COOLDOWN_MS } from './constants'
import { toRetryableError } from './error'
import {
  abortLosers,
  buildLanes,
  raceFirstResolve,

} from './race'
import { isAbortError, sleep } from './signal'

export type { RaceProvider, RaceProviderSettings } from './types'

export function createRaceProvider(settings: RaceProviderSettings): RaceProvider {
  const { concurrency = DEFAULT_CONCURRENCY, baseURL, ...rest } = settings
  const n = Math.max(1, concurrency)
  const base: OpenAICompatibleProviderSettings = {
    ...rest,
    baseURL: baseURL ?? DEFAULT_BASE_URL,
  }
  const underlying = createOpenAICompatible(base)

  function raceLanguageModel(modelId: string): LanguageModelV4 {
    const model = underlying.languageModel(modelId)

    const proxy: LanguageModelV4 = {
      specificationVersion: model.specificationVersion,
      provider: model.provider,
      modelId: model.modelId,
      supportedUrls: model.supportedUrls,

      async doGenerate(options: LanguageModelV4CallOptions): Promise<LanguageModelV4GenerateResult> {
        const lanes = buildLanes(opts => model.doGenerate(opts), options, n)
        let winnerLane: Lane<LanguageModelV4GenerateResult> | null = null
        try {
          const result = await raceFirstResolve(lanes)
          if (result.isErr()) {
            const e = result.error
            if (options.abortSignal?.aborted || isAbortError(e))
              throw e
            await sleep(RETRY_COOLDOWN_MS, options.abortSignal)
            throw toRetryableError(e)
          }
          winnerLane = result.value.lane
          return result.value.result
        }
        finally {
          abortLosers(lanes, winnerLane)
        }
      },

      async doStream(options: LanguageModelV4CallOptions): Promise<LanguageModelV4StreamResult> {
        const lanes = buildLanes(opts => model.doStream(opts), options, n)
        let winnerLane: Lane<LanguageModelV4StreamResult> | null = null
        try {
          const result = await raceFirstResolve(lanes)
          if (result.isErr()) {
            const e = result.error
            if (options.abortSignal?.aborted || isAbortError(e))
              throw e
            await sleep(RETRY_COOLDOWN_MS, options.abortSignal)
            throw toRetryableError(e)
          }
          winnerLane = result.value.lane
          return result.value.result
        }
        finally {
          abortLosers(lanes, winnerLane)
        }
      },
    }

    return proxy
  }

  return {
    languageModel: raceLanguageModel,
    chatModel: raceLanguageModel,
  }
}

export const raceProviderFactory = createRaceProvider
