#!/usr/bin/env python3
"""Maalt per-pagina metrics uit de dsh session-logs (main-run).
Per pagina: write-timestamp + wall-time sinds vorige pagina + output tokens van de
berichten tussen twee writes in. Bij meerdere writes: de LAATSTE telt (fix-passes)."""
import glob, json, os, re, subprocess, sys, datetime

SESS = os.path.expanduser("~/.dsh/sessions/--home-suffie-html-lab-qwen38-flashnext-100-htmls--")
OUT = os.path.expanduser("~/html-lab/qwen38-flashnext-100-htmls/metrics")

write_re = re.compile(r"out/(\d{3})-[a-z0-9-]+\.html")

pages = {}
main = {"in": 0, "out": 0, "t0": None, "t1": None}
fix = {"in": 0, "out": 0, "t0": None, "t1": None}

def acc(b, t, inp, outp):
    b["in"] += inp; b["out"] += outp
    if t:
        b["t0"] = min(b["t0"], t) if b["t0"] else t
        b["t1"] = max(b["t1"], t) if b["t1"] else t

for sf in sorted(glob.glob(os.path.join(SESS, "session-*/session.v3.jsonl.zstd")), key=os.path.getmtime):
    txt = subprocess.run(["zstdcat", sf], capture_output=True, text=True, errors="replace").stdout
    if '"type":"user/message"' not in txt and '"type": "user/message"' not in txt:
        continue
    events = []
    sess_in = sess_out = 0
    pending_out = 0
    n_files = 0
    for line in txt.splitlines():
        try: o = json.loads(line)
        except Exception: continue
        typ = o.get("type"); d = o.get("data") or {}
        t = o.get("time")
        if typ == "assistant/message":
            u = d.get("usage") or {}
            inp = u.get("inputTokens", 0); outp = u.get("outputTokens", 0)
            sess_in += inp; sess_out += outp
            pending_out += outp
            events.append((t, inp, outp))
        elif typ == "tool/call":
            args = d.get("arguments") or ""
            m = write_re.search(args)
            if m and d.get("name") in ("write", "write_file", "create_file", "edit", "edit_file", "str_replace"):
                pages[m.group(1)] = {"t": t, "out_tok": pending_out}
                pending_out = 0
                n_files += 1
                if events: sess_t0 = events[0][0]
                sess_t1 = t
    bucket = main if n_files > 20 else fix
    for t, i, oo in events: acc(bucket, t, i, oo)

# wall-time per pagina = delta tot volgende write
nums = sorted(pages)
per = []
for i, n in enumerate(nums):
    nxt = pages[nums[i+1]]["t"] if i + 1 < len(nums) else None
    secs = (nxt - pages[n]["t"]) / 1000 if nxt else None
    per.append({"num": n, "out_tok": pages[n]["out_tok"], "secs": round(secs, 1) if secs else None})

def dur(b):
    return (b["t1"] - b["t0"]) / 1000 if b["t0"] and b["t1"] else 0
dur_main = dur(main)
res = {
    "generated": datetime.datetime.now().isoformat(timespec="seconds"),
    "hardware": "NVIDIA RTX 5090 32GB · Ultra 9 285K · 63GB RAM",
    "model": "Qwen3.8-Flash-Next 125B · UD-IQ3_XXS Dynamic v3.1 · DFlash2 spec-decoding · 262K ctx (Strata engine)",
    "harness": "DeepSeek Harness dsh 0.1.5 — 1 sessie, het model schreef zijn eigen brieves, dezelfde regels voor elke pagina",
    "main_run": {"input_tokens": main["in"], "output_tokens": main["out"],
                 "wall_seconds": round(dur_main), "wall_human": f"{dur_main/3600:.2f} h",
                 "avg_output_tok_s": round(main["out"] / dur_main, 1) if dur_main else None},
    "repair_pass": {"input_tokens": fix["in"], "output_tokens": fix["out"],
                    "wall_seconds": round(dur(fix))},
    "totals": {"input_tokens": main["in"] + fix["in"], "output_tokens": main["out"] + fix["out"],
               "all_tokens": main["in"] + fix["in"] + main["out"] + fix["out"]},
    "pages": per,
}
os.makedirs(OUT, exist_ok=True)
json.dump(res, open(os.path.join(OUT, "run.json"), "w"), indent=1)
print("pagina's met metrics:", len(per))
print("hoofdrun:", res["main_run"])
print("repair-pass:", res["repair_pass"])
print("totaal:", res["totals"])
