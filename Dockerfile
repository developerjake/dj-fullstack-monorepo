FROM node:24-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS build
COPY . /usr/src/app
WORKDIR /usr/src/app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm build
RUN pnpm deploy --filter=backend --prod /prod/backend

FROM base AS backend
COPY --from=build /prod/backend /prod/backend
COPY --from=build /usr/src/app/apps/backend/dist /prod/backend/dist
WORKDIR /prod/backend
EXPOSE 3000
CMD [ "node", "dist/main.js" ]

FROM nginx:alpine AS frontend
COPY --from=build /usr/src/app/apps/frontend/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
