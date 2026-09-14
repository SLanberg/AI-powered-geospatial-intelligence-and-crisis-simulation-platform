import { AiConfig } from "../types";
import { AiLogger } from "../observability/logger";

export class BudgetExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BudgetExceededError";
  }
}

export interface UsageMetrics {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  latencyMs: number;
  isLocalCompute: boolean;
}

export class CostManager {
  private config: AiConfig;
  private logger: AiLogger;

  // Running tally (in-memory state)
  private dailySpendUsd = 0;
  private monthlySpendUsd = 0;
  private totalRequests = 0;
  private localTokenCount = 0;

  constructor(config: AiConfig, logger?: AiLogger) {
    this.config = config;
    this.logger = logger ?? new AiLogger(config);
  }

  resetTally() {
    this.dailySpendUsd = 0;
    this.monthlySpendUsd = 0;
    this.totalRequests = 0;
    this.localTokenCount = 0;
  }

  getDailySpend(): number {
    return this.dailySpendUsd;
  }

  getMonthlySpend(): number {
    return this.monthlySpendUsd;
  }

  checkBudget(provider: string) {
    if (!this.config.cost.enabled) return;

    const isLocal = provider.toLowerCase() === "ollama" || provider.toLowerCase() === "mock";
    if (isLocal) return; // Local inference compute is explicitly $0 USD

    const dailyLimit = this.config.cost.budgets.daily_usd;
    const monthlyLimit = this.config.cost.budgets.monthly_usd;

    if (this.dailySpendUsd >= dailyLimit) {
      throw new BudgetExceededError(
        `Daily USD budget limit of $${dailyLimit} exceeded (current spend: $${this.dailySpendUsd.toFixed(4)})`
      );
    }

    if (this.monthlySpendUsd >= monthlyLimit) {
      throw new BudgetExceededError(
        `Monthly USD budget limit of $${monthlyLimit} exceeded (current spend: $${this.monthlySpendUsd.toFixed(4)})`
      );
    }
  }

  recordUsage(
    provider: string,
    model: string,
    promptTokens: number,
    completionTokens: number,
    latencyMs: number
  ): UsageMetrics {
    const isLocal = provider.toLowerCase() === "ollama" || provider.toLowerCase() === "mock";
    const totalTokens = promptTokens + completionTokens;
    let costUsd = 0;

    if (!isLocal) {
      // Calculate API provider token costs
      const m = model.toLowerCase();
      let promptPricePerMillion = 2.5;
      let completionPricePerMillion = 10.0;

      if (m.includes("mini")) {
        promptPricePerMillion = 0.15;
        completionPricePerMillion = 0.6;
      }

      costUsd =
        (promptTokens / 1_000_000) * promptPricePerMillion +
        (completionTokens / 1_000_000) * completionPricePerMillion;

      this.dailySpendUsd += costUsd;
      this.monthlySpendUsd += costUsd;
    } else {
      this.localTokenCount += totalTokens;
    }

    this.totalRequests++;

    this.logger.info(`Cost/Usage recorded for provider '${provider}'`, {
      provider,
      model,
      totalTokens,
      costUsd,
      isLocalCompute: isLocal,
      dailySpendUsd: this.dailySpendUsd,
      latencyMs,
    });

    return {
      promptTokens,
      completionTokens,
      totalTokens,
      estimatedCostUsd: costUsd,
      latencyMs,
      isLocalCompute: isLocal,
    };
  }
}
