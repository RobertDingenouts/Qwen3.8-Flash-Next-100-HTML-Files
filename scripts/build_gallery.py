#!/usr/bin/env python3
"""Bouwt index.html: zoekbare gallery met thumbnails, eigen prompts en per-pagina metrics."""
import json, os, re, html as H

ROOT = os.path.expanduser("~/html-lab/qwen38-flashnext-100-htmls")
OUT = os.path.join(ROOT, "out"); TH = os.path.join(ROOT, "thumbs")

metrics = {}
mrun = json.load(open(os.path.join(ROOT, "metrics", "run.json")))
for p in mrun["pages"]:
    metrics[p["num"]] = p

FIELDS = ["TITLE", "PROMPT", "DESCRIPTION", "TECHNIQUES", "INTERACTION"]
items = []
for f in sorted(os.listdir(OUT)):
    if not f.endswith(".html"): continue
    num = f.split("-", 1)[0]
    txt = open(os.path.join(OUT, f[:-5] + ".txt"), encoding="utf-8", errors="replace").read()
    d = {}
    for fld in FIELDS:
        m = re.search(rf"^{fld}:\s*(.*)$", txt, re.M)
        d[fld] = m.group(1).strip() if m else ""
    px = os.path.join(TH, f[:-5] + ".jpg")
    mm = metrics.get(num, {})
    items.append({"n": num, "file": H.escape(f), "slug": H.escape(f[:-5]),
                  "img": os.path.exists(px),
                  "title": H.escape(d["TITLE"] or f), "prompt": H.escape(d["PROMPT"]),
                  "desc": H.escape(d["DESCRIPTION"]), "tech": H.escape(d["TECHNIQUES"]),
                  "inter": H.escape(d["INTERACTION"]),
                  "tok": mm.get("out_tok"), "sec": mm.get("secs")})

t = mrun["main_run"]
tpl = open(os.path.join(ROOT, "scripts", "gallery-template.html"), encoding="utf-8").read()
head = (tpl
        .replace("__OUTTOK__", f"{t['output_tokens']:,}")
        .replace("__WALL__", t["wall_human"])
        .replace("__TPS__", str(t["avg_output_tok_s"]))
        .replace("__HW__", H.escape(mrun["hardware"]))
        .replace("__DATA__", json.dumps(items, ensure_ascii=False)))
open(os.path.join(ROOT, "index.html"), "w", encoding="utf-8").write(head)
print("gallery gebouwd:", len(items), "kaarten | thumbs:", sum(1 for i in items if i["img"]))
