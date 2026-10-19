# Add Vercel Web Analytics

## Summary
- Mount the official Vercel Analytics component in the root Next.js App Router layout.
- Reuse the existing `@vercel/analytics` dependency; no package changes are needed.

## Why
This enables page-view tracking for Issue Scout after Web Analytics is enabled in the Vercel project dashboard and this change is deployed.

## Testing
- `npm run lint`
- `npm run build`
- After merge/deploy, open the production site and confirm the Vercel Analytics dashboard begins receiving visits (analytics are not recorded in development mode).

## Notes
The Vercel dashboard may require Web Analytics to be enabled for the project separately: https://vercel.com/sharm-07/issue-scout/analytics?environment=all
