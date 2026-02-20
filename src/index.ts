/* ================================================================== */
/*  Pump Studio Agent — Main entry point                               */
/*                                                                     */
/*  A standalone MVP agent that:                                       */
/*    1. Registers an API key (if none set)                            */
/*    2. Sets agent profile                                            */
/*    3. Discovers new tokens                                          */
/*    4. Fetches a DataPoint snapshot                                  */
/*    5. Analyzes with deterministic heuristics                        */
/*    6. Submits structured analysis to earn XP                        */
/*    7. Exits cleanly                                                 */
/*                                                                     */
/*  Zero dependencies beyond typescript, tsx, and dotenv.              */
/* ================================================================== */

import "dotenv/config";
import { PumpStudioClient } from "./client.js";
import { analyze } from "./analyzer.js";
import * as log from "./logger.js";

/* ---- Config ---- */

const API_BASE = process.env.PUMP_API_BASE || "https://api.pump.studio";
const API_KEY = process.env.PUMP_STUDIO_API_KEY || "";
const AGENT_NAME = process.env.AGENT_NAME || "pumpstudio-agent";
const AGENT_DESC = process.env.AGENT_DESCRIPTION || "Deterministic quant analysis agent for Pump.fun tokens";

/* ================================================================== */
/*  Main                                                               */
/* ================================================================== */

async function main(): Promise<void> {
  log.banner();
  log.divider();

  /* ---- Step 0: Validate API key ---- */

  if (!API_KEY || API_KEY === "ps_your_key_here") {
    log.warn("AUTH", "No API key found in .env");
    log.info("Attempting to auto-register a new key...");
    log.blank();

    const client = new PumpStudioClient(API_BASE, null);

    try {
      const result = await client.register(AGENT_NAME, AGENT_DESC);

      if (result.ok && result.data?.key) {
        log.success("REGISTER", `API key created: ${result.data.key}`);
        log.blank();
        log.important("Save this key to your .env file:");
        log.info(`  PUMP_STUDIO_API_KEY=${result.data.key}`);
        log.blank();
        log.info("Then run again:  npm start");
        log.divider();
        process.exit(0);
      } else {
        log.fail("REGISTER", result.error ?? "Unknown error");
        process.exit(1);
      }
    } catch (err) {
      log.fail("REGISTER", (err as Error).message);
      log.blank();
      log.info("Get your key manually at: https://pump.studio/agents");
      process.exit(1);
    }
  }

  const client = new PumpStudioClient(API_BASE, API_KEY);
  log.success("AUTH", `API key loaded: ${API_KEY.slice(0, 12)}...`);

  /* ---- Step 1: Set agent profile ---- */

  log.step("PROFILE", "Setting agent profile...");

  try {
    const existing = await client.getProfile();
    if (existing.ok && existing.profile) {
      log.success("PROFILE", `Existing profile: ${existing.profile.name}`);
    } else {
      await client.setProfile({ name: AGENT_NAME, description: AGENT_DESC });
      log.success("PROFILE", `Profile set: ${AGENT_NAME}`);
    }
  } catch (err) {
    log.warn("PROFILE", `Could not set profile: ${(err as Error).message}`);
    log.info("Continuing without profile — submissions still work.");
  }

  /* ---- Step 2: Discover tokens ---- */

  log.step("DISCOVER", "Fetching indexed tokens...");

  let tokens;
  try {
    tokens = await client.getMarket("all", 5);
  } catch (err) {
    log.fail("DISCOVER", (err as Error).message);
    process.exit(1);
  }

  if (!tokens || tokens.length === 0) {
    log.fail("DISCOVER", "No tokens returned from market API");
    process.exit(1);
  }

  log.success("DISCOVER", `Found ${tokens.length} tokens`);
  for (const t of tokens) {
    log.info(`  ${t.symbol?.padEnd(10) ?? "?"} ${t.name?.slice(0, 24) ?? "?"} ${t.mint.slice(0, 12)}...`);
  }

  /* Pick the first token with a valid mint */
  const target = tokens.find((t) => t.mint && t.mint.length >= 32);
  if (!target) {
    log.fail("DISCOVER", "No valid token found");
    process.exit(1);
  }

  log.blank();
  log.step("TARGET", `Selected: $${target.symbol ?? "?"} (${target.mint.slice(0, 16)}...)`);

  /* ---- Step 3: Fetch DataPoint ---- */

  log.step("SNAPSHOT", "Fetching DataPoint...");

  let datapoint;
  try {
    datapoint = await client.getDataPoint(target.mint);
  } catch (err) {
    log.fail("SNAPSHOT", (err as Error).message);
    process.exit(1);
  }

  log.success("SNAPSHOT", `Loaded ${datapoint.name} ($${datapoint.symbol})`);
  log.keyValue("Price", datapoint.priceUsd != null ? `$${datapoint.priceUsd}` : "-");
  log.keyValue("MCap", datapoint.marketCap != null ? `$${formatCompact(datapoint.marketCap)}` : "-");
  log.keyValue("Liquidity", datapoint.liquidity != null ? `$${formatCompact(datapoint.liquidity)}` : "-");
  log.keyValue("Holders", datapoint.holderCount ?? "-");
  log.keyValue("24h Volume", datapoint.volume24h != null ? `$${formatCompact(datapoint.volume24h)}` : "-");
  log.keyValue("Buys/Sells", `${datapoint.buys24h ?? 0} / ${datapoint.sells24h ?? 0}`);
  log.keyValue("Bonding", datapoint.bondingComplete ? "graduated" : `${datapoint.bondingProgress?.toFixed(1) ?? "?"}%`);
  log.keyValue("Live", datapoint.isLive ? `yes (${datapoint.viewerCount} viewers)` : "no");

  /* ---- Step 4: Analyze ---- */

  log.blank();
  log.step("ANALYZE", "Running deterministic heuristics...");

  const analysis = analyze(datapoint);

  log.success("ANALYZE", `${analysis.sentiment.toUpperCase()} — score ${analysis.score}/100`);
  log.keyValue("Risk Level", analysis.quant.riskLevel);
  log.keyValue("Buy Pressure", `${analysis.quant.buyPressure}%`);
  log.keyValue("Volatility", `${analysis.quant.volatilityScore}/100`);
  log.keyValue("Liquidity", analysis.quant.liquidityDepth);
  log.keyValue("Holders", analysis.quant.holderConcentration);
  log.keyValue("Trend", analysis.quant.trendDirection);
  log.keyValue("Volume", analysis.quant.volumeProfile);
  log.keyValue("Risk Factors", analysis.quant.riskFactors.join(", "));

  /* ---- Step 5: Submit ---- */

  log.blank();
  log.step("SUBMIT", "Submitting analysis...");

  try {
    const result = await client.submitAnalysis({
      mint: target.mint,
      sentiment: analysis.sentiment,
      score: analysis.score,
      summary: analysis.summary,
      snapshot: analysis.snapshot,
      quant: analysis.quant,
    });

    if (result.ok) {
      log.divider();
      log.success("SUBMIT", "Analysis accepted!");
      log.blank();
      log.result("XP Earned", `+${result.xpEarned}`);
      log.result("XP Total", String(result.xpTotal));
      log.result("Validated", result.validated ? "yes (within 15%)" : "no");
      log.result("Deviation", `${result.deviationPct}%`);
      log.result("Analysis ID", result.analysisId ?? "-");
      if (result.warning) {
        log.blank();
        log.warn("WARNING", result.warning);
      }
    } else {
      log.fail("SUBMIT", result.error ?? "Unknown error");
      if (result.error?.includes("cooldown")) {
        log.info("Try again in 60 seconds or analyze a different token.");
      }
    }
  } catch (err) {
    log.fail("SUBMIT", (err as Error).message);
  }

  /* ---- Done ---- */

  log.blank();
  log.divider();
  log.info("Leaderboard:  https://pump.studio/agents?tab=leaderboard");
  log.info("Dataset:      https://huggingface.co/datasets/Pumpdotstudio/pump-fun-sentiment-100k");
  log.divider();
  log.blank();
}

/* ---- Helpers ---- */

function formatCompact(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(0);
}

/* ---- Run ---- */

main().catch((err) => {
  log.fail("FATAL", (err as Error).message);
  process.exit(1);
});
