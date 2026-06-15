#!/usr/bin/env bash
# isotope dev 기동 스크립트 (Remote-WSL 통합 터미널 = WSL bash 전제).
#   .vscode/tasks.json 의 "frontend" 태스크가 호출 → Docker Desktop 준비를 보장한 뒤
#   frontend 스택을 포그라운드로 띄운다.  접속: http://localhost:4173
#
# 왜 Docker / 왜 4173?
#   - 포트 5173 이 Windows 예약 포트 범위(5141-5765)에 걸려 Docker 가 호스트에 게시 불가.
#     → docker-compose.yml 에서 4173:5173 으로 우회(컨테이너 내부 Vite 는 그대로 5173).
set -u

DD_EXE="/mnt/c/Program Files/Docker/Docker/Docker Desktop.exe"

# 1) 데몬이 이미 응답하면 바로 진행, 아니면 Docker Desktop 을 백그라운드로 기동(WSL→Windows interop).
if ! docker info >/dev/null 2>&1; then
  echo "🐳 Docker 데몬 미응답 — Docker Desktop 시작 중..."
  [ -x "$DD_EXE" ] && "$DD_EXE" >/dev/null 2>&1 &
fi

# 2) 데몬이 응답할 때까지 대기 (최대 ~3분, 2초 간격).
echo "⏳ Docker 데몬 준비 대기..."
for i in $(seq 1 90); do
  docker info >/dev/null 2>&1 && { echo "✅ Docker 준비됨 ($((i * 2))초)"; break; }
  sleep 2
done

# 3) 끝내 미응답이면 원인 안내 후 터미널 유지(수동 디버깅용).
if ! docker info >/dev/null 2>&1; then
  echo "❌ Docker 데몬이 응답하지 않습니다."
  echo "   WSL 통합이 깨진 경우: Windows PowerShell 에서 'wsl --shutdown' 실행 후 폴더를 다시 여세요."
  echo "   (이 터미널은 수동 확인용으로 유지됩니다.)"
  exec bash
fi

# 4) frontend 스택 기동 — 포그라운드, 로그 표시. http://localhost:4173
echo "🚀 docker compose up → http://localhost:4173"
exec docker compose up
