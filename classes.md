# EHC Membership Class: Page and Module Reference
> From attending to belonging. A four-week journey rendered in deep black, burgundy and gold, with frosted glass and editorial serif type that carries the weight of a sanctuary.

The Membership Class page is where a first-timer becomes part of Everlasting Hills Church. It should feel like the rest of the EHC website: a near-black canvas with a soft burgundy glow, white frosted-glass cards, DM Serif Display headlines, and gold reserved for scripture and moments of honor. Light blush sections give the curriculum room to breathe. Burgundy is the only action color.

**Theme:** mixed (dark hero and closing band, light content sections)

Brand colors, fonts and easing come from the EHC brand system. Type scale, spacing and radii are proposed values in the same spirit; confirm them against the live site before shipping. HTML or component examples are reconstructions, not source components.

Anchor verse: Genesis 49:26. Tagline: *Planted by God, Preserved in Prayer.*

---

## Overview

| Item | Value |
|------|-------|
| Module | Membership Class (one of four EHC classes) |
| Audience | First-timers who have attended at least 4 weeks |
| Length | 4 weeks, 20 lessons, in-person sessions plus online lessons |
| Flow | Belong → Believe → Walk → Go |
| Public page | `everlastinghills.church/classes/membership` |
| Portal | `membership.everlastinghills.church` |
| Registration | `membership.everlastinghills.church/register` |
| Class home | `membership.everlastinghills.church/classes/membership` |
| Lesson | `membership.everlastinghills.church/classes/membership/[week]/[lesson-slug]` |
| Stack | Next.js 14 App Router, TypeScript, Tailwind, Framer Motion, NestJS, Supabase |

### The four EHC classes

| Class | Purpose |
|-------|---------|
| Believers Class | New or untaught believers. Salvation, identity in Christ, prayer, forgiveness, taught extensively |
| Membership Class | New members joining the church. Belonging to the EHC family |
| Discipleship Class | [one-line description] |
| Foundation School | Workers in training. Teaches extensively, including the culture of the house |

The Membership Class teaches belonging. Doctrine is taught as an overview and points to Believers Class for depth. Culture, honor and conduct are taught as expectations and point to Foundation School for depth.

---

## Tokens: Colors

| Name | Value | Token | Role |
|------|-------|-------|------|
| Ink | `#080808` | `--color-ink` | Dark canvas for hero and closing band; primary text on light sections |
| Burgundy | `#87102C` | `--color-burgundy` | The only action color. Primary buttons, active states, progress fill, links on light |
| Deep Burgundy | `#4a0819` | `--color-deep-burgundy` | Hover/pressed state for burgundy, radial glow behind the hero |
| Crimson | `#8B1A3A` | `--color-crimson` | Secondary accent. Week numerals, small highlights, gradient partner to burgundy |
| Gold | `#C8A04A` | `--color-gold` | Honor accent. Scripture references, the italic emphasis word on dark, completion badge, "You are here" marker |
| Blush | `#FBEAF0` | `--color-blush` | Light section background for curriculum and FAQ |
| Chip | `#FFE8ED` | `--color-chip` | Chip and tag fills, lesson-count badges, eligibility pill on light |
| Pink Border | `#E7CDD3` | `--color-pink-border` | Hairline borders, dividers and accordion separators on light sections |
| White | `#ffffff` | `--color-white` | Text on dark and on burgundy, card surface on light |
| Glass | `rgba(255,255,255,0.06)` | `--color-glass` | Frosted card fill on dark surfaces |
| Glass Border | `rgba(255,255,255,0.12)` | `--color-glass-border` | Hairline on glass cards |
| Muted on Dark | `rgba(255,255,255,0.64)` | `--color-muted-dark` | Secondary text on ink |
| Muted on Light | `rgba(8,8,8,0.60)` | `--color-muted-light` | Secondary text on white and blush |

---

## Tokens: Typography

### DM Serif Display: display headlines, section titles, week titles, scripture pull quotes · `--font-display`
- **Weights:** 400 (the family ships one weight), plus italic
- **Sizes:** 32px, 40px, 48px, 64px, 80px
- **Line height:** 0.95 to 1.10
- **Letter spacing:** -0.02em at 64px and above, -0.01em at 40 to 48px, normal at 32px
- **Role:** All display and section headings. One italic word per hero or section headline carries the emphasis (see Italic Emphasis System).

### Instrument Sans: body, UI, buttons, navigation, lesson text, labels · `--font-sans`
- **Weights:** 400, 500, 600
- **Sizes:** 12px, 14px, 16px, 18px, 20px, 24px
- **Line height:** 1.30 to 1.60
- **Letter spacing:** -0.01em at 20px and above, normal below; +0.08em for uppercase labels
- **Role:** Everything that is read or clicked. 16px/400 is default body. 500 for buttons and labels. 600 only for small uppercase eyebrows.

### Type Scale (proposed)

| Role | Family | Weight | Size | Line Height | Letter Spacing | Token |
|------|--------|--------|------|-------------|----------------|-------|
| eyebrow | Instrument Sans | 600 | 12px | 1.2 | 0.08em, uppercase | `--text-eyebrow` |
| caption | Instrument Sans | 400 | 14px | 1.4 | 0 | `--text-caption` |
| body | Instrument Sans | 400 | 16px | 1.6 | 0 | `--text-body` |
| body-lg | Instrument Sans | 400 | 18px | 1.55 | -0.005em | `--text-body-lg` |
| lead | Instrument Sans | 400 | 20px | 1.5 | -0.01em | `--text-lead` |
| title-sm | DM Serif Display | 400 | 32px | 1.1 | 0 | `--text-title-sm` |
| title | DM Serif Display | 400 | 40px | 1.05 | -0.01em | `--text-title` |
| heading | DM Serif Display | 400 | 48px | 1.0 | -0.01em | `--text-heading` |
| heading-lg | DM Serif Display | 400 | 64px | 0.98 | -0.02em | `--text-heading-lg` |
| display | DM Serif Display | 400 | 80px | 0.95 | -0.02em | `--text-display` |

On mobile, step display down to 48px and heading to 36px.

---

## Tokens: Spacing, Shapes and Motion

**Base unit:** 4px · **Density:** spacious, calm

### Spacing Scale

| Name | Value | Token |
|------|-------|-------|
| 4 | 4px | `--space-4` |
| 8 | 8px | `--space-8` |
| 12 | 12px | `--space-12` |
| 16 | 16px | `--space-16` |
| 24 | 24px | `--space-24` |
| 32 | 32px | `--space-32` |
| 40 | 40px | `--space-40` |
| 48 | 48px | `--space-48` |
| 64 | 64px | `--space-64` |
| 96 | 96px | `--space-96` |
| 128 | 128px | `--space-128` |

### Border Radius (proposed)

| Element | Value |
|---------|-------|
| cards (glass and light) | 20px |
| accordion items | 16px |
| inputs | 12px |
| buttons | 999px (pill) |
| chips and badges | 999px |
| progress bar | 999px |

### Layout

- **Page max-width:** 1200px (reading column for intro and lessons: 680px)
- **Section gap:** 96 to 128px desktop, 64px mobile
- **Card padding:** 32px desktop, 24px mobile
- **Element gap:** 12 to 24px
- **Mobile gutter:** 16px, no horizontal scroll

### Motion

| Token | Value | Use |
|-------|-------|-----|
| `--ease-ehc` | `cubic-bezier(0.22, 1, 0.36, 1)` | All entrances, accordions, progress fills |
| `--dur-fast` | 200ms | Hover, press, chip toggles |
| `--dur-base` | 400ms | Accordion open, card reveal |
| `--dur-slow` | 700ms | Hero headline and journey stepper reveal |

Reveal on scroll with a 16px upward drift and fade. Respect `prefers-reduced-motion` by removing drift and keeping opacity only.

---

## Page Structure

Order of sections on the public page `everlastinghills.church/classes/membership`, with the surface each sits on. Every "Start" or "Register" button links to `membership.everlastinghills.church`.

| # | Section | Surface |
|---|---------|---------|
| 1 | Hero | Ink with burgundy glow |
| 2 | Introduction | White |
| 3 | Who this class is for + eligibility status | White |
| 4 | What you'll gain | Blush |
| 5 | The journey (Belong → Believe → Walk → Go) | Ink |
| 6 | Curriculum (4 week accordions) | Blush |
| 7 | How it works | White |
| 8 | Your growth journey at EHC (class pathway) | White |
| 9 | Meet your facilitators | Blush |
| 10 | FAQs | White |
| 11 | Closing call to action | Ink with burgundy glow |

---

## Content

Text in [brackets] is a placeholder to fill in.

### 1. Hero

- **Eyebrow:** MEMBERSHIP CLASS
- **Headline:** Belong. Believe. Walk. *Go.* (italic emphasis on "Go.")
- **Supporting line:** A four-week journey into the life, faith and family of Everlasting Hills Church.
- **Buttons:** `Start the Class` (primary) · `Check Eligibility` (glass)
- **Footnote:** Genesis 49:26 (gold, small)

### 2. Introduction

> Welcome home.
>
> If you have been worshipping with us for a few weeks, you have already felt something of who we are. The Membership Class is where you go from attending EHC to belonging to EHC.
>
> Over four weeks, we will walk you through our story, what we believe, how we live as a family, and how you can take your place in the house. This is not a course to pass. It is an invitation to be planted.
>
> Our prayer is that by the end, you will not only know EHC, but know that you are a vital part of it.

### 3. Who this class is for

- You have attended EHC services for **at least 4 weeks**
- You want to make EHC your church home
- You want to understand what we believe and how we do life together

Eligibility status card (see States): "You're eligible: Start now." or "Keep attending: [X] of 4 weeks complete."

### 4. What you'll gain

- A clear picture of who EHC is and where we are going
- A firm grasp of the core truths we stand on
- Practical habits for your walk with God
- Real connection through a Home Cell and the church family
- A clear next step for your growth and service

### 5. The journey

| Stage | Week | Focus |
|-------|------|-------|
| Belong | Week 1 | Becoming part of the house |
| Believe | Week 2 | The truths we stand on |
| Walk | Week 3 | Living it out daily |
| Go | Week 4 | Order, honor and mission |

### 6. Curriculum

#### Week 1: Welcome to the House
*You belong here. Discover who we are and where you fit.*

1. **Welcome and Orientation:** How the class works and what to expect.
2. **Introduction to EHC, Vision and Mission:** Our story, our calling, and where God is taking us.
3. **What It Means to Be Part of the Church:** Salvation and membership in the body of Christ.
4. **Why Belong to a Church Family:** The bond that holds us together and why no believer should walk alone.
5. **Home Cell, and Why:** Where church gets personal, and how to join one.

#### Week 2: What We Believe
*The truths we stand on.*

1. **Who Really Is Jesus?** The person of Christ and the Trinity, clearly explained.
2. **The Holy Spirit as Lord:** Knowing Him as a person, not just a power.
3. **Fruit of the Spirit:** The character God grows in us.
4. **Gifts of the Spirit:** The grace God gives through us.
5. **Basic Biblical Doctrine:** A summary of what EHC believes.

#### Week 3: How We Walk
*Faith lived out, every day.*

1. **Prayer:** Building a life of communion with God.
2. **Personal and Daily Devotion:** Meeting God in His Word daily.
3. **Love Walk:** How we treat one another as family.
4. **Welfare:** How we care for one another in need.
5. **Living With Purpose in Mind:** Discovering why God placed you here.

#### Week 4: Order and Mission
*Honoring the house and reaching the world.*

1. **Church Service Conduct:** How we behave in the house of God (1 Timothy 3:14-15).
2. **Spiritual Leadership and Honor:** Knowing and honoring those who watch over your soul.
3. **Shining Light:** Living as light in your world. [adjust to match the lesson]
4. **How to Evangelize:** Sharing your faith simply and confidently.
5. **What Next:** Your path forward at EHC, plus the class conclusion.

### 7. How it works

- **Format:** Weekly in-person sessions, with online lessons to watch before or after each one
- **Duration:** 4 weeks, [day and time]
- **Each lesson includes:** a short video, key scriptures, a summary, a reflection question, a short quiz, one action step
- **Cohorts:** New classes begin [monthly / date]
- **Completion:** Finish all lessons and attend the sessions to be recognised as a member of EHC

### 8. Your growth journey at EHC

Pathway graphic, Membership Class marked "You are here" in gold. Arrange to match the actual order of progression.

- **Believers Class:** The essentials every believer should know
- **Membership Class:** Belonging to the EHC family
- **Discipleship Class:** [one-line description]
- **Foundation School:** Training for workers, including the culture of the house

### 9. Meet your facilitators

Photo, name, role, one-line bio per facilitator.

### 10. FAQs

- **Do I have to complete the class to become a member?** [Your answer]
- **What if I miss a session?** You can catch up through the online lesson and [makeup arrangement].
- **Is there a cost?** [Free / details]
- **I'm not sure I'm saved. Is this class for me?** You're welcome to join. We may also guide you to the Believers Class.
- **How long does each session take?** [Duration]
- **I filled the first-timer form. How do I get my login?** Register for this class with the phone number or email you used on the form. We'll send you a code to set up your account.

### 11. Closing call to action

- **Headline:** Your place in the house is *waiting.*
- **Button:** `Start the Membership Class`
- **Tagline:** Planted by God, Preserved in Prayer.

---

## Access and Account Flow

```
First-timer form  →  person record + account (status: provisioned, not handed over)
        ↓  attends services (check-ins attach to that account from day one)
Registers for Membership Class  →  OTP verify  →  account activated
        ↓
Member-in-training  →  completes class  →  Pastor/Admin confirms  →  full member

Exception path: Admin activates early (reason recorded)
```

### Rules

- The first-timer form is the single entry point. Submitting it provisions the account automatically so attendance is tracked from the first service.
- A provisioned account cannot log in. Activation is the hand-over: via class registration OTP (normal path) or admin action (exception path, with reason logged).
- Check-in never requires the person to log in: usher or admin lookup by name or phone, kiosk phone entry, or QR.
- Attendance should reference the stable person/profile ID, not the login record.
- Class access comes from an enrollment row, not a new role. The six roles stay unchanged.
- Members-in-training get the Member role with `membership_status = in_training`. A short, explicit list of features waits for `full`: [unit service / Foundation School, member directory, leadership or voting, welfare (decide)].
- Completing the class creates a "ready for membership" item. A Pastor or Admin confirms it, which sets `membership_status = full`.
- If someone registers before 4 weeks, place them in the next cohort that starts after they become eligible.
- No progress for [3] weeks flags a follow-up to the cell leader or facilitator. Unfinished members roll into the next cohort; access is not removed.

### Account States

| State | Can log in | Class access | Shown on page |
|-------|-----------|--------------|---------------|
| provisioned | No | None | Eligibility card: "[X] of 4 weeks" or "Register now" |
| active · in_training | Yes | Enrolled class | Progress card, Continue button |
| active · full | Yes | Completed classes + next class | Certificate, next class CTA |
| active · exception | Yes | As assigned | Same as in_training |

### Domains

| Domain | Purpose | Auth |
|--------|---------|------|
| `everlastinghills.church` | Public website, class landing pages | None required; reads session only to switch buttons |
| `membership.everlastinghills.church` | Member portal: registration, OTP, classes, lessons, progress, member features | Required (except `/register`) |

- Scope the Supabase session cookie to `.everlastinghills.church` so the public site can tell a visitor is logged in and change "Start the Class" to "Continue", without asking them to log in twice.
- Set `SameSite=Lax`, `Secure` and `HttpOnly` on that cookie. Authorization still happens server side on the portal; the public site only reads login state for display.
- Add both origins to Supabase Auth redirect URLs and to the NestJS CORS allowlist.
- Logged-out portal visits redirect to `membership.everlastinghills.church/register`, not to a bare login screen, because most new people have a provisioned account they have never used.

### Registration Flow (`membership.everlastinghills.church/register`)

1. Enter the phone number or email used on the first-timer form
2. Receive and enter OTP
3. System finds the provisioned account and reads attendance
4. Eligible: set password, enroll in current cohort, land in portal
5. Not yet eligible: enroll in the next eligible cohort, show "[X] of 4 weeks"
6. No match: "We couldn't find your record. Our team will reach out." Request goes to the admin queue

---

## Lesson Anatomy (LMS)

Every lesson uses the same structure.

| Block | Content |
|-------|---------|
| Outcome | One line: "By the end, you can..." |
| Video | 8 to 12 minutes, YouTube unlisted to start |
| Scriptures | Key references in gold, expandable text |
| Summary | One short paragraph |
| Reflection | One question, private answer field |
| Quiz | 3 to 5 questions, graded server side |
| Action step | One practical step, self-checked or leader-verified |

---

## Components

### Primary Button
**Role:** Start the Class, Register, Continue

Burgundy `#87102C` fill, white text, pill radius, Instrument Sans 500 at 16px, padding 14px 28px. Hover to Deep Burgundy `#4a0819` with a 200ms `--ease-ehc` transition. One primary button per viewport.

### Glass Button
**Role:** Secondary action on dark surfaces (Check Eligibility)

`--color-glass` fill, 1px `--color-glass-border`, `backdrop-filter: blur(16px)`, white text, pill radius, same type and padding as primary.

### Outline Button
**Role:** Secondary action on light surfaces

1px burgundy border, burgundy text, transparent fill, pill radius. Hover fills with Chip `#FFE8ED`.

### Hero
**Role:** Page opener

Full-bleed Ink `#080808` with a radial Deep Burgundy glow (`radial-gradient(60% 50% at 70% 30%, rgba(135,16,44,0.35), transparent)`). Eyebrow in gold. Headline in DM Serif Display 80px white with one italic gold word. Supporting line Instrument Sans 20px muted-on-dark. Buttons below. On desktop, right side holds a glass card preview of the four-week journey.

### Eligibility Status Card
**Role:** Shows where the visitor stands

White card, 20px radius, 1px Pink Border, 24px padding. Left: eyebrow "YOUR STATUS". Center: state message. Right: 4 dot indicator, filled dots in burgundy, empty dots in Pink Border. Eligible state adds a Chip pill "Eligible" and the primary button.

### Journey Stepper
**Role:** Belong → Believe → Walk → Go

Four glass cards in a row on Ink, connected by a thin gold line. Each card: week number in Crimson (DM Serif Display 48px), stage name in white (DM Serif Display 32px), focus line in muted-on-dark. Stacks vertically on mobile with the line running down the left.

### Week Accordion
**Role:** Curriculum

White item on Blush section, 16px radius, 1px Pink Border, 24px padding. Header: "Week 1" eyebrow, title in DM Serif Display 32px, italic subtitle, Chip badge "5 lessons", chevron. Opens with 400ms `--ease-ehc`. Inside: numbered lesson rows.

### Lesson Row
**Role:** One lesson inside a week

Number in Crimson, title in Instrument Sans 500 16px, description in caption muted-on-light. Logged-in: right side shows status (locked, not started, in progress, done). Done uses a burgundy check.

### Progress Card (logged in)
**Role:** Enrolled member's progress

Glass card on Ink or white card on light. "Week 2 of 4" eyebrow, percentage in DM Serif Display 48px, progress bar (Pink Border track, burgundy fill, pill radius, 8px tall), next live session line, `Continue` primary button.

### Action Step Checklist
**Role:** Tracks real-world steps (joined a Home Cell, read a passage)

Rows with a circular checkbox, label, and a "Verified by leader" chip where applicable. Checked boxes fill burgundy with a white tick.

### Class Pathway
**Role:** Shows the four EHC classes

Horizontal track of four nodes on white. Current class node filled burgundy with a gold "You are here" tag. Completed nodes burgundy outline with check. Future nodes Pink Border outline.

### Facilitator Card
**Role:** Puts faces to the teachers

White card on Blush, 20px radius, circular photo 72px, name in DM Serif Display 24px, role eyebrow, one-line bio.

### Scripture Reference
**Role:** Inline and pull-quote scripture

Inline: gold text, Instrument Sans 500. Pull quote: DM Serif Display italic 32px, left border 2px gold, reference below in gold eyebrow.

### Input and OTP Field
**Role:** Registration

White fill, 1px Pink Border, 12px radius, padding 14px 16px, Instrument Sans 16px Ink text. Focus: 2px burgundy border, no glow. OTP: six 48px square cells, 12px radius, auto-advance.

### Completion Badge and Certificate
**Role:** Celebrates finishing

Gold ring badge with burgundy center, EHC mark, "Member of Everlasting Hills Church", date, Genesis 49:26 footer.

---

## Do's and Don'ts

### Do
- Use DM Serif Display for every heading and Instrument Sans for everything read or clicked
- Keep burgundy as the only action color and use one primary button per viewport
- Reserve gold for honor: scripture, the italic emphasis word on dark, "You are here", completion
- Use frosted glass cards only on Ink surfaces, and white cards with Pink Border on light surfaces
- Animate with `cubic-bezier(0.22, 1, 0.36, 1)` and respect reduced motion
- Keep body text left-aligned and the reading column at 680px
- Show the person's real status (eligibility, progress, next step) wherever they are logged in
- Point to Believers Class and Foundation School instead of over-teaching their topics

### Don't
- Don't use em dashes anywhere in copy or UI text
- Don't use gold for body text on white or blush; it fails contrast
- Don't introduce blue, green or other cool accents
- Don't put glass cards on light sections or heavy shadows on any card
- Don't stack more than one italic emphasis word per headline
- Don't ask a provisioned user to "log in"; always route them through registration and OTP
- Don't use the phone number as a password
- Don't make completion automatically grant full membership; it goes to a Pastor or Admin

---

## Italic Emphasis System

One word per hero or section headline is set in DM Serif Display italic. It must be the climax of the sentence ("Go.", "waiting.", "belong"). On Ink, the italic word is gold. On light surfaces, it is burgundy. Never use it in body copy, buttons or lesson titles.

---

## Surfaces

| Level | Name | Value | Purpose |
|-------|------|-------|---------|
| 0 | Ink | `#080808` | Hero, journey and closing band |
| 0 | White | `#ffffff` | Default light canvas |
| 1 | Blush | `#FBEAF0` | Alternating light sections (curriculum, gains, facilitators) |
| 2 | Glass | `rgba(255,255,255,0.06)` + blur | Cards on Ink |
| 2 | White Card | `#ffffff` + Pink Border | Cards on Blush |
| 3 | Burgundy | `#87102C` | Primary buttons, progress fill, selected states |

## Elevation

Depth comes from the contrast between Ink and light sections, glass blur, and hairline borders. The only shadow allowed is a soft one on glass cards over the hero: `0 8px 32px rgba(0,0,0,0.35)`. Light cards use borders, not shadows.

## Imagery

Warm, real photography from EHC services, Home Cells and fellowship: people worshipping, praying together, laughing over a meal. No stock imagery. Grade photos warm with deep shadows so they sit naturally on Ink. Use the EHC mountain mark subtly as a watermark in the closing band. Icons are thin line icons in white on dark and Ink on light.

## Layout

Centered 1200px column. Hero is full-bleed Ink, two columns on desktop (headline left, journey preview right), single column on mobile. Sections alternate between white and Blush, with Ink bands for the journey and closing call. Curriculum accordions sit in an 800px column. Lessons and intro text use a 680px reading column. Spacious rhythm: 96 to 128px between sections, 32px card padding.

---

## Agent Prompt Guide

**Quick Color Reference**
- text on light: `#080808`
- text on dark: `#ffffff`
- light background: `#ffffff` / `#FBEAF0`
- dark background: `#080808`
- border on light: `#E7CDD3`
- primary action: `#87102C` (hover `#4a0819`)
- honor accent: `#C8A04A`
- secondary accent: `#8B1A3A`

**Example Component Prompts**

1. Build the hero: full-bleed `#080808` with a radial burgundy glow top right. Eyebrow "MEMBERSHIP CLASS" in Instrument Sans 600 12px uppercase, gold. Headline "Belong. Believe. Walk. Go." in DM Serif Display 80px white, "Go." italic in gold. Supporting line Instrument Sans 20px at 64% white. Primary pill button "Start the Class" in `#87102C`, glass pill button "Check Eligibility".

2. Build a week accordion: white item, 16px radius, 1px `#E7CDD3` border, 24px padding on a `#FBEAF0` section. Eyebrow "WEEK 1", title "Welcome to the House" in DM Serif Display 32px, italic subtitle, chip "5 lessons" in `#FFE8ED` with burgundy text. Opens with 400ms `cubic-bezier(0.22, 1, 0.36, 1)` to a numbered lesson list.

3. Build the progress card: glass card on `#080808`, 20px radius, blur 16px. Eyebrow "WEEK 2 OF 4", "45%" in DM Serif Display 48px white, 8px pill progress bar with `#E7CDD3` track and `#87102C` fill, "Next session: [date]" caption, primary "Continue" button.

4. Build the eligibility card: white, 20px radius, 1px `#E7CDD3` border. Eyebrow "YOUR STATUS". Message "Keep attending: 3 of 4 weeks complete". Four 12px dots, three burgundy and one `#E7CDD3`.

5. Build the class pathway: four nodes on a thin line. Membership node filled `#87102C` with a gold "You are here" tag. Labels in Instrument Sans 500 14px.

---

## Quick Start

### CSS Custom Properties

```css
:root {
  /* Colors */
  --color-ink: #080808;
  --color-burgundy: #87102C;
  --color-deep-burgundy: #4a0819;
  --color-crimson: #8B1A3A;
  --color-gold: #C8A04A;
  --color-blush: #FBEAF0;
  --color-chip: #FFE8ED;
  --color-pink-border: #E7CDD3;
  --color-white: #ffffff;
  --color-glass: rgba(255, 255, 255, 0.06);
  --color-glass-border: rgba(255, 255, 255, 0.12);
  --color-muted-dark: rgba(255, 255, 255, 0.64);
  --color-muted-light: rgba(8, 8, 8, 0.60);

  /* Fonts */
  --font-display: 'DM Serif Display', Georgia, serif;
  --font-sans: 'Instrument Sans', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;

  /* Type scale */
  --text-eyebrow: 12px;
  --text-caption: 14px;
  --text-body: 16px;
  --text-body-lg: 18px;
  --text-lead: 20px;
  --text-title-sm: 32px;
  --text-title: 40px;
  --text-heading: 48px;
  --text-heading-lg: 64px;
  --text-display: 80px;

  /* Spacing */
  --space-4: 4px;
  --space-8: 8px;
  --space-12: 12px;
  --space-16: 16px;
  --space-24: 24px;
  --space-32: 32px;
  --space-40: 40px;
  --space-48: 48px;
  --space-64: 64px;
  --space-96: 96px;
  --space-128: 128px;

  /* Radius */
  --radius-card: 20px;
  --radius-accordion: 16px;
  --radius-input: 12px;
  --radius-pill: 999px;

  /* Layout */
  --page-max-width: 1200px;
  --reading-width: 680px;

  /* Motion */
  --ease-ehc: cubic-bezier(0.22, 1, 0.36, 1);
  --dur-fast: 200ms;
  --dur-base: 400ms;
  --dur-slow: 700ms;

  /* Effects */
  --glass-blur: 16px;
  --shadow-glass: 0 8px 32px rgba(0, 0, 0, 0.35);
}
```

### Tailwind (tailwind.config.ts, v3)

```ts
import type { Config } from 'tailwindcss';

export default {
  theme: {
    extend: {
      colors: {
        ink: '#080808',
        burgundy: { DEFAULT: '#87102C', deep: '#4a0819' },
        crimson: '#8B1A3A',
        gold: '#C8A04A',
        blush: '#FBEAF0',
        chip: '#FFE8ED',
        'pink-border': '#E7CDD3',
      },
      fontFamily: {
        display: ['"DM Serif Display"', 'Georgia', 'serif'],
        sans: ['"Instrument Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        eyebrow: ['12px', { lineHeight: '1.2', letterSpacing: '0.08em' }],
        caption: ['14px', { lineHeight: '1.4' }],
        body: ['16px', { lineHeight: '1.6' }],
        lead: ['20px', { lineHeight: '1.5', letterSpacing: '-0.01em' }],
        'title-sm': ['32px', { lineHeight: '1.1' }],
        title: ['40px', { lineHeight: '1.05', letterSpacing: '-0.01em' }],
        heading: ['48px', { lineHeight: '1', letterSpacing: '-0.01em' }],
        'heading-lg': ['64px', { lineHeight: '0.98', letterSpacing: '-0.02em' }],
        display: ['80px', { lineHeight: '0.95', letterSpacing: '-0.02em' }],
      },
      borderRadius: { card: '20px', accordion: '16px', input: '12px' },
      maxWidth: { page: '1200px', reading: '680px' },
      transitionTimingFunction: { ehc: 'cubic-bezier(0.22, 1, 0.36, 1)' },
      boxShadow: { glass: '0 8px 32px rgba(0, 0, 0, 0.35)' },
    },
  },
} satisfies Partial<Config>;
```

### Framer Motion

```ts
export const ease = [0.22, 1, 0.36, 1] as const;

export const reveal = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease } },
};
```