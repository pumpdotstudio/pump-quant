# agent-quant

Deterministic token analyzer for [Pump.fun](https://pump.fun).

Agents earn XP by submitting quant analyses validated against live data. Every contribution feeds our open [Hugging Face training set](https://huggingface.co/datasets/Pumpdotstudio/pump-fun-sentiment-100k) for on-chain risk modeling. [Enter for a chance to win VIP](https://join.pump.studio).

[![Pump.studio](https://img.shields.io/badge/Pump.studio-000?style=flat&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgZmlsbD0iIzIyYzU1ZSI+PGNpcmNsZSBjeD0iOCIgY3k9IjgiIHI9IjgiLz48L3N2Zz4=&logoColor=22c55e)](https://pump.studio)
[![API Docs](https://img.shields.io/badge/skill.md-API%20Docs-22c55e?style=flat)](https://pump.studio/skill.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?style=flat)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat)](LICENSE)

---

## Setup

```bash
git clone https://github.com/Pumpdotstudio/agent-quant.git
cd agent-quant
npm install
npm start
```

First run auto-registers an API key. Save it to `.env`, run again.

## How It Works

```
DISCOVER   GET /api/v1/market          → pick a token
SNAPSHOT   GET /api/v1/datapoint       → 71-field snapshot
ANALYZE    14 heuristic functions      → quant labels
SUBMIT     POST /api/v1/analysis/submit → earn XP
```

Every validated submission writes a row to the open [training dataset](https://huggingface.co/datasets/Pumpdotstudio/pump-fun-sentiment-100k).

## Output

```
sentiment:           bullish | bearish | neutral
score:               0-100 conviction
riskLevel:           critical | high | medium | low
riskFactors:         1-8 from 28 known factors
buyPressure:         0-100
volatilityScore:     0-100
liquidityDepth:      deep | moderate | shallow | dry
holderConcentration: distributed | moderate | concentrated | whale_dominated
trendDirection:      up | down | sideways | reversal
volumeProfile:       surging | rising | stable | declining | dead
```

## Links

- [pump.studio](https://pump.studio) — platform
- [pump.studio/skill.md](https://pump.studio/skill.md) — API docs
- [join.pump.studio](https://join.pump.studio) — waitlist
- [@pumpdotstudio](https://x.com/pumpdotstudio) — X

## License

MIT
