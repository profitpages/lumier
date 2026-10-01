# Lumière: setup guide

A quiet-luxury beauty theme for Shopify Online Store 2.0. It uses espresso type on ivory paper with editorial cards, arches,
champagne offset slabs and floating polaroids.

## 1. Install
1. Go to **Online Store › Themes › Add theme › Upload zip file** and choose `lumiere-beauty-theme.zip`.
2. Click **Customize**. Every section, block, color and font can be changed there.
3. *(Developers)* Run `shopify theme dev --store your-store.myshopify.com` from this folder for a live preview.

**External dependencies:** none. No JavaScript libraries are used. The fonts (Fraunces and DM Sans) load from Google Fonts.
To use the Shopify font library instead, untick *Theme settings › Typography › Use Lumière fonts*.

## 2. Required assets (your own photography)
The demo ships with fine line-art placeholders, so it looks finished before you add photos. Replace them with:

| Where | Image | Tip |
|---|---|---|
| Hero | Portrait/lifestyle image | About 4:5. The arch crops the top into a semicircle. An optional mobile image is supported |
| Hero polaroids | Pick 2 **products** | The polaroids use each product's image and link to it. You can also upload custom images |
| Shop by concern | One image per concern | Square crops |
| Ingredient edit | Texture or ingredient shots | One per tab, or one shared image |
| Before / after | Two images with the same framing | Genuine and unretouched only |
| Community | 3 lifestyle photos | Mosaic next to the quote slider |
| Story / Skin first / Lumière standard | Product still-lifes | 3:2 for the curved frame, square for the offset block |
| Collection banner | Defaults to the **collection image** | Landscape about 5:4 |
| Product gallery | Product media | Square works best. Videos and 3D models are supported |

## 3. Color schemes
| Scheme | Name | Used for |
|---|---|---|
| 1 | Ivory | Page background |
| 2 | Paper | Trust strip, menus, filter drawer |
| 3 | Linen | Hero stage, "Pairs beautifully with" |
| 4 | Blush | Story band, "Skin first", shipping note |
| 5 | Sand | Newsletter panel |
| 6 | Espresso | Announcement, community, quote band, how-to-use, footer |
| 7 | Cocoa | Newsletter band on product pages |
| 8 | Champagne | Spare accent scheme |

Global 2.5D colors (blush dots, linen stages, champagne slabs) are under *Theme settings › Colors › 2.5D palette*.
The slab depth is under *Theme settings › 2.5D effects*.

## 4. Menus (Online Store › Navigation)
- **Main menu**, for example: Shop · New arrivals · Rituals · About. Nested items become dropdowns. When a second level
  has its own children, the dropdown becomes a **mega menu**, and a *Mega menu promo* block adds an image card.
- **Footer** menu (Our story, Ingredients, Shipping & returns, Contact). The footer's "Follow" column lists the profiles
  added in *Theme settings › Social media*.
- *Header › Menu style* switches between sentence case and small caps.

## 5. Collections & concerns
- Create collections (Skincare, Makeup, Body…, and concern collections like Dryness or Dullness). Pick them in
  **Shop by concern** (photo cards on home, chips on collection pages) and in **Product grid › Category tab** blocks.
- A concern can also link to a filtered URL, for example `/collections/skincare?filter.p.m.custom.skin_type=Dry`.

## 6. Beauty product metafields (optional, recommended)
**Settings › Custom data › Products › Add definition**

| Name | Namespace & key | Type | Used by |
|---|---|---|---|
| Subtitle | `custom.subtitle` | Single line text | Line under the card title ("Radiance in every drop") |
| Card badge | `custom.badge` | Single line text | Card badge (Bestseller, New, Editor's pick, Limited edition get their own colors). A `badge:New` tag also works |
| Highlights | `custom.highlights` | List of single line text | Pills on the product page (Bestseller · Cruelty-free) |
| Usage note | `custom.usage_note` | Single line text | Beside quantity ("One bottle lasts approximately 8–10 weeks.") |
| Image caption | `custom.media_badge` | Single line text | Caption chip on the product image ("Glow, bottled") |
| Ingredients | `custom.ingredients` | Multi-line or rich text | "Every last detail" accordion |
| How to use | `custom.how_to_use` | Multi-line or rich text | Accordion and How-to-use section |
| Results | `custom.results` | Multi-line or rich text | Accordion |
| Skin type | `custom.skin_type` | List of single line text | Skin types section, filters |
| Size | `custom.size` | Single line text | Accordion |

**Variant metafield:** `custom.option_note` (single line text, on variants) adds the small sub-label under a size option
card ("1 fl oz", "Best value"). It applies to single-option products.

Empty rows and blocks hide automatically.

## 7. Apps (free)
- **Shopify Search & Discovery**: collection filters (availability, price, type, vendor, metafields) and the
  complementary products shown in **Pairs beautifully with**.
- **A reviews app** (Judge.me, Okendo, Shopify Product Reviews, Yotpo…): stars on cards and the "4.9 average from 128
  verified reviews" summary come from the standard `reviews.rating` metafields. Add the app's block inside the
  **Reviews** section. The theme never shows invented reviews, and without an app the Reviews section stays hidden from shoppers.
- **Wishlist**: a built-in browser wishlist is included (a page using the `page.wishlist` template, selected in
  *Theme settings › Wishlist*). If you use a wishlist app, untick *Show wishlist hearts*.

## 8. Cart
*Theme settings › Cart* covers drawer or page, the free-shipping threshold ("You're $25 away from free shipping."),
the promo code field, recommendations and the order note. Promo codes use Shopify discount links.

## 9. Sections
**Home (Canva order):** Hero (arch + polaroids / split / full-bleed) · Trust strip · Featured products ("The edit") ·
Shop by concern · Ingredient edit (tabs) · Before / after (reveal) · Testimonials (community slider + photos) · FAQ ·
Image with text (curved corner / arch / offset block / full-bleed) · Featured products ("Gift sets", boutique cards) ·
Ritual steps (tabs with a recommended product and quick add) · Quote band · Newsletter (panel / band / inline).

**Product:** Product information (vertical thumbnails, zoom, option cards, quantity note, wishlist, shipping note,
sticky add-to-bag) · Benefits ("The glow standard") · Ingredient edit (formula panel) · How to use · Before / after
(split) · Product details (accordions) · Pairs beautifully with (recommendations) · Reviews (app slot) · Recently viewed.

**Collection:** Collection banner (count, slab, caption chip) · Concern chips · Product grid (Filter drawer or sidebar,
sort, badges, wishlist, hover quick add, "Discover more" load more, promo tile) · Image with text · Newsletter.

**Also included:** Slideshow, Beauty categories, Promotional cards, Complete your routine (add-all bundle), Skin types,
Blog posts, Featured product, Video, Scrolling text, Rich text, Countdown, Skin quiz, Shoppable gallery, Press & logos,
Comparison table, Multirow, Multicolumn, Video reviews and Custom Liquid.

**Lumière additions:**
- **Shop the look:** an editorial image with product hotspots. Set each hotspot's position (% from left / top). It opens a
  price popover and highlights the product in the list beside the image, with quick add.
- **Results:** large serif figures for consumer or clinical results. **Only publish figures from your own studies.** The
  study note is shown under the figures, so keep the participant count and duration in it.
- **Formulated without:** your free-from promise as a hairline list.
- **AM / PM ritual:** morning and evening routines side by side (ivory and espresso). Each step is a product with quick add.
- **Collection tabs:** one tab per collection, each with a product grid.
- **Editorial collage:** an asymmetric mosaic of up to three image / product / collection tiles.
- **Timeline:** brand milestones, horizontal on desktop and vertical on mobile.
- **Consultation / atelier:** an arch portrait, opening hours / address / contact rows, and booking and directions buttons. Link the button to your booking app or contact page.
- **Founder's note:** a portrait arch, a letter-style quote and a signature.

## 10. Known limitations
- Rating breakdown bars and individual review cards come from your reviews app's block, because Shopify doesn't expose them to themes.
- The browser wishlist and recently viewed lists live on the shopper's device and don't sync across devices.
- Option sub-labels (`custom.option_note`) apply to single-option products, since a value maps to one variant only then.
- The bundle discount in "Complete your routine" must be created under *Discounts*.
- `templates/index.sections-demo*.json` are QA pages (`?view=sections-demo`, `-2` and `-3`) and are excluded from the release zip.

## 11. QA checklist (verified on a development store)
- [x] Online Store 2.0 architecture: sections everywhere, `{% schema %}` with settings, blocks and presets
- [x] JSON templates (index, product, collection, list-collections, cart, search, page, page.contact, page.wishlist, blog, article, 404, password, customers/*)
- [x] Section groups (header-group and footer-group) rendered from `layout/theme.liquid`
- [x] Theme Editor customization: 8 color schemes, block reordering, presets, and editor block-select hooks for tabs and sliders
- [x] Dynamic products, collections and navigation (Shopify menus with a fallback)
- [x] Product variants: option cards and swatches, price/stock/image sync, sold-out state (tested)
- [x] Functional cart: add, quantity, remove, free-shipping bar, empty state (AJAX Cart API, tested)
- [x] Cart drawer and cart page
- [x] Collection filtering (Search & Discovery) in a drawer, sorting, "Discover more" load more (tested)
- [x] Search page and predictive search
- [x] Product recommendations (complementary and related), loaded lazily
- [x] Responsive: 1440 / 1280 / 1024 / 768 / 390 / 375 / 320, no horizontal overflow on home, product or collection (measured)
- [x] Accessibility: semantic landmarks, one h1 per page, labelled controls, keyboard tabs (arrows / Home / End), focus styles, tap targets of 24px or more, reduced-motion support
- [x] SEO: dynamic titles and meta, canonical URLs, Open Graph, Product / Breadcrumb / FAQ / Organization structured data
- [x] Performance: no frameworks, vanilla JS (~40 KB unminified), per-section CSS, responsive `image_url` / `image_tag`, lazy loading below the fold
- [x] 2.5D visual system: glow orb, arches, curved corners, champagne slabs, tilted polaroids, caption chips, grain, card lift
- [x] Custom Liquid section
- [x] Shopify Theme Check: 0 offenses
