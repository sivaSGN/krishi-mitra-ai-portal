<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project architecture
- Keep all KrishiMitra data and behavior browser-only; use a shared React context and localStorage because the product is an offline frontend demonstration.
- Use TanStack file routes for every content page and dynamic scheme/thread URL because route identity, metadata, and deep links must remain type-safe.
- Smoke tests live in tests/smoke_test.py (Python Playwright, run against the dev server) because the sandbox ships Playwright for Python.
