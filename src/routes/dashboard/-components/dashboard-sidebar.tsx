import * as React from "react"
import { auth } from '@/lib/auth'
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail, SidebarMenuButton } from "@/components/ui/sidebar"
import { Navigation } from "./navigation"


type CompanyInfo = {
    id?: number
    name?: string
    alias?: string | null
    cnpj?: string | null
    document?: string | null
    image?: { url?: string | null } | null
    logo_url?: string | null
}

export function DashboardSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const [company, setCompany] = React.useState<CompanyInfo | null>(null)

    React.useEffect(() => {
        const sub = window.location.hostname.split('.')[0]
        const key = `${sub}-kayla-company`
        const fromLocal = (() => {
            try {
                const raw = localStorage.getItem(key)
                return raw ? JSON.parse(raw) as CompanyInfo : null
            } catch { return null }
        })()

        if (fromLocal && (fromLocal.name || fromLocal.alias)) {
            setCompany(fromLocal)
        } else {
            auth.getCompany().then((res) => {
                if (res?.status === 200 && res?.data) {
                    setCompany(res.data as CompanyInfo)
                }
            }).catch(() => {})
        }

        const handleStorage = (e: StorageEvent) => {
            if (!e.key || !e.key.endsWith('-kayla-company')) return
            try {
                const next = e.newValue ? JSON.parse(e.newValue) as CompanyInfo : null
                setCompany(next)
            } catch {}
        }
        window.addEventListener('storage', handleStorage)
        return () => window.removeEventListener('storage', handleStorage)
    }, [])

    const companyName = company?.name ?? 'Empresa'
    const companyDoc = company?.cnpj ?? company?.document ?? company?.alias ?? '—'

    return (
        <Sidebar collapsible="icon" {...props} variant="sidebar">
            <SidebarHeader className="dark:bg-neutral-950">
                <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:text-2xl data-[slot=sidebar-menu-button]:p-1.5! h-14 font-confortaa rounded-none" >

                    {/* Company */}
                    <div className='flex h-10 items-center'>
                        <div className='font-bold text-2xl'>
                            <img src={company?.image?.url ?? company?.logo_url ?? '/placeholder.svg'} alt="logo" className="h-8 w-auto rounded-md" />
                        </div>
                        <span className="flex flex-col data-[slot=sidebar-menu-button]:hidden">
                            <div className='font-semibold text-sm leading-none text-slate-800'>{companyName}</div>
                            <span className='text-xs text-slate-500 dark:text-neutral-500'>{companyDoc}</span>
                        </span>
                    </div>

                </SidebarMenuButton>
            </SidebarHeader>
            <SidebarContent className="dark:bg-neutral-950">
                <Navigation />
            </SidebarContent>
            {/* User session moved to Topbar */}
            <SidebarFooter className="dark:bg-neutral-950" />
            <SidebarRail />
        </Sidebar>
    )
}