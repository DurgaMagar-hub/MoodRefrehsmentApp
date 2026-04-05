#!/usr/bin/env bash
# Dev helper: start backend, set adb reverse, and start Expo Metro for Android USB workflow
set -e

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
echo "Starting backend..."
cd "$ROOT_DIR"
npm run server &
SERVER_PID=$!
sleep 1

echo "Setting adb reverse for device (3001 and 8081)..."
adb reverse tcp:3001 tcp:3001 || true
adb reverse tcp:8081 tcp:8081 || true
adb reverse --list || true

echo "Starting Expo Metro (mobile)..."
cd "$ROOT_DIR/mobile"
npx expo start --clear --host lan

echo "Cleaning up server (pid $SERVER_PID)"
kill $SERVER_PID || true
