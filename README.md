# WanderWise: Your AI Travel Concierge

WanderWise — AI Travel Discovery Platform

Build a polished, modern web application called WanderWise.

WanderWise is an AI-powered travel and hotel discovery platform that lets users search for stays using natural language and receive personalized recommendations.

The core idea is:

Users describe what they want in natural language, and WanderWise finds and explains the best matching stays.

Example:

"Find me a 4-star hotel in Udaipur under ₹4,000 per night"

The application should feel like a premium AI travel startup, not a basic hotel booking website or CRUD dashboard.

1. CORE USER EXPERIENCE

The main user journey should be:

Landing Page → Natural Language Search → Personalized Results → Understand Recommendations → Like/Save/Dismiss/Book

The most important part of the product is the search experience.

The user should immediately understand that they can simply describe what they want instead of manually filling out many forms.

Primary search example:

Find me a 4-star hotel in Udaipur under ₹4,000 per night

The interface should feel intelligent, fast, visual, and trustworthy.

2. VISUAL DESIGN

Create a premium travel-focused design.

Desired qualities:

Modern

Elegant

Minimal

Premium

AI-powered

Travel-focused

Trustworthy

Visually rich

Responsive

Clean

Take inspiration from the UX quality of modern products such as Airbnb, Booking.com, Google Travel, and modern AI interfaces, but do not copy their designs.

Create a distinct WanderWise identity.

Avoid

Generic Bootstrap layouts

Generic admin dashboards

Excessive gradients

Excessive glassmorphism

Overly colorful UI

Huge amounts of text

Cluttered cards

Too many unnecessary buttons

Unnecessary animations

Use strong:

Typography

Whitespace

Image treatment

Card design

Icons

Micro-interactions

Hover states

Transitions

Responsive layouts

3. BRANDING

Application name:

WanderWise

Possible tagline:

Travel smarter. Stay better.

Alternative hero messaging:

Tell us where you want to go. We'll find the right stay.

The branding should communicate:

Travel + Intelligence + Personalization

Create a clean logo/wordmark using the WanderWise name and an appropriate travel-inspired icon.

4. HOMEPAGE

Create a visually impressive landing page.

Navigation

Include:

WanderWise logo

Explore

Discover

Saved

Minimal profile/session icon

Keep navigation clean and lightweight.

Hero

Large headline:

Tell us where you want to go. We'll find the right stay.

Supporting text:

Search naturally. Discover stays that match your budget, preferences, and travel style.

Main AI Search Box

Create a large, prominent search interface.

Placeholder:

"Find me a 4-star hotel in Udaipur under ₹4,000 per night"

Include:

Search input

Search button

AI/search icon

subtle interaction animation

example queries

Example suggestions:

"Beachside stays in Goa under ₹5,000"

"Luxury hotels in Jaipur for a weekend"

"Family-friendly hotels in Bengaluru"

"4-star stays in Udaipur under ₹4,000"

Visual section

Use high-quality travel imagery and a premium editorial layout.

Do not make the homepage feel like a plain search form.

5. SEARCH RESULTS

After searching, display a polished results page.

At the top:

Search bar containing the user's query

Search/edit controls

Filter controls

Number of results

Example:

4-star hotels in Udaipur under ₹4,000/night

Then display the results.

Desktop layout:

-----------------------------------------------------
 Search bar
-----------------------------------------------------

 Filters             Recommended stays

 Price               Hotel Card
 Stars               Hotel Card
 Category            Hotel Card
 Amenities           Hotel Card
-----------------------------------------------------


The actual visual design should be much more sophisticated than this simple representation.

6. FILTERS

Support these backend filters:

City

Maximum Price

Minimum Stars

Category

Amenities

Use intuitive UI controls:

Price slider

Star selector

Category chips/dropdown

Amenity chips

City selector

Do not expose technical API field names.

For example:

Instead of:

price_max = "4000.00"

display:

Under ₹4,000

7. HOTEL RECOMMENDATION CARDS

Hotel cards are a major part of the application.

Each card should feel premium and visually engaging.

Where information is available, show:

Hotel name

Star/category information

Price

Location

Amenities

Recommendation explanation

Save

Like

Dismiss

Share

View/Book action

The card should have a strong visual hierarchy.

Use large imagery when actual image data is available.

If hotel images are not available from the backend, use tasteful placeholders rather than pretending that specific hotel images exist.

8. AI RECOMMENDATION EXPLANATIONS

This is one of WanderWise's key differentiators.

Every recommendation can contain an explanation from the backend.

Example:

Why this matches you

✨ Within your ₹4,000 budget

or:

Why WanderWise recommends this

Matches your preferred hotel category and budget.

Make this explanation visually noticeable but not intrusive.

Do not show raw ML terminology.

Do not make:

score: 0.87

the main user-facing element.

The recommendation should feel understandable to a normal traveler.

9. PERSONALIZATION

The backend tracks user interactions:

View

Click

Like

Save

Book

Dismiss

Share

Search

Make these interactions feel natural.

For example:

When the user clicks Save:

Immediately update the UI.

Send the interaction to the backend.

Show a subtle confirmation.

Handle failure gracefully.

Use optimistic UI where appropriate.

Saved/liked states should be visually obvious.

10. QUERY GUARD

The backend can automatically relax exactly one filter when there are too few matching results.

If:

relaxed = true

show a subtle message:

We broadened your search slightly to find more options.

If possible, mention which filter was relaxed in human-friendly language.

For example:

We slightly expanded the price range to find more stays.

Do not make this look like an error.

If:

narrow_results = true

show:

Only a few stays match your exact preferences.

The purpose is to maintain transparency and trust.

11. LOADING EXPERIENCE

Create polished loading states.

Use skeleton hotel cards instead of a generic spinner.

For search loading, use subtle messaging such as:

Understanding your search...

Finding matching stays...

Personalizing your results...

These should only be displayed while the real request is loading.

12. EMPTY STATE

If there are no results:

Display a polished empty state.

Example:

We couldn't find an exact match.

Then suggest actions such as:

Broaden your budget

Reduce the minimum star rating

Remove an amenity

Try another destination

Do not automatically change the user's filters.

13. HOTEL DETAILS

Create a hotel details page or modal.

Use only information actually available from the backend.

Possible sections:

Hotel name

Images

Price

Category/star information

Location

Amenities

Recommendation explanation

Save

Share

Book/View CTA

The design should be ready to accept richer hotel information in the future.

Do not invent backend APIs.

14. ANONYMOUS USERS

Users should be able to use WanderWise without creating an account.

Create a session ID on the frontend and store it appropriately.

For example:

sessionStorage

The session ID should be sent with searches and interactions.

user_id is optional.

The application should work fully for anonymous users.

15. BACKEND API

The frontend will eventually communicate with this backend:

POST /search

Used for the main search.

Request includes:

session_id

user_id

query_text

language

filters

city_id

price_max

star_min

category

amenities

top_k

Response contains:

results

entity_type

entity_id

name

score

explanation

moved_up

query_guard

latency information

POST /interactions

Used for:

view

click

like

save

book

dismiss

share

search

GET /session/{session_id}/profile

Returns the current session profile.

GET /health

Used to check:

API status

database connection

embedding model status

Do not display technical health information prominently to normal users.

16. IMPORTANT DATA RULES

Respect these rules.

IDs are opaque strings.

Examples:

htl_...

usr_...

poi_...

pkg_...

cty_...

Never convert these IDs into integers.

Money values are strings with two decimal places.

Example:

"4000.00"

NOT:

4000

Do not use floating-point calculations for money.

17. RESPONSIVE DESIGN

The application must work beautifully on:

Desktop

Laptop

Tablet

Mobile

Desktop:

Filter sidebar

Multiple hotel cards

Large search experience

Mobile:

Sticky search

Filter button

Horizontal filter chips

Stacked cards

Large touch targets

Easy save/like interactions

Do not simply shrink the desktop UI.

Create an intentional mobile experience.

18. COMPONENT STRUCTURE

Use a clean React component architecture.

Suggested structure:

src/
├── components/
│   ├── Navbar
│   ├── SearchBar
│   ├── SearchSuggestions
│   ├── FilterPanel
│   ├── FilterChips
│   ├── HotelCard
│   ├── RecommendationExplanation
│   ├── HotelDetails
│   ├── LoadingSkeleton
│   ├── EmptyState
│   └── Toast
│
├── pages/
│   ├── Home
│   ├── SearchResults
│   └── HotelDetails
│
├── services/
│   └── api
│
├── hooks/
│   ├── useSearch
│   └── useInteractions
│
└── utils/
    └── session


Adapt this to the existing project rather than blindly creating duplicate structures.

19. API SAFETY

Do NOT invent endpoints.

Currently supported:

POST /search
POST /interactions
GET /session/{session_id}/profile
GET /health


If some UI information is not available from these APIs, create the UI structure but clearly separate unavailable data.

Do not fake successful backend operations.

20. MOCK DATA

If the backend isn't currently connected, create a clean mock-data layer so the UI can still be previewed.

Keep mock data separate from the API service.

The application should be easy to switch from:

Mock mode → Real backend

without rewriting components.

21. ANIMATIONS

Use subtle animations for:

Search submission

Page transitions

Card hover

Save/like interactions

Filter opening

Recommendation explanations

Loading states

Animations should feel premium and fast.

Avoid excessive motion.

22. ACCESSIBILITY

Ensure:

Good color contrast

Keyboard navigation

Clear focus states

Accessible buttons

Proper labels

Large enough touch targets

Semantic HTML

23. IMPORTANT PRODUCT PRINCIPLE

The main differentiator is NOT simply "hotel booking."

It is:

AI-powered natural-language travel discovery + personalized recommendations + transparent explanations.

The UI should make this obvious within the first few seconds.

A user should immediately understand:

"I can simply tell WanderWise what kind of trip/stay I want, and it will find relevant options for me."

24. FINAL GOAL

Build WanderWise as if it were being presented as a polished AI travel startup at a hackathon/demo day.

Prioritize:

Exceptional first impression

Beautiful natural-language search

High-quality recommendation cards

Clear AI explanations

Smooth filtering

Personalization interactions

Responsive design

Loading/empty/error states

Clean architecture

Real backend integration readiness

Do not create a generic template.

Create a distinctive, premium, production-quality WanderWise experience.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://intelligent-stay-finder.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1ff920cf-4429-401a-81df-11d98bcbaa74).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
