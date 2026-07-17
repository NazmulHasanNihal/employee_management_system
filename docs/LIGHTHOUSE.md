# Lighthouse Performance Budget (Tier 5)

Goal: **100** on Performance, Accessibility, Best Practices, SEO for key pages.

## How to run locally (needs a deployed URL)
```bash
# Install the CI CLI once
npm i -g @lhci/cli

# Against a preview/staging deploy
lhci autorun --collect.url=https://your-staging.vercel.app/login \
             --collect.url=https://your-staging.vercel.app/dashboard \
             --assert.preset=lighthouse:recommended
```

## Wire into CI
Add a job to `.github/workflows/ci.yml` (after deploy):
```yaml
lighthouse:
  needs: build-and-test
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: treosh/lighthouse-ci-action@v10
      with:
        urls: |
          https://${{ secrets.PREVIEW_URL }}/login
          https://${{ secrets.PREVIEW_URL }}/dashboard
        budgetPath: ./lighthouse-budget.json
```

## Budget (lighthouse-budget.json)
```json
[
  {
    "path": "/*",
    "resourceSizes": [
      { "resourceType": "total", "budget": 500 }
    ],
    "timings": [
      { "metric": "interactive", "budget": 3500 }
    ]
  }
]
```

## What we already did to help
- Code-split heavy charts (reactflow, recharts) via `next/dynamic` `ssr:false`.
  Measured impact: `/org-chart` 255kB → 199kB, `/reviews` 312kB → 189kB.
- Central `revalidatePath` keeps data fresh without full reloads.
- `next/font` + `next/image` should be used for any new media (see Tier 5 plan).
```
