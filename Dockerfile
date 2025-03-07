#  Base image
FROM node:20-alpine AS base

#  Install global dependencies
RUN npm install -g pnpm@9.14.3

#  Set working directory
WORKDIR /app

#  Build stage
FROM base AS builder

#  Copy project files
COPY . .

#  Install all dependencies
RUN pnpm install

#  Build shared packages
RUN pnpm -F "@repo/*" build

#  Build application
RUN cd apps/backend && npx prisma generate
RUN cd apps/backend && pnpm run build
RUN cd apps/web && pnpm run build

#  Backend image
FROM base AS backend

#  Set working directory
WORKDIR /app

#  Copy source code
COPY --from=builder /app .

#  Ensure Prisma client is generated at runtime
WORKDIR /app/apps/backend
RUN npx prisma generate

#  Create start script
RUN echo '#!/bin/sh' > /app/start-backend.sh && \
    echo 'cd /app/apps/backend' >> /app/start-backend.sh && \
    echo 'npx prisma db push --skip-generate' >> /app/start-backend.sh && \
    echo 'npx prisma generate' >> /app/start-backend.sh && \
    echo 'node dist/main.js' >> /app/start-backend.sh && \
    chmod +x /app/start-backend.sh

#  Expose port
EXPOSE 8080

#  Start application
CMD ["/app/start-backend.sh"]

#  Frontend image
FROM base AS frontend

#  Set working directory
WORKDIR /app

#  Copy source code
COPY --from=builder /app .

#  Ensure next command is available
RUN cd /app && npm install -g next

#  Create start script
RUN echo '#!/bin/sh' > /app/start-frontend.sh && \
    echo 'cd /app/apps/web' >> /app/start-frontend.sh && \
    echo 'npx next start -p 9000' >> /app/start-frontend.sh && \
    chmod +x /app/start-frontend.sh

#  Expose port
EXPOSE 9000

#  Start application
CMD ["/app/start-frontend.sh"]