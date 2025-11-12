Barangay Budget Tracker — Secure Invite & Automated Setup (Option B)
Date: 2025-10-31T16:56:39

New files:
- src/models/OfficialInvite.js
- src/controllers/inviteController.js
- src/routes/inviteRoutes.js  (mounted at /api/setup)
- src/middlewares/setupGuard.js
- src/utils/seedInvites.js
- src/utils/setupWatcher.js

.env additions:
SETUP_MODE=true
SEED_SIGNATURE=4BsSecureInit2025
TOKEN_EXPIRY_DAYS=30

Seed (run once during setup):
node src/utils/seedInvites.js --verify 4BsSecureInit2025

Invite API:
POST /api/setup/invite
- During SETUP_MODE=true: no auth
- After lock (SETUP_MODE=false): Authorization: Bearer <Chairman JWT>
Body: {"email":"newtreasurer@example.com","role":"Treasurer","termStart":"2026-01-01","termEnd":"2026-12-31"}

Auto-lock:
- Triggers after successful registration of both Chairman & Treasurer.
- Console: "🔒 System setup completed. SETUP_MODE automatically locked."

Tokens:
- Format: CHR-xxxxxxxxxx / TRE-xxxxxxxxxx (10 hex chars)
- Expire after TOKEN_EXPIRY_DAYS (default 30)
- Console logs show generated tokens as requested.
