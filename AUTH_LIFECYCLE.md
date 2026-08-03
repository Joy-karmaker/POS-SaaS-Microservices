# 🔐 Auth Service Lifecycle (Simplified)

## 📌 TL;DR
*   **Access Token (JWT)**: Used for normal requests. Short-lived (1 hr) and verified **statelessly** by each microservice using a shared secret (no Redis/DB query).
*   **Refresh Token (Redis)**: Used only to get new Access Tokens. Long-lived (14 days), stored **statefully** in Redis, and rotated (replaced) on every use.
*   **Cookies**: Both tokens are sent and saved in secure, unencrypted `HttpOnly` cookies (`pos_access_token` and `pos_refresh_token`).

---

## 🔄 The 3 Step Lifecycle

### 1. Login (Establish Session)
```
User submits credentials ➔ Validate in Auth Service ➔ Save Refresh Token hash in Redis ➔ Set Cookies
```
*   **Action**: User calls `POST /login` with username & password.
*   **Result**: 
    1. A JWT **Access Token** is generated.
    2. A random string **Refresh Token** is generated, SHA-256 hashed, and saved in Redis (`auth:rt:hash:<hash>`).
    3. Cookies `pos_access_token` and `pos_refresh_token` are set on the client.

---

### 2. Normal Request (Stateless Verification)
```
Client sends request with cookie ➔ Microservice verifies JWT signature locally ➔ Request Approved
```
*   **Action**: Client requests data from any microservice (e.g. `GET /cart`).
*   **Result**: The microservice decodes the `pos_access_token` cookie locally using the shared secret `AUTH_JWT_SECRET`. **No database or Redis query is needed.**

---

### 3. Refresh (Rotation & Replay Protection)
```
Access token expires (401) ➔ Client hits /refresh ➔ Validate in Redis ➔ Issue new tokens & delete old ones
```
*   **Action**: Access token expires. Client silently sends a POST request to `/refresh`.
*   **Result**: 
    1. Auth Service hashes the incoming `pos_refresh_token` cookie and checks Redis.
    2. If valid, the old token is deleted from Redis.
    3. A new access token and new refresh token are generated, saved in Redis, and returned to the client (Token Rotation).

---

## 📂 Key Files & Settings

| Component | Location in Code / Config | Description |
| :--- | :--- | :--- |
| **API Endpoints** | [routes/web.php](file:///e:/POS-SaaS-Microservices/services/auth-service-laravel/routes/web.php) | Defines `/login`, `/refresh`, `/logout`, and `/me`. |
| **Token Issuance** | [AuthController.php](file:///e:/POS-SaaS-Microservices/services/auth-service-laravel/app/Http/Controllers/AuthController.php) | Handles logging in, issuing session tokens, and constructing cookies. |
| **Redis Storage** | [RefreshTokenRepository.php](file:///e:/POS-SaaS-Microservices/services/auth-service-laravel/app/Repositories/RefreshTokenRepository.php) | Performs Redis read, write, and revoke operations. |
| **Request Verification** | [AuthenticateJwt.php](file:///e:/POS-SaaS-Microservices/services/tenant-service-laravel/app/Http/Middleware/AuthenticateJwt.php) | Decodes and validates the JWT on incoming requests. |
| **Shared Secret** | `AUTH_JWT_SECRET` in root `.env` | The key all microservices use to check JWT signatures. |
| **Session Lifetime** | `AUTH_JWT_REFRESH_TTL` | Lifespan of the refresh token in Redis (default: 14 days). |
