# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_SUPABASE_ANON_KEY
ARG VITE_PAYSTACK_PUBLIC_KEY
ARG VITE_SITE_URL
ARG VITE_RATE_GHS_TO_NGN
ARG VITE_RATE_GHS_TO_USD

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_SUPABASE_ANON_KEY=$VITE_SUPABASE_SUPABASE_ANON_KEY
ENV VITE_PAYSTACK_PUBLIC_KEY=$VITE_PAYSTACK_PUBLIC_KEY
ENV VITE_SITE_URL=$VITE_SITE_URL
ENV VITE_RATE_GHS_TO_NGN=$VITE_RATE_GHS_TO_NGN
ENV VITE_RATE_GHS_TO_USD=$VITE_RATE_GHS_TO_USD

# Install dependencies first (layer cache)
COPY package.json package-lock.json* ./
RUN npm ci --frozen-lockfile

# Copy source and build
COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginx:1.25-alpine AS runner

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/app.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
