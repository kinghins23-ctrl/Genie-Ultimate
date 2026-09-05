# Genie-Ultimate

## AI provider configuration

This project supports two ways to reach a chat-completions-compatible model:

### Recommended: OpenClaw Gateway

OpenClaw can use a Codex/ChatGPT subscription login and expose a local OpenAI-compatible gateway. Enable the chat-completions endpoint in OpenClaw, then create a local .env.local file:

```env
OPENCLAW_BASE_URL=http://127.0.0.1:18789/v1
OPENCLAW_GATEWAY_TOKEN=your_local_gateway_token
OPENAI_MODEL=openclaw/default
```

Keep OPENCLAW_GATEWAY_TOKEN server-side and never commit it. The application uses OpenClaw whenever this variable is present.

### Direct OpenAI API fallback

If OpenClaw is not configured, set an API key instead:

```env
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o
```

Direct API usage is billed separately by the OpenAI API platform.

Copy .env.example to .env.local and fill in exactly one credential path. Environment files are ignored by Git.

## Run locally

```bash
npm install
npm run dev
```

The AI client is implemented in src/genies/openaiClient.ts.
