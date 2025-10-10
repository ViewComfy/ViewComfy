FROM debian:bookworm-slim AS base

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get --allow-releaseinfo-change update && \
    apt-get install -y software-properties-common \
    curl \
    build-essential \
    ca-certificates \
    unzip \
    ffmpeg \
    wget \
    && rm -rf /var/lib/apt/lists/*

RUN apt update -y \
    && apt install -y --no-install-recommends git 

RUN apt update && apt install -y --no-install-recommends python3.11 \
    python3-dev \
    python3-pip \
    python3.11-venv \
    && rm -rf /var/lib/apt/lists/*

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=off \
    PIP_DISABLE_PIP_VERSION_CHECK=on \
    PIP_DEFAULT_TIMEOUT=100

RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
RUN apt-get install -y nodejs

WORKDIR /app

# Install dependencies only when needed
FROM base AS deps
# Update package lists and install any necessary dependencies

WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
# In your ViewComfy-editor-modal.dockerfile
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_USER_MANAGEMENT
ARG NEXT_PUBLIC_VIEW_MODE
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_CLOUD_WS_URL

ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_USER_MANAGEMENT=$NEXT_PUBLIC_USER_MANAGEMENT
ENV NEXT_PUBLIC_VIEW_MODE=$NEXT_PUBLIC_VIEW_MODE
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_CLOUD_WS_URL=$NEXT_PUBLIC_CLOUD_WS_URL

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# USER nextjs

ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

EXPOSE 3000

ENV HOSTNAME="0.0.0.0"
