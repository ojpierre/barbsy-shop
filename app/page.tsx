import { Header } from "@/components/barbsy/header"
import { Hero } from "@/components/barbsy/hero"
import { TrustBadges } from "@/components/barbsy/trust-badges"
import { FeatureSection } from "@/components/barbsy/feature-section"
import { ProductGrid } from "@/components/barbsy/product-grid"
import { Testimonials } from "@/components/barbsy/testimonials"
import { CTABanner } from "@/components/barbsy/cta-banner"
import { Newsletter } from "@/components/barbsy/newsletter"
import { Footer } from "@/components/barbsy/footer"

export default function HomePage() {
  return (
    <main>
      <Header />
      <Hero />
      <TrustBadges />
      <ProductGrid />
      <FeatureSection />
      <Testimonials />
      <CTABanner />
      <Newsletter />
      <Footer />
    </main>
  )
}
