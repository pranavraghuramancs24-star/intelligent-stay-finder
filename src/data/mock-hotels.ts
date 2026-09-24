import palaceImage from "@/assets/hotel-palace.jpg";
import haveliImage from "@/assets/hotel-haveli.jpg";
import retreatImage from "@/assets/hotel-retreat.jpg";

export type Hotel = {
  entity_type: "hotel";
  entity_id: string;
  name: string;
  price: string;
  stars: number;
  category: string;
  location: string;
  amenities: string[];
  explanation: string;
  image: string;
  imageAlt: string;
};

export const mockHotels: Hotel[] = [
  {
    entity_type: "hotel",
    entity_id: "htl_lakeview_palace",
    name: "Lakeview Palace Udaipur",
    price: "3850.00",
    stars: 4,
    category: "Heritage",
    location: "Lake Pichola, Udaipur",
    amenities: ["Lake view", "Breakfast", "Pool"],
    explanation: "Within your ₹4,000 budget, with the lake view you asked for and a calm heritage setting.",
    image: palaceImage,
    imageAlt: "A white marble palace-style stay overlooking Lake Pichola at dusk",
  },
  {
    entity_type: "hotel",
    entity_id: "htl_heritage_haveli",
    name: "Heritage Haveli Resort",
    price: "3600.00",
    stars: 4,
    category: "Boutique",
    location: "Old City, Udaipur",
    amenities: ["Courtyard", "Spa", "Breakfast"],
    explanation: "Matches your preferred category and budget, with a tranquil courtyard and breakfast included.",
    image: haveliImage,
    imageAlt: "A warmly lit heritage haveli courtyard with carved stone arches",
  },
  {
    entity_type: "hotel",
    entity_id: "htl_lakefront_retreat",
    name: "The Lakefront Retreat",
    price: "3990.00",
    stars: 4,
    category: "Resort",
    location: "Fateh Sagar, Udaipur",
    amenities: ["Lake view", "Infinity pool", "Terrace"],
    explanation: "Right at your budget ceiling, with a private terrace and the peaceful lake setting you described.",
    image: retreatImage,
    imageAlt: "A quiet boutique hotel terrace overlooking a lake and palace",
  },
];
