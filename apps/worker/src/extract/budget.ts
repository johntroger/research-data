/**
 * Budget cap (step 1.7, Mục 4.3, D6): the worker stops safely BEFORE a call that could pass the
 * limit. Every paid call is booked in the spend ledger (`api_spend`), also when its answer is
 * later rejected, because the money is gone either way.
 *   GEMINI_BUDGET_LIMIT       total USD the project may spend (pilot: 25)
 *   GEMINI_SPENT_OFFSET_USD   money spent before the ledger existed (see Google AI Studio billing)
 *   GEMINI_RUN_LIMIT          optional cap for one run of the worker
 */
import type pg from "pg";

export interface SpendEntry {
  model: string;
  pass: string | null;
  fileHash: string | null;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  batch?: boolean;
  batchJobId?: string | null;
  note?: string | null;
}

export interface SpendLedger {
  totalUsd(): Promise<number>;
  add(entry: SpendEntry): Promise<void>;
}

export class BudgetExceeded extends Error {
  constructor(
    readonly scope: "total" | "run",
    readonly limitUsd: number,
    readonly spentUsd: number,
    readonly neededUsd: number,
  ) {
    super(
      `Budget cap reached (${scope}): $${spentUsd.toFixed(4)} spent + $${neededUsd.toFixed(4)} for the next call would pass the limit of $${limitUsd.toFixed(2)}`,
    );
    this.name = "BudgetExceeded";
  }
}

export interface BudgetConfig {
  limitUsd: number;
  /** Spent before the ledger existed. */
  offsetUsd?: number;
  runLimitUsd?: number | undefined;
}

export class Budget {
  private runSpent = 0;

  constructor(
    readonly ledger: SpendLedger,
    readonly config: BudgetConfig,
  ) {}

  async spentUsd(): Promise<number> {
    return (await this.ledger.totalUsd()) + (this.config.offsetUsd ?? 0);
  }

  async remainingUsd(): Promise<number> {
    return Math.max(0, this.config.limitUsd - (await this.spentUsd()));
  }

  get runSpentUsd(): number {
    return this.runSpent;
  }

  /** Throws BudgetExceeded when `neededUsd` more would pass a limit. Call before every paid call. */
  async assertCanSpend(neededUsd: number): Promise<void> {
    const spent = await this.spentUsd();
    if (spent + neededUsd > this.config.limitUsd) throw new BudgetExceeded("total", this.config.limitUsd, spent, neededUsd);
    const runLimit = this.config.runLimitUsd;
    if (runLimit !== undefined && this.runSpent + neededUsd > runLimit) throw new BudgetExceeded("run", runLimit, this.runSpent, neededUsd);
  }

  async record(entry: SpendEntry): Promise<void> {
    await this.ledger.add(entry);
    this.runSpent += entry.costUsd;
  }
}

/** Ledger in memory, for tests and dry runs. */
export class MemoryLedger implements SpendLedger {
  readonly entries: SpendEntry[] = [];
  async totalUsd(): Promise<number> {
    return this.entries.reduce((n, e) => n + e.costUsd, 0);
  }
  async add(entry: SpendEntry): Promise<void> {
    this.entries.push(entry);
  }
}

/** Ledger in the `api_spend` table. */
export class PgLedger implements SpendLedger {
  constructor(private readonly db: pg.Client) {}

  async totalUsd(): Promise<number> {
    const res = await this.db.query<{ total: string }>("select coalesce(sum(cost_usd), 0) as total from api_spend");
    return Number(res.rows[0]!.total);
  }

  async add(e: SpendEntry): Promise<void> {
    await this.db.query(
      `insert into api_spend (model, pass, file_hash, input_tokens, output_tokens, cost_usd, batch, batch_job_id, note)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [e.model, e.pass, e.fileHash, e.inputTokens, e.outputTokens, e.costUsd, e.batch ?? false, e.batchJobId ?? null, e.note ?? null],
    );
  }
}

/** Budget settings from the environment (D6: 25 USD for the pilot, raised from 10 to 20 and then to 25 on 2026-10-19). */
export function budgetConfigFromEnv(env: NodeJS.ProcessEnv = process.env): BudgetConfig {
  const number = (name: string): number | undefined => {
    const raw = env[name]?.trim();
    if (!raw) return undefined;
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0) throw new Error(`${name} must be a non-negative number of USD, got "${raw}"`);
    return value;
  };
  return { limitUsd: number("GEMINI_BUDGET_LIMIT") ?? 25, offsetUsd: number("GEMINI_SPENT_OFFSET_USD") ?? 0, runLimitUsd: number("GEMINI_RUN_LIMIT") };
}
