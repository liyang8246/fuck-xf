import type { OpenAICompatibleProviderSettings } from '@ai-sdk/openai-compatible'
import type { LanguageModelV4 } from '@ai-sdk/provider'

export interface RaceProviderSettings extends OpenAICompatibleProviderSettings {
  concurrency?: number
}

export interface RaceProvider {
  languageModel: (modelId: string) => LanguageModelV4
  chatModel: (modelId: string) => LanguageModelV4
}

export interface Lane<T> {
  ac: AbortController
  promise: Promise<T>
}
