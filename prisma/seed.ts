import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const products = [
  {
    name: "Radiance Serum",
    slug: "radiance-serum",
    tagline: "Vitamin C brightening formula",
    description:
      "Our bestselling Radiance Serum combines stabilized Vitamin C with niacinamide and hyaluronic acid to brighten, even skin tone, and deeply hydrate. Lightweight and fast-absorbing for a luminous, healthy glow.",
    price: 68,
    image:
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&h=800&fit=crop",
    ],
    category: "serums",
    badge: "Bestseller",
    sizes: ["30ml", "50ml"],
    featured: true,
    inStock: true,
  },
  {
    name: "Hydrating Serum",
    slug: "hydrating-serum",
    tagline: "Hyaluronic acid moisture boost",
    description:
      "Triple-weight hyaluronic acid serum that delivers intense hydration to every layer of the skin. Plumps, smooths, and locks in moisture all day.",
    price: 62,
    image:
      "https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=600&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=800&h=800&fit=crop",
    ],
    category: "serums",
    sizes: ["30ml", "50ml"],
    featured: false,
    inStock: true,
  },
  {
    name: "Age Defense Serum",
    slug: "age-defense-serum",
    tagline: "Retinol & peptide complex",
    description:
      "Advanced anti-aging serum featuring encapsulated retinol and bioactive peptides to reduce fine lines, boost collagen, and restore youthful firmness.",
    price: 78,
    image:
      "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800&h=800&fit=crop",
    ],
    category: "serums",
    badge: "New",
    sizes: ["30ml"],
    featured: true,
    inStock: true,
  },
  {
    name: "Glow Serum",
    slug: "glow-serum",
    tagline: "Niacinamide brightening boost",
    description:
      "Glow-enhancing serum with 10% niacinamide, alpha arbutin, and botanical extracts. Minimizes pores and evens out skin tone for a radiant complexion.",
    price: 58,
    originalPrice: 68,
    image:
      "https://images.unsplash.com/photo-1570194065650-d99fb4ee6feb?w=600&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1570194065650-d99fb4ee6feb?w=800&h=800&fit=crop",
    ],
    category: "serums",
    badge: "Sale",
    sizes: ["30ml", "50ml"],
    featured: false,
    inStock: true,
  },
  {
    name: "Hydra Cream",
    slug: "hydra-cream",
    tagline: "Deep moisture with hyaluronic acid",
    description:
      "Rich yet non-greasy cream that delivers 72-hour hydration with hyaluronic acid, ceramides, and shea butter. Perfect for dry and normal skin types.",
    price: 54,
    image:
      "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&h=800&fit=crop",
    ],
    category: "moisturizers",
    sizes: ["50ml", "100ml"],
    featured: false,
    inStock: true,
  },
  {
    name: "Gentle Cleanser",
    slug: "gentle-cleanser",
    tagline: "Soothing botanical wash",
    description:
      "A pH-balanced gel cleanser with chamomile, aloe vera, and green tea extracts. Gently removes impurities without stripping the skin's natural barrier.",
    price: 38,
    originalPrice: 48,
    image:
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&h=800&fit=crop",
    ],
    category: "cleansers",
    badge: "Sale",
    sizes: ["150ml", "250ml"],
    featured: true,
    inStock: true,
  },
  {
    name: "Night Cream",
    slug: "night-cream",
    tagline: "Restorative overnight treatment",
    description:
      "Luxurious night cream enriched with bakuchiol, squalane, and peptides. Works while you sleep to repair, restore, and rejuvenate tired skin.",
    price: 64,
    image:
      "https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=600&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=800&h=800&fit=crop",
    ],
    category: "moisturizers",
    badge: "Bestseller",
    sizes: ["50ml"],
    featured: true,
    inStock: true,
  },
  {
    name: "Day Cream SPF 30",
    slug: "day-cream-spf",
    tagline: "Protection & hydration",
    description:
      "Lightweight day cream with broad-spectrum SPF 30, vitamin E, and green tea extract. Hydrates, protects, and prevents premature aging.",
    price: 58,
    image:
      "https://images.unsplash.com/photo-1612817288484-6f916006741a?w=600&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1612817288484-6f916006741a?w=800&h=800&fit=crop",
    ],
    category: "moisturizers",
    sizes: ["50ml"],
    featured: false,
    inStock: true,
  },
  {
    name: "Renewal Oil",
    slug: "renewal-oil",
    tagline: "Nourishing facial oil blend",
    description:
      "A luxe blend of rosehip, marula, and jojoba oils enriched with vitamin E. Deeply nourishes, softens, and restores a healthy glow.",
    price: 72,
    image:
      "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800&h=800&fit=crop",
    ],
    category: "oils",
    badge: "New",
    sizes: ["30ml"],
    featured: false,
    inStock: true,
  },
  {
    name: "Rosehip Oil",
    slug: "rosehip-oil",
    tagline: "Pure organic rosehip extract",
    description:
      "100% cold-pressed organic rosehip seed oil. Rich in vitamins A and C, essential fatty acids, and antioxidants for natural skin renewal.",
    price: 48,
    image:
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&h=800&fit=crop",
    ],
    category: "oils",
    sizes: ["30ml", "50ml"],
    featured: false,
    inStock: true,
  },
  {
    name: "Jojoba Oil",
    slug: "jojoba-oil",
    tagline: "Balancing & lightweight",
    description:
      "Lightweight golden jojoba oil that closely mimics the skin's natural sebum. Balances oil production and deeply moisturizes without clogging pores.",
    price: 42,
    image:
      "https://images.unsplash.com/photo-1570194065650-d99fb4ee6feb?w=600&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1570194065650-d99fb4ee6feb?w=800&h=800&fit=crop",
    ],
    category: "oils",
    sizes: ["30ml"],
    featured: false,
    inStock: true,
  },
  {
    name: "Argan Oil",
    slug: "argan-oil",
    tagline: "Moroccan beauty elixir",
    description:
      "Hand-pressed Moroccan argan oil rich in vitamin E and essential fatty acids. Hydrates, softens, and adds a beautiful natural sheen to skin and hair.",
    price: 56,
    image:
      "https://images.unsplash.com/photo-1617897903246-719242758050?w=600&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1617897903246-719242758050?w=800&h=800&fit=crop",
    ],
    category: "oils",
    badge: "Bestseller",
    sizes: ["30ml", "50ml"],
    featured: true,
    inStock: true,
  },
  {
    name: "Glow Mask",
    slug: "glow-mask",
    tagline: "Weekly brightening treatment",
    description:
      "Enzyme-rich exfoliating mask with kaolin clay, papaya extract, and AHAs. Use weekly for a brighter, smoother, and more refined complexion.",
    price: 45,
    image:
      "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=600&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=800&h=800&fit=crop",
    ],
    category: "masks",
    sizes: ["75ml"],
    featured: false,
    inStock: true,
  },
  {
    name: "Balance Toner",
    slug: "balance-toner",
    tagline: "pH restoring mist",
    description:
      "Alcohol-free toner mist with witch hazel, rosewater, and centella asiatica. Restores skin's pH, tightens pores, and preps for serums.",
    price: 32,
    image:
      "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=800&h=800&fit=crop",
    ],
    category: "toners",
    badge: "New",
    sizes: ["100ml", "200ml"],
    featured: false,
    inStock: true,
  },
];

async function main() {
  console.log("🌱 Seeding database...");

  // Upsert products by slug
  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: { ...p },
      create: { ...p },
    });
    console.log(`  ✓ ${p.name}`);
  }

  console.log(`\n✅ Seeded ${products.length} products`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
