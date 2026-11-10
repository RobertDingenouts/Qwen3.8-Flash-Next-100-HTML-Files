# 100 HTML Files — Qwen3.8-Flash-Next (lokaal op één RTX 5090)

**NL** — Eén lokaal AI-model, één prompt, honderd zelfstandige webpagina's — met alle token- en snelheidscijfers openlijk inzichtelijk.

**EN** — One local model, one prompt, 100 self-contained HTML pages, with full per-page token/time telemetry.

## Het experiment

Het format is geïnspireerd op het [100-HTML-experiment van Mia's AI Lab](https://mia-ai.net/lab/experiments/100-htmls) (@MiaAI_lab), dat 24 modellen langs dezelfde drie regels legde: *look stunning, zero repetitive designs, go full creative mode*. Haar collectie bevatte nog geen Qwen3.8-Flash-Next — deze repo is de eerste flash-next-collectie van het experiment, en de eerste met volledige telemetry.

Het model kreeg **één startprompt** en besliste per pagina zelf onderwerp, stijl en techniek. Elke `.txt` bevat de creative brief die het model zich zelf gaf — niets door de mens geschreven, niets gecureerd.

## Cijfers

| | |
|---|---|
| Model | Qwen3.8-Flash-Next 125B · UD-IQ3_XXS Dynamic v3.1 + DFlash2 speculative decoding · 262K context (Strata engine) |
| Hardware | 1× NVIDIA RTX 5090 32GB · Intel Ultra 9 285K · 63GB RAM — **€0 API-kosten** |
| Harness | DeepSeek Harness (dsh) 0.1.5, één sessie, permission-mode workspace-write |
| Hoofdrun | 100 pagina's in **1,18 uur** · 413.234 output / 235.106 input tokens · gem. **97,5 tok/s** output (incl. agent-overhead; piek-decode ~260 tok/s) |
| Repair-pass | 6 pagina's met runtime-fouten, door hetzelfde model gerepareerd in 14 min (53,5K tok) → 100/100 foutvrij in headless Chromium |
| Totaal | 755.699 tokens |

Ter vergelijking: dezelfde challenge via een frontier-API kostte de originele experimentator [$512 aan API-kosten voor 76 pagina's](https://x.com/MiaAI_lab/status/2120044501477609834). Dit staat lokaal voor de prijs van de stroom.

Per-pagina-cijfers (tokens, seconden, tok/s): [`metrics/run.json`](metrics/run.json).

## QA

Alle pagina's doorliepen: HTML-parse, `http`-referentie-grep, grootte-check, `node --check` en een headless-Chromium smoke test (console-errors + canvas-pixel-probe). Het model bouwde tijdens de run zelf zijn eigen QA-script (`.check.sh`). Resultaat: 94/100 foutvrij bij eerste run; de 6 runtime-fouten repareerde het model in een tweede pass met dezelfde tools.

Eén eerlijke kanttekening: `010-vesica.html` bevat één `http://www.w3.org/2000/svg`-namespace-URI (technisch geen netwerkreferentie — het bestand is volledig offline).

## Opbouw

```
out/NNN-slug.html   de pagina — alle CSS in één <style>, JS in één IIFE, geen externe referenties
out/NNN-slug.txt    TITLE / PROMPT / DESCRIPTION / TECHNIQUES / INTERACTION (zelf bedacht door het model)
index.html          doorzoekbare gallery (screenshots: thumbs/)
metrics/run.json    per-pagina tokens en tijden + totals, berekend uit de harness-log
scripts/            runner-overlay, QA, screenshot-capture en gallery-builder (MIT)
```

## Bedoeling

Een zuivere showcase van wat lokaal met AI mogelijk is: één consumentengpu, een open model, een agent-harness en een kleine pijplijn van run tot publicatie — geen API, geen abonnement, en alle cijfers gewoon openlijk inzichtelijk.

*Ontworpen, aangestuurd en opgeleverd door Robert Dingenouts (Robas Lab). De pagina's zijn gegenereerd door het model onder één vaste startprompt; de QA-, meet- en publicatie-infrastructuur is van Robas Lab.*

---

**EN** — 100 self-contained pages authored end-to-end by one locally-hosted model (Qwen3.8-Flash-Next, RTX 5090, no API) under a single three-rule prompt, first flash-next entry in the challenge popularised by Mia's AI Lab. Full telemetry in `metrics/run.json`. The pages are the model's own; the harness setup, QA gate, gallery and publishing pipeline are mine.
