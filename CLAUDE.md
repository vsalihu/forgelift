# ForgeLift

Fitness app. Client: React 18 + Vite + Tailwind + Framer Motion in `forgelift/client` (deployed on Vercel). Server: Express + Mongoose in `forgelift/server` (deployed on Render, MongoDB Atlas).

## Design skills: project overrides

The design skills in `.claude/skills/` are general-purpose. Where they conflict with ForgeLift's own decisions, these win:

- **Icons.** ForgeLift has its own custom icon set in `forgelift/client/src/components/icons/` (`navIcons.jsx`, `featureIcons.jsx`), drawn from the owner's brand icon sheets. Use those first, and add new ones there in the same style (24x24 grid, `currentColor`, stroke 2, round caps). Generic controls (close, chevrons, search, trash) stay on `lucide-react`. Do not swap the custom set for Phosphor or another library, even though `design-taste-frontend` discourages hand-rolled SVG icons and lucide.
- **Scope of `design-taste-frontend`.** It is written for landing pages and marketing sites. Apply it to `LandingPage` and other marketing surfaces. For in-app pages (dashboard, analytics, gym mode, forms), use `web-design-guidelines` and the app's existing components instead.
- **Brand.** Dark theme with the forge orange accent (`forge-ember`, `forge-copper`). Keep it unless the owner asks to change it.

## Browser checks with playwright-cli

The `playwright-cli` skill needs the CLI, which cloud containers don't keep between sessions. In a Claude Code cloud session:

```bash
npm install -g @playwright/cli@latest
export PLAYWRIGHT_MCP_EXECUTABLE_PATH=/opt/pw-browsers/chromium   # use the preinstalled Chromium
playwright-cli open --browser=chromium http://localhost:5173/
```

Run it from a scratch directory, or keep its `.playwright-cli/` output out of commits (it's in `.gitignore`).
