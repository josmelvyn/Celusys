import { getSession } from '@/app/lib/auth/session'
import { AuthProvider } from '@/app/component/providers/auth-provider'
import { Sidebar } from '@/app/component/shared/sidebar'
import { Navbar } from '@/app/component/shared/navbar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getSession()

  return (
    <AuthProvider user={user}>
      <div className="flex min-h-screen bg-slate-950 text-slate-100">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar />
          <main className="p-6 flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </AuthProvider>
  )
}