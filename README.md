# The Ember Table — Restaurant Website Demo

A premium, responsive restaurant website starter built with semantic HTML, CSS, vanilla JavaScript, and a dependency-free Node.js server.

## Run locally

Requirements: Node.js 20 or newer.

```bash
npm start
```

Open http://localhost:3000.

## Included

- Responsive restaurant landing page with story, menu, dining experience, gallery, reservation request, and contact sections.
- Editorial typography, warm dark palette, subtle scroll reveals, hover states, menu filters, mobile navigation, and accessible gallery lightbox.
- Reduced-motion support and keyboard-visible focus styles.
- Server-side reservation validation, bounded request bodies, honeypot, same-origin validation, and in-memory rate limiting.
- Security headers including CSP, frame protection, MIME sniffing protection, Referrer Policy, and production HSTS.
- No third-party runtime JavaScript and no API keys in the client.

## Important demo behavior

The reservation endpoint validates requests but **does not save, email, or confirm bookings**. Connect a restaurant-approved booking provider or private database before real use.

The restaurant name, menu, prices, address, hours, and email are fictional placeholders. Replace them with verified business information before launch. The hero image is stored locally in `public/assets/ember-hero.webp`; other food and gallery images use Unsplash URLs. Confirm image usage rights for commercial deployment.

## Customization

- Brand, copy, sample menu, hours, and contact: `public/index.html`.
- Colors, typography, layout, and motion: `public/styles.css`.
- Menu filters, mobile navigation, gallery, and form behavior: `public/app.js`.
- Server validation and HTTP security headers: `server.js`.

## Security notes

- The server validates all reservation fields; browser validation is only for usability.
- Cross-origin submissions are rejected; permissive CORS is not enabled.
- Request bodies are capped at 8 KB; reservation submissions are rate-limited in memory.
- Submitted personal data is not logged or persisted by this demo.
- The in-memory limiter is for a single-process demo only. Use a shared rate-limit store in production.
- Use HTTPS in production. Set `NODE_ENV=production` and `PUBLIC_ORIGIN` to the exact public origin; production submissions fail closed when it is missing.
- Never expose reservation records publicly or add an admin page without authentication, authorization, audit logging, and a retention policy.
- No card data or passwords are collected.

This starter is a technical demonstration, not a security audit or legal/compliance certification.


## Latest UI improvements

- Hero background now has a slow, restrained zoom; text entrances are staggered.
- Sticky navigation has an active-section indicator and improved mobile menu focus behavior.
- The experience section is interactive, with keyboard-operable tabs and changing story imagery.
- The gallery uses an asymmetric staggered layout and an accessible lightbox with previous/next controls, keyboard navigation, and focus restoration.
- Menu filters retain visible/pressed state and animate newly shown cards.
- Reservation validation now checks consent, guest limits, date round-tripping, and allowed demo time slots on the server.
