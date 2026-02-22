"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useSearchParams, useRouter } from "next/navigation"
import { Suspense } from "react"
import { Mail, Eye, EyeOff, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"

function SignInContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const callbackUrl = searchParams.get("callbackUrl") || "/"
  const error = searchParams.get("error")

  const [mode, setMode] = useState<"choose" | "signin" | "signup">("choose")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [name, setName] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState("")

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setFormError("")

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setFormError("Invalid email or password")
      } else {
        router.push(callbackUrl)
        router.refresh()
      }
    } catch {
      setFormError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setFormError("")

    if (password !== confirmPassword) {
      setFormError("Passwords do not match")
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setFormError("Password must be at least 6 characters")
      setLoading(false)
      return
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setFormError(data.error || "Failed to create account")
        return
      }

      // Auto sign-in after registration
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setFormError("Account created. Please sign in.")
        setMode("signin")
      } else {
        router.push(callbackUrl)
        router.refresh()
      }
    } catch {
      setFormError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const errorMessages: Record<string, string> = {
    OAuthAccountNotLinked: "This email is already linked to another account.",
    CredentialsSignin: "Invalid email or password.",
    Default: "Something went wrong. Please try again.",
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-3xl p-8 shadow-lg barbsy-shadow">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/">
              <h1 className="font-serif text-4xl text-foreground mb-2">Barbsy</h1>
            </Link>
            <p className="text-muted-foreground">
              {mode === "signup" ? "Create your account" : "Welcome back"}
            </p>
          </div>

          {(error || formError) && (
            <div className="bg-destructive/10 text-destructive rounded-xl p-3 mb-6 text-sm text-center">
              {formError || errorMessages[error!] || errorMessages.Default}
            </div>
          )}

          {mode === "choose" && (
            <div className="space-y-3">
              {/* Google Sign In */}
              <button
                onClick={() => signIn("google", { callbackUrl })}
                className="w-full flex items-center justify-center gap-3 bg-white text-foreground border border-border rounded-full px-6 py-3.5 hover:bg-muted transition-colors text-sm font-medium"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-4 text-muted-foreground">or</span>
                </div>
              </div>

              {/* Email Sign In */}
              <button
                onClick={() => setMode("signin")}
                className="w-full flex items-center justify-center gap-3 bg-foreground text-background rounded-full px-6 py-3.5 hover:bg-foreground/90 transition-colors text-sm font-medium"
              >
                <Mail className="w-5 h-5" />
                Continue with Email
              </button>

              <p className="text-center text-xs text-muted-foreground mt-6">
                Don&apos;t have an account?{" "}
                <button
                  onClick={() => setMode("signup")}
                  className="text-primary hover:underline font-medium"
                >
                  Sign up
                </button>
              </p>
            </div>
          )}

          {(mode === "signin" || mode === "signup") && (
            <form onSubmit={mode === "signin" ? handleEmailSignIn : handleRegister} className="space-y-4">
              <button
                type="button"
                onClick={() => { setMode("choose"); setFormError("") }}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground barbsy-transition mb-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              {mode === "signup" && (
                <div>
                  <label htmlFor="name" className="text-sm font-medium text-foreground block mb-1.5">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary barbsy-transition text-sm"
                  />
                </div>
              )}

              <div>
                <label htmlFor="email" className="text-sm font-medium text-foreground block mb-1.5">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary barbsy-transition text-sm"
                />
              </div>

              <div>
                <label htmlFor="password" className="text-sm font-medium text-foreground block mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "signup" ? "Min 6 characters" : "Enter your password"}
                    required
                    minLength={6}
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary barbsy-transition text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground barbsy-transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {mode === "signup" && (
                <div>
                  <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground block mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      required
                      minLength={6}
                      className={`w-full px-4 py-3 pr-12 rounded-xl border bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 barbsy-transition text-sm ${
                        confirmPassword && confirmPassword !== password
                          ? "border-destructive focus:border-destructive"
                          : "border-border focus:border-primary"
                      }`}
                    />
                    {confirmPassword && (
                      <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium ${
                        confirmPassword === password ? "text-primary" : "text-destructive"
                      }`}>
                        {confirmPassword === password ? "✓" : "✗"}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground py-3.5 rounded-full font-medium hover:bg-primary/90 barbsy-transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {mode === "signup" ? "Create Account" : "Sign In"}
              </button>

              {/* Divider */}
              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-4 text-muted-foreground">or</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => signIn("google", { callbackUrl })}
                className="w-full flex items-center justify-center gap-3 bg-white text-foreground border border-border rounded-full px-6 py-3 hover:bg-muted transition-colors text-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </button>

              <p className="text-center text-xs text-muted-foreground mt-4">
                {mode === "signin" ? (
                  <>
                    Don&apos;t have an account?{" "}
                    <button
                      type="button"
                      onClick={() => { setMode("signup"); setFormError("") }}
                      className="text-primary hover:underline font-medium"
                    >
                      Sign up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => { setMode("signin"); setFormError("") }}
                      className="text-primary hover:underline font-medium"
                    >
                      Sign in
                    </button>
                  </>
                )}
              </p>
            </form>
          )}

          <p className="text-xs text-muted-foreground mt-6 text-center">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </main>
  )
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-muted-foreground">Loading...</div>
        </main>
      }
    >
      <SignInContent />
    </Suspense>
  )
}
