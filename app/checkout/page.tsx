"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronLeft, Loader2, CreditCard, Phone, ShieldCheck, Truck, RotateCcw } from "lucide-react"
import { useSession } from "next-auth/react"
import { Header } from "@/components/barbsy/header"
import { Footer } from "@/components/barbsy/footer"
import { useCart } from "@/components/barbsy/cart-context"

type Step = "information" | "payment" | "confirmation"

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart()
  const { data: session } = useSession()
  const router = useRouter()

  const [step, setStep] = useState<Step>("information")
  const [loading, setLoading] = useState(false)
  const [orderId, setOrderId] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "card">("mpesa")
  const [stkSent, setStkSent] = useState(false)

  // Form state
  const [form, setForm] = useState({
    name: session?.user?.name || "",
    email: session?.user?.email || "",
    phone: "",
    address: "",
    city: "",
    notes: "",
  })

  const shipping = subtotal > 50 ? 0 : 5
  const total = subtotal + shipping

  const updateForm = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.id,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
          })),
          customerName: form.name,
          customerEmail: form.email,
          customerPhone: form.phone,
          shippingAddress: `${form.address}, ${form.city}${form.notes ? ` — ${form.notes}` : ""}`,
          userId: session?.user?.id || null,
        }),
      })

      const data = await res.json()

      if (data.success) {
        setOrderId(data.order.id)
        setStep("payment")
      }
    } catch {
      alert("Failed to create order. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleMpesaPayment = async () => {
    if (!form.phone) return
    setLoading(true)

    try {
      const res = await fetch("/api/payhero/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          phone: form.phone.startsWith("0")
            ? `254${form.phone.slice(1)}`
            : form.phone,
          amount: total,
          customerName: form.name,
        }),
      })

      const data = await res.json()

      if (data.success) {
        setStkSent(true)
        // Poll for successful payment or show confirmation
        setTimeout(() => {
          clearCart()
          setStep("confirmation")
          setLoading(false)
        }, 8000)
      } else {
        alert(data.error || "Payment failed. Please try again.")
        setLoading(false)
      }
    } catch {
      alert("Payment failed. Please try again.")
      setLoading(false)
    }
  }

  const handleCardPayment = async () => {
    setLoading(true)
    // Simulate for now - Google Pay / card integration
    setTimeout(() => {
      clearCart()
      setStep("confirmation")
      setLoading(false)
    }, 2000)
  }

  if (items.length === 0 && step !== "confirmation") {
    return (
      <main className="min-h-screen">
        <Header />
        <div className="pt-28 pb-20 flex flex-col items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground mb-4">Your cart is empty</p>
          <Link
            href="/shop"
            className="bg-primary text-primary-foreground px-8 py-3 rounded-full hover:bg-primary/90 barbsy-transition text-sm"
          >
            Continue Shopping
          </Link>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen">
      <Header />

      <div className="pt-28 pb-20">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          {/* Back */}
          {step !== "confirmation" && (
            <Link
              href={step === "payment" ? "#" : "/shop"}
              onClick={(e) => {
                if (step === "payment") {
                  e.preventDefault()
                  setStep("information")
                }
              }}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground barbsy-transition mb-8"
            >
              <ChevronLeft className="w-4 h-4" />
              {step === "payment" ? "Back to information" : "Back to shop"}
            </Link>
          )}

          {/* Steps indicator */}
          <div className="flex items-center gap-4 mb-10">
            {["Information", "Payment", "Confirmation"].map((label, i) => {
              const stepMap: Step[] = ["information", "payment", "confirmation"]
              const isActive = stepMap.indexOf(step) >= i
              return (
                <div key={label} className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium barbsy-transition ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {i + 1}
                  </div>
                  <span
                    className={`text-sm hidden sm:block ${
                      isActive ? "text-foreground font-medium" : "text-muted-foreground"
                    }`}
                  >
                    {label}
                  </span>
                  {i < 2 && (
                    <div className="w-8 sm:w-16 h-px bg-border mx-2" />
                  )}
                </div>
              )
            })}
          </div>

          <div className="grid lg:grid-cols-5 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-3">
              {step === "information" && (
                <form onSubmit={handleCreateOrder} className="space-y-6">
                  <h2 className="font-serif text-2xl text-foreground mb-6">
                    Shipping Information
                  </h2>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1.5">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => updateForm("name", e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary barbsy-transition text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1.5">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => updateForm("email", e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary barbsy-transition text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={form.phone}
                      onChange={(e) => updateForm("phone", e.target.value)}
                      placeholder="0712345678"
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary barbsy-transition text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">
                      Delivery Address *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.address}
                      onChange={(e) => updateForm("address", e.target.value)}
                      placeholder="Street address, building, floor"
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary barbsy-transition text-sm"
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1.5">
                        City *
                      </label>
                      <input
                        type="text"
                        required
                        value={form.city}
                        onChange={(e) => updateForm("city", e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary barbsy-transition text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1.5">
                        Notes (optional)
                      </label>
                      <input
                        type="text"
                        value={form.notes}
                        onChange={(e) => updateForm("notes", e.target.value)}
                        placeholder="Delivery instructions"
                        className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary barbsy-transition text-sm"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary text-primary-foreground py-4 rounded-full font-medium hover:bg-primary/90 barbsy-transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Continue to Payment
                  </button>
                </form>
              )}

              {step === "payment" && (
                <div className="space-y-6">
                  <h2 className="font-serif text-2xl text-foreground mb-6">
                    Payment Method
                  </h2>

                  {/* Payment method selector */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("mpesa")}
                      className={`p-4 rounded-2xl border-2 text-left barbsy-transition ${
                        paymentMethod === "mpesa"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-foreground/20"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Phone className="w-5 h-5 text-primary" />
                        <span className="font-medium text-foreground">M-Pesa</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Pay via M-Pesa STK Push
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("card")}
                      className={`p-4 rounded-2xl border-2 text-left barbsy-transition ${
                        paymentMethod === "card"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-foreground/20"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <CreditCard className="w-5 h-5 text-primary" />
                        <span className="font-medium text-foreground">Card</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Visa, Mastercard, Google Pay
                      </p>
                    </button>
                  </div>

                  {paymentMethod === "mpesa" && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-foreground block mb-1.5">
                          M-Pesa Phone Number
                        </label>
                        <input
                          type="tel"
                          value={form.phone}
                          onChange={(e) => updateForm("phone", e.target.value)}
                          placeholder="0712345678"
                          className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary barbsy-transition text-sm"
                        />
                      </div>

                      {stkSent && (
                        <div className="bg-primary/10 text-primary rounded-xl p-4 text-sm flex items-center gap-3">
                          <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
                          <div>
                            <p className="font-medium">STK Push sent!</p>
                            <p className="text-primary/80">Check your phone and enter your M-Pesa PIN to complete payment.</p>
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleMpesaPayment}
                        disabled={loading || !form.phone}
                        className="w-full bg-primary text-primary-foreground py-4 rounded-full font-medium hover:bg-primary/90 barbsy-transition disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          `Pay KES ${total.toLocaleString()} with M-Pesa`
                        )}
                      </button>
                    </div>
                  )}

                  {paymentMethod === "card" && (
                    <div className="space-y-4">
                      <div className="bg-muted/50 rounded-xl p-4 text-sm text-muted-foreground text-center">
                        Card payments coming soon. Use M-Pesa for now.
                      </div>
                      <button
                        type="button"
                        onClick={handleCardPayment}
                        disabled={loading}
                        className="w-full bg-foreground text-background py-4 rounded-full font-medium hover:bg-foreground/90 barbsy-transition disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          `Pay $${total.toFixed(2)} with Card`
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {step === "confirmation" && (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShieldCheck className="w-10 h-10 text-primary" />
                  </div>
                  <h2 className="font-serif text-3xl text-foreground mb-3">
                    Order Confirmed!
                  </h2>
                  <p className="text-muted-foreground mb-2">
                    Thank you for your order. We&apos;ll send a confirmation to{" "}
                    <span className="text-foreground font-medium">{form.email}</span>
                  </p>
                  {orderId && (
                    <p className="text-sm text-muted-foreground mb-8">
                      Order ID: <span className="font-mono text-foreground">{orderId.slice(0, 12)}...</span>
                    </p>
                  )}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                      href="/shop"
                      className="bg-primary text-primary-foreground px-8 py-3 rounded-full hover:bg-primary/90 barbsy-transition text-sm font-medium"
                    >
                      Continue Shopping
                    </Link>
                  </div>
                </div>
              )}

              {/* Trust badges */}
              {step !== "confirmation" && (
                <div className="grid grid-cols-3 gap-4 mt-10 pt-8 border-t border-border/30">
                  <div className="text-center">
                    <ShieldCheck className="w-5 h-5 text-primary mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Secure Checkout</p>
                  </div>
                  <div className="text-center">
                    <Truck className="w-5 h-5 text-primary mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Free Shipping $50+</p>
                  </div>
                  <div className="text-center">
                    <RotateCcw className="w-5 h-5 text-primary mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">30-Day Returns</p>
                  </div>
                </div>
              )}
            </div>

            {/* Order Summary Sidebar */}
            {step !== "confirmation" && (
              <div className="lg:col-span-2">
                <div className="bg-card rounded-2xl p-6 barbsy-shadow sticky top-28">
                  <h3 className="font-serif text-lg text-foreground mb-4">
                    Order Summary
                  </h3>

                  <div className="space-y-4 mb-6">
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-3">
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                          <span className="absolute -top-1 -right-1 w-5 h-5 bg-foreground text-background text-[10px] rounded-full flex items-center justify-center">
                            {item.quantity}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {item.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Qty: {item.quantity}
                          </p>
                        </div>
                        <p className="text-sm font-medium text-foreground">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2 text-sm border-t border-border/30 pt-4">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Shipping</span>
                      <span>{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span>
                    </div>
                    <div className="flex justify-between text-foreground font-medium text-base pt-2 border-t border-border/30">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
