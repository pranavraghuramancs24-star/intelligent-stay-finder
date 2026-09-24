import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from "react";
import {
  Bookmark,
  Check,
  ChevronRight,
  Compass,
  Expand,
  Filter,
  Heart,
  MapPin,
  Plane,
  Search,
  Share2,
  Sparkles,
  Star,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";

import heroImage from "@/assets/wanderwise-hero.jpg";
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
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const resultsRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(total > 0 ? (window.scrollY / total) * 100 : 0);
      setScrolled(window.scrollY > 24);
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

      <section id="top" className="hero-section">
        <div className="hero-image-wrap" aria-hidden="true"><img src={heroImage} width={1920} height={1088} alt="" className="hero-image" /><div className="hero-wash" /></div>
        <Plane className="ambient-plane hidden lg:block" aria-hidden="true" />
        <MapPin className="ambient-pin hidden md:block" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-5 pb-16 pt-20 lg:px-8 lg:pb-24 lg:pt-28">
          <div className="hero-copy">
            <p className="hero-enter label-caps text-primary">AI travel discovery</p>
            <h1 className="hero-enter hero-delay-1 mt-5 max-w-[19ch] font-display text-5xl font-medium leading-[1.03] sm:text-6xl lg:text-7xl">Tell us where you want to go. <span className="italic text-primary">We’ll find the right stay.</span></h1>
            <p className="hero-enter hero-delay-2 mt-6 max-w-[46ch] text-base leading-relaxed text-muted-foreground sm:text-lg">Search naturally. Discover stays that match your budget, preferences, and travel style.</p>
          </div>
          <form onSubmit={runSearch} className={`hero-enter hero-delay-3 mt-9 max-w-3xl ${loading ? "is-searching" : ""}`}>
            <div className="search-shell">
              <span className="search-icon"><Sparkles className="size-5" aria-hidden="true" /></span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Describe your ideal stay" className="min-w-0 flex-1 bg-transparent px-1 py-3 text-sm outline-none placeholder:text-muted-foreground/70 sm:text-base" placeholder="Find me a 4-star hotel in Udaipur under ₹4,000 per night" />
              <Button type="submit" disabled={loading} className="h-12 shrink-0 rounded-xl px-5 shadow-sm transition-transform hover:-translate-y-0.5">{loading ? <Sparkles className="animate-pulse" /> : <Search />}<span className="hidden sm:inline">Search</span></Button>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2"><span className="label-caps mr-1 text-muted-foreground">Try</span>{suggestions.map((suggestion, index) => <button key={suggestion} type="button" onClick={() => setQuery(suggestion)} className="suggestion-chip" style={{ "--chip-delay": `${index * 80}ms` } as CSSProperties}>{suggestion}</button>)}</div>
          </form>
          <div className="hero-enter hero-delay-4 mt-12 flex items-center gap-3 text-sm text-foreground/70"><span className="flex -space-x-2">{["A", "M", "R"].map((letter) => <span key={letter} className="traveler-avatar">{letter}</span>)}</span><span>Thoughtful picks for curious travelers</span></div>
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

      <footer id="saved" className="border-t border-border py-9"><div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 text-sm text-muted-foreground sm:flex-row lg:px-8"><span className="font-display text-lg text-foreground">WanderWise</span><span>Travel smarter. Stay better.</span></div></footer>

      <Dialog open={activeHotel !== null} onOpenChange={(open) => !open && setActiveHotel(null)}><DialogContent className="w-[calc(100%-2rem)] max-w-5xl overflow-hidden border-border bg-surface p-0 shadow-modal sm:rounded-2xl"><DialogTitle className="sr-only">{activeHotel?.hotel.name ?? "Hotel preview"}</DialogTitle><DialogDescription className="sr-only">Large travel image and stay details.</DialogDescription>{activeHotel && <div className={activeHotel.mode === "image" ? "" : "grid md:grid-cols-[1.15fr_.85fr]"}><img src={activeHotel.hotel.image} alt={activeHotel.hotel.imageAlt} width={1024} height={768} className={`w-full object-cover ${activeHotel.mode === "image" ? "max-h-[82vh]" : "h-full min-h-80"}`} />{activeHotel.mode === "details" && <div className="flex flex-col p-7 sm:p-9"><p className="label-caps text-primary">{activeHotel.hotel.stars}-star · {activeHotel.hotel.category}</p><h2 className="mt-3 font-display text-3xl font-medium">{activeHotel.hotel.name}</h2><p className="mt-2 text-sm text-muted-foreground">{activeHotel.hotel.location}</p><div className="mt-6 rounded-xl bg-primary/5 p-4"><p className="label-caps text-primary">Why this matches</p><p className="mt-2 text-sm leading-relaxed">{activeHotel.hotel.explanation}</p></div><div className="mt-6 flex flex-wrap gap-2">{activeHotel.hotel.amenities.map((item) => <span className="amenity-pill" key={item}>{item}</span>)}</div><div className="mt-auto flex items-end justify-between gap-4 pt-8"><div><p className="font-display text-3xl font-semibold">₹{Number(activeHotel.hotel.price).toLocaleString("en-IN")}</p><p className="text-xs text-muted-foreground">per night</p></div><Button onClick={() => { void sendInteraction(activeHotel.hotel, "book"); toast.success("Opening booking partner…"); }} className="rounded-full px-6">View / Book<ChevronRight /></Button></div></div>}</div>}</DialogContent></Dialog>
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
