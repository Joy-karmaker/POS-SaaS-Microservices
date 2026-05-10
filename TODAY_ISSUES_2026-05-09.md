# TODAY'S PROGRESS - 2026-05-09

## 1. Catalog Service Docker Build Optimization
*   **Problem**: The Docker build process for `catalog-service` was failing at the `RUN npm ci` stage. Since the development environment is fully containerized and the host machine lacks a local Node/NPM installation, the `package-lock.json` was out of sync with `package.json`, causing the strict `npm ci` check to fail.
*   **Solution**: Updated the `Dockerfile` to use `RUN npm install` instead of `RUN npm ci`. This allows the container to dynamically resolve dependencies and update the tree during the build process, which is more robust for environments where local package management isn't possible.

## 2. Prisma Client Generation & Build Fix
*   **Problem**: The subsequent `npm run build` command failed with 16 TypeScript errors because the NestJS application couldn't find the Prisma Client types. In a Docker build context, Prisma Client must be explicitly generated after dependencies are installed but before the build command is executed.
*   **Solution**: Inserted `RUN npx prisma generate` into the `Dockerfile` immediately after copying the source code. This ensures that the TypeScript compiler has access to all generated database models and types during the build stage.

## 3. Prisma v7.8.0 Schema Migration
*   **Problem**: Running `npx prisma generate` initially failed with a `P1012` validation error. Prisma v7.8.0 has deprecated the use of the `url` property inside the `datasource` block within the `schema.prisma` file.
*   **Solution**: 
    *   Modified `services/catalog-service-node/prisma/schema.prisma` to remove the `url = env("DATABASE_URL")` line.
    *   Verified that the connection logic is now properly delegated to the existing `prisma.config.ts`, which handles the environment variables and database adapters.
    *   Successfully verified the full Docker build cycle (Install -> Generate -> Build).

## 4. Prisma Client Constructor Error (502 Bad Gateway)
*   **Problem**: Even after building successfully, the `catalog-service` container was stuck in a crash loop returning `502 Bad Gateway` through Nginx. The crash was due to Prisma v7 removing the native query engine; it strictly requires a driver adapter for database connectivity, throwing `PrismaClientConstructorValidationError`.
*   **Solution**: 
    *   Installed `@prisma/adapter-mariadb` and `mariadb` inside the container.
    *   Modified `src/prisma.service.ts` to construct the connection URL dynamically using the provided Docker environment variables (`DB_HOST`, `DB_PORT`, etc.).
    *   Passed a new `PrismaMariaDb` adapter instance directly into the `super({ adapter })` constructor call, resolving the crash loop.

## 5. JWT Authentication Issues (401 Unauthorized)
*   **Problem 1**: The frontend request to `/catalog/categories` returned `401 Unauthorized` with "No token provided". The `catalog-service` `JwtAuthGuard` only checked the `Authorization: Bearer` header, but the frontend sends the token via a `pos_access_token` cookie.
*   **Solution 1**: Updated `JwtAuthGuard`'s `extractTokenFromHeader` method to parse and extract the token from `request.headers.cookie` when the `Bearer` header is absent.

*   **Problem 2**: After extracting the token, it still failed with "Invalid or expired token" due to a signature mismatch. Node's `jwt.verify` failed against `AUTH_JWT_SECRET=local-dev-jwt-secret-change-this`.
*   **Solution 2**: Discovered that Laravel's configuration inside `auth-service` and `tenant-service` was cached at build time. It ignored the `.env` value and was signing tokens using the fallback secret `"change-me-in-production"`. Fixed by running `docker exec auth-service php artisan config:clear` (and the same for `tenant-service`), forcing Laravel to read the correct `.env` secret.

## Next Steps
*   **Verify Frontend**: Re-login from the frontend to generate a token signed with the correct `.env` secret.
*   **Validate Business Logic**: Ensure that creating and retrieving categories/products works flawlessly end-to-end.
