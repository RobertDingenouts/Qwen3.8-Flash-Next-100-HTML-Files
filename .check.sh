#!/bin/bash
# internal build checker (not a deliverable)
fail=0
for f in out/[0-9][0-9][0-9]-*.html; do
  b=$(basename "$f")
  [ "$(head -1 "$f")" = "<!DOCTYPE html>" ] || { echo "$b: bad doctype"; fail=1; }
  sz=$(wc -c < "$f"); [ "$sz" -ge 3000 ] || { echo "$b: too small ($sz)"; fail=1; }
  grep -q "http" "$f" && { echo "$b: CONTAINS http"; fail=1; }
  s=$(grep -c "<style" "$f"); [ "$s" -eq 1 ] || { echo "$b: style count $s"; fail=1; }
  sc=$(grep -c "<script" "$f"); [ "$sc" -eq 1 ] || { echo "$b: script count $sc"; fail=1; }
  t="${f%.html}.txt"
  [ -f "$t" ] || { echo "$b: missing txt"; fail=1; continue; }
  for fld in TITLE PROMPT DESCRIPTION TECHNIQUES INTERACTION; do grep -q "^$fld:" "$t" || { echo "$t: missing $fld"; fail=1; }; done
  sed -n '/<script>/,/<\/script>/p' "$f" | sed '1d;$d' > .tmp-chk.js
  node --check .tmp-chk.js 2>.tmp-chk.err || { echo "$b: JS SYNTAX"; cat .tmp-chk.err; fail=1; }
done
rm -f .tmp-chk.js .tmp-chk.err
echo "checked $(ls out/[0-9][0-9][0-9]-*.html | wc -l) pages, fail=$fail"
