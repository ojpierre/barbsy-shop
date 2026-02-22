"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import Script from "next/script"
import { useRouter } from "next/navigation"
import {
  ChevronLeft,
  Loader2,
  Phone,
  ShieldCheck,
  Truck,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Wallet,
} from "lucide-react"
import { useSession } from "next-auth/react"
import { Header } from "@/components/barbsy/header"
import { Footer } from "@/components/barbsy/footer"
import { useCart } from "@/components/barbsy/cart-context"
import {
  type CurrencyCode,
  detectCurrency,
  formatPrice,
  formatShipping,
  shippingCostUSD,
  toKES,
  convertPrice,
} from "@/lib/currency"

type Step = "information" | "payment" | "confirmation"
type PaymentMethod = "mpesa" | "google_pay"

// ── Google Pay types ─────────────────────────────────
declare global {
  interface Window {
    google?: {
      payments: {
        api: {
          PaymentsClient: new (config: Record<string, unknown>) => GooglePayClient
        }
      }
    }
  }
}

interface GooglePayClient {
  isReadyToPay: (req: Record<string, unknown>) => Promise<{ result: boolean }>
  loadPaymentData: (req: Record<string, unknown>) => Promise<Record<string, unknown>>
}

const BASE_CARD_PAYMENT_METHOD = {
  type: "CARD",
  parameters: {
    allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
    allowedCardNetworks: ["MASTERCARD", "VISA"],
  },
}

const TOKENIZATION_SPEC = {
  type: "PAYMENT_GATEWAY",
  parameters: {
    gateway: "example",
    gatewayMerchantId: "exampleGatewayMerchantId",
  },
}

// ─────────────────────────────────────────────────────

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart()
  const { data: session } = useSession()
  const router = useRouter()

  const [step, setStep] = useState<Step>("information")
  const [loading, setLoading] = useState(false)
  const [orderId, setOrderId] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("mpesa")
  const [stkSent, setStkSent] = useState(false)
  const [stkRef, setStkRef] = useState("")
  const [paymentError, setPaymentError] = useState("")
  const [orderError, setOrderError] = useState("")
  const [gpayReady, setGpayReady] = useState(false)
  const [currency, setCurrency] = useState<CurrencyCode>("KES")
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const gpayClientRef = useRef<GooglePayClient | null>(null)

  // Form state
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    notes: "",
  })

  // Detect currency and pre-fill form from session
  useEffect(() => {
    setCurrency(detectCurrency())
  }, [])

  useEffect(() => {
    if (session?.user) {
      setForm((prev) => ({
        ...prev,
        name: prev.name || session.user?.name || "",
        email: prev.email || session.user?.email || "",
      }))
    }
  }, [session])

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  const shippingUSD = shippingCostUSD(subtotal)
  const totalUSD = subtotal + shippingUSD

  const updateForm = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  // ── Google Pay Setup ───────────────────────────────
  const initGooglePay = useCallback(async () => {
    if (!window.google?.payments?.api) return

    try {
      const client = new window.google.payments.api.PaymentsClient({
        environment: "TEST",
      })
      gpayClientRef.current = client

      const readyToPay = await client.isReadyToPay({
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: [BASE_CARD_PAYMENT_METHOD],
      })

      setGpayReady(readyToPay.result)
    } catch (err) {
      console.error("Google Pay init error:", err)
    }
  }, [])

  // ── Step 1: Create Order ───────────────────────────
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setOrderError("")
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

      if (!res.ok) {
        throw new Error(data.error || "Failed to create order")
      }

      if (data.success && data.order?.id) {
        setOrderId(data.order.id)
        setStep("payment")
      } else {
        throw new Error("Invalid response from server")
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong"
      setOrderError(msg)
    } finally {
      setLoading(false)
    }
  }

  // ── Step 2a: M-Pesa Payment ────────────────────────
  const handleMpesaPayment = async () => {
    if (!form.phone) return
    setPaymentError("")
    setLoading(true)

    try {
      // Always send KES amount to PayHero
      const kesAmount = toKES(totalUSD)
      const phoneFormatted = form.phone.startsWith("0")
        ? `254${form.phone.slice(1)}`
        : form.phone.startsWith("+")
          ? form.phone.slice(1)
          : form.phone

      const res = await fetch("/api/payhero/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          phone: phoneFormatted,
          amount: kesAmount,
          customerName: form.name,
        }),
      })

      const data = await res.json()

      if (data.success) {
        setStkSent(true)
        setStkRef(data.reference || "")

        // Poll for payment status every 5 seconds
        pollRef.current = setInterval(async () => {
          try {
            const statusRes = await fetch(
              `/api/payhero/status?reference=${data.reference}&orderId=${orderId}`
            )
            const statusData = await statusRes.json()

            if (statusData.status === "paid") {
              if (pollRef.current) clearInterval(pollRef.current)
              clearCart()
              setStep("confirmation")
              setLoading(false)
            } else if (statusData.status === "failed") {
              if (pollRef.current) clearInterval(pollRef.current)
              setPaymentError("Payment was declined. Please try again.")
              setStkSent(false)
              setLoading(false)
            }
          } catch {
            // Continue polling
          }
        }, 5000)

        // Stop polling after 2 minutes
        setTimeout(() => {
          if (pollRef.current) {
            clearInterval(pollRef.current)
            if (step !== "confirmation") {
              setLoading(false)
              setStkSent(false)
              setPaymentError("Payment timed out. Please try again.")
            }
          }
        }, 120_000)
      } else {
        setPaymentError(data.error || "Failed to initiate payment")
        setLoading(false)
      }
    } catch {
      setPaymentError("Could not connect to payment provider")
      setLoading(false)
    }
  }

  // ── Step 2b: Google Pay Payment ────────────────────
  const handleGooglePay = async () => {
    if (!gpayClientRef.current) return
    setPaymentError("")
    setLoading(true)

    try {
      const paymentData = await gpayClientRef.current.loadPaymentData({
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: [
          {
            ...BASE_CARD_PAYMENT_METHOD,
            tokenizationSpecification: TOKENIZATION_SPEC,
          },
        ],
        merchantInfo: {
          merchantId: "BCR2DN4TY5ODALQJ",
          merchantName: "Barbsy Skincare",
        },
        transactionInfo: {
          totalPriceStatus: "FINAL",
          totalPrice:
            currency === "KES"
              ? Math.round(convertPrice(totalUSD, "KES")).toString()
              : totalUSD.toFixed(2),
          currencyCode: currency,
          countryCode: currency === "KES" ? "KE" : "US",
        },
      })

      // Send token to our API
      const tokenData = paymentData as Record<
        string,
        Record<string, Record<string, string>>
      >
      const res = await fetch("/api/payments/google-pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          paymentToken:
            tokenData?.paymentMethodData?.tokenizationData?.token ||
            "test_token",
          paymentData,
        }),
      })

      const data = await res.json()

      if (data.success) {
        clearCart()
        setStep("confirmation")
      } else {
        setPaymentError(
          "Google Pay payment failed. Please try another method."
        )
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : ""
      if (!msg.includes("CANCELED")) {
        setPaymentError("Google Pay payment was not completed.")
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Empty Cart ─────────────────────────────────────
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

      {/* Load Google Pay JS */}
      <Script
        src="https://pay.google.com/gp/p/js/pay.js"
        onLoad={initGooglePay}
        strategy="lazyOnload"
      />

      <div className="pt-28 pb-20">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          {/* Back */}
          {step !== "confirmation" && (
            <button
              type="button"
              onClick={() => {
                if (step === "payment") {
                  setStep("information")
                  setPaymentError("")
                  setStkSent(false)
                  if (pollRef.current) clearInterval(pollRef.current)
                } else {
                  router.push("/shop")
                }
              }}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground barbsy-transition mb-8"
            >
              <ChevronLeft className="w-4 h-4" />
              {step === "payment" ? "Back to information" : "Back to shop"}
            </button>
          )}

          {/* Steps indicator */}
          <div className="flex items-center gap-4 mb-10">
            {(["Information", "Payment", "Confirmation"] as const).map(
              (label, i) => {
                const stepMap: Step[] = [
                  "information",
                  "payment",
                  "confirmation",
                ]
                const currentIdx = stepMap.indexOf(step)
                const isActive = currentIdx >= i
                const isCompleted = currentIdx > i
                return (
                  <div key={label} className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium barbsy-transition ${
                        isCompleted
                          ? "bg-primary text-primary-foreground"
                          : isActive
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        i + 1
                      )}
                    </div>
                    <span
                      className={`text-sm hidden sm:block ${
                        isActive
                          ? "text-foreground font-medium"
                          : "text-muted-foreground"
                      }`}
                    >
                      {label}
                    </span>
                    {i < 2 && (
                      <div
                        className={`w-8 sm:w-16 h-px mx-2 ${
                          currentIdx > i ? "bg-primary" : "bg-border"
                        }`}
                      />
                    )}
                  </div>
                )
              }
            )}
          </div>

          {/* Currency toggle */}
          {step !== "confirmation" && (
            <div className="flex justify-end mb-4">
              <div className="inline-flex rounded-full bg-muted p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setCurrency("KES")}
                  className={`px-3 py-1 rounded-full barbsy-transition font-medium ${
                    currency === "KES"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  KSh
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency("USD")}
                  className={`px-3 py-1 rounded-full barbsy-transition font-medium ${
                    currency === "USD"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  USD
                </button>
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-5 gap-12">
            {/* ════════ Main Content ════════ */}
            <div className="lg:col-span-3">
              {/* ── STEP 1: Information ── */}
              {step === "information" && (
                <form onSubmit={handleCreateOrder} className="space-y-6">
                  <h2 className="font-serif text-2xl text-foreground mb-6">
                    Shipping Information
                  </h2>

                  {orderError && (
                    <div className="flex items-center gap-2 bg-destructive/10 text-destructive rounded-xl p-4 text-sm">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {orderError}
                    </div>
                  )}

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

              {/* ── STEP 2: Payment ── */}
              {step === "payment" && (
                <div className="space-y-6">
                  <h2 className="font-serif text-2xl text-foreground mb-2">
                    Payment Method
                  </h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    Order #{orderId.slice(0, 8)} &middot; Total:{" "}
                    <span className="font-semibold text-foreground">
                      {formatPrice(totalUSD, currency)}
                    </span>
                  </p>

                  {paymentError && (
                    <div className="flex items-center gap-2 bg-destructive/10 text-destructive rounded-xl p-4 text-sm">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {paymentError}
                    </div>
                  )}

                  {/* Payment method selector */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMethod("mpesa")
                        setPaymentError("")
                      }}
                      className={`p-4 rounded-2xl border-2 text-left barbsy-transition ${
                        paymentMethod === "mpesa"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-foreground/20"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Phone className="w-5 h-5 text-primary" />
                        <span className="font-medium text-foreground">
                          M-Pesa
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Pay via M-Pesa STK Push
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMethod("google_pay")
                        setPaymentError("")
                      }}
                      className={`p-4 rounded-2xl border-2 text-left barbsy-transition ${
                        paymentMethod === "google_pay"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-foreground/20"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Wallet className="w-5 h-5 text-primary" />
                        <span className="font-medium text-foreground">
                          Google Pay
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Visa, Mastercard via Google Pay
                      </p>
                    </button>
                  </div>

                  {/* ── M-Pesa ── */}
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
                        <div className="bg-primary/10 text-primary rounded-xl p-4 text-sm">
                          <div className="flex items-center gap-3 mb-2">
                            <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
                            <p className="font-medium">STK Push sent!</p>
                          </div>
                          <p className="text-primary/80 ml-8">
                            Check your phone and enter your M-Pesa PIN to
                            complete the payment of{" "}
                            <span className="font-bold">
                              KSh {toKES(totalUSD).toLocaleString()}
                            </span>
                          </p>
                          {stkRef && (
                            <p className="text-xs text-primary/60 ml-8 mt-1">
                              Ref: {stkRef}
                            </p>
                          )}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleMpesaPayment}
                        disabled={loading || !form.phone}
                        className="w-full bg-[#4CAF50] text-white py-4 rounded-full font-medium hover:bg-[#43A047] barbsy-transition disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {stkSent
                              ? "Waiting for confirmation..."
                              : "Sending STK Push..."}
                          </>
                        ) : (
                          <>
                            <Phone className="w-4 h-4" />
                            Pay KSh {toKES(totalUSD).toLocaleString()} with
                            M-Pesa
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* ── Google Pay ── */}
                  {paymentMethod === "google_pay" && (
                    <div className="space-y-4">
                      {gpayReady ? (
                        <button
                          type="button"
                          onClick={handleGooglePay}
                          disabled={loading}
                          className="w-full bg-black text-white py-4 rounded-full font-medium hover:bg-black/90 barbsy-transition disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <svg
                                viewBox="0 0 41 17"
                                fill="none"
                                className="h-5"
                              >
                                <path
                                  d="M19.526 2.635v4.083h2.518c.6 0 1.096-.202 1.488-.605.403-.402.605-.882.605-1.437 0-.544-.202-1.018-.605-1.422-.392-.413-.888-.62-1.488-.62h-2.518zm0 5.52v4.736h-1.504V1.198h3.99c1.013 0 1.873.337 2.582 1.012.72.675 1.08 1.497 1.08 2.466 0 .991-.36 1.819-1.08 2.482-.697.665-1.559.997-2.583.997h-2.485z"
                                  fill="white"
                                />
                                <path
                                  d="M27.194 10.442c0 .544.2 1.007.6 1.39.413.382.888.573 1.424.573s1.01-.19 1.424-.574c.4-.382.6-.845.6-1.389 0-.556-.2-1.024-.6-1.405-.413-.393-.888-.59-1.424-.59s-1.012.197-1.424.59c-.4.38-.6.849-.6 1.405zm5.456-4.306v.672h-.048c-.403-.506-.975-.758-1.716-.758-.855 0-1.582.322-2.183.966a3.308 3.308 0 00-.901 2.35c0 .896.3 1.662.9 2.299.602.636 1.329.954 2.184.954.741 0 1.313-.252 1.716-.757h.048v.48c0 1.27-.66 1.905-1.98 1.905-.773 0-1.405-.28-1.897-.84l-1.032 1.084c.72.81 1.685 1.215 2.897 1.215 1.014 0 1.83-.282 2.45-.846.632-.576.949-1.434.949-2.574v-6.15h-1.387z"
                                  fill="white"
                                />
                                <path
                                  d="M39.099 2.635v10.258h-1.504V2.635h-2.55v-1.44h6.604v1.44h-2.55z"
                                  fill="white"
                                />
                                <path
                                  d="M7.092 7.415c0-.39-.033-.77-.097-1.14H.007v2.281h3.986a3.428 3.428 0 01-1.476 2.241v1.864h2.39c1.397-1.289 2.202-3.187 2.202-5.246h-.017z"
                                  fill="#4285F4"
                                />
                                <path
                                  d="M.007 14.566c1.998 0 3.672-.663 4.895-1.795l-2.39-1.864c-.662.444-1.51.707-2.505.707-1.926 0-3.556-1.303-4.138-3.054h-2.468v1.924c1.212 2.414 3.703 4.082 6.606 4.082z"
                                  fill="#34A853"
                                />
                                <path
                                  d="M-4.131 8.56c-.149-.444-.233-.92-.233-1.41s.084-.965.233-1.41V3.817h-2.468A7.216 7.216 0 00-7.392 7.15c0 1.158.276 2.254.793 3.233l2.468-1.824z"
                                  fill="#FBBC04"
                                />
                                <path
                                  d="M.007 2.286c1.085 0 2.06.374 2.826 1.107l2.12-2.125C3.67.474 1.997-.4.008-.4c-2.903 0-5.394 1.668-6.606 4.082l2.468 1.924C-3.549 3.855-1.918 2.286.007 2.286z"
                                  fill="#EA4335"
                                />
                              </svg>
                              Pay {formatPrice(totalUSD, currency)}
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="text-center space-y-3">
                          <div className="bg-muted/50 rounded-xl p-6 text-sm text-muted-foreground">
                            <Wallet className="w-8 h-8 mx-auto mb-3 text-muted-foreground/60" />
                            <p>
                              Google Pay is not available on this
                              device/browser.
                            </p>
                            <p className="mt-1">
                              Try using Chrome or an Android device, or pay with
                              M-Pesa instead.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setPaymentMethod("mpesa")}
                            className="text-sm text-primary hover:underline"
                          >
                            Switch to M-Pesa
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── STEP 3: Confirmation ── */}
              {step === "confirmation" && (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-primary" />
                  </div>
                  <h2 className="font-serif text-3xl text-foreground mb-3">
                    Order Confirmed!
                  </h2>
                  <p className="text-muted-foreground mb-2">
                    Thank you for shopping with Barbsy! We&apos;ll send a
                    confirmation to{" "}
                    <span className="text-foreground font-medium">
                      {form.email}
                    </span>
                  </p>
                  {orderId && (
                    <p className="text-sm text-muted-foreground mb-8">
                      Order ID:{" "}
                      <span className="font-mono text-foreground">
                        {orderId.slice(0, 12)}...
                      </span>
                    </p>
                  )}

                  <div className="bg-muted/50 rounded-2xl p-6 text-left max-w-md mx-auto mb-8">
                    <h3 className="font-medium text-sm text-foreground mb-3">
                      What&apos;s next?
                    </h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        You&apos;ll receive an order confirmation email
                      </li>
                      <li className="flex gap-2">
                        <Truck className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        We&apos;ll prepare and ship your order within 24 hours
                      </li>
                      <li className="flex gap-2">
                        <Phone className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        Track your delivery via SMS
                      </li>
                    </ul>
                  </div>

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
                    <p className="text-xs text-muted-foreground">
                      Secure Checkout
                    </p>
                  </div>
                  <div className="text-center">
                    <Truck className="w-5 h-5 text-primary mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">
                      Free Shipping{" "}
                      {currency === "KES" ? "KSh 7,500+" : "$50+"}
                    </p>
                  </div>
                  <div className="text-center">
                    <RotateCcw className="w-5 h-5 text-primary mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">
                      30-Day Returns
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ════════ Order Summary Sidebar ════════ */}
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
                          {formatPrice(item.price * item.quantity, currency)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2 text-sm border-t border-border/30 pt-4">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span>{formatPrice(subtotal, currency)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Shipping</span>
                      <span>{formatShipping(subtotal, currency)}</span>
                    </div>
                    <div className="flex justify-between text-foreground font-medium text-base pt-2 border-t border-border/30">
                      <span>Total</span>
                      <span>{formatPrice(totalUSD, currency)}</span>
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
