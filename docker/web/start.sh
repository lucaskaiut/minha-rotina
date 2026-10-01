#!/bin/sh
set -eu

APP_DIR="/app"
cd "$APP_DIR"

log() { echo "[web-start] $*"; }

DEV_PORT="${DEV_PORT:-3000}"
export HOST="${HOST:-0.0.0.0}"

if [ ! -f package.json ]; then
    log "ERRO: package.json não encontrado em ./web"
    exit 1
fi

if [ ! -f .env ]; then
    if [ -f .env.docker ]; then
        cp .env.docker .env
        log ".env criado a partir de .env.docker"
    fi
else
    log ".env já existe - mantendo"
fi

if [ -f pnpm-lock.yaml ]; then
    PM="pnpm"
elif [ -f yarn.lock ]; then
    PM="yarn"
else
    PM="npm"
fi
log "Gerenciador de pacotes: ${PM}"

current_hash() {
    if [ -f pnpm-lock.yaml ]; then
        md5sum pnpm-lock.yaml
    elif [ -f yarn.lock ]; then
        md5sum yarn.lock
    elif [ -f package-lock.json ]; then
        md5sum package-lock.json
    else
        md5sum package.json
    fi | awk '{print $1}'
}

STAMP="node_modules/.install-stamp"
HASH="$(current_hash)"

if [ ! -f "$STAMP" ] || [ "$(cat "$STAMP" 2>/dev/null)" != "$HASH" ]; then
    log "Instalando dependências com ${PM}..."
    case "$PM" in
        pnpm) pnpm install ;;
        yarn) yarn install ;;
        npm)
            if [ -f package-lock.json ]; then
                npm ci || npm install
            else
                npm install
            fi
            ;;
    esac
    mkdir -p node_modules
    current_hash > "$STAMP"
    log "Dependências instaladas"
else
    log "Dependências atualizadas - pulando instalação"
fi

HAS_DEV="$(node -p "require('./package.json').scripts && require('./package.json').scripts.dev ? '1' : '0'" 2>/dev/null || echo 0)"

if [ "$HAS_DEV" = "1" ]; then
    log "Iniciando Vite (porta ${DEV_PORT})..."
    case "$PM" in
        pnpm) exec pnpm run dev --host 0.0.0.0 --port "$DEV_PORT" --strictPort ;;
        yarn) exec yarn dev --host 0.0.0.0 --port "$DEV_PORT" --strictPort ;;
        npm)  exec npm run dev -- --host 0.0.0.0 --port "$DEV_PORT" --strictPort ;;
    esac
else
    log "Script 'dev' não encontrado"
    exit 1
fi
