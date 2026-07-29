# Builder Rank Publishing Unblock Notes

Current local repo state includes the demo customer site and onboarding rehearsal work, but production publishing is blocked until GitHub or Vercel auth is restored on this machine.

## What Is Ready Locally

- Demo customer site: `/demo-remodeler`
- Demo customer payload: `docs/demo-remodeler-customer.json`
- Link glossary: `docs/builderrank-link-glossary.md`
- Demo dry-run command: `npm run customer:demo-dry-run`
- Local commits:
  - `c9d4309 Add demo remodeler tracking site`
  - latest local head contains the onboarding rehearsal updates

## What Blocked Publishing

GitHub HTTPS push failed because the shell has no usable GitHub credential:

```text
fatal: could not read Username for 'https://github.com': Device not configured
```

GitHub SSH also failed:

```text
git@github.com: Permission denied (publickey).
```

The connected GitHub app can read the repo, but write attempts returned:

```text
GitHub API error 403: Resource not accessible by integration
```

## Fastest Fix

Open a terminal in the project folder and authenticate GitHub for this machine:

```bash
cd "/Users/kalebgamez/Documents/Marketing and sales/builderrank-app"
gh auth login
git push origin main
```

If `gh` is not installed, install GitHub CLI or switch the repo remote to an SSH key that is added to the Builder Rank GitHub account.

## After Publishing

Run:

```bash
BASE_URL=https://builderrank.io npm run smoke:production
curl -L https://builderrank.io/demo-remodeler
npm run customer:demo-dry-run
```

Then open:

```text
https://builderrank.io/demo-remodeler
https://builderrank.io/admin-beta
https://builderrank.io/dashboard?siteId=br_demo_front_range_remodels
```
