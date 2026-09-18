#!/usr/bin/env bash
# Сквозная проверка этапа 1: роли, согласия, привязки, доступы, токены.
# Требует запущенный API с NODE_ENV=test (отключает rate limit) и выполненный db:seed.
set -euo pipefail

API=${API:-http://localhost:3001/api/v1}
ADMIN_EMAIL=${SEED_ADMIN_EMAIL:-admin@soyleup.local}
ADMIN_PASSWORD=${SEED_ADMIN_PASSWORD:-ChangeMe-Admin-2026}
RUN=$(date +%s%N)
BODY=$(mktemp)

json() { # json <path> — достаёт поле из JSON в stdin
  node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const v=process.argv[1].split(".").reduce((a,k)=>a?.[k],JSON.parse(s));console.log(typeof v==="object"?JSON.stringify(v):v)})' "$1"
}

req() { # req METHOD PATH EXPECTED_STATUS [TOKEN] [BODY]
  local method=$1 path=$2 expected=$3 token=${4:-} data=${5:-}
  local args=(-s -o "$BODY" -w '%{http_code}' -X "$method" "$API$path" -H 'Content-Type: application/json')
  [[ -n $token ]] && args+=(-H "Authorization: Bearer $token")
  [[ -n $data ]] && args+=(-d "$data")
  local status; status=$(curl "${args[@]}")
  if [[ $status != "$expected" ]]; then
    echo "FAIL $method $path: expected $expected, got $status" >&2; cat "$BODY" >&2; echo >&2; exit 1
  fi
  echo "  ok  $method $path → $status" >&2
  cat "$BODY"
}

register() { # register ROLE EMAIL [BIRTHDATE]
  local birth=${3:+,\"birthDate\":\"$3\"}
  req POST /auth/register 201 "" "{\"email\":\"$2\",\"password\":\"password123\",\"firstName\":\"Test\",\"role\":\"$1\",\"acceptTerms\":true$birth}"
}

echo "▸ health & auth"
req GET /health 200 >/dev/null
ADMIN=$(req POST /auth/login 200 "" "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" | json accessToken)
req GET /users/me 401 >/dev/null
req POST /auth/register 400 "" '{"email":"x@y.z","password":"password123","firstName":"A","role":"STUDENT","birthDate":"2000-01-01"}' >/dev/null # без acceptTerms
req POST /auth/register 400 "" "{\"email\":\"admin$RUN@t.kz\",\"password\":\"password123\",\"firstName\":\"A\",\"role\":\"ADMIN\",\"acceptTerms\":true}" >/dev/null

echo "▸ adult student"
R=$(register STUDENT "adult$RUN@t.kz" 2000-01-15)
ADULT=$(echo "$R" | json accessToken); ADULT_ID=$(echo "$R" | json user.id); ADULT_REFRESH=$(echo "$R" | json refreshToken)
[[ $(echo "$R" | json user.status) == ACTIVE ]]
req POST /auth/register 409 "" "{\"email\":\"ADULT$RUN@t.kz\",\"password\":\"password123\",\"firstName\":\"A\",\"role\":\"PARENT\",\"acceptTerms\":true}" >/dev/null
req PATCH /users/me 200 "$ADULT" '{"targetLevel":"B2","dailyMinutes":30}' >/dev/null
req POST /users/me/consents 201 "$ADULT" '{"type":"VOICE_RECORDING"}' >/dev/null
req DELETE /users/me/consents/DATA_PROCESSING 400 "$ADULT" >/dev/null

echo "▸ minor student waits for parent consent"
R=$(register STUDENT "minor$RUN@t.kz" 2014-05-01)
MINOR=$(echo "$R" | json accessToken); MINOR_ID=$(echo "$R" | json user.id)
[[ $(echo "$R" | json requiresParentConsent) == true ]]
req GET /users/me 200 "$MINOR" >/dev/null
req PATCH /users/me 403 "$MINOR" '{"goal":"school"}' >/dev/null
req POST /users/me/consents 403 "$MINOR" '{"type":"DATA_PROCESSING"}' >/dev/null
CODE=$(req POST /students/me/link-code 201 "$MINOR" | json code)

echo "▸ parent links child and grants consent"
PARENT=$(register PARENT "parent$RUN@t.kz" | json accessToken)
req POST /students/me/link-code 403 "$PARENT" >/dev/null
req POST /parents/children/link 400 "$PARENT" '{"code":"AAAAAAAA"}' >/dev/null
L=$(req POST /parents/children/link 201 "$PARENT" "{\"code\":\"$CODE\"}")
[[ $(echo "$L" | json requiresConsent) == true ]]
req POST /parents/children/link 400 "$PARENT" "{\"code\":\"$CODE\"}" >/dev/null # код одноразовый
req POST /parents/children/$MINOR_ID/consents 201 "$PARENT" '{"type":"DATA_PROCESSING"}' >/dev/null
req PATCH /users/me 200 "$MINOR" '{"goal":"school"}' >/dev/null
req POST /parents/children/$ADULT_ID/consents 404 "$PARENT" '{"type":"CAMERA"}' >/dev/null
[[ $(req GET /parents/children 200 "$PARENT" | json 0.id) == "$MINOR_ID" ]]

echo "▸ data isolation"
req GET /students/$MINOR_ID 200 "$PARENT" >/dev/null
req GET /students/$ADULT_ID 404 "$PARENT" >/dev/null
req GET /students/$ADULT_ID 404 "$MINOR" >/dev/null
req GET /students/$MINOR_ID 200 "$MINOR" >/dev/null
req GET /students/$MINOR_ID/skill-history 200 "$MINOR" >/dev/null   # своя история навыков доступна
req GET /students/$ADULT_ID/skill-history 404 "$MINOR" >/dev/null   # чужая — нет
req GET /admin/users 403 "$ADULT" >/dev/null

echo "▸ curator assignment"
CURATOR_ID=$(req POST /admin/users 201 "$ADMIN" "{\"email\":\"cur$RUN@t.kz\",\"password\":\"curator-pass-123\",\"firstName\":\"Aigerim\",\"role\":\"CURATOR\"}" | json id)
CURATOR=$(req POST /auth/login 200 "" "{\"email\":\"cur$RUN@t.kz\",\"password\":\"curator-pass-123\"}" | json accessToken)
req GET /students/$MINOR_ID 404 "$CURATOR" >/dev/null
req POST /admin/curator-assignments 201 "$ADMIN" "{\"curatorId\":\"$CURATOR_ID\",\"studentId\":\"$MINOR_ID\"}" >/dev/null
req POST /admin/curator-assignments 201 "$ADMIN" "{\"curatorId\":\"$CURATOR_ID\",\"studentId\":\"$MINOR_ID\"}" >/dev/null # переназначение
req POST /admin/curator-assignments 400 "$ADMIN" "{\"curatorId\":\"$ADULT_ID\",\"studentId\":\"$MINOR_ID\"}" >/dev/null
[[ $(req GET /students/$MINOR_ID 200 "$CURATOR" | json curator.id) == "$CURATOR_ID" ]]
[[ $(req GET /curator/students 200 "$CURATOR" | json length) == 1 ]]
req GET /students/$ADULT_ID 404 "$CURATOR" >/dev/null

echo "▸ refresh rotation & reuse detection"
NEW_REFRESH=$(req POST /auth/refresh 200 "" "{\"refreshToken\":\"$ADULT_REFRESH\"}" | json refreshToken)
req POST /auth/refresh 401 "" "{\"refreshToken\":\"$ADULT_REFRESH\"}" >/dev/null   # повтор старого
req POST /auth/refresh 401 "" "{\"refreshToken\":\"$NEW_REFRESH\"}" >/dev/null     # вся сессия отозвана
req POST /auth/refresh 401 "" '{"refreshToken":"garbage"}' >/dev/null

echo "▸ blocking"
req PATCH /admin/users/$ADULT_ID/status 200 "$ADMIN" '{"status":"BLOCKED"}' >/dev/null
req GET /users/me 401 "$ADULT" >/dev/null
req POST /auth/login 403 "" "{\"email\":\"adult$RUN@t.kz\",\"password\":\"password123\"}" >/dev/null
req PATCH /admin/users/$ADULT_ID/status 200 "$ADMIN" '{"status":"ACTIVE"}' >/dev/null
req POST /auth/login 200 "" "{\"email\":\"adult$RUN@t.kz\",\"password\":\"password123\"}" >/dev/null

echo "▸ consent revocation"
req DELETE /parents/children/$MINOR_ID/consents/DATA_PROCESSING 200 "$PARENT" >/dev/null
req PATCH /users/me 403 "$MINOR" '{"goal":"x"}' >/dev/null
R=$(req PATCH /admin/users/$MINOR_ID/status 200 "$ADMIN" '{"status":"ACTIVE"}')
[[ $(echo "$R" | json status) == PENDING_CONSENT ]]

[[ $(req GET "/admin/users?search=minor$RUN" 200 "$ADMIN" | json total) == 1 ]]

echo "▸ content: courses, lessons, blocks, exercises"
req GET /admin/content/courses 403 "$CURATOR" >/dev/null
CID=$(req POST /admin/content/courses 201 "$ADMIN" '{"title":"Smoke Course","level":"B1","audience":"ADULTS"}' | json id)
req PATCH /admin/content/courses/$CID 200 "$ADMIN" '{"title":"Smoke Course v2"}' >/dev/null
MID=$(req POST /admin/content/courses/$CID/modules 201 "$ADMIN" '{"title":"Module 1"}' | json id)
LID=$(req POST /admin/content/modules/$MID/lessons 201 "$ADMIN" '{"title":"Lesson 1"}' | json id)
[[ $(req GET /admin/content/courses/$CID 200 "$ADMIN" | json modules.0.lessons.0.title) == "Lesson 1" ]]
BID=$(req POST /admin/content/lessons/$LID/blocks 201 "$ADMIN" '{"type":"EXERCISE"}' | json id)
EID=$(req POST /admin/content/blocks/$BID/exercises 201 "$ADMIN" '{"type":"MULTIPLE_CHOICE","content":{"question":"2+2?","options":["3","4"],"correctIndex":1}}' | json id)
[[ $(req GET /admin/content/lessons/$LID 200 "$ADMIN" | json blocks.0.exercises.0.content.correctIndex) == 1 ]]
req GET /admin/content/lessons/$LID/preview 200 "$ADMIN" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{if("correctIndex" in JSON.parse(s).blocks[0].exercises[0].content) process.exit(1)})'
req DELETE /admin/content/exercises/$EID 200 "$ADMIN" >/dev/null
req DELETE /admin/content/courses/$CID 200 "$ADMIN" >/dev/null
req GET /admin/content/courses/$CID 404 "$ADMIN" >/dev/null

echo "▸ content: vocabulary"
WID=$(req POST /admin/content/vocabulary 201 "$ADMIN" '{"word":"smokeword","translationRu":"тест","level":"B1"}' | json id)
[[ $(req GET "/admin/content/vocabulary?search=smokeword" 200 "$ADMIN" | json total) == 1 ]]
req PATCH /admin/content/vocabulary/$WID 200 "$ADMIN" '{"definition":"updated"}' >/dev/null
IMPORT=$(req POST /admin/content/vocabulary/import 201 "$ADMIN" '{"csv":"word,translationRu,level\nsmokeword2,тест2,B1\nbadrow,,ZZ"}')
[[ $(echo "$IMPORT" | json imported) == 1 ]]
[[ $(echo "$IMPORT" | json skipped | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).length))') == 1 ]]
req DELETE /admin/content/vocabulary/$WID 200 "$ADMIN" >/dev/null

echo "▸ content: question bank"
QID=$(req POST /admin/content/questions 201 "$ADMIN" '{"skill":"GRAMMAR","level":"B1","type":"MULTIPLE_CHOICE","content":{"question":"q","options":["a","b"],"correctIndex":0}}' | json id)
[[ $(req GET "/admin/content/questions?skill=GRAMMAR&level=B1" 200 "$ADMIN" | json total) -ge 1 ]]
req DELETE /admin/content/questions/$QID 200 "$ADMIN" >/dev/null

echo "▸ placement test: adaptive ladder & English Profile"
for SK in GRAMMAR VOCABULARY READING LISTENING; do
  for i in 1 2 3 4 5 6; do
    req POST /admin/content/questions 201 "$ADMIN" "{\"skill\":\"$SK\",\"level\":\"B1\",\"type\":\"MULTIPLE_CHOICE\",\"content\":{\"question\":\"$SK-$i-$RUN\",\"options\":[\"correct\",\"wrong\"],\"correctIndex\":0}}" >/dev/null
  done
done
req POST /admin/content/questions 201 "$ADMIN" "{\"skill\":\"SPEAKING\",\"level\":\"B1\",\"type\":\"SPEAKING\",\"content\":{\"prompt\":\"Speak $RUN\"}}" >/dev/null
req POST /admin/content/questions 201 "$ADMIN" "{\"skill\":\"SPEAKING\",\"level\":\"B1\",\"type\":\"SPEAKING\",\"content\":{\"prompt\":\"Speak $RUN 2\"}}" >/dev/null

AID=$(req POST /placement/attempts 201 "" | json id)   # анонимно, без токена
[[ $(req GET /placement/attempts/$AID 200 "" | json includeSpeaking) == false ]]   # анонимный тест — без Speaking
for SK in GRAMMAR VOCABULARY READING LISTENING; do
  for i in 1 2 3 4 5 6; do
    QID=$(req GET /placement/attempts/$AID/next-question 200 "" | json question.id)
    req POST /placement/attempts/$AID/answers 201 "" "{\"questionId\":\"$QID\",\"answer\":0}" >/dev/null   # всегда верный ответ
  done
done
R=$(req GET /placement/attempts/$AID 200 "")
[[ $(echo "$R" | json status) == COMPLETED ]]
[[ $(echo "$R" | json results.overall) -ge 85 ]]   # все ответы верные → лестница дошла до верхнего уровня
req POST /placement/attempts/$AID/answers 400 "" '{"questionId":"00000000-0000-0000-0000-000000000000","answer":0}' >/dev/null   # попытка уже завершена

echo "▸ placement: сохранение результата после регистрации (claim)"
R=$(register STUDENT "place$RUN@t.kz" 2000-01-01)
PTOKEN=$(echo "$R" | json accessToken); PID=$(echo "$R" | json user.id)
req GET /placement/attempts/$AID 200 "$PTOKEN" >/dev/null   # анонимная попытка доступна по id
req POST /placement/attempts/$AID/claim 201 "$PTOKEN" >/dev/null
[[ $(req GET /users/me 200 "$PTOKEN" | json englishProfile.overall) -ge 85 ]]

echo "▸ placement: Speaking доступен только с согласием и аккаунтом"
[[ $(req POST /placement/attempts 201 "$PTOKEN" | json includeSpeaking) == false ]]   # согласия ещё нет
req POST /users/me/consents 201 "$PTOKEN" '{"type":"VOICE_RECORDING"}' >/dev/null
AID2=$(req POST /placement/attempts 201 "$PTOKEN" | json id)
[[ $(req GET /placement/attempts/$AID2 200 "$PTOKEN" | json includeSpeaking) == true ]]
req POST /placement/attempts/$AID2/speaking/presign 403 "" '{"fileName":"a.webm","contentType":"audio/webm"}' >/dev/null   # без токена нельзя

echo "▸ placement: чужая привязанная попытка не видна"
OTOKEN=$(register STUDENT "otherplace$RUN@t.kz" 2000-01-01 | json accessToken)
req GET /placement/attempts/$AID2 404 "$OTOKEN" >/dev/null
req GET /placement/attempts/$AID2 404 "" >/dev/null

echo "▸ learning: план дня, урок, повторение слов"
req PATCH /users/me 200 "$PTOKEN" '{"targetLevel":"B2"}' >/dev/null

CID=$(req POST /admin/content/courses 201 "$ADMIN" '{"title":"Learning smoke course","level":"B1","audience":"ADULTS"}' | json id)
MID=$(req POST /admin/content/courses/$CID/modules 201 "$ADMIN" '{"title":"M1"}' | json id)
LID=$(req POST /admin/content/modules/$MID/lessons 201 "$ADMIN" '{"title":"L1"}' | json id)
req POST /admin/content/vocabulary 201 "$ADMIN" "{\"word\":\"smokeword-$RUN\",\"translationRu\":\"тест\",\"level\":\"B1\"}" >/dev/null
VBID=$(req POST /admin/content/lessons/$LID/blocks 201 "$ADMIN" "{\"type\":\"VOCABULARY\",\"order\":0,\"content\":{\"words\":[\"smokeword-$RUN\"]}}" | json id)
MTBID=$(req POST /admin/content/lessons/$LID/blocks 201 "$ADMIN" '{"type":"MINI_TEST","order":1}' | json id)
EID=$(req POST /admin/content/blocks/$MTBID/exercises 201 "$ADMIN" '{"type":"MULTIPLE_CHOICE","skill":"GRAMMAR","content":{"question":"2+2?","options":["3","4"],"correctIndex":1}}' | json id)

req GET /learning/today-plan 403 "$ADMIN" >/dev/null   # не ученик
PLAN=$(req GET /learning/today-plan 200 "$PTOKEN")
[[ $(echo "$PLAN" | json lesson.id) == "$LID" ]]   # единственный курс своей аудитории — назначился автоматически
[[ $(echo "$PLAN" | json prioritySkills | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).length))') == 3 ]]

L=$(req GET /learning/lessons/$LID 200 "$PTOKEN")
[[ $(echo "$L" | json progress.status) == IN_PROGRESS ]]
[[ $(echo "$L" | json progress.currentBlockOrder) == 0 ]]

req POST /learning/lessons/$LID/blocks/$VBID/complete 201 "$PTOKEN" >/dev/null
DUE=$(req GET /learning/vocabulary/due 200 "$PTOKEN")
[[ $(echo "$DUE" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).some(w=>w.word==="smokeword-'"$RUN"'")))') == true ]]
WVID=$(echo "$DUE" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).find(w=>w.word==="smokeword-'"$RUN"'").id))')
req POST /learning/vocabulary/$WVID/review 201 "$PTOKEN" '{"quality":4}' >/dev/null

GRAMMAR_BEFORE=$(req GET /users/me 200 "$PTOKEN" | json studentProfile.grammarScore)
ANS=$(req POST /learning/lessons/$LID/exercises/$EID/answers 201 "$PTOKEN" '{"answer":1}')
[[ $(echo "$ANS" | json isCorrect) == true ]]
GRAMMAR_AFTER=$(req GET /users/me 200 "$PTOKEN" | json studentProfile.grammarScore)
[[ $GRAMMAR_AFTER != "$GRAMMAR_BEFORE" ]]   # мини-тест (вес 0.1) сдвинул балл

req POST /learning/lessons/$LID/blocks/$MTBID/complete 201 "$PTOKEN" >/dev/null
[[ $(req GET /learning/lessons/$LID 200 "$PTOKEN" | json progress.status) == COMPLETED ]]
[[ $(req GET /learning/today-plan 200 "$PTOKEN" | json lesson) == null ]]   # курс пройден полностью

echo "▸ learning: чужой прогресс недоступен"
req POST /learning/vocabulary/$WVID/review 404 "$OTOKEN" '{"quality":4}' >/dev/null

echo "▸ куратор: домашние задания и проверка speaking"
HWCID=$(req POST /admin/users 201 "$ADMIN" "{\"email\":\"hwcur$RUN@t.kz\",\"password\":\"curator-pass-123\",\"firstName\":\"Homework\",\"role\":\"CURATOR\"}" | json id)
HWCUR=$(req POST /auth/login 200 "" "{\"email\":\"hwcur$RUN@t.kz\",\"password\":\"curator-pass-123\"}" | json accessToken)
OTHERCUR=$(req POST /admin/users 201 "$ADMIN" "{\"email\":\"othercur$RUN@t.kz\",\"password\":\"curator-pass-123\",\"firstName\":\"Other\",\"role\":\"CURATOR\"}" | json id)
OTHERCURTOKEN=$(req POST /auth/login 200 "" "{\"email\":\"othercur$RUN@t.kz\",\"password\":\"curator-pass-123\"}" | json accessToken)
req POST /admin/curator-assignments 201 "$ADMIN" "{\"curatorId\":\"$HWCID\",\"studentId\":\"$PID\"}" >/dev/null

# Ручное ДЗ, сдача текстом+аудио, проверка с рубрикой → двигает Speaking
HWID=$(req POST /curator/homework 201 "$HWCUR" "{\"studentId\":\"$PID\",\"title\":\"Расскажи о себе\",\"requiresIntegrityCheck\":true}" | json id)
req GET /curator/review-queue 403 "$PTOKEN" >/dev/null   # не куратор
[[ $(req GET /learning/homework 200 "$PTOKEN" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).some(h=>h.id==="'"$HWID"'")))') == true ]]
req POST /learning/homework/$HWID/submit 201 "$PTOKEN" '{"text":"Hello, my name is...","audioKey":"fake/hw.webm","integritySignals":{"tabAwayCount":1,"fullscreenExitCount":0,"pasteDetected":false}}' >/dev/null
[[ $(req GET /curator/review-queue 200 "$HWCUR" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).some(i=>i.type==="HOMEWORK"&&i.id==="'"$HWID"'")))') == true ]]
req GET /curator/review-queue 200 "$OTHERCURTOKEN" >/dev/null   # чужой куратор — просто пустая своя очередь, не ошибка
req GET /curator/homework/$HWID/listen 404 "$OTHERCURTOKEN" >/dev/null   # чужой ученик — не видно
SPEAK_BEFORE=$(req GET /curator/students/$PID 200 "$HWCUR" | json studentProfile.speakingScore)
req GET /curator/homework/$HWID/listen 200 "$HWCUR" >/dev/null
req POST /curator/homework/$HWID/review 201 "$HWCUR" '{"action":"APPROVE","rubric":{"vocabulary":4,"grammar":4,"fluency":4,"pronunciation":4},"comment":"Хорошо"}' >/dev/null
SPEAK_AFTER=$(req GET /curator/students/$PID 200 "$HWCUR" | json studentProfile.speakingScore)
[[ $SPEAK_AFTER != "$SPEAK_BEFORE" ]]
[[ $(req GET /students/$PID/skill-history 200 "$HWCUR" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).some(x=>x.source==="HOMEWORK")))') == true ]]

# Возврат на доработку → пересдача → зачёт без рубрики (без аудио)
HWID2=$(req POST /curator/homework 201 "$HWCUR" "{\"studentId\":\"$PID\",\"title\":\"Напиши 5 предложений\"}" | json id)
req POST /learning/homework/$HWID2/submit 201 "$PTOKEN" '{"text":"short"}' >/dev/null
req POST /curator/homework/$HWID2/review 400 "$HWCUR" '{"action":"RETURN"}' >/dev/null   # без комментария нельзя
req POST /curator/homework/$HWID2/review 201 "$HWCUR" '{"action":"RETURN","comment":"Добавь ещё предложений"}' >/dev/null
[[ $(req GET /learning/homework 200 "$PTOKEN" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).find(h=>h.id==="'"$HWID2"'").status))') == RETURNED ]]
req POST /learning/homework/$HWID2/submit 201 "$PTOKEN" '{"text":"one two three four five sentences here"}' >/dev/null
req POST /curator/homework/$HWID2/review 201 "$HWCUR" '{"action":"APPROVE","comment":"Отлично"}' >/dev/null   # без рубрики — без аудио и не нужна

# Рубрика без аудио запрещена
HWID3=$(req POST /curator/homework 201 "$HWCUR" "{\"studentId\":\"$PID\",\"title\":\"Тест3\"}" | json id)
req POST /learning/homework/$HWID3/submit 201 "$PTOKEN" '{"text":"no audio"}' >/dev/null
req POST /curator/homework/$HWID3/review 400 "$HWCUR" '{"action":"APPROVE","rubric":{"vocabulary":3,"grammar":3,"fluency":3,"pronunciation":3}}' >/dev/null

echo "▸ куратор: проверка speaking в уроке"
SPBID=$(req POST /admin/content/lessons/$LID/blocks 201 "$ADMIN" '{"type":"SPEAKING","order":2}' | json id)
SPEID=$(req POST /admin/content/blocks/$SPBID/exercises 201 "$ADMIN" '{"type":"SPEAKING","content":{"prompt":"Tell me about yourself"}}' | json id)
req POST /learning/lessons/$LID/exercises/$SPEID/speaking 201 "$PTOKEN" '{"audioKey":"fake/lesson-speak.webm"}' >/dev/null
ANSID=$(req GET /learning/lessons/$LID 200 "$PTOKEN" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const l=JSON.parse(s);for(const b of l.blocks)for(const e of b.exercises)if(e.id==="'"$SPEID"'")console.log("ok")})')
LANSID=$(req GET /curator/students/$PID/speaking-recordings 200 "$HWCUR" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).lesson[0].id))')
req GET /curator/lesson-answers/$LANSID/recording 404 "$OTHERCURTOKEN" >/dev/null
req GET /curator/lesson-answers/$LANSID/recording 200 "$HWCUR" >/dev/null
req POST /curator/lesson-answers/$LANSID/review-speaking 201 "$HWCUR" '{"rubric":{"vocabulary":3,"grammar":3,"fluency":3,"pronunciation":3},"comment":"ok"}' >/dev/null
req POST /curator/lesson-answers/$LANSID/review-speaking 400 "$HWCUR" '{"rubric":{"vocabulary":3,"grammar":3,"fluency":3,"pronunciation":3}}' >/dev/null   # уже проверено

echo "▸ куратор: проверка speaking из плейсмент-теста"
for SK in GRAMMAR VOCABULARY READING LISTENING; do
  for i in 1 2 3 4 5 6; do
    req POST /admin/content/questions 201 "$ADMIN" "{\"skill\":\"$SK\",\"level\":\"B1\",\"type\":\"MULTIPLE_CHOICE\",\"content\":{\"question\":\"hw-$SK-$i-$RUN\",\"options\":[\"correct\",\"wrong\"],\"correctIndex\":0}}" >/dev/null
  done
done
req POST /admin/content/questions 201 "$ADMIN" "{\"skill\":\"SPEAKING\",\"level\":\"B1\",\"type\":\"SPEAKING\",\"content\":{\"prompt\":\"Speak hw $RUN\"}}" >/dev/null
req POST /admin/content/questions 201 "$ADMIN" "{\"skill\":\"SPEAKING\",\"level\":\"B1\",\"type\":\"SPEAKING\",\"content\":{\"prompt\":\"Speak hw $RUN 2\"}}" >/dev/null
for SK in GRAMMAR VOCABULARY READING LISTENING; do
  for i in 1 2 3 4 5 6; do
    QID=$(req GET /placement/attempts/$AID2/next-question 200 "$PTOKEN" | json question.id)
    req POST /placement/attempts/$AID2/answers 201 "$PTOKEN" "{\"questionId\":\"$QID\",\"answer\":0}" >/dev/null
  done
done
for i in 1 2; do
  QID=$(req GET /placement/attempts/$AID2/next-question 200 "$PTOKEN" | json question.id)
  req POST /placement/attempts/$AID2/speaking 201 "$PTOKEN" "{\"questionId\":\"$QID\",\"audioKey\":\"fake/placement-hw-$i.webm\"}" >/dev/null
done
[[ $(req GET /placement/attempts/$AID2 200 "$PTOKEN" | json results.SPEAKING.status) == PENDING ]]
[[ $(req GET /curator/review-queue 200 "$HWCUR" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).some(i=>i.type==="PLACEMENT"&&i.id==="'"$AID2"'")))') == true ]]
req POST /curator/placement-attempts/$AID2/review-speaking 404 "$OTHERCURTOKEN" '{"rubric":{"vocabulary":3,"grammar":3,"fluency":3,"pronunciation":3}}' >/dev/null
req POST /curator/placement-attempts/$AID2/review-speaking 201 "$HWCUR" '{"rubric":{"vocabulary":5,"grammar":5,"fluency":5,"pronunciation":5},"comment":"Отлично"}' >/dev/null
[[ $(req GET /curator/students/$PID 200 "$HWCUR" | json studentProfile.speakingScore) == 100 ]]
req POST /curator/placement-attempts/$AID2/review-speaking 400 "$HWCUR" '{"rubric":{"vocabulary":1,"grammar":1,"fluency":1,"pronunciation":1}}' >/dev/null   # уже проверено

echo "▸ куратор: список учеников (фильтры) и план"
[[ $(req GET "/curator/students?hasPending=true" 200 "$HWCUR" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).some(x=>x.id==="'"$PID"'")))') == true ]]
req PATCH /curator/students/$PID/plan 200 "$HWCUR" '{"targetLevel":"C1"}' >/dev/null
[[ $(req GET /users/me 200 "$PTOKEN" | json studentProfile.targetLevel) == C1 ]]
req PATCH /curator/students/$PID/plan 404 "$OTHERCURTOKEN" '{"targetLevel":"A1"}' >/dev/null
req GET /curator/students/$PID 404 "$OTHERCURTOKEN" >/dev/null
req GET /curator/students/$PID/mistakes 404 "$OTHERCURTOKEN" >/dev/null

rm -f "$BODY"
echo "✔ All smoke checks passed"
