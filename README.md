# Lumière: Shopify OS 2.0 luxury beauty theme

A quiet-luxury, editorial beauty theme with a soft 2.5D layer, converted from the Canva design "Luxury beauty Shopify theme".

- **Merchant setup, metafields, limitations and the QA checklist:** [GETTING-STARTED.md](GETTING-STARTED.md)
- **Design analysis (Stage 1):** [`_design-source/ANALYSIS.md`](_design-source/ANALYSIS.md), with Canva captures in `_design-source/screens/`

## Structure
```
assets/      theme.css (tokens, components, 2.5D system) · theme.js (vanilla, no dependencies) ·
             component-product.css · section-hero.css · section-lumiere.css · section-story.css ·
             section-collection.css · section-*.css (each loaded only by its sections)
config/      settings_schema.json (8 color schemes, typography, layout, 2.5D, cards, cart…) · settings_data.json
layout/      theme.liquid · password.liquid
locales/     en.default.json
sections/    header-group.json · footer-group.json · 64 sections (main-*, hero, featured-products, ingredients, ritual-tabs, …)
snippets/    product-card (4 styles) · price · badge · rating · icon · button · responsive-image · product-form ·
             variant-picker · cart-item · cart-summary · pagination · breadcrumb · cosmetic-art (line-art placeholders) · decor · …
templates/   JSON templates + customers/* + gift_card.liquid
```

## Develop
```bash
shopify theme dev --store <store>.myshopify.com
shopify theme check
```
Push only the files you changed, so edits made in the theme editor aren't overwritten:
```bash
shopify theme push --store <store>.myshopify.com --theme <id> --only sections/hero.liquid
```

## Release zip
Zip `assets config layout locales sections snippets templates` with forward-slash paths. Leave out
`templates/index.sections-demo.json` and `templates/index.sections-demo-2.json` (QA only).
