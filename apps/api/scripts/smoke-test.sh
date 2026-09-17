#!/usr/bin/env bash
# Сквозная проверка этапа 1: роли, согласия, привязки, доступы, токены.
# Требует запущенный API с NODE_ENV=test (отключает rate limit) и выполненный db:seed.
set -euo pipefail

API=${API:-http://localhost:3001/api/v1}
ADMIN_EMAIL=${SEED_ADMIN_EMAIL:-admin@lingua.local}
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

rm -f "$BODY"
echo "✔ All smoke checks passed"
