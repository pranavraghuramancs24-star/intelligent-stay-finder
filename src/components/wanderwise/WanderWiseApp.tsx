import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from "react";
import {
  ArrowUpRight,
  Bookmark,
  Camera,
  Check,
  ChevronRight,
  Compass,
  Expand,
  Filter,
  Heart,
  MapPin,
  Mountain,
  Plane,
  Search,
  Share2,
  Sparkles,
  Star,
  Waves,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";

import heroImage from "@/assets/wanderwise-hero.jpg";
import jaipurImage from "@/assets/destination-jaipur.jpg";
import goaImage from "@/assets/destination-goa.jpg";
import keralaImage from "@/assets/destination-kerala.jpg";
import kashmirImage from "@/assets/destination-kashmir.jpg";
import { mockHotels, type Hotel } from "@/data/mock-hotels";
import { recordInteraction, searchStays } from "@/services/api";
import { getSessionId } from "@/utils/session";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";

const suggestions = [
  "Beachside stays in Goa under ₹5,000",
  "Luxury hotels in Jaipur for a weekend",
  "Family-friendly hotels in Bengaluru",
  "4-star stays in Udaipur under ₹4,000",
];

const loadingCopy = ["Understanding your search…", "Finding matching stays…", "Personalizing your recommendations…"];

const destinations = [
  { name: "Udaipur", note: "Royal escapes by the lake", image: heroImage, icon: Sparkles },
  { name: "Jaipur", note: "Courtyards glowing after dusk", image: jaipurImage, icon: Compass },
  { name: "Goa", note: "Slow sunsets by the sea", image: goaImage, icon: Waves },
  { name: "Kerala", note: "Still mornings on the backwaters", image: keralaImage, icon: Camera },
  { name: "Kashmir", note: "Mountain quiet, beautifully framed", image: kashmirImage, icon: Mountain },
];

type Destination = (typeof destinations)[number];

type ActiveHotel = { hotel: Hotel; mode: "image" | "details" } | null;

function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        setVisible(true);
        observer.unobserve(element);
      }
    }, { threshold: 0.12, rootMargin: "0px 0px -40px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} className={`reveal ${visible ? "is-visible" : ""} ${className}`} style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}>{children}</div>;
}

function FilterControls({ price, setPrice, stars, setStars }: { price: number; setPrice: (value: number) => void; stars: number; setStars: (value: number) => void }) {
  return (
    <div className="space-y-7">
      <div className="filter-group">
        <label className="label-caps" htmlFor="city-filter">City</label>
        <div id="city-filter" className="mt-3 flex items-center justify-between rounded-xl border border-border bg-surface px-3.5 py-3 text-sm">
          <span>Udaipur</span><MapPin className="size-4 text-primary" aria-hidden="true" />
        </div>
      </div>
      <div className="filter-group">
        <div className="flex items-center justify-between"><span className="label-caps">Max price</span><span className="font-mono text-xs text-primary">Under ₹{price.toLocaleString("en-IN")}</span></div>
        <Slider className="mt-5" min={2500} max={8000} step={250} value={[price]} onValueChange={(value) => setPrice(value[0] ?? price)} aria-label="Maximum price per night" />
      </div>
      <div className="filter-group">
        <span className="label-caps">Minimum stars</span>
        <div className="mt-3 flex gap-2">{[3, 4, 5].map((value) => <Button key={value} type="button" variant={stars === value ? "default" : "outline"} size="sm" onClick={() => setStars(value)} aria-pressed={stars === value}>{value}<Star className="size-3 fill-current" /></Button>)}</div>
      </div>
      <div className="filter-group">
        <span className="label-caps">Category</span>
        <div className="mt-3 flex flex-wrap gap-2">{["Heritage", "Boutique", "Resort"].map((item, index) => <button key={item} type="button" className={`filter-chip ${index === 0 ? "is-active" : ""}`}>{item}</button>)}</div>
      </div>
      <div className="filter-group">
        <span className="label-caps">Amenities</span>
        <div className="mt-3 flex flex-wrap gap-2">{["Lake view", "Breakfast", "Pool", "Spa"].map((item, index) => <button key={item} type="button" className={`filter-chip ${index < 2 ? "is-active" : ""}`}>{item}</button>)}</div>
      </div>
    </div>
  );
}

export function WanderWiseApp() {
  const [query, setQuery] = useState("Find me a 4-star hotel in Udaipur under ₹4,000 per night");
  const [results, setResults] = useState(mockHotels);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [price, setPrice] = useState(4000);
  const [stars, setStars] = useState(4);
  const [saved, setSaved] = useState<Set<string>>(() => new Set());
  const [liked, setLiked] = useState<Set<string>>(() => new Set(["htl_lakeview_palace"]));
  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set());
  const [activeHotel, setActiveHotel] = useState<ActiveHotel>(null);
  const [activeDestination, setActiveDestination] = useState<Destination | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const resultsRef = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(total > 0 ? (window.scrollY / total) * 100 : 0);
      setScrolled(window.scrollY > 24);
      heroRef.current?.style.setProperty("--hero-scroll", `${Math.min(window.scrollY, 520)}px`);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!loading) return;
    setLoadingStep(0);
    const id = window.setInterval(() => setLoadingStep((step) => Math.min(step + 1, loadingCopy.length - 1)), 420);
    return () => window.clearInterval(id);
  }, [loading]);

  const visibleResults = useMemo(() => results.filter((hotel) => !dismissed.has(hotel.entity_id)), [results, dismissed]);

  const sendInteraction = async (hotel: Hotel | undefined, interaction_type: Parameters<typeof recordInteraction>[0]["interaction_type"]) => {
    try {
      await recordInteraction({
        session_id: getSessionId(),
        interaction_type,
        ...(hotel ? { entity_type: hotel.entity_type, entity_id: hotel.entity_id } : {}),
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "That action could not be saved.");
    }
  };

  const runSearch = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    void sendInteraction(undefined, "search");
    try {
      const response = await searchStays({
        session_id: getSessionId(), query_text: query.trim(), language: "en",
        filters: { city_id: "cty_udaipur", price_max: `${price}.00`, star_min: stars, amenities: ["Lake view", "Breakfast"] }, top_k: 12,
      });
      setResults(response.results);
      window.requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Search is temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  };

  const toggle = (hotel: Hotel, type: "save" | "like") => {
    const setter = type === "save" ? setSaved : setLiked;
    setter((current) => {
      const next = new Set(current);
      const becomingActive = !next.has(hotel.entity_id);
      becomingActive ? next.add(hotel.entity_id) : next.delete(hotel.entity_id);
      toast.success(becomingActive ? `${type === "save" ? "Saved" : "Liked"} ${hotel.name}` : `Removed ${hotel.name}`);
      return next;
    });
    void sendInteraction(hotel, type);
  };

  return (
    <main className="min-h-screen overflow-clip bg-background text-foreground">
      <div className="scroll-progress" style={{ transform: `scaleX(${progress / 100})` }} />
      <header className={`site-nav ${scrolled ? "is-scrolled" : ""}`}>
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-5 lg:px-8">
          <a href="#top" className="flex items-center gap-2.5" aria-label="WanderWise home"><span className="brand-mark"><Compass className="size-4" /></span><span className="font-display text-xl font-semibold">WanderWise</span></a>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex" aria-label="Main navigation"><a href="#results" className="nav-link">Explore</a><a href="#story" className="nav-link">Discover</a><a href="#saved" className="nav-link">Saved</a></nav>
          <Button type="button" variant="ghost" size="icon" className="rounded-full" aria-label="Profile"><UserRound /></Button>
        </div>
      </header>

      <section
        ref={heroRef}
        id="top"
        className="hero-section"
        onPointerMove={(event) => {
          const bounds = event.currentTarget.getBoundingClientRect();
          event.currentTarget.style.setProperty("--pointer-x", `${((event.clientX - bounds.left) / bounds.width - 0.5) * 12}px`);
          event.currentTarget.style.setProperty("--pointer-y", `${((event.clientY - bounds.top) / bounds.height - 0.5) * 8}px`);
        }}
      >
        <div className="hero-image-wrap" aria-hidden="true"><img src={heroImage} width={1920} height={1088} alt="" className="hero-image" /><div className="hero-wash" /></div>
        <div className="hero-light hero-light-one" aria-hidden="true" /><div className="hero-light hero-light-two" aria-hidden="true" />
        <Plane className="ambient-plane hidden lg:block" aria-hidden="true" />
        <MapPin className="ambient-pin hidden md:block" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-5 pb-16 pt-24 lg:px-8 lg:pb-24 lg:pt-32">
          <div className="hero-copy">
            <p className="hero-enter label-caps text-hero-accent">AI travel discovery across India</p>
            <h1 className="hero-enter hero-delay-1 mt-5 max-w-[16ch] font-display text-5xl font-medium leading-[1.03] text-hero-foreground sm:text-6xl lg:text-7xl">Where do you want to <span className="italic text-hero-accent">wander?</span></h1>
            <p className="hero-enter hero-delay-2 mt-6 max-w-[44ch] text-base leading-relaxed text-hero-muted sm:text-lg">Tell us how you want your trip to feel. We’ll find stays that fit your budget, preferences, and pace.</p>
          </div>
          <form onSubmit={runSearch} className={`hero-enter hero-delay-3 mt-9 max-w-3xl ${loading ? "is-searching" : ""}`}>
            <div className="search-shell">
              <span className="search-icon"><Sparkles className="size-5" aria-hidden="true" /></span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Describe your ideal stay" className="min-w-0 flex-1 bg-transparent px-1 py-3 text-sm outline-none placeholder:text-muted-foreground/70 sm:text-base" placeholder="Find me a 4-star hotel in Udaipur under ₹4,000 per night" />
              <Button type="submit" disabled={loading} className="h-12 shrink-0 rounded-xl px-5 shadow-sm transition-transform hover:-translate-y-0.5">{loading ? <Sparkles className="animate-pulse" /> : <Search />}<span className="hidden sm:inline">Search</span></Button>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2"><span className="label-caps mr-1 text-muted-foreground">Try</span>{suggestions.map((suggestion, index) => <button key={suggestion} type="button" onClick={() => setQuery(suggestion)} className="suggestion-chip" style={{ "--chip-delay": `${index * 80}ms` } as CSSProperties}>{suggestion}</button>)}</div>
          </form>
           <div className="hero-enter hero-delay-4 mt-10 flex items-center gap-3 text-sm text-hero-muted"><span className="flex -space-x-2">{["A", "M", "R"].map((letter) => <span key={letter} className="traveler-avatar">{letter}</span>)}</span><span>Thoughtful picks for curious travelers</span></div>
          <button type="button" className="hero-memory hero-memory-jaipur" onClick={() => setActiveDestination(destinations[1] ?? null)} aria-label="View Jaipur travel image"><img src={jaipurImage} alt="Jaipur palace courtyard at dusk" width={1408} height={1008} /><span><b>Jaipur</b><small>After dusk</small></span></button>
          <button type="button" className="hero-memory hero-memory-goa" onClick={() => setActiveDestination(destinations[2] ?? null)} aria-label="View Goa travel image"><img src={goaImage} alt="Goa resort at sunset" width={1408} height={1008} /><span><b>Goa</b><small>By the sea</small></span></button>
          <button type="button" className="hero-memory hero-memory-kerala" onClick={() => setActiveDestination(destinations[3] ?? null)} aria-label="View Kerala travel image"><img src={keralaImage} alt="Kerala backwater resort" width={1408} height={1008} /><span><b>Kerala</b><small>Backwater calm</small></span></button>
        </div>
        <div className="hero-scroll-cue" aria-hidden="true"><span>Explore India</span><i /></div>
      </section>

      <section id="destinations" className="destinations-section">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
          <Reveal><div className="section-heading"><div><p className="label-caps text-accent">Journeys worth taking</p><h2 className="mt-3 max-w-[13ch] font-display text-4xl font-medium leading-tight sm:text-5xl">Explore India, one beautiful stay at a time.</h2></div><p className="max-w-md text-base leading-relaxed text-muted-foreground">From palace courtyards to quiet backwaters, discover places with a sense of story.</p></div></Reveal>
          <div className="destination-editorial">
            {destinations.map((destination, index) => {
              const Icon = destination.icon;
              return <Reveal key={destination.name} delay={index * 120} className={`destination-slot destination-slot-${index + 1}`}><button type="button" className="destination-card group" onClick={() => setActiveDestination(destination)}><img src={destination.image} alt={`${destination.name}: ${destination.note}`} loading="lazy" width={1408} height={1008} /><span className="destination-shade" /><span className="destination-copy"><span className="destination-icon"><Icon /></span><span><b>{destination.name}</b><small>{destination.note}</small></span><ArrowUpRight className="destination-arrow" /></span></button></Reveal>;
            })}
          </div>
        </div>
      </section>

      <section ref={resultsRef} id="results" className="mx-auto max-w-7xl scroll-mt-20 px-5 py-16 lg:px-8 lg:py-20">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-5 border-b border-border pb-6">
            <div><p className="label-caps text-primary">Recommended stays</p><h2 className="mt-2 font-display text-3xl font-medium sm:text-4xl">4-star hotels in Udaipur under ₹{price.toLocaleString("en-IN")}/night</h2><p className="mt-2 text-sm text-muted-foreground">{visibleResults.length} stays match · <span className="text-primary">We slightly expanded the price range to find more options.</span></p></div>
            <Sheet><SheetTrigger asChild><Button variant="outline" className="lg:hidden"><Filter /> Filters</Button></SheetTrigger><SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-3xl"><SheetHeader><SheetTitle>Refine your stay</SheetTitle><SheetDescription>Adjust the preferences WanderWise uses for this search.</SheetDescription></SheetHeader><div className="mt-6"><FilterControls price={price} setPrice={setPrice} stars={stars} setStars={setStars} /></div></SheetContent></Sheet>
          </div>
        </Reveal>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2 lg:hidden"><span className="active-pill">Under ₹{price.toLocaleString("en-IN")}</span><span className="filter-chip">{stars}+ stars</span><span className="filter-chip">Lake view</span><span className="filter-chip">Breakfast</span></div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[244px_1fr]">
          <Reveal className="hidden lg:block" delay={80}><aside className="sticky top-24 rounded-2xl border border-border bg-surface/75 p-5 shadow-soft backdrop-blur-xl"><div className="mb-6 flex items-center justify-between"><span className="label-caps">Filters</span><Filter className="size-4 text-primary" /></div><FilterControls price={price} setPrice={setPrice} stars={stars} setStars={setStars} /></aside></Reveal>
          <div className="min-w-0 space-y-5">
            {loading ? <LoadingCards message={loadingCopy[loadingStep] ?? "Understanding your search…"} /> : visibleResults.length ? visibleResults.map((hotel, index) => (
              <Reveal key={hotel.entity_id} delay={index * 110}>
                <article className="hotel-card group">
                  <button type="button" className="hotel-image-button" onClick={() => setActiveHotel({ hotel, mode: "image" })} aria-label={`Expand image for ${hotel.name}`}>
                    <img src={hotel.image} alt={hotel.imageAlt} loading="lazy" width={1024} height={768} className="hotel-image" />
                    <span className="star-badge">{hotel.stars}<Star className="size-3 fill-current" /> · {hotel.category}</span><span className="expand-cue"><Expand className="size-4" /> View</span>
                  </button>
                  <div className="flex min-w-0 flex-1 flex-col p-1 sm:py-1">
                    <div className="flex items-start justify-between gap-4"><div><h3 className="font-display text-2xl font-medium leading-tight">{hotel.name}</h3><p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="size-3.5" />{hotel.location}</p></div><div className="shrink-0 text-right"><p className="font-display text-2xl font-semibold">₹{Number(hotel.price).toLocaleString("en-IN")}</p><p className="font-mono text-[10px] uppercase text-muted-foreground">per night</p></div></div>
                    <div className="mt-4 flex flex-wrap gap-2">{hotel.amenities.map((amenity) => <span key={amenity} className="amenity-pill">{amenity}</span>)}</div>
                    <div className="recommendation-panel" style={{ "--explanation-delay": `${index * 110 + 190}ms` } as CSSProperties}><div className="flex items-center gap-2"><Sparkles className="size-3.5 text-primary" /><p className="label-caps text-primary">Why WanderWise recommends this</p></div><p className="mt-1.5 text-sm leading-relaxed text-foreground/75">{hotel.explanation}</p></div>
                    <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4"><div className="flex gap-1.5"><ActionIcon label="Save" active={saved.has(hotel.entity_id)} onClick={() => toggle(hotel, "save")}><Bookmark /></ActionIcon><ActionIcon label="Like" active={liked.has(hotel.entity_id)} onClick={() => toggle(hotel, "like")}><Heart className={liked.has(hotel.entity_id) ? "fill-current" : ""} /></ActionIcon><ActionIcon label="Share" onClick={() => { void sendInteraction(hotel, "share"); toast.success("Share link ready"); }}><Share2 /></ActionIcon><ActionIcon label="Dismiss" onClick={() => { setDismissed((current) => new Set(current).add(hotel.entity_id)); void sendInteraction(hotel, "dismiss"); }}><X /></ActionIcon></div><Button type="button" onClick={() => { setActiveHotel({ hotel, mode: "details" }); void sendInteraction(hotel, "click"); }} className="rounded-full px-5">View stay<ChevronRight /></Button></div>
                  </div>
                </article>
              </Reveal>
            )) : <EmptyState onReset={() => { setPrice(4000); setStars(4); setDismissed(new Set()); setResults(mockHotels); }} />}
          </div>
        </div>
      </section>

      <section id="story" className="border-y border-border bg-surface py-20 lg:py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 lg:grid-cols-2 lg:px-8">
          <Reveal><p className="label-caps text-primary">A more human way to search</p><h2 className="mt-4 max-w-[13ch] font-display text-4xl font-medium leading-tight sm:text-5xl">From a feeling to the right place.</h2><p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">WanderWise turns the way you naturally describe a trip into clear, considered recommendations—and explains every match.</p><div className="mt-8 grid gap-5 sm:grid-cols-3">{[[Search,"Describe"],[Sparkles,"Understand"],[Check,"Discover"]].map(([Icon,label],index) => { const I = Icon as typeof Search; return <Reveal key={label as string} delay={index*100}><div className="story-step"><I /><span>{label as string}</span></div></Reveal>; })}</div></Reveal>
          <Reveal delay={120}><div className="image-collage">{mockHotels.filter((hotel) => hotel.entity_id !== "htl_heritage_haveli").map((hotel, index) => <button key={hotel.entity_id} onClick={() => setActiveHotel({ hotel, mode: "image" })} className={index === 0 ? "collage-main" : "collage-small collage-b"}><img src={hotel.image} alt={hotel.imageAlt} loading="lazy" width={1024} height={768} /></button>)}<span className="route-line" aria-hidden="true"><Plane className="size-4" /></span></div></Reveal>
        </div>
      </section>

      <section className="preference-section">
        <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 py-20 lg:grid-cols-[.9fr_1.1fr] lg:px-8 lg:py-28">
          <Reveal><p className="label-caps text-accent">Personal, not generic</p><h2 className="mt-4 max-w-[12ch] font-display text-4xl font-medium leading-tight sm:text-5xl">WanderWise learns what you love.</h2><p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">Every search and thoughtful choice helps shape recommendations around the way you actually travel.</p><div className="mt-8 flex items-center gap-3 text-sm text-foreground/70"><Sparkles className="size-4 text-accent" /><span>Clear reasons accompany every recommendation.</span></div></Reveal>
          <Reveal delay={140}><div className="preference-orbit" aria-label="Personalization preferences"><div className="preference-center"><Compass /><strong>YOU</strong><small>Your travel rhythm</small></div>{["Heritage","Lake views","Under ₹4,000","Quiet stays","Great location"].map((label, index) => <span key={label} className={`preference-bubble preference-bubble-${index + 1}`} style={{ "--bubble-delay": `${index * 120}ms` } as CSSProperties}><Check />{label}</span>)}<svg viewBox="0 0 620 420" aria-hidden="true"><path d="M80 130 C190 80 210 180 310 210 S450 110 550 135"/><path d="M90 315 C210 370 235 245 310 210 S440 330 535 305"/></svg></div></Reveal>
        </div>
      </section>

      <section className="route-section">
        <div className="mx-auto max-w-6xl px-5 py-20 lg:px-8 lg:py-24">
          <Reveal><div className="text-center"><p className="label-caps text-accent">A journey taking shape</p><h2 className="mt-3 font-display text-4xl font-medium sm:text-5xl">Follow the feeling.</h2></div></Reveal>
          <Reveal delay={120}><div className="india-route" aria-label="Decorative travel route from Delhi to Goa"><span className="route-track" /><Plane className="route-plane" aria-hidden="true" />{["Delhi","Jaipur","Udaipur","Goa"].map((city, index) => <div className={`route-stop route-stop-${index + 1}`} key={city}><span><MapPin /></span><b>{city}</b><small>{["Begin","Heritage","Lakes","Unwind"][index]}</small></div>)}</div></Reveal>
        </div>
      </section>

      <section className="final-invitation">
        <img src={kashmirImage} alt="A warm mountain retreat beside a calm lake in Kashmir" loading="lazy" width={1408} height={1008} />
        <div className="final-invitation-wash" />
        <Reveal className="relative z-10"><div className="mx-auto flex max-w-7xl flex-col items-start px-5 py-24 text-hero-foreground lg:px-8 lg:py-32"><p className="label-caps text-hero-accent">Your next stay is waiting</p><h2 className="mt-4 max-w-[12ch] font-display text-5xl font-medium leading-tight sm:text-6xl">Find somewhere you’ll remember.</h2><Button type="button" className="mt-8 rounded-full px-6" onClick={() => document.querySelector<HTMLInputElement>('input[aria-label="Describe your ideal stay"]')?.focus()}>Start exploring<Search /></Button></div></Reveal>
      </section>

      <footer id="saved" className="border-t border-border py-9"><div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 text-sm text-muted-foreground sm:flex-row lg:px-8"><span className="font-display text-lg text-foreground">WanderWise</span><span>Travel smarter. Stay better.</span></div></footer>

      <Dialog open={activeHotel !== null} onOpenChange={(open) => !open && setActiveHotel(null)}><DialogContent className="w-[calc(100%-2rem)] max-w-5xl overflow-hidden border-border bg-surface p-0 shadow-modal sm:rounded-2xl"><DialogTitle className="sr-only">{activeHotel?.hotel.name ?? "Hotel preview"}</DialogTitle><DialogDescription className="sr-only">Large travel image and stay details.</DialogDescription>{activeHotel && <div className={activeHotel.mode === "image" ? "" : "grid md:grid-cols-[1.15fr_.85fr]"}><img src={activeHotel.hotel.image} alt={activeHotel.hotel.imageAlt} width={1024} height={768} className={`w-full object-cover ${activeHotel.mode === "image" ? "max-h-[82vh]" : "h-full min-h-80"}`} />{activeHotel.mode === "details" && <div className="flex flex-col p-7 sm:p-9"><p className="label-caps text-primary">{activeHotel.hotel.stars}-star · {activeHotel.hotel.category}</p><h2 className="mt-3 font-display text-3xl font-medium">{activeHotel.hotel.name}</h2><p className="mt-2 text-sm text-muted-foreground">{activeHotel.hotel.location}</p><div className="mt-6 rounded-xl bg-primary/5 p-4"><p className="label-caps text-primary">Why this matches</p><p className="mt-2 text-sm leading-relaxed">{activeHotel.hotel.explanation}</p></div><div className="mt-6 flex flex-wrap gap-2">{activeHotel.hotel.amenities.map((item) => <span className="amenity-pill" key={item}>{item}</span>)}</div><div className="mt-auto flex items-end justify-between gap-4 pt-8"><div><p className="font-display text-3xl font-semibold">₹{Number(activeHotel.hotel.price).toLocaleString("en-IN")}</p><p className="text-xs text-muted-foreground">per night</p></div><Button onClick={() => { void sendInteraction(activeHotel.hotel, "book"); toast.success("Opening booking partner…"); }} className="rounded-full px-6">View / Book<ChevronRight /></Button></div></div>}</div>}</DialogContent></Dialog>
      <Dialog open={activeDestination !== null} onOpenChange={(open) => !open && setActiveDestination(null)}><DialogContent className="gallery-dialog w-[calc(100%-2rem)] max-w-6xl overflow-hidden border-border bg-surface p-0 shadow-modal sm:rounded-2xl"><DialogTitle className="sr-only">{activeDestination?.name ?? "Destination preview"}</DialogTitle><DialogDescription className="sr-only">Large destination photograph and caption.</DialogDescription>{activeDestination && <figure><img src={activeDestination.image} alt={`${activeDestination.name}: ${activeDestination.note}`} width={1408} height={1008} /><figcaption><span><b>{activeDestination.name}</b><small>{activeDestination.note}</small></span><span className="label-caps">India, beautifully discovered</span></figcaption></figure>}</DialogContent></Dialog>
    </main>
  );
}

function ActionIcon({ label, active = false, onClick, children }: { label: string; active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return <Button type="button" variant="outline" size="icon" onClick={onClick} aria-label={label} aria-pressed={active} title={label} className={`action-icon rounded-full ${active ? "is-active" : ""}`}>{children}</Button>;
}

function LoadingCards({ message }: { message: string }) {
  return <div aria-live="polite"><p className="mb-4 flex items-center gap-2 text-sm text-primary"><Sparkles className="size-4 animate-pulse" />{message}</p>{[0,1,2].map((item) => <div key={item} className="mb-5 grid gap-5 rounded-2xl border border-border bg-surface p-4 sm:grid-cols-[288px_1fr]"><div className="skeleton aspect-[4/3] rounded-xl"/><div className="space-y-4 py-2"><div className="skeleton h-7 w-1/2 rounded"/><div className="skeleton h-4 w-1/3 rounded"/><div className="skeleton h-20 rounded-xl"/><div className="skeleton h-9 w-36 rounded-full"/></div></div>)}</div>;
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return <Reveal><div className="rounded-2xl border border-border bg-surface px-6 py-16 text-center"><Compass className="mx-auto size-10 text-primary" /><h3 className="mt-5 font-display text-3xl">We couldn’t find an exact match.</h3><p className="mx-auto mt-3 max-w-md text-muted-foreground">Try broadening your budget, reducing the star rating, or removing an amenity.</p><Button className="mt-6 rounded-full" onClick={onReset}>Reset filters</Button></div></Reveal>;
}
