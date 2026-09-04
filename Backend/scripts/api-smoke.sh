#!/usr/bin/env bash
# End-to-end check of every endpoint, including the failure paths.
# Usage: bash scripts/api-smoke.sh [baseUrl] [email] [password]
set -u

B="${1:-http://localhost:3000}"
EMAIL="${2:-admin@gmail.com}"
PASSWORD="${3:-admin123}"
BODY=$(mktemp)
pass=0
fail=0

check() { # label expected actual
  if [ "$2" = "$3" ]; then
    printf "  PASS  %-42s %s\n" "$1" "$3"
    pass=$((pass + 1))
  else
    printf "  FAIL  %-42s got %s, want %s\n" "$1" "$3" "$2"
    fail=$((fail + 1))
  fi
}

code() { curl -s -o "$BODY" -w "%{http_code}" "$@"; }
json() { python3 -c "import json,sys;print(json.load(open('$BODY'))$1)"; }

echo "Public"
check "GET /health" 200 "$(code "$B/health")"
check "GET /api/nope" 404 "$(code "$B/api/nope")"

echo "Auth"
check "login without a body" 400 "$(code -X POST "$B/api/auth/login" -H 'Content-Type: application/json' -d '{}')"
check "login with a wrong password" 401 "$(code -X POST "$B/api/auth/login" -H 'Content-Type: application/json' -d "{\"email\":\"$EMAIL\",\"password\":\"wrong\"}")"
check "login" 200 "$(code -X POST "$B/api/auth/login" -H 'Content-Type: application/json' -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")"

TOKEN=$(json "['token']")
AUTH="Authorization: Bearer $TOKEN"

check "current user without a token" 401 "$(code "$B/api/auth/me")"
check "current user" 200 "$(code -H "$AUTH" "$B/api/auth/me")"
check "current user with a forged token" 401 "$(code -H 'Authorization: Bearer not.a.token' "$B/api/auth/me")"

echo "Masters"
check "states without a token" 401 "$(code "$B/api/masters/states")"
check "states" 200 "$(code -H "$AUTH" "$B/api/masters/states")"
STATE=$(json "['data'][0]['_id']")
check "departments" 200 "$(code -H "$AUTH" "$B/api/masters/departments")"
DEPARTMENT=$(json "['data'][0]['_id']")
check "cities without a state" 400 "$(code -H "$AUTH" "$B/api/masters/cities")"
check "cities for a state" 200 "$(code -H "$AUTH" "$B/api/masters/cities?stateId=$STATE")"
CITY=$(json "['data'][0]['_id']")

echo "Employees"
EMAIL_NEW="smoke$RANDOM@example.com"
PNG=$(mktemp /tmp/smoke.XXXX.png)
printf '\x89PNG\r\n\x1a\n' > "$PNG"

check "create without a token" 401 "$(code -X POST "$B/api/employees" -F name=Test)"
check "create with a short phone" 400 "$(code -H "$AUTH" -X POST "$B/api/employees" \
  -F name=Test -F "email=$EMAIL_NEW" -F phone=99 -F gender=M -F "department=$DEPARTMENT" \
  -F "state=$STATE" -F "city=$CITY" -F pincode=411001 -F address=Somewhere)"
check "create" 201 "$(code -H "$AUTH" -X POST "$B/api/employees" \
  -F name="Smoke Test" -F "email=$EMAIL_NEW" -F phone=9876543210 -F gender=M \
  -F "department=$DEPARTMENT" -F "state=$STATE" -F "city=$CITY" -F pincode=411001 \
  -F address="12 Model Colony" -F isPermanent=true -F "profilePicture=@$PNG")"
ID=$(json "['data']['_id']")
PICTURE=$(json "['data']['profilePicture']")

check "create with a duplicate email" 400 "$(code -H "$AUTH" -X POST "$B/api/employees" \
  -F name=Copy -F "email=$EMAIL_NEW" -F phone=9876543211 -F gender=F -F "department=$DEPARTMENT" \
  -F "state=$STATE" -F "city=$CITY" -F pincode=411001 -F address=Elsewhere)"
check "list" 200 "$(code -H "$AUTH" "$B/api/employees?page=1&limit=10")"
check "search" 200 "$(code -H "$AUTH" "$B/api/employees?search=Smoke")"
check "get one" 200 "$(code -H "$AUTH" "$B/api/employees/$ID")"
check "get a malformed id" 404 "$(code -H "$AUTH" "$B/api/employees/not-an-id")"
check "update" 200 "$(code -H "$AUTH" -X PUT "$B/api/employees/$ID" -F name="Smoke Test Edited")"
check "delete" 200 "$(code -H "$AUTH" -X DELETE "$B/api/employees/$ID")"
check "delete the same record again" 404 "$(code -H "$AUTH" -X DELETE "$B/api/employees/$ID")"
check "the uploaded file is gone" 404 "$(code "$B$PICTURE")"

rm -f "$BODY" "$PNG"
echo
echo "$pass passed, $fail failed"
[ "$fail" -eq 0 ]
