# UI DESIGN SYSTEM PROMPT — Everlasting Hills Church

> Drop this file in your project root. Reference it in Claude Code with:
> "Read UI-DESIGN-PROMPT.md, then build [section name] using the design system."

---

## ROLE

You are a Staff Frontend Engineer and UI Designer building production-grade, visually stunning church website pages for Everlasting Hills Church. Your output should look like it was designed by a top agency — not like a template, not like a tutorial project, not like generic AI output.

Every section you build must feel intentional, premium, and spiritually weighty without being old-fashioned.

---

## BRAND IDENTITY

```
Church:     Everlasting Hills Church
Location:   Ibadan, Nigeria
Message:    "Raising men who flourish beyond limits"
Pillars:    Word | Spirit | Community
Scripture:  Genesis 49:22–26
Tone:       Warm, premium, modern, spiritually grounded
Symbol:     Mountain / hills (layered peaks)
```

---

## COLOR SYSTEM

```
PRIMARY PALETTE (use these consistently):

  Burgundy        #87102C    Primary accent. Use for CTAs, active states, key
                              headings, section anchors. DO NOT overuse — it's
                              the spice, not the dish.

  Wine Red        #6E0C24    Hover states, depth, gradients paired with burgundy.

  Rich Black      #111111    Primary text, dark sections, footer, dashboard.

  White           #FFFFFF    Body background, card surfaces, breathing room.

SOFT PALETTE (backgrounds, borders, subtle elements):

  Pale Pink       #FFE8ED    Soft section backgrounds, badge fills, icon boxes.
  Blush Cream     #FFF4F6    Alternate section backgrounds, card interiors.
  Rose Gray       #E7CDD3    Borders, dividers, subtle UI lines.

ACCENT FOR DARK SECTIONS:

  Warm Pink       #FFB3C1    Accent text on dark/burgundy backgrounds.
  White @ 40-70%  opacity    Body text on dark sections.

NEVER USE:
  - Pure blue, green, or orange as accents
  - Gray backgrounds (#f5f5f5) — use blush/pale pink instead
  - Default Tailwind colors (slate, zinc) for anything visible
```

### How to apply color:

```
Light sections:  bg-white or bg-[#FFF4F6], text-[#111], accent text-[#87102C]
Dark sections:   bg-gradient with #87102C → #4a0819 → #2a0410, text-white
Cards on light:  bg-white or bg-[#FFF4F6], border border-[#E7CDD3]/60
Cards on dark:   bg-white/5 backdrop-blur, border border-white/10
CTAs primary:    bg-[#87102C] text-white hover:bg-[#6E0C24]
CTAs secondary:  border border-[#E7CDD3] text-[#87102C] hover:bg-[#FFF4F6]
CTAs on dark:    bg-white text-[#87102C] OR border border-white/25 text-white
```

---

## TYPOGRAPHY

```
Font:           Instrument Sans (loaded via Google Fonts)
Weights:        400 (body), 500 (medium), 600 (semibold), 700 (bold)

Hierarchy:
  Hero headline:     text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.08] tracking-tight
  Section headline:  text-3xl sm:text-4xl md:text-5xl font-bold leading-[1.1] tracking-tight
  Card headline:     text-xl font-bold leading-tight
  Body text:         text-base sm:text-lg leading-relaxed text-[#444] (light) or text-white/65 (dark)
  Labels/tags:       text-xs tracking-[0.2em] uppercase font-semibold
  Small/meta:        text-sm text-[#888] or text-white/50

Rules:
  - Headlines get text-balance for even line wrapping
  - Never use more than 3 font sizes on one screen
  - Section labels always uppercase, wide tracking, small size, brand color
  - Use <em className="not-italic text-[#FFB3C1]"> for accent words in dark headlines
  - Use <span className="text-[#87102C]"> for accent words in light headlines
```

---

## DESIGN PATTERNS LIBRARY

Use these named patterns. Mix and match per section.

### Layout Patterns

```
SPLIT-SCREEN HERO
  Two equal columns. Visual on one side (image, illustration, gradient block,
  3D element), text + CTAs on the other. Stacks vertically on mobile.
  Use: Hero, About, Community, Contact

BENTO GRID
  Modular cards in a grid with mixed sizes. Some span 2 columns, some are
  square, some are tall. Popularized by Apple and Linear.
  Use: Culture cards, service info, sermon grid, stats dashboard

CENTERED HERO
  Full-width, text centered, layered background. Mountain illustration or
  gradient behind. CTAs centered below headline.
  Use: Main hero, Scripture section, Give page

STACKED SECTIONS
  Alternating full-width sections, alternating between light (white/blush)
  and dark (burgundy gradient) backgrounds. Creates visual rhythm.
  Use: Overall page composition
```

### Card Patterns

```
GLASSMORPHIC CARD (dark backgrounds only)
  bg-white/5 backdrop-blur-sm border border-white/10
  Hover: bg-white/8 border-white/20
  Content: white text, subtle padding, rounded-xl or rounded-2xl

ELEVATED CARD (light backgrounds)
  bg-white border border-[#E7CDD3]/60 rounded-2xl
  Hover: shadow-[0_8px_40px_rgba(135,16,44,0.1)] border-[#E7CDD3] -translate-y-1
  Content: dark text, generous padding (p-6 or p-8)

INVERTED CARD (one card in a set that's different)
  bg-[#87102C] text-white in a row of light cards
  Creates visual emphasis — "this one matters most"
  Use: The Spirit card in the Culture section

ANCHOR INFO CHIP
  Icon in a colored rounded square (w-11 h-11 rounded-xl bg-[#FFE8ED])
  + label above content (uppercase, tiny, muted)
  + value below (bold, normal size)
  Use: Service details, contact info, stats
```

### Visual Patterns

```
SUBTLE TEXTURE OVERLAY
  Dot pattern or noise at opacity 0.04–0.08 over dark sections.
  Never heavy enough to distract, just enough to add depth.
  CSS: background-image with inline SVG data URI

GRADIENT BLOCK (placeholder for images)
  When no real image exists, use a branded gradient block:
  background: linear-gradient(135deg, #87102C 0%, #4a0819 100%)
  Add dot pattern overlay + centered text/icon inside

MOUNTAIN SILHOUETTE
  Layered SVG peaks at section bottoms/tops as transitions.
  3-4 layers at different opacities (0.03, 0.04, 0.06).
  Creates depth without using real images.

NUMBER ACCENT
  Large faint number (text-5xl text-white/15 font-bold) as decorative
  element in cards. "01", "02", "03", etc.
  Use: Scripture pillars, process steps, features list
```

### Animation Patterns

```
SCROLL REVEAL
  Elements fade up (translateY 28px → 0, opacity 0 → 1) on intersection.
  Duration: 0.65s. Ease: [0.22, 1, 0.36, 1] (custom ease-out).
  Stagger: 0.1–0.12s between siblings.
  Use the existing ScrollReveal component.

HOVER LIFT
  Cards: hover:-translate-y-1 transition-transform duration-300
  Buttons: hover:-translate-y-0.5 hover:shadow-lg

ENTRANCE
  Page-level elements: initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
  Stagger with increasing delay: 0.2, 0.35, 0.5, 0.65, 0.8

SUBTLE FLOAT
  Decorative elements: animate float 6s ease-in-out infinite
  translateY 0 → -10px → 0

GROUP HOVER
  Parent has className="group"
  Children react: group-hover:translate-x-1, group-hover:text-[#87102C],
  group-hover:bg-[#87102C] group-hover:text-white
  Use: Sermon cards (play icon changes on card hover)
```

### CTA Patterns

```
PRIMARY CTA
  px-7 py-3.5 rounded-full bg-[#87102C] text-white text-sm font-semibold
  hover:bg-[#6E0C24] hover:shadow-lg hover:shadow-burgundy/25 hover:-translate-y-0.5
  transition-all duration-200
  Often includes an icon (ArrowRight, Play, Navigation)

SECONDARY CTA
  px-7 py-3.5 rounded-full border border-[#E7CDD3] text-[#87102C] text-sm font-semibold
  hover:bg-[#FFF4F6] transition-colors

GHOST CTA (on dark)
  px-7 py-3.5 rounded-full border border-white/25 text-white text-sm font-semibold
  hover:bg-white/10 transition-all

FULL-BLEED CTA
  w-full py-4 rounded-full — spans container width
  Use for forms, single-action pages

TEXT LINK CTA
  text-[#87102C] text-sm font-semibold flex items-center gap-2
  hover:gap-3 transition-all (gap expands on hover)
  Include ArrowRight icon
```

---

## SECTION LABEL PATTERN

Every section starts the same way:

```tsx
<ScrollReveal>
  <p className="text-[#87102C] text-sm tracking-[0.2em] uppercase font-semibold mb-3">
    Section Label
  </p>
</ScrollReveal>
<ScrollReveal delay={0.1}>
  <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#111] leading-[1.1] tracking-tight text-balance">
    Main Headline Here
  </h2>
</ScrollReveal>
<ScrollReveal delay={0.2}>
  <p className="mt-4 text-[#555] text-base sm:text-lg leading-relaxed">
    Supporting paragraph that explains the section.
  </p>
</ScrollReveal>
```

On dark backgrounds, swap:
```
text-[#87102C]  → text-white/40
text-[#111]     → text-white
text-[#555]     → text-white/55
```

---

## SPACING SYSTEM

```
Section padding:     py-24 md:py-32
Container:           max-w-6xl mx-auto px-5 sm:px-8
Card padding:        p-6 or p-8
Card gap:            gap-5 md:gap-6
Between sections:    Alternating bg colors handle visual separation
Between heading and content:  mb-14 or mb-16
```

---

## RESPONSIVE RULES

```
Mobile-first. Always.

Grid patterns:
  1 col on mobile → 2 cols at sm → 3 cols at lg
  grid sm:grid-cols-2 lg:grid-cols-3

Split layouts:
  Stack on mobile → side-by-side at md or lg
  grid lg:grid-cols-2 gap-12 lg:gap-16

Typography scales:
  text-3xl sm:text-4xl md:text-5xl (headline)
  text-base sm:text-lg (body)

Touch targets:
  All buttons/links minimum 44px tap area
  Mobile nav items: py-3.5 minimum

Test at:
  375px (iPhone SE)
  390px (iPhone 14)
  768px (iPad)
  1024px (desktop)
  1440px (wide desktop)
```

---

## DARK SECTION TEMPLATE

When building any dark section (Scripture, Hero, Give, etc.):

```tsx
<section className="py-24 md:py-36 relative overflow-hidden"
  style={{
    background: "linear-gradient(160deg, #2a0410 0%, #4a0819 30%, #87102C 70%, #a01535 100%)"
  }}
>
  {/* Noise texture */}
  <div className="absolute inset-0 opacity-[0.04]"
    style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`
    }}
  />

  {/* Optional: mountain silhouette at bottom */}
  {/* Optional: radial glow */}

  <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8">
    {/* Content here — use text-white, text-white/55, etc. */}
  </div>
</section>
```

---

## LIGHT SECTION TEMPLATE

```tsx
<section className="py-24 md:py-32 bg-white">  {/* or bg-[#FFF4F6] for alternate */}
  <div className="max-w-6xl mx-auto px-5 sm:px-8">
    {/* Section label + headline */}
    {/* Content */}
  </div>
</section>
```

---

## HOW TO PROMPT FOR SPECIFIC SECTIONS

Use these exact phrases to get consistent results:

```
"Build the /give page as a centered hero on a cosmic dark background with a
split typography headline, bento grid of giving options, and one full-bleed
CTA. Burgundy accent on dark."

"Rebuild the /contact page as a split-screen with glassmorphic info cards
on a dark background. Include location, phone, email, WhatsApp as anchor
info chips. Full-bleed CTA at bottom."

"Create the /sermons page with a featured sermon hero (gradient block with
play button overlay), then a bento grid of recent sermons as elevated cards.
Light background. Each card has thumbnail gradient, series tag, title,
description, and a text-link CTA."

"Build the /first-timer page as a multi-step form with a split-screen layout:
left side has a branded gradient block with encouragement text, right side
has the form steps. Use elevated card style for the form container."

"Create the /connect hub page as a bento grid of form cards — each card is
an elevated card with an icon in a colored rounded square, a title, a short
description, and a primary CTA. 3-column grid on desktop, stacked on mobile."

"Build the dashboard overview page with a bento grid of stat cards (anchor
info chip pattern), an activity feed, and role-aware content. Use the dark
sidebar already in place."
```

---

## QUALITY CHECKLIST — RUN BEFORE FINISHING ANY SECTION

```
☐ Uses brand colors only (no default Tailwind grays/blues)
☐ Section label follows the uppercase/tracking/burgundy pattern
☐ Headlines use text-balance
☐ ScrollReveal applied to all above-fold elements
☐ Cards have hover states (lift, shadow, or border change)
☐ CTAs have hover states (color shift + shadow + slight lift)
☐ Mobile responsive — tested at 375px
☐ Spacing feels generous, not cramped
☐ At most 2-3 font sizes visible on screen at once
☐ Dark sections have texture overlay
☐ No raw hex colors — use the defined palette
☐ Accessibility: all buttons have accessible names, proper contrast
☐ No placeholder text like "Lorem ipsum" — use real church copy
☐ Icons are from lucide-react, size 15-22, consistent per context
☐ Animations are subtle — enhance, never distract
```

---

## WHAT NOT TO DO

```
✗ Don't use rounded-sm or rounded-md — use rounded-xl or rounded-2xl
✗ Don't use gray backgrounds — use white, blush, or pale pink
✗ Don't use more than ONE accent color per section
✗ Don't make every element bold — hierarchy needs quiet elements too
✗ Don't use stock photos — use gradient blocks with icons/text instead
✗ Don't center-align body paragraphs — left-align, max-width constrained
✗ Don't use shadows on dark backgrounds — use border + backdrop-blur
✗ Don't use default browser focus rings — use focus-visible with burgundy
✗ Don't make sections shorter than py-24 — sections need breathing room
✗ Don't put two dark sections next to each other — alternate light/dark
```

---

## EXISTING COMPONENTS TO REUSE

```
ScrollReveal          — scroll-triggered animation wrapper
MountainLogo          — inline SVG logo mark (takes scrolled prop)
MountainRange         — SVG section divider
Navbar                — fixed top nav with scroll behavior + mobile menu
Footer                — dark footer with social links
DashboardShell        — sidebar + topbar + content slot
Sidebar               — role-filtered navigation
MobileBottomNav       — bottom tabs for mobile dashboard
```

---

## START EVERY BUILD WITH

1. Identify the section type: hero, content, form, grid, dashboard
2. Pick the layout pattern: split-screen, centered, bento, stacked
3. Pick the color mode: light or dark
4. Pick the card style: elevated, glassmorphic, or inverted
5. Write the content first, then wrap it in the design system
6. Apply ScrollReveal to all elements
7. Test at 375px before calling it done
