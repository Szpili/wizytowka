#!/usr/bin/env bash
# Przelacza Joi z linii "automat" na "live" po powrocie GPU i MIERZY, czy to ma sens.
# Endpoint: ollama-3090-kpp (:11436) — Bielik 11B Q5_K_M pinowany po UUID na 3090, bez kolizji ze Strata.
# ponytail: jawne uruchomienie, nie magia na bootcie — flip configu ma byc decyzja, nie niespodzianka.
set -u
ENV=/home/trebusz/wizytowka/server/joi.env
URL=http://127.0.0.1:11436
MODEL=$(grep -oP '^MODEL=\K.*' "$ENV")

nvidia-smi -L >/dev/null 2>&1 || { echo "STOP: GPU nadal nieczynne ($(nvidia-smi 2>&1|head -1)). Joi zostaje na automacie."; exit 1; }
curl -sf --max-time 5 "$URL/api/tags" >/dev/null || { echo "STOP: $URL nie odpowiada (systemctl --user start ollama-3090-kpp)"; exit 1; }

echo "== 1 sztuka: $MODEL na $URL =="
m=$(curl -s --max-time 180 "$URL/api/chat" -d "{\"model\":\"$MODEL\",\"keep_alive\":\"2h\",\"messages\":[{\"role\":\"user\",\"content\":\"Powiedz jednym zdaniem, czym jest wizytowka.\"}],\"stream\":false,\"options\":{\"num_predict\":40}}")
python3 - "$m" <<'PY'
import sys,json
d=json.loads(sys.argv[1]); t=d.get('eval_count',0)/max(d.get('eval_duration',1)/1e9,1e-9)
print("odpowiedz:", d.get('message',{}).get('content','')[:160])
print("tok/s: %.1f  TTFT: %.2fs  zimny start: %.1fs" % (t, d.get('prompt_eval_duration',0)/1e9, d.get('load_duration',0)/1e9))
sys.exit(0 if t >= 20 else 2)
PY
case $? in
 0) echo "OK (>=20 tok/s) — przelaczam na live";;
 2) echo "STOP: za wolno (<20 tok/s) = CPU offload. Sprawdz: curl -s $URL/api/ps  (ma byc 100% GPU, patrz pulapka w weedbot-live-calls); Joi zostaje na automacie"; exit 1;;
 *) echo "STOP: model nie odpowiedzial sensownie"; exit 1;;
esac

sed -i "s|^LLM_URL=.*|LLM_URL=$URL|" "$ENV"
systemctl --user restart joi; sleep 4
echo "== health =="; curl -s --max-time 10 localhost:8790/health; echo
echo "== pelna tura przez funnel (STT robi przegladarka, wiec to LLM+siec) =="
s=$(date +%s.%N)
curl -sN --max-time 120 -X POST https://pop-os.tailaf1556.ts.net/chat -H 'Content-Type: application/json' \
  -H 'Origin: https://szpili.github.io' -d '{"lang":"pl","session":"joi-live-check","messages":[{"role":"user","text":"Czym zajmuje sie Karol?"}]}' \
  | python3 -c "import sys,json;print(''.join(json.loads(l).get('delta','') for l in sys.stdin if l.strip())[:300])"
echo "czas tury: $(echo "$(date +%s.%N) - $s" | bc) s"
echo "== glos =="
curl -s --max-time 30 -X POST https://pop-os.tailaf1556.ts.net/speak -H 'Content-Type: application/json' \
  -H 'Origin: https://szpili.github.io' -d '{"text":"Jestem Joi. Slucham."}' -o /tmp/joi-live.wav -w 'speak %{http_code} %{size_download}B\n'
rm -f /home/trebusz/brain/inbox/joi/joi-live-check.md
