# Design System: HabitFlow

## 1. Visual Theme & Atmosphere
An uncompromising, high-end "Ethereal Glass" architecture designed for deep focus and premium utility. The layout eschews generic symmetry in favor of confident, masonry-style asymmetry. Motion is ever-present but highly controlled through heavy spring physics, evoking the tactile density of machined hardware. The atmosphere is clinical, cinematic, and decidedly non-generic—a $150k agency build.

## 2. Color Palette & Roles
- **Canvas White / OLED Base** (#050505) — Primary background surface. Deepest charcoal/black for immersive contrast.
- **Pure Surface** (#0A0A0A) — Inner card and container fill.
- **Charcoal Ink** (#18181B) — (For light contexts) Zinc-950 depth. In our dark mode: Primary text is muted white.
- **Muted Steel** (#64748B) — Secondary text, descriptions, and metadata.
- **Whisper Border** (rgba(255, 255, 255, 0.05)) — Card borders and 1px structural lines.
- **Muted Emerald** (#059669) — The sole primary accent. Saturated just enough for interaction, but muted to blend seamlessly with the OLED base.

*Constraint: Maximum 1 accent color. Saturation < 80%. No purple/neon gradients.*

## 3. Typography Rules
- **Display:** Geist / Plus Jakarta Sans — Track-tight, controlled scale, weight-driven hierarchy.
- **Body:** Geist / Plus Jakarta Sans — Relaxed leading, 65ch max-width, neutral secondary color.
- **Mono:** Geist Mono — For code, metadata, timestamps, and high-density numbers.
- **Banned:** Inter, Roboto, Arial, generic system fonts, and all generic serif fonts (Times New Roman, Georgia).

## 4. Component Stylings
* **Buttons:** Flat, pill-shaped (`rounded-full`). No outer glow. Tactile -1px translate (`active:scale-[0.98]`) on active state. Primary buttons use the "Button-in-Button" trailing icon pattern (the arrow or icon sits in its own circular wrapper flush with the right padding).
* **Cards (The "Double-Bezel"):** Nested container architecture. The outer shell uses a subtle border (`rgba(255,255,255,0.05)`) and large radius (`rounded-[2rem]`). The inner core houses the content with a sharp `1px` inner white highlight.
* **Inputs:** Label above, error below. Focus ring in accent color. No floating labels.
* **Loaders:** Skeletal shimmer matching exact layout dimensions. No generic circular spinners.
* **Empty States:** Composed, illustrated compositions indicating how to populate data.

## 5. Layout Principles
- **Asymmetric Grid:** The "Asymmetrical Bento" replaces boring 3-column structures.
- **Containment:** Strict max-width containment (`max-w-7xl`).
- **Whitespace:** Aggressive use of negative space. Double the standard padding.
- **Full-Height Limits:** Sections must use `min-h-[100dvh]` — never `h-screen` to prevent iOS Safari jumping.
- **Mobile-First Collapse:** All multi-column layouts strictly collapse to a single column below 768px.

## 6. Motion & Interaction
- **Spring Physics:** All interactive transitions run on heavy spring physics (`stiffness: 100, damping: 20`) or custom cubic-beziers (`cubic-bezier(0.32, 0.72, 0, 1)`). No linear easing.
- **Staggered Entry:** Elements never load statically. They enter via a heavy, delayed blur fade-up (`translate-y-48px blur-8px opacity-0` to visible).
- **Perpetual Micro-Interactions:** Ambient, slow-moving noise or shimmer layers on interactive dashboard components.
- **GPU-Safe Animation:** Animate exclusively via `transform` and `opacity`.

## 7. Anti-Patterns (Banned)
* **NO Emojis** everywhere; use premium icons.
* **NO Inter font**; it looks cheap and generic.
* **NO "AI Purple/Blue Neon" aesthetic**; no purple button glows or neon gradients.
* **NO Pure Black (#000000) or Pure White (#FFFFFF)** bases.
* **NO 3-column equal card layouts**; symmetry is the enemy of premium design here.
* **NO Generic AI Copywriting clichés** ("Elevate", "Seamless", "Unleash", "Next-Gen").
* **NO Fake round numbers** (`99.99%`, `50%`). Use organic data (`47.2%`).
* **NO Overlapping elements**; every element occupies its own clear spatial zone.
