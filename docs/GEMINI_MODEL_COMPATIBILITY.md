# Gemini model compatibility evidence

- Checked: 2026-11-18 Africa/Lagos
- Provider: Google Gemini Developer API
- SDK: `@google/generative-ai` 0.24.1
- Authentication: `GEMINI_API_KEY` (value never logged or stored here)
- Probe: one attempt per advertised `generateContent` model, JSON response mode, temperature 0, 16 output tokens, 12-second timeout, two concurrent workers
- Result: 49 tested; 2 returned parseable `{ "ok": true }` JSON

## Selected model

| Model | Result | Duration | Decision |
|---|---:|---:|---|
| `gemini-3.5-flash-lite` | HTTP 200, valid JSON | 1.926 s | Selected: pinned and fastest successful model |
| `gemini-flash-lite-latest` | HTTP 200, valid JSON | 6.173 s | Rejected: rolling alias and slower |

## Unsuccessful models

| Result | Models |
|---|---|
| HTTP 400 | `antigravity-preview-05-2026`, `antigravity-preview-09-2026`, `antigravity-preview-latest`, `gemini-2.5-flash-preview-tts`, `gemini-3.1-flash-tts-preview`, `gemini-3.5-transcribe`, `gemini-3.8-flash-lite-tts`, `gemini-3.8-flash-tts` |
| HTTP 404 | `gemini-2.5-flash`, `gemini-2.5-flash-lite`, `gemini-2.5-pro` |
| HTTP 429 | `deep-research-max-preview-04-2026`, `deep-research-preview-04-2026`, `deep-research-pro-preview-12-2025`, `gemini-2.5-computer-use-preview-10-2025`, `gemini-2.5-flash-image`, `gemini-2.5-pro-preview-tts`, `gemini-3-pro-image`, `gemini-3-pro-image-preview`, `gemini-3.1-flash-image`, `gemini-3.1-flash-image-preview`, `gemini-3.1-flash-lite-image`, `gemini-3.1-pro-preview`, `gemini-3.1-pro-preview-customtools`, `gemini-4-argon`, `gemini-4-carbon`, `gemini-nano-banana-2.1`, `gemini-omni-1.1-flash`, `gemini-omni-1.2-flash`, `gemini-omni-flash-preview`, `gemini-pro-latest`, `lyria-3-clip-preview`, `lyria-3-pro-preview`, `lyria-3.5`, `nano-banana-pro-preview` |
| HTTP 503 | `gemini-3.8-flash`, `gemini-flash-latest`, `gemma-4-31b-it` |
| 12-second timeout | `gemini-3.1-flash-lite`, `gemini-3.1-flash-lite-preview`, `gemini-3.5-flash`, `gemini-3.6-flash`, `gemini-3.7-flash`, `gemini-4-hydrogen` |
| Non-matching JSON | `gemini-3-flash-preview`, `gemini-robotics-er-2-preview`, `gemma-4-26b-a4b-it` |

These results are a point-in-time compatibility matrix, not a claim about model quality or permanent availability.
