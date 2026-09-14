/**
 * AI System Type Definitions matching config.yaml
 */

export interface ReasoningConfig {
  enabled: boolean;
  effort: "low" | "medium" | "high";
}

export interface RetryConfig {
  enabled: boolean;
  max_attempts: number;
  initial_delay_ms: number;
  max_delay_ms: number;
  backoff_multiplier: number;
  jitter: boolean;
}

export interface ModelCapabilities {
  tool_calling: boolean;
  structured_output: boolean;
  reasoning: boolean;
  streaming: boolean;
  vision: boolean;
  embeddings: boolean;
  supported_params: Array<
    "reasoning.effort" | "temperature" | "top_p" | "max_output_tokens" | "tools" | "response_format"
  >;
}

export interface ModelConfig {
  provider: "openai" | "ollama" | "mock" | string;
  name: string;
  temperature: number;
  top_p: number;
  max_output_tokens: number;
  max_context_tokens?: number;
  reasoning: ReasoningConfig;
  timeout_seconds: number;
  max_retries: number;
  retry?: RetryConfig;
}

export interface AgentConfig {
  name: string;
  system_prompt: {
    file: string;
  };
  max_steps: number;
  max_execution_time_seconds: number;
  capabilities: {
    tool_calling: boolean;
    retrieval: boolean;
    memory: boolean;
    planning: boolean;
    reasoning?: boolean;
    structured_output?: boolean;
  };
  output: {
    format: "json" | "text" | "markdown";
    schema?: string;
  };
}

export type ToolExecutionMode = "parallel" | "sequential";
export type ToolCategory = "read_only" | "write" | "external_action" | "non_idempotent";

export interface ToolExecutionPolicy {
  mode: ToolExecutionMode;
  requires_confirmation: boolean;
  idempotent: boolean;
  category: ToolCategory;
}

export interface ToolPermission {
  enabled: boolean;
  read_only: boolean;
  execution?: Partial<ToolExecutionPolicy>;
}

export interface ToolsConfig {
  execution: {
    enabled: boolean;
    parallel_calls: boolean;
    timeout_seconds: number;
    max_calls_per_step: number;
  };
  enabled: string[];
  permissions: Record<string, ToolPermission>;
  write_operations: {
    enabled: boolean;
    require_confirmation: boolean;
  };
}

export interface McpServerConfig {
  enabled: boolean;
  transport: "stdio" | "http" | "websocket";
  command?: string;
  args?: string[];
  url?: string;
  tools: {
    allow: string[];
  };
}

export interface McpSecurityConfig {
  allow_remote_servers: boolean;
  require_authentication: boolean;
  allowed_hosts: string[];
  allowed_transports: string[];
  max_response_size_mb: number;
  timeout_seconds: number;
  max_tool_calls_per_request: number;
}

export interface McpConfig {
  enabled: boolean;
  servers: Record<string, McpServerConfig>;
  security: McpSecurityConfig;
}

export interface RetrievalConfig {
  enabled: boolean;
  provider: string;
  embeddings: {
    provider: string;
    model: string;
    dimensions: number;
  };
  search: {
    top_k: number;
    similarity_threshold: number;
  };
  reranking: {
    enabled: boolean;
    top_k: number;
  };
  sources: Record<string, { enabled: boolean; collection: string }>;
  context: {
    max_tokens: number;
    include_metadata: boolean;
    include_source_references: boolean;
  };
}

export interface MemoryConfig {
  enabled: boolean;
  conversation: {
    enabled: boolean;
    max_messages: number;
    max_tokens: number;
  };
  long_term: {
    enabled: boolean;
    provider: string;
    collection: string;
  };
  retrieval: {
    top_k: number;
    similarity_threshold: number;
  };
  retention: {
    enabled: boolean;
    days: number;
  };
}

export interface ContextConfig {
  max_tokens: number;
  sources: {
    conversation: boolean;
    retrieval: boolean;
    memory: boolean;
    tool_results: boolean;
  };
  prioritization: {
    system_prompt: number;
    current_user_request: number;
    tool_results: number;
    retrieved_documents: number;
    memory: number;
  };
  compression: {
    enabled: boolean;
    trigger_at_percent: number;
  };
}

export interface SafetyConfig {
  enabled: boolean;
  input: {
    validation: boolean;
    max_length: number;
  };
  output: {
    validation: boolean;
  };
  tools: {
    require_confirmation_for: string[];
  };
  prompt_injection: {
    detection: boolean;
  };
}

export interface ObservabilityConfig {
  enabled: boolean;
  logging: {
    level: string;
    redact_secrets: boolean;
    redact_pii: boolean;
    include: Record<string, boolean>;
  };
  tracing: {
    enabled: boolean;
    provider: string;
  };
  metrics: {
    enabled: boolean;
    collect: string[];
  };
  evaluation: {
    enabled: boolean;
    sample_rate: number;
  };
}

export interface CostConfig {
  enabled: boolean;
  limits: {
    max_tokens_per_request: number;
    max_tool_calls_per_request: number;
  };
  budgets: {
    daily_usd: number;
    monthly_usd: number;
  };
}

export interface CacheConfig {
  enabled: boolean;
  provider: string;
  ttl_seconds: number;
  operations: Record<string, boolean>;
}

export interface DatabaseConfig {
  provider: string;
  url: string;
  pool: {
    min: number;
    max: number;
  };
}

export interface ServicesConfig {
  [key: string]: {
    url?: string;
    api_key?: string;
    [key: string]: unknown;
  };
}

export interface SecurityConfig {
  secrets: { provider: string };
  network: { allow_outbound: boolean };
  authentication: { enabled: boolean };
  authorization: { enabled: boolean };
}

export interface ProfileConfig {
  debug: boolean;
  mock_tools: boolean;
  mock_model: boolean;
  save_prompts: boolean;
  save_tool_inputs: boolean;
  save_tool_outputs: boolean;
  verbose_errors: boolean;
  health_checks?: { enabled: boolean };
  graceful_shutdown?: { timeout_seconds: number };
}

export interface AiConfig {
  version: number;
  app: {
    name: string;
    environment: string;
    version: string;
  };
  model: ModelConfig;
  agent: AgentConfig;
  tools: ToolsConfig;
  mcp: McpConfig;
  retrieval: RetrievalConfig;
  memory: MemoryConfig;
  context: ContextConfig;
  safety: SafetyConfig;
  observability: ObservabilityConfig;
  cost: CostConfig;
  cache: CacheConfig;
  database: DatabaseConfig;
  services: ServicesConfig;
  security: SecurityConfig;
  development: ProfileConfig;
  production: ProfileConfig;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  name?: string;
  tool_call_id?: string;
  tool_calls?: Array<{
    id: string;
    name: string;
    arguments: Record<string, unknown>;
  }>;
}

export interface AgentRunOptions {
  messages: ChatMessage[];
  context?: string;
  stream?: boolean;
  modelOverride?: string;
  temperatureOverride?: number;
  userConfirmationGranted?: boolean;
}

export interface AgentRunResult {
  content: string;
  model: string;
  stepsCount: number;
  toolCallsCount: number;
  tokensUsed?: {
    prompt: number;
    completion: number;
    total: number;
  };
  executionTimeMs: number;
  warnings?: string[];
}

