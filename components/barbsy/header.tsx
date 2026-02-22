"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Menu, X, ShoppingBag, Search, User, LogOut, ShieldCheck } from "lucide-react"
import { useSession, signIn, signOut } from "next-auth/react"
import { CartDrawer } from "./cart-drawer"
import { useCart } from "./cart-context"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const { setIsOpen, itemCount } = useCart()
  const { data: session } = useSession()
  const router = useRouter()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 pt-4">
      <nav className="max-w-7xl mx-auto px-6 lg:px-8 backdrop-blur-md rounded-lg py-0 my-0 animate-scale-fade-in bg-[rgba(255,255,255,0.4)] border border-[rgba(255,255,255,0.32)]" style={{ boxShadow: 'rgba(0, 0, 0, 0.1) 0px 10px 50px' }}>
        <div className="flex items-center justify-between h-[68px]">
          {/* Mobile menu button */}
          <button
            type="button"
            className="lg:hidden p-2 text-foreground/80 hover:text-foreground barbsy-transition"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Desktop Navigation - Left */}
          <div className="hidden lg:flex items-center gap-8">
            <Link
              href="/shop"
              className="text-sm tracking-wide text-foreground/70 hover:text-foreground barbsy-transition"
            >
              Shop
            </Link>
            <Link
              href="/"
              className="text-sm tracking-wide text-foreground/70 hover:text-foreground barbsy-transition"
            >
              About
            </Link>
            <Link
              href="/"
              className="text-sm tracking-wide text-foreground/70 hover:text-foreground barbsy-transition"
            >
              Ingredients
            </Link>
          </div>

          {/* Logo */}
          <Link href="/" className="absolute left-1/2 -translate-x-1/2">
            <h1 className="font-serif text-3xl tracking-wider text-foreground">Barbsy</h1>
          </Link>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => router.push("/search")}
              className="p-2 text-foreground/70 hover:text-foreground barbsy-transition"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* User / Auth */}
            <div className="relative hidden sm:block">
              {session ? (
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1 text-foreground/70 hover:text-foreground barbsy-transition rounded-full"
                  aria-label="Account menu"
                >
                  {session.user?.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user.name ?? ""}
                      width={28}
                      height={28}
                      className="rounded-full"
                    />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => signIn("google")}
                  className="p-2 text-foreground/70 hover:text-foreground barbsy-transition"
                  aria-label="Sign in"
                >
                  <User className="w-5 h-5" />
                </button>
              )}

              {/* User dropdown */}
              {isUserMenuOpen && session && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-border/50 py-2 z-50">
                  <div className="px-4 py-2 border-b border-border/30">
                    <p className="text-sm font-medium truncate">{session.user?.name}</p>
                    <p className="text-xs text-foreground/50 truncate">{session.user?.email}</p>
                  </div>
                  {(session.user as { role?: string })?.role === "ADMIN" && (
                    <Link
                      href="/admin"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-foreground/70 hover:text-foreground hover:bg-foreground/5 barbsy-transition"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Admin Dashboard
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => { setIsUserMenuOpen(false); signOut() }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-foreground/70 hover:text-foreground hover:bg-foreground/5 barbsy-transition"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="relative p-2 text-foreground/70 hover:text-foreground barbsy-transition"
              aria-label="Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center rounded-full animate-scale-fade-in">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <CartDrawer />

        {/* Mobile Navigation */}
        <div
          className={`lg:hidden overflow-hidden barbsy-transition ${
            isMenuOpen ? "max-h-64 pb-6" : "max-h-0"
          }`}
        >
          <div className="flex flex-col gap-4 pt-4 border-t border-border/50">
            <Link
              href="/shop"
              className="text-sm tracking-wide text-foreground/70 hover:text-foreground barbsy-transition"
            >
              Shop
            </Link>
            <Link
              href="/"
              className="text-sm tracking-wide text-foreground/70 hover:text-foreground barbsy-transition"
            >
              About
            </Link>
            <Link
              href="/"
              className="text-sm tracking-wide text-foreground/70 hover:text-foreground barbsy-transition"
            >
              Ingredients
            </Link>
            {session ? (
              <button
                type="button"
                onClick={() => signOut()}
                className="text-sm tracking-wide text-foreground/70 hover:text-foreground barbsy-transition text-left"
              >
                Sign out
              </button>
            ) : (
              <button
                type="button"
                onClick={() => signIn("google")}
                className="text-sm tracking-wide text-foreground/70 hover:text-foreground barbsy-transition text-left"
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </nav>
    </header>
  )
}
