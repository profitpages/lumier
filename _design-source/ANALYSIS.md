# Lumière: design analysis (Stage 1)

Source: Canva site `wonderland-toys.my.canva.site/luxury-beauty-shopify-theme/` (home, `/page-2` product, `/page-3` collection).
The pages are Canva Code embeds. Their markup and CSS were pulled from `_assets/remote/embed/codelet/<id>/index.html`; copy and colors come from the page JSON.
Captures are in `screens/`, and extracted CSS and copy are in `home|product|collection.css/.json`.

## Personality
Quiet luxury and editorial. Lumière is the opposite of a candy-coloured beauty theme: espresso type on ivory paper, near-square
editorial cards with hairline borders, arches and single curved corners, champagne "shadow slabs" (solid offset shadows),
tilted polaroid product shots and a soft glow orb. The look is restrained, typographic and photographic.

## Color system
| Token | Hex | Use |
|---|---|---|
| Ivory | `#f8f4ed` | page background |
| Paper | `#fffdf9` | cards, trust strip, alternating bands |
| Linen | `#eee2d6` | hero stage |
| Sand | `#e9ddd2` / `#f0e4da` | newsletter panel, ingredient panel, home footer |
| Blush | `#e9cbc5` (`#dfaca0` on PDP) | story band, promo band, concern accents, buttons on dark |
| Rose | `#b77c74` | focus rings, kicker on PDP (`#8c635c`), hover accents |
| Champagne | `#d6bb89` | offset slab shadow (at 35% alpha), badges ("Editor's pick") |
| Espresso | `#2d201c` | text, primary buttons, announcement, dark bands, footer |
| Cocoa | `#342521` / `#654b44` | newsletter band on the PDP |
| Muted | `#806f66` | secondary text |
| Line | `rgba(70,49,38,.15)` / `#e5d9cc` | hairlines |

These become 8 color schemes: Ivory, Paper, Linen, Blush, Sand, Espresso, Cocoa and Champagne.

## Typography
- **Fraunces** (opsz 9..144, weights 400–600) for display and headings. On the PDP the title is set very tight (`letter-spacing:-.055em`, line-height .95).
- **DM Sans** for body and UI. The collection page uses Work Sans; DM Sans is kept everywhere for consistency (both are geometric grotesques).
- Eyebrow/kicker: 0.68–0.69rem, weight 700, letter-spacing .16em, uppercase.
- Wordmark: uppercase, letter-spacing .16–.19em. It is Fraunces on the PDP/collection pages and DM Sans bold on home. The theme uses Fraunces with a toggle.
- Nav: 0.72–0.83rem. Uppercase and tracked on the PDP, sentence case on home (setting).
- Scale: hero 4.4–5rem, section titles clamp(2rem, 3.5vw, 3.7rem), card titles 1.15–1.25rem.

## Shape, depth, spacing
- Container: 1180px on home, 1400px editorial on the PDP. Default 1280 with a 24–72px fluid gutter.
- Radii: home cards are square (0–2px). PDP surfaces are soft (gallery 1.7rem, panels 1.6rem, cards 1.3rem, options .8rem). Buttons are pills (999px), and the add-to-bag button is .85rem.
  → Settings: card radius (default 2px), media radius (default 28px), button radius (pill).
- Signature shapes: the arch (`220px 220px 0 0`), the single curved corner (`0 150px 0 0`), and circles (blush dot, glow orb).
- Shadows: soft drop `0 20px 48px rgba(67,45,34,.12)`, and the **slab** (solid offset): `18px 25px 0 champagne/35%` or `20px 24px 0 #eadbd2`.
- Grain: dotted radial texture (`7px` grid) on stages.
- Section rhythm is about 96px desktop and 56–64px mobile.

## 2.5D system (reusable)
1. **Glow orb**: a large, blurred ivory circle behind the hero art.
2. **Arch frame**: the main image in an arch with a champagne slab shadow.
3. **Polaroids**: 1–2 small tilted product frames floating over the arch (±5°). They lift and tilt on hover.
4. **Curved-corner frame**: an image with one large rounded corner, plus a soft shadow.
5. **Offset slab**: a solid colored block offset behind an image (collection hero, promo).
6. **Accent dot**: a blush circle overlapping the frame corner.
7. **Caption chip**: a small paper chip over the image ("Glow, bottled", "A daily ritual, beautifully considered").
8. **Card lift**: on hover, cards rise 8px with a soft shadow and the image zooms 5%.
All of these are separate elements (HTML/CSS), never baked into a background image. Motion respects `prefers-reduced-motion`.

## Page and section map
**Header group:** announcement (espresso, centred, rotating), header (wordmark left, centred nav, search/account/bag right, frosted ivory, sticky).

**Home**
1. Hero: kicker, display title, text, 2 CTAs. Art: glow orb, arch image with slab, 2 polaroids.
2. Trust strip: 3 statements with hairline dividers on paper.
3. "The edit": 4 product cards (paper, hairline, 12px inset, title/price, subtitle, rating, underlined Quick add).
4. Shop by concern: 4 photo cards (image, serif title, text, DISCOVER link).
5. The ingredient edit: curved-corner image and tabs (Hyaluronic Acid / Rosehip Oil / Peptides).
6. Skin, in soft focus: text with a curved-corner image and a "Reveal image" range (before/after).
7. Notes from our community (espresso): rating, big quote, author, arrows, a 3-photo mosaic and a "Shop the look" tile.
8. FAQ: narrow centred accordion.
9. Everyday luxury, considered (blush): text, bullet list, outline CTA, curved-corner image.
10. Gift sets & limited editions: cards with a label eyebrow, price · note, and a pill Quick add.
11. Skin first (blush): image with offset frame, copy and CTA.
12. The three-step ritual: tabs with a progress line. Each panel has a step, title and text plus a recommended product with quick add.
13. Quote band (espresso), centred testimonial.
14. Notes from Lumière: newsletter panel (sand).
15. Footer (sand on home, espresso elsewhere): brand and 3 menus.

**Product**
1. Breadcrumb.
2. Gallery: vertical thumbs, soft 1.7rem stage, caption chip.
3. Info: eyebrow (vendor / type), very large title, rating link, subtitle, price with stock, badges, option cards with a sub-label, quantity with a usage note, Add to bag with a wishlist square, and a shipping note.
4. The glow standard (sand): kicker left, big statement right, 3 benefits with icons and top hairlines.
5. The formula: heading left, ingredient tabs with a panel card (copy and image).
6. How to use (espresso): 3 large numerals with title and text.
7. The veil effect: copy beside a split before/after with labels.
8. Every last detail: heading left, accordions right.
9. Pairs beautifully with (sand): recommendations as rounded cards with a pill quick add.
10. Loved in every light: rating summary and review cards (app slot, no invented reviews).
11. Recently viewed.
12. Newsletter band (cocoa, rose orb).
13. Footer (espresso).

**Collection**
1. Breadcrumb.
2. Collection hero: eyebrow ("Collection 01"), title, description, product count, image with a slab, accent dot and caption chip.
3. Shop by concern: chips.
4. Toolbar: Filter (drawer), count, sort.
5. Grid of 4: image cards with a badge top-left (Bestseller / New / Editor's pick), wishlist heart top-right, title/price row, subtitle, rating with count.
6. Discover more (load more).
7. The Lumière standard: full-bleed split image and copy (blush).
8. Newsletter inline (underlined field).
9. Footer.

## Components
Announcement, header (mega and mobile sheet), search overlay with predictive results, product card (4 styles: editorial, label, rounded, gallery),
price, rating, badge, wishlist button, quantity, option cards, accordion, tabs, before/after range, quote slider, cart drawer
(free-shipping bar, recommendations, note, discount), toast, buttons (solid / outline / link-underline), chips, breadcrumb, pagination/load more.

## Responsive strategy
- ≥1280: as designed. 1024: nav tightens and grids go to 3. ≤989: burger with a full-height sheet, hero stacks (art below copy), split sections stack.
- ≤749: 2-column product grids. Concern cards and gift sets become swipe rails. Polaroids shrink. Slab offsets drop to about 60%. The PDP gallery becomes a swipe stage with thumbs underneath. The sticky add-to-bag bar is kept.
- 375/390: 16–20px gutters, and the hero art is capped at about 400px high.

## Shopify data
Products, collections, menus (`main-menu`, `footer`), cart (AJAX + section rendering), predictive search, product recommendations
(`related` + `complementary`), Search & Discovery filters, and customer forms.
Metafields: `custom.subtitle`, `custom.badge`, `custom.highlights`, `custom.ingredients`, `custom.how_to_use`, `custom.results`, `custom.skin_type`, `custom.size`, `custom.usage_note`, `custom.option_note`.
Ratings come from `reviews.rating` / `reviews.rating_count` (written by review apps).

## Engineering approach
The commerce backbone (cart API layer, product form, variant picker, facets, predictive search, recommendations, accounts) is
the same proven, store-tested code as the studio's Éclaté theme. **Every visual layer is new:** tokens, color schemes, typography,
the 2.5D system, product cards, and all homepage, product and collection sections follow this analysis.
