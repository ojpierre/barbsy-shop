"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Search as SearchIcon, Loader2, ShoppingBag } from "lucide-react"
import { Header } from "@/components/barbsy/header"
import { Footer } from "@/components/barbsy/footer"
import { useCart } from "@/components/barbsy/cart-context"

interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  originalPrice: number | null
  image: string
  badge: string | null
  category: string
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen">
        <Header />
        <div className="pt-28 pb-20 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
        <Footer />
      </main>
    }>
      <SearchContent />
    </Suspense>
  )
}

function SearchContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("q") || ""
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const { addItem } = useCart()

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([])
      setSearched(false)
      return
    }

    setLoading(true)
    setSearched(true)

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`)
      const data = await res.json()
      setResults(data.products || [])
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (initialQuery) {
      doSearch(initialQuery)
    }
  }, [initialQuery, doSearch])

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      doSearch(query)
    }, 400)
    return () => clearTimeout(timeout)
  }, [query, doSearch])

  return (
    <main className="min-h-screen">
      <Header />

      <div className="pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Search Header */}
          <div className="max-w-2xl mx-auto mb-12">
            <h1 className="font-serif text-3xl md:text-4xl text-foreground text-center mb-8">
              Search Products
            </h1>
            <div className="relative">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for serums, creams, oils..."
                autoFocus
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-border bg-card text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary barbsy-transition text-base barbsy-shadow"
              />
              {loading && (
                <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground animate-spin" />
              )}
            </div>
          </div>

          {/* Results */}
          {loading && !results.length ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Searching...</p>
            </div>
          ) : searched && results.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg mb-2">
                No products found for &ldquo;{query}&rdquo;
              </p>
              <p className="text-sm text-muted-foreground/70">
                Try a different search term or{" "}
                <Link href="/shop" className="text-primary hover:underline">
                  browse all products
                </Link>
              </p>
            </div>
          ) : results.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground mb-6">
                {results.length} {results.length === 1 ? "result" : "results"} for &ldquo;{query}&rdquo;
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map((product) => (
                  <Link
                    key={product.id}
                    href={`/product/${product.slug}`}
                    className="group"
                  >
                    <div className="bg-card rounded-3xl overflow-hidden barbsy-shadow barbsy-transition group-hover:scale-[1.02]">
                      <div className="relative aspect-square bg-muted overflow-hidden">
                        <Image
                          src={product.image || "/placeholder.svg"}
                          alt={product.name}
                          fill
                          className="object-cover barbsy-transition group-hover:scale-105"
                        />
                        {product.badge && (
                          <span
                            className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs tracking-wide ${
                              product.badge === "Sale"
                                ? "bg-destructive/10 text-destructive"
                                : product.badge === "New"
                                ? "bg-primary/10 text-primary"
                                : "bg-accent text-accent-foreground"
                            }`}
                          >
                            {product.badge}
                          </span>
                        )}
                        <button
                          type="button"
                          className="absolute bottom-4 right-4 w-12 h-12 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 barbsy-transition barbsy-shadow"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            addItem({
                              id: product.slug,
                              name: product.name,
                              description: product.description || "",
                              price: product.price,
                              image: product.image,
                            })
                          }}
                          aria-label="Add to cart"
                        >
                          <ShoppingBag className="w-5 h-5 text-foreground" />
                        </button>
                      </div>
                      <div className="p-6">
                        <h3 className="font-serif text-xl text-foreground mb-1">
                          {product.name}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          {product.description}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-medium text-foreground">
                            ${product.price}
                          </span>
                          {product.originalPrice && (
                            <span className="text-sm text-muted-foreground line-through">
                              ${product.originalPrice}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <SearchIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">
                Start typing to search our collection
              </p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </main>
  )
}
