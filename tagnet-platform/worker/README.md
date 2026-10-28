# Worker API notes

This Worker is a starter API and is not yet connected to the React demo UI. See `../docs/SETUP_GUIDE_HINGLISH.md` for deployment steps.

- Public profile URLs use immutable `public_id` values, not editable handles.
- Edit keys are SHA-256 hashed before storage in D1.
- Admin routes require a Worker secret in `Authorization: Bearer ...`.
- This is not a complete production security review. Add rate limits, robust admin sessions, validation, audit logging, and careful privacy controls before launch.
