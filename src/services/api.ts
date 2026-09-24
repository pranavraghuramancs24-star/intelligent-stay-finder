import { mockHotels, type Hotel } from "@/data/mock-hotels";

type SearchFilters = {
  city_id?: string;
  price_max?: string;
  star_min?: number;
  category?: string;
  amenities?: string[];
};

export type SearchRequest = {
  session_id: string;
  user_id?: string;
  query_text: string;
  language: string;
  filters: SearchFilters;
  top_k: number;
};

export type SearchResponse = {
  results: Hotel[];
  query_guard: { relaxed: boolean; relaxed_filter?: string; narrow_results: boolean };
};

export type InteractionType = "view" | "click" | "like" | "save" | "book" | "dismiss" | "share" | "search";

const API_BASE = import.meta.env.VITE_WANDERWISE_API_URL as string | undefined;

export async function searchStays(payload: SearchRequest): Promise<SearchResponse> {
  if (!API_BASE) {
    await new Promise((resolve) => window.setTimeout(resolve, 650));
    return {
      results: mockHotels.filter((hotel) => {
        const max = payload.filters.price_max;
        const stars = payload.filters.star_min ?? 0;
        return (!max || hotel.price.localeCompare(max, undefined, { numeric: true }) <= 0) && hotel.stars >= stars;
      }),
      query_guard: { relaxed: true, relaxed_filter: "price", narrow_results: false },
    };
  }

  const response = await fetch(`${API_BASE}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error((await response.text()) || "Search failed");
  return response.json() as Promise<SearchResponse>;
}

export async function recordInteraction(payload: {
  session_id: string;
  entity_type?: string;
  entity_id?: string;
  interaction_type: InteractionType;
}) {
  if (!API_BASE) return { mock: true };
  const response = await fetch(`${API_BASE}/interactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error((await response.text()) || "Interaction failed");
  return response.json();
}
