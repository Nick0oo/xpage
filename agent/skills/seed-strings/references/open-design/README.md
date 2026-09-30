# OpenDesign source bundle for XPage seed work

Research snapshot: `nexu-io/open-design` commit `5b19dfa4351b3eed33826ee72746a7c653c23a54` (2026-09-30). Sources were fetched from the repository's `raw.githubusercontent.com` endpoint and the GitHub tree API. Source files below are retained verbatim, except `system-prompt-excerpts.md`, which contains marked verbatim excerpts. The upstream Git blob IDs make each source revision independently verifiable.

## Included source materials

| Local file | Upstream file | Upstream Git blob | Size | Use |
|---|---|---|---:|---|
| `system-prompt-excerpts.md` | `apps/daemon/src/prompts/core-slim.ts` | `0d66b9d2543f91d827b27cefc21df9869e2bd46c` | 36,077 B | Exact core charter lines on judgment, craft, fundamentals, and goal fit; plus exact lines from `apps/daemon/src/prompts/official-system.ts` (`7abc9c4be41c3f6f79ce4856ef65acbebd523475`, 18,661 B) on filler and one decisive flourish. |
| `frontend-design.md` | `skills/frontend-design/SKILL.md` | `43fa4a5860b97b192fe05d67c6bd2d97bc643d3f` | 5,240 B | Full upstream skill, including distinctive subject-grounded direction, layout, typography, image and motion guidance. |
| `web-prototype-skill.md` | `plugins/_official/examples/web-prototype/SKILL.md` | `56c3e986eb403365bde7653ea6eed4c8b48b9983` | 5,865 B | Original example plugin instructions and composition workflow. Copied as authored material; no plugin runtime is included. |
| `web-prototype-layouts.md` | `plugins/_official/examples/web-prototype/references/layouts.md` | `545c661135e240a164b28de24bae786d34bf5f63` | 10,995 B | Original section composition library and sequencing suggestions. |
| `web-prototype-checklist.md` | `plugins/_official/examples/web-prototype/references/checklist.md` | `f773548fc9c669c0483240b97b310c7e4f27b3bf` | 4,679 B | Original visual/content quality gate, including anti-filler, no invented metrics, layout rhythm, CTA and responsive checks. |
| `totality-festival-design.md` | `design-systems/totality-festival/DESIGN.md` | `acc3de05372585c7668c24aff9f612540fccd9c1` | 9,058 B | One vivid package with obsidian, amber-crown and cyan atmosphere, cinematic light, and a specific visual premise. It is an option, not a default XPage theme. |
| `totality-festival-usage.md` | `design-systems/totality-festival/USAGE.md` | `0f3926c35bbf70b2d84bb0a4a66a855601452d3f` | 1,691 B | Package application notes. The much larger token JSON, component catalog, preview and image assets were intentionally not copied. |
| `LICENSE` | `LICENSE` | `eb79c35bd865477e525b18e56f35d56fbe0f7110` | 11,296 B | Full OpenDesign repository Apache-2.0 license; required with the copied repository materials. |
| `frontend-design-LICENSE.txt` | `skills/frontend-design/LICENSE.txt` | `f433b1a53f5b830a205fd2df78e2b34974656c7b` | 10,174 B | The separate Apache-2.0 license supplied alongside OpenDesign's adapted frontend-design skill. |

## Attribution and ancestry

- Original repository: [nexu-io/open-design](https://github.com/nexu-io/open-design/tree/5b19dfa4351b3eed33826ee72746a7c653c23a54), Copyright 2026 Open Design contributors, Apache License 2.0. See `LICENSE` for full terms.
- OpenDesign's `skills/frontend-design/SKILL.md` frontmatter points to [Anthropic's frontend-design skill](https://github.com/anthropics/skills/tree/main/skills/frontend-design), and the copied body identifies itself as adapted from that official skill. That ancestry attribution is retained. The included OpenDesign copy provides `skills/frontend-design/LICENSE.txt`; it is also Apache-2.0. No separate `NOTICE` file exists in the pinned OpenDesign tree. This bundle copies OpenDesign's attributed adaptation, not Anthropic repository assets.
- Upstream plugin materials are included as text references only; their manifests, runtime, template, image/font assets and supporting code are not included.

## Runtime boundary

These files are authored reference material, not installed skills, plugins, tools, or a promise that OpenDesign runtime behavior exists in XPage. Eve's `load_skill` returns the named bundled skill markdown; it does not recursively expose this directory. Method skills may explicitly call XPage's `read_seed_reference` tool to read allowlisted files; the tool reads local copies and does not invoke OpenDesign. `XPAGE-ADAPTATION.md` records the local application boundary and XPage-specific adjustments.
