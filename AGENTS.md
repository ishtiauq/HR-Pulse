<!-- CODEGRAPH_START -->
## CodeGraph

In repositories indexed by CodeGraph (a `.codegraph/` directory exists at the repo root), reach for it BEFORE grep/find or reading files when you need to understand or locate code:

- **MCP tool** (when available): `codegraph_explore` answers most code questions in one call — the relevant symbols' verbatim source plus the call paths between them, including dynamic-dispatch hops grep can't follow. Name a file or symbol in the query to read its current line-numbered source. If it's listed but deferred, load it by name via tool search.
- **Shell** (always works): `codegraph explore "<symbol names or question>"` prints the same output.

If there is no `.codegraph/` directory, skip CodeGraph entirely — indexing is the user's decision.
<!-- CODEGRAPH_END -->

## Global Design System (Liquid Glass)
Whenever building new components or updating existing ones in this project, you MUST strictly adhere to the "Liquid Glass" design system defined in `src/index.css`:
1. **Glassmorphism Everywhere**: Use `.bg-card`, `.bg-popover`, or `.bg-sidebar` for structural containers. For Modals/Dialogs, ensure they use `[role="dialog"]` which automatically applies the glass effect.
2. **Inputs & Forms**: Do not use solid backgrounds. The global system handles `.border-input`, `input`, `select`, and `textarea` automatically. Focus states have a glowing ring.
3. **Buttons**: Use standard `.bg-primary` for primary actions. They are globally shaped as pills (`rounded-full`) and have interactive glow on hover.
4. **Modals/Popovers**: Nested popovers are fixed globally, and standard modals are given a `1rem` radius. Always use Shadcn `Dialog` or React Aria Components `Popover`/`Modal`.
5. **No Placeholders/Mockups**: The UI should remain clean, without dummy text unless requested.
6. **No Custom Colors**: Rely on semantic variables (`bg-primary`, `text-muted-foreground`, etc.). The global system neutralizes hardcoded Tailwind colors.
7. **Subtle Shadows**: Use Shadcn's default tight shadow depth (`shadow-sm`) globally for cards and containers. Avoid large, diffuse drop-shadows. This is handled globally in `src/index.css`.
