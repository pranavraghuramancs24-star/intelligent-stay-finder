# WanderWise cinematic visual enhancement

## What will change
- Deepen the existing hero into a full-width Indian luxury travel scene with a warmer overlay, subtle movement, premium search treatment, and a few floating destination memories.
- Add a photography-led “Explore India” section using an editorial, asymmetric composition rather than a standard grid.
- Add a restrained animated travel route and an elegant personalization story showing how preferences shape recommendations.
- Upgrade transitions between sections, hotel image interactions, recommendation callouts, navigation behavior, and the final invitation.
- Keep mobile lighter with swipeable imagery, fewer floating elements, reduced parallax, and stable touch targets.

## What stays unchanged
- Search and API calls, filters, recommendation logic, session handling, hotel actions, booking, and mock/API separation.
- The selected editorial-glass visual language and existing page structure.

## Technical details
- Generate four cohesive, royalty-safe Indian destination images for the experience.
- Reuse the existing Intersection Observer reveal system and GPU-friendly opacity/transform animation.
- Add pointer-based hero depth and scroll-based CSS variables without introducing artificial delays.
- Reuse the existing image dialog for destination and hotel photography.
- Respect `prefers-reduced-motion`, lazy-load below-the-fold media, and verify desktop plus mobile behavior.

## Verification
- Check the full page from top to bottom at desktop and mobile sizes.
- Exercise search, filter opening, destination and hotel lightboxes, save, like, dismiss, share, and booking actions.
- Confirm the latest preview reports no build or runtime errors.
