// Single source of truth for the tools referenced in post "Tools & References"
// sections. Posts reference a tool by its slug (in frontmatter) plus an optional
// per-post `note`; this registry holds the canonical name + link. `description`
// is a generic fallback shown only when a post omits a note.

export type Tool = {
  name: string;
  url: string;
  description: string;
};

export const toolsRegistry: Record<string, Tool> = {
  // AoE2 LLM Arena
  "ultralytics-yolo": {
    name: "Ultralytics YOLO",
    url: "https://github.com/ultralytics/ultralytics",
    description: "Real-time object-detection framework",
  },
  pyautogui: {
    name: "PyAutoGUI",
    url: "https://github.com/asweigart/pyautogui",
    description: "Programmatic mouse and keyboard control",
  },
  "anthropic-prompt-caching": {
    name: "Anthropic prompt caching",
    url: "https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching",
    description: "Reuse cached prompt prefixes to cut token cost",
  },
  mss: {
    name: "mss",
    url: "https://github.com/BoboTiG/python-mss",
    description: "Fast cross-platform screen capture",
  },
  "anthropic-tool-use": {
    name: "Anthropic tool use",
    url: "https://docs.anthropic.com/en/docs/build-with-claude/tool-use",
    description: "Let Claude call tools in an agentic loop",
  },
  "asyncio-create-task": {
    name: "asyncio (create_task)",
    url: "https://docs.python.org/3/library/asyncio.html#asyncio.create_task",
    description: "Schedule fire-and-forget background coroutines",
  },
  pillow: {
    name: "Pillow (PIL)",
    url: "https://github.com/python-pillow/Pillow",
    description: "Python imaging library for encoding and conversion",
  },

  // Document Q&A
  uploadthing: {
    name: "UploadThing",
    url: "https://uploadthing.com/",
    description: "Typed file-upload service with an S3 backend",
  },
  "llamaindex-ts": {
    name: "LlamaIndex (TS)",
    url: "https://github.com/run-llama/LlamaIndexTS",
    description: "TypeScript RAG framework for indexing and retrieval",
  },
  qdrant: {
    name: "Qdrant",
    url: "https://github.com/qdrant/qdrant",
    description: "Open-source vector database",
  },
  "vercel-ai-sdk": {
    name: "Vercel AI SDK",
    url: "https://sdk.vercel.ai/",
    description: "Streaming helpers for AI chat UIs",
  },
  zod: {
    name: "Zod",
    url: "https://github.com/colinhacks/zod",
    description: "TypeScript-first runtime schema validation",
  },
  "shadcn-ui": {
    name: "shadcn/ui",
    url: "https://ui.shadcn.com/",
    description: "Headless, copy-in React component primitives",
  },

  // Knowledge base app
  "llamaindex-python": {
    name: "LlamaIndex (Python)",
    url: "https://github.com/run-llama/llama_index",
    description: "Python RAG framework for indexing and retrieval",
  },
  chromadb: {
    name: "ChromaDB",
    url: "https://github.com/chroma-core/chroma",
    description: "Open-source vector database for self-hosted RAG",
  },
  minio: {
    name: "MinIO",
    url: "https://github.com/minio/minio",
    description: "S3-compatible object storage",
  },
  "bge-embeddings": {
    name: "BGE embeddings (bge-base-en-v1.5)",
    url: "https://huggingface.co/BAAI/bge-base-en-v1.5",
    description: "Local open-source text embedding model",
  },
  fastapi: {
    name: "FastAPI",
    url: "https://github.com/tiangolo/fastapi",
    description: "Async Python web framework",
  },
  poetry: {
    name: "Poetry",
    url: "https://github.com/python-poetry/poetry",
    description: "Python dependency and packaging manager",
  },

  // Tweet scheduler
  "trigger-dev": {
    name: "Trigger.dev",
    url: "https://trigger.dev/",
    description: "Background jobs and scheduling for TypeScript",
  },
  "upstash-redis": {
    name: "Upstash Redis",
    url: "https://upstash.com/docs/redis/overall/getstarted",
    description: "Serverless Redis with a REST API",
  },
  "twitter-ts-sdk": {
    name: "X (Twitter) TypeScript SDK",
    url: "https://github.com/xdevplatform/twitter-api-typescript-sdk",
    description: "Official typed client for the X API",
  },
  "openai-chat": {
    name: "OpenAI Chat Completions",
    url: "https://platform.openai.com/docs/guides/text-generation",
    description: "Text generation with OpenAI chat models",
  },
  "zod-form-data": {
    name: "zod-form-data",
    url: "https://github.com/airjp73/zod-form-data",
    description: "Parse FormData into typed Zod schemas",
  },
  jest: {
    name: "Jest",
    url: "https://jestjs.io/",
    description: "JavaScript testing framework",
  },

  // Ethereum wallet series
  "react-native-bip39": {
    name: "react-native-bip39",
    url: "https://github.com/valora-inc/react-native-bip39",
    description: "BIP39 mnemonic generation for React Native",
  },
  libauth: {
    name: "libauth",
    url: "https://github.com/bitauth/libauth",
    description: "Cryptography for wallets, incl. BIP32 key derivation",
  },
  "react-native-keychain": {
    name: "react-native-keychain",
    url: "https://github.com/oblador/react-native-keychain",
    description: "Secure credential storage via iOS Keychain / Android Keystore",
  },
  web3js: {
    name: "Web3.js",
    url: "https://github.com/web3/web3.js",
    description: "Ethereum JavaScript API",
  },
  infura: {
    name: "Infura",
    url: "https://infura.io/",
    description: "Hosted Ethereum and L2 RPC endpoints",
  },
  "react-navigation": {
    name: "React Navigation",
    url: "https://reactnavigation.org/",
    description: "Routing and navigation for React Native",
  },
  "react-native-reanimated": {
    name: "react-native-reanimated",
    url: "https://github.com/software-mansion/react-native-reanimated",
    description: "Native-driver animations for React Native",
  },
  "react-native-pager-view": {
    name: "react-native-pager-view",
    url: "https://github.com/callstack/react-native-pager-view",
    description: "Native swipeable paged views for React Native",
  },
  polygon: {
    name: "Polygon",
    url: "https://polygon.technology/",
    description: "Ethereum layer-2 scaling network",
  },
  etherscan: {
    name: "Etherscan",
    url: "https://etherscan.io/",
    description: "Ethereum block explorer",
  },
  polygonscan: {
    name: "Polygonscan",
    url: "https://mumbai.polygonscan.com/",
    description: "Polygon block explorer",
  },
  "polygon-faucet": {
    name: "Polygon Faucet",
    url: "https://faucet.polygon.technology/",
    description: "Testnet faucet for MATIC",
  },

  // FlatUniverse
  sequin: {
    name: "Sequin",
    url: "https://sequinstream.com/",
    description: "Change-data-capture streaming from Postgres",
  },
  neon: {
    name: "Neon",
    url: "https://neon.tech/",
    description: "Serverless Postgres",
  },
  pinecone: {
    name: "Pinecone",
    url: "https://www.pinecone.io/",
    description: "Managed vector database",
  },
  "openai-embeddings": {
    name: "OpenAI embeddings",
    url: "https://platform.openai.com/docs/guides/embeddings",
    description: "Text embeddings via the OpenAI API",
  },
  "openai-gpt4o-mini": {
    name: "OpenAI (GPT-4o mini)",
    url: "https://platform.openai.com/docs/models",
    description: "Compact OpenAI chat model",
  },

  // Telegram project management
  mastra: {
    name: "Mastra",
    url: "https://mastra.ai/",
    description: "TypeScript framework for building AI agents",
  },
  plane: {
    name: "Plane",
    url: "https://docs.plane.so/",
    description: "Open-source project and issue management",
  },
  "telegram-bot-api": {
    name: "Telegram Bot API",
    url: "https://core.telegram.org/bots/api",
    description: "Build bots on top of Telegram",
  },
};

export function getTool(slug: string): Tool | undefined {
  return toolsRegistry[slug];
}
