# Requirements

## Campaign Metadata
- Campaign: 2026-jul-nike-pegasus-42-w
- Client: Nike
- Product: Pegasus 42 — Women's Road Running Shoes
- isTestCampaign: true
- productionReady: false

## Must Include
- Header with Nike logo (swoosh) — pendiente de confirmar URL del logo
- Hero with banner image of Pegasus 42 women's (AI-generated)
- Brand name + H1 + subtitle + CTA
- Optional: intro paragraph
- Optional: 3 benefits without icons
- Closing band with CTA
- Footer with legal placeholders

## Must Not Include
- Pricing, financing, or comparison figures
- "Just Do It" as a fixed claim (not observed on product page)
- Emoji/icons in benefit cards (Nike is too aspirational per brand pack)
- Overlay/scrim on hero image (text is below, not overlaid)

## Verification Requirements
- Gradients.heroBackground: verify no broken placeholders, resolves to "none" correctly
- Scrim: verify H1/subtitle/CTA are BELOW the photo, not overlaid
- Shadows.card: verify any card-type boxes show box-shadow:none
- Production gate: 9/9 gates, including Gate 8 (brand-pack-completeness)
