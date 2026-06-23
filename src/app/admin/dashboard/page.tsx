'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { isAdminLoggedIn } from '@/lib/admin-storage'
import AdminDashboard from '@/components/admin/AdminDashboard'

export default function DashboardPage() {
  const router = useRouter()

  useEffect(() => {
    if (!isAdminLoggedIn()) router.replace('/admin')
  }, [router])

  return <AdminDashboard />
}
