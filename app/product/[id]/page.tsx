"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ChevronLeft, Minus, Plus, ChevronDown, Leaf, Heart, Award, Recycle, Star, Check, Loader2 } from "lucide-react"
import { Header } from "@/components/barbsy/header"
import { Footer } from "@/components/barbsy/footer"
import { useCart } from "@/components/barbsy/cart-context"
import { type CurrencyCode, detectCurrency, formatPrice } from "@/lib/currency"

interface ProductData {
  id: string
  slug: string
  name: string
  tagline: string | null
  description: string
  price: number
  originalPrice: number | null
  image: string
  sizes: string[]
  details: string | null
  howToUse: string | null
  ingredients: string | null
  delivery: string | null
}

const benefits = [
  { icon: Leaf, label: "100% Natural" },
  { icon: Heart, label: "Cruelty-Free" },
  { icon: Recycle, label: "Eco-Friendly" },
  { icon: Award, label: "Expert Approved" }
]

type AccordionSection = "details" | "howToUse" | "ingredients" | "delivery"

export default function ProductPage() {
  const params = useParams()
  const router = useRouter()
  const { addItem } = useCart()
  const productSlug = params.id as string

  const [product, setProduct] = useState<ProductData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [selectedSize, setSelectedSize] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [openAccordion, setOpenAccordion] = useState<AccordionSection | null>("details")
  const [isAdded, setIsAdded] = useState(false)
  const [currency, setCurrency] = useState<CurrencyCode>("KES")

  useEffect(() => {
    setCurrency(detectCurrency())
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
    setLoading(true)
    setNotFound(false)

    fetch(`/api/products/${productSlug}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found")
        return res.json()
      })
      .then((data) => {
        setProduct(data.product)
        setSelectedSize(data.product.sizes?.[0] || "")
      })
      .catch(() => {
        setNotFound(true)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [productSlug])

  const toggleAccordion = (section: AccordionSection) => {
    setOpenAccordion(openAccordion === section ? null : section)
  }

  const handleAddToCart = () => {
    if (!product) return
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.slug,
        name: `${product.name}${product.sizes?.length > 1 ? ` — ${selectedSize}` : ""}`,
        description: product.tagline || product.description,
        price: product.price,
        image: product.image,
      })
    }
    setIsAdded(true)
    setTimeout(() => setIsAdded(false), 2000)
  }

  const handleBuyNow = () => {
    handleAddToCart()
    setTimeout(() => router.push("/checkout"), 300)
  }

  if (loading) {
    return (
      <main className="min-h-screen">
        <Header />
        <div className="pt-28 pb-20 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
        <Footer />
      </main>
    )
  }

  if (notFound || !product) {
    return (
      <main className="min-h-screen">
        <Header />
        <div className="pt-28 pb-20 text-center min-h-[60vh] flex flex-col items-center justify-center">
          <h1 className="font-serif text-3xl text-foreground mb-3">Product Not Found</h1>
          <p className="text-muted-foreground mb-6">We couldn&apos;t find the product you&apos;re looking for.</p>
          <Link
            href="/shop"
            className="bg-primary text-primary-foreground px-8 py-3 rounded-full hover:bg-primary/90 barbsy-transition text-sm"
          >
            Browse All Products
          </Link>
        </div>
        <Footer />
      </main>
    )
  }

  const accordionItems: { key: AccordionSection; title: string; content: string }[] = [
    { key: "details", title: "Details", content: product.details || "Premium quality skincare formulated with natural ingredients." },
    { key: "howToUse", title: "How to Use", content: product.howToUse || "Apply to cleansed skin as directed. Use morning and evening for best results." },
    { key: "ingredients", title: "Ingredients", content: product.ingredients || "Made with carefully selected natural ingredients." },
    { key: "delivery", title: "Delivery & Returns", content: product.delivery || "Free standard shipping on orders over $50. Returns accepted within 30 days." }
  ]

  return (
    <main className="min-h-screen">
      <Header />
      
      <div className="pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Back Link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground barbsy-transition mb-8"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Shop
          </Link>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
            {/* Product Image */}
            <div className="lg:sticky lg:top-28 lg:self-start">
              <div className="relative aspect-square rounded-3xl overflow-hidden bg-card barbsy-shadow">
                <Image
                  src={product.image || "/placeholder.svg"}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>

            {/* Product Info */}
            <div className="flex flex-col">
              {/* Header */}
              <div className="mb-8">
                <span className="text-sm tracking-[0.3em] uppercase text-primary mb-2 block">
                  Barbsy Essentials
                </span>
                <h1 className="font-serif text-4xl md:text-5xl text-foreground mb-3">
                  {product.name}
                </h1>
                {product.tagline && (
                  <p className="text-lg text-muted-foreground italic mb-4">
                    {product.tagline}
                  </p>
                )}
                
                {/* Rating */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">(128 reviews)</span>
                </div>

                <p className="text-foreground/80 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Price */}
              <div className="flex items-center gap-3 mb-8">
                <span className="text-3xl font-medium text-foreground">{formatPrice(product.price, currency)}</span>
                {product.originalPrice && (
                  <span className="text-xl text-muted-foreground line-through">
                    {formatPrice(product.originalPrice, currency)}
                  </span>
                )}
              </div>

              {/* Size Selector */}
              {product.sizes && product.sizes.length > 0 && (
                <div className="mb-6">
                  <label className="text-sm font-medium text-foreground mb-3 block">Size</label>
                  <div className="flex gap-3">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={`px-6 py-3 rounded-full text-sm barbsy-transition barbsy-shadow ${
                          selectedSize === size
                            ? "bg-primary text-primary-foreground"
                            : "bg-card text-foreground hover:bg-card/80"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity Selector */}
              <div className="mb-8">
                <label className="text-sm font-medium text-foreground mb-3 block">Quantity</label>
                <div className="inline-flex items-center gap-4 bg-card rounded-full px-2 py-2 barbsy-shadow">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-foreground/60 hover:text-foreground barbsy-transition"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-medium text-foreground">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-foreground/60 hover:text-foreground barbsy-transition"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Add to Cart Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className={`flex-1 inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-sm tracking-wide barbsy-transition barbsy-shadow ${
                    isAdded
                      ? "bg-primary/80 text-primary-foreground"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check className="w-4 h-4" />
                      Added to Cart
                    </>
                  ) : (
                    "Add to Cart"
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-transparent border border-foreground/20 text-foreground px-8 py-4 rounded-full text-sm tracking-wide barbsy-transition hover:bg-foreground/5"
                >
                  Buy Now
                </button>
              </div>

              {/* Benefits */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
                {benefits.map((benefit) => (
                  <div
                    key={benefit.label}
                    className="flex flex-col items-center gap-2 p-4 barbsy-shadow bg-transparent shadow-none rounded-md"
                  >
                    <benefit.icon className="w-5 h-5 text-primary" />
                    <span className="text-xs text-muted-foreground text-center">{benefit.label}</span>
                  </div>
                ))}
              </div>

              {/* Accordion */}
              <div className="border-t border-border/50">
                {accordionItems.map((item) => (
                  <div key={item.key} className="border-b border-border/50">
                    <button
                      type="button"
                      onClick={() => toggleAccordion(item.key)}
                      className="w-full flex items-center justify-between py-5 text-left"
                    >
                      <span className="font-medium text-foreground">{item.title}</span>
                      <ChevronDown
                        className={`w-5 h-5 text-muted-foreground barbsy-transition ${
                          openAccordion === item.key ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    <div
                      className={`overflow-hidden barbsy-transition ${
                        openAccordion === item.key ? "max-h-96 pb-5" : "max-h-0"
                      }`}
                    >
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {item.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
