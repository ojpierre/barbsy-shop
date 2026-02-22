import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import AdminDashboardClient from "./dashboard-client"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user?.email) {
    redirect("/auth/signin?callbackUrl=/admin")
  }

  const adminEmails = process.env.ADMIN_EMAILS?.split(",") || []
  const adminEmail = process.env.ADMIN_EMAIL || ""

  const isAdmin =
    session.user.role === "ADMIN" ||
    adminEmails.includes(session.user.email) ||
    adminEmail === session.user.email

  if (!isAdmin) {
    redirect("/")
  }

  return (
    <AdminDashboardClient user={session.user}>
      {children}
    </AdminDashboardClient>
  )
}
