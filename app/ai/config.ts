import fs from "fs";
import path from "path";
import yaml from "yaml";
import { AiConfig } from "./types";

let cachedConfig: AiConfig | null = null;
let cachedSystemPrompt: string | null = null;

function resolveEnvVars(str: string): string {
  return str.replace(/\$\{([^}]+)\}/g, (_, envVar) => {
    return process.env[envVar] ?? "";
  });
}

function deepResolveEnvVars<T>(obj: T): T {
  if (typeof obj === "string") {
    return resolveEnvVars(obj) as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => deepResolveEnvVars(item)) as unknown as T;
  }
  if (obj !== null && typeof obj === "object") {
    const res: Record<string, unknown> = {};
    for (const key of Object.keys(obj as Record<string, unknown>)) {
      res[key] = deepResolveEnvVars((obj as Record<string, unknown>)[key]);
    }
    return res as T;
  }
  return obj;
}

function mergeDeep(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const output = { ...target };
  for (const key of Object.keys(source)) {
    const targetVal = target[key];
    const sourceVal = source[key];
    if (
      targetVal &&
      typeof targetVal === "object" &&
      !Array.isArray(targetVal) &&
      sourceVal &&
      typeof sourceVal === "object" &&
      !Array.isArray(sourceVal)
    ) {
      output[key] = mergeDeep(targetVal as Record<string, unknown>, sourceVal as Record<string, unknown>);
    } else {
      output[key] = sourceVal;
    }
  }
  return output;
}

/**
 * Loads the base config.yaml and applies environment-specific overrides (dev/prod)
 * and resolves environment variables.
 */
export function loadAiConfig(forceReload = false): AiConfig {
  if (cachedConfig && !forceReload) {
    return cachedConfig;
  }

  const projectDir = process.cwd();
  const baseConfigPath = path.join(projectDir, "ai", "config", "config.yaml");

  if (!fs.existsSync(baseConfigPath)) {
    throw new Error(`Base AI configuration file not found at ${baseConfigPath}`);
  }

  const baseRaw = fs.readFileSync(baseConfigPath, "utf-8");
  let parsedConfig = yaml.parse(baseRaw) as Record<string, unknown>;

  const env = process.env.NODE_ENV === "production" ? "prod" : "dev";
  const overridePath = path.join(projectDir, "ai", "config", `config.${env}.yaml`);

  if (fs.existsSync(overridePath)) {
    const overrideRaw = fs.readFileSync(overridePath, "utf-8");
    const parsedOverride = yaml.parse(overrideRaw) as Record<string, unknown>;
    parsedConfig = mergeDeep(parsedConfig, parsedOverride);
  }

  parsedConfig = deepResolveEnvVars(parsedConfig);

  cachedConfig = parsedConfig as unknown as AiConfig;
  return cachedConfig;
}

/**
 * Loads the system prompt specified in agent.system_prompt.file
 */
export function loadSystemPrompt(config?: AiConfig): string {
  if (cachedSystemPrompt) return cachedSystemPrompt;
  const cfg = config ?? loadAiConfig();
  const promptPath = path.resolve(process.cwd(), cfg.agent.system_prompt.file);

  if (fs.existsSync(promptPath)) {
    cachedSystemPrompt = fs.readFileSync(promptPath, "utf-8").trim();
    return cachedSystemPrompt;
  }

  return "You are a helpful AI assistant.";
}
