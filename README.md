# fxxk-xf

Race provider for [opencode](https://opencode.ai). Fires 8 parallel connections to an OpenAI-compatible endpoint, first valid SSE chunk wins, rest aborted. On total failure signals `retry-after-ms: 0` so opencode retries instantly.

## Use in opencode

Add to `opencode.json` (project root or `~/.config/opencode/`):

```jsonc
{
  //...
  "provider": {
    "AstronCodingPlan": {
      "npm": "@liyang8246/fxxk-xf",
      "name": "astron-coding-plan",
      "options": {
        "baseURL": "https://maas-coding-api.cn-huabei-1.xf-yun.com/v2",
        "apiKey": "{env:XF_API_KEY}"
      },
      "models": {
        "xopdeepseekv32": { "name": "DeepSeek-V3.2", "reasoning": true, "limit": { "context": 128000, "output": 65536 }, "options": { "enable_thinking": true } },
        "xopdeepseekv4flash": { "name": "DeepSeek-V4-Flash", "reasoning": true, "limit": { "context": 1000000, "output": 1000000 }, "options": { "enable_thinking": true } },
        "xopdeepseekv4pro": { "name": "DeepSeek-V4-Pro", "reasoning": true, "limit": { "context": 1000000, "output": 1000000 }, "options": { "enable_thinking": true } },
        "xopglmv47flash": { "name": "GLM-4.7-Flash", "reasoning": true, "limit": { "context": 128000, "output": 131072 }, "options": { "enable_thinking": true } },
        "xopglm5": { "name": "GLM-5", "reasoning": true, "limit": { "context": 200000, "output": 131072 }, "options": { "enable_thinking": true } },
        "xopglm51": { "name": "GLM-5.1", "reasoning": true, "limit": { "context": 200000, "output": 131072 }, "options": { "enable_thinking": true } },
        "xopglm52": { "name": "GLM-5.2", "reasoning": true, "limit": { "context": 500000, "output": 131072 }, "options": { "enable_thinking": true } },
        "xopkimik25": { "name": "KIMI-K2.5", "reasoning": true, "limit": { "context": 128000, "output": 262144 }, "options": { "enable_thinking": true } },
        "xopkimik26": { "name": "Kimi-K2.6", "reasoning": true, "limit": { "context": 256000, "output": 262144 }, "options": { "enable_thinking": true } },
        "xminimaxm25": { "name": "MiniMax-M2.5", "reasoning": true, "limit": { "context": 128000, "output": 131072 }, "options": { "enable_thinking": true } },
        "xop3qwencodernext": { "name": "Qwen3-Coder-Next-FP8", "reasoning": true, "limit": { "context": 256000, "output": 65536 }, "options": { "enable_thinking": true } },
        "xopqwen35v35b": { "name": "Qwen3.5-35B-A3B", "reasoning": true, "limit": { "context": 128000, "output": 65536 }, "options": { "enable_thinking": true } },
        "xopqwen35397b": { "name": "Qwen3.5-397B-A17B", "reasoning": true, "limit": { "context": 256000, "output": 65536 }, "options": { "enable_thinking": true } },
        "xopqwen36v35b": { "name": "Qwen3.6-35B-A3B", "reasoning": true, "limit": { "context": 128000, "output": 65536 }, "options": { "enable_thinking": true } },
        "xsparkx2": { "name": "Spark X2", "reasoning": true, "limit": { "context": 128000, "output": 131072 }, "options": { "enable_thinking": true } },
        "xsparkx2agent": { "name": "Spark-X2-Agent", "reasoning": true, "limit": { "context": 256000, "output": 131072 }, "options": { "enable_thinking": true } },
        "xsparkx2flash": { "name": "Spark-X2-Flash", "reasoning": true, "limit": { "context": 256000, "output": 262144 }, "options": { "enable_thinking": true } }
      }
    }
  }
}
```

### Options

| Field | Default | Description |
|---|---|---|
| `apiKey` | — | Auth key |
| `baseURL` | `https://maas-coding-api.cn-huabei-1.xf-yun.com/v2` | Endpoint |
| `concurrency` | `8` | Parallel lanes; `1` disables racing |

## License

MIT
