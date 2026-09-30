# XPage visual grammar catalog

The six recipes in `catalog.ts` are compact art-direction starting points chosen against the actual brief. They describe composition, type, color logic, material, motion, fit and anti-patterns. XPage intentionally keeps this catalog curated: directions must be legible and meaningfully distinct, and every recipe is adapted through the plan's `designDNA` instead of applied as a rigid theme.

`design-templates/compositions.ts` supplies reusable section sequences and their fit/anti-pattern checks. The API returns the selected system and the composition recipe IDs with the plan, so the choice can be reviewed with the rest of its design decisions. Creative direction generation receives a short, brief-ranked set and asks for a different system per option.

## Research and attribution

This implementation was informed by public OpenDesign project material:

- [OpenDesign repository](https://github.com/vustudio/opendesign) — the ideas of a compact design-system vocabulary, brief discovery, a small direction picker, compositional scaffolds and a bounded critique pass.
- [Web Prototype plugin](https://open-design.ai/plugins/example-web-prototype/) — template plus layout-reference architecture and priority-based quality checks.
- [Critique plugin](https://open-design.ai/plugins/example-critique/) — critique as a focused review step rather than an unbounded rewrite.

XPage did not vendor source code, assets, text, or a copied `DESIGN.md` from those projects. The recipe names, descriptions, structures, prompts and quality contract here are original and tailored to XPage's Spanish briefs, local HTML preview, accessibility requirements and evidence model. Upstream licenses therefore do not govern these original files; consult each upstream repository's current license before copying any source in future work.
