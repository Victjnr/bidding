# Production Checklist

## 1. Environment Variables
- [ ] `APP_ENV=production`
- [ ] `APP_DEBUG=false`
- [ ] Ensure `APP_KEY` is securely generated and never changed.
- [ ] `DB_PASSWORD`, `STRIPE_SECRET`, `REDIS_PASSWORD` stored in Docker Secrets / Vault (never committed to `.env`).

## 2. Database Hardening
- [ ] The production DB user should have `SELECT`, `INSERT`, `UPDATE`, `DELETE` privileges ONLY.
- [ ] `GRANT`, `DROP`, `ALTER` must be reserved for a separate migration-only user run during deployment.
- [ ] Enable daily automated snapshots to a cross-region bucket (e.g., S3).

## 3. Redis Hardening
- [ ] Ensure Redis `requirepass` is set.
- [ ] Bind Redis exclusively to `127.0.0.1` or the internal private subnet.

## 4. Performance & Opcache
- [ ] Run `php artisan optimize:clear && php artisan optimize` in the deployment script.
- [ ] In `php.ini`, set `opcache.validate_timestamps=0` to prevent disk reads on every request.

## 5. Security & Networking
- [ ] Cloudflare enabled with WAF in strict mode.
- [ ] Rate limiting rules applied at the edge (Cloudflare) to protect login/bidding endpoints.
- [ ] DDoS protection enabled.
- [ ] HTTPS enforced. HSTS preloading headers enabled.

## 6. S3 / Storage
- [ ] Public bucket (`auctions-public`): Read-only to public. Used for avatars, auction images.
- [ ] Private bucket (`auctions-private`): Block all public access. Used for KYC, Dispute evidence, and Data exports. Pre-signed URLs ONLY.

## 7. CI/CD & Deploy
- [ ] CI pipeline passes Larastan level 9, PHPCS, and test coverage (>80%).
- [ ] Composer audit shows no critical CVEs.
- [ ] Container image scanned for OS vulnerabilities.
