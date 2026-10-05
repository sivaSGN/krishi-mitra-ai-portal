# KrishiMitra AI frontend

## Goal
Build a polished, browser-only agricultural scheme assistant with realistic mock data, complete navigation, responsive layouts, local interactions, and no external services.

## What will be built
- A shared production-style dashboard shell with responsive sidebar, top search, mobile navigation, language selector, theme control, profile menu, notifications, and page transitions.
- Complete pages for Dashboard, AI Assistant, Scheme Discovery, Scheme Details, Eligibility Checker, Recommendations, Saved Schemes, Notifications, Farmer Profile, and Help & Support.
- At least 10 realistic Indian agricultural schemes with detailed mock eligibility, benefits, documents, deadlines, departments, states, and match scores.
- Working browser interactions: scheme search and filters, save/remove, detail navigation, modal confirmations, toasts, tabs, language switching, dark mode, profile editing, notification read states, suggested AI prompts, mocked chat responses, document/voice controls, and the full eligibility wizard with mock results.
- Responsive dashboard analytics for category mix, eligibility status, monthly searches, and saved schemes, plus loading skeletons and empty states.

## Visual direction
- Friendly agricultural intelligence aesthetic: fresh leaf green, deep forest text, warm white surfaces, a small harvest-gold accent, soft shadows, compact rounded cards, strong accessible hierarchy, and domain-specific crop/leaf motifs.
- Large touch targets, straightforward labels, clear status colors, and readable typography for rural and elderly users while retaining a sophisticated AI SaaS presentation.
- Light and dark themes driven by semantic design tokens, with restrained motion and reduced-motion support.

## Technical approach
- Keep TanStack Router as the project router and map every requested URL to a real route file; `/` redirects to `/dashboard`.
- Use local React state plus localStorage for theme, language, saved schemes, notification state, and profile data.
- Use the installed chart library for responsive mock analytics and install AI Elements primitives for the chat transcript and composer.
- Organize shared data, application context, shell, cards, form controls, dialogs, and AI UI into focused reusable TypeScript components.
- Add unique metadata to every content route and verify the desktop and mobile experience with browser checks.

## Validation
- Confirm all navigation targets and primary flows work in the browser.
- Verify the eligibility wizard, save/remove flow, filters, assistant responses, language switching, and theme switching.
- Run lint and rely on the project preview build checks, then inspect the rendered desktop and mobile layouts for overflow or overlap.
