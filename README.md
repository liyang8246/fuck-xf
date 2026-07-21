# fxxk-xf

Race provider for [opencode](https://opencode.ai). Fires 8 parallel connections to an OpenAI-compatible endpoint, first valid SSE chunk wins, rest aborted. On total failure signals `retry-after-ms: 0` so opencode retries instantly.

## Install

```bash
pnpm add @liyang8246/fxxk-xf
```

## Use in opencode

Add to `opencode.json` (project root or `~/.config/opencode/`):

```json
{
  "$schema": "https://opencode.ai/config.json",
  "model": "race/claude-sonnet-4-5",
  "provider": {
    "race": {
      "npm": "@liyang8246/fxxk-xf",
      "name": "Race",
      "options": {
        "apiKey": "{env:XF_API_KEY}"
      },
      "models": {
        "claude-sonnet-4-5": { "name": "Claude 4.5" }
      }
    }
  }
}
```

opencode auto-detects the `createRaceProvider` export and calls it with your `options`. Set `XF_API_KEY` in env, or run `/connect` → Other → `race`.

### Options

| Field | Default | Description |
|---|---|---|
| `apiKey` | — | Auth key |
| `baseURL` | `https://maas-coding-api.cn-huabei-1.xf-yun.com/v2` | Endpoint |
| `concurrency` | `8` | Parallel lanes; `1` disables racing |

## License

MIT
