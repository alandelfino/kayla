import * as React from "react"
import { NavUser } from "./nav-user"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail, SidebarMenuButton } from "@/components/ui/sidebar"
import { Navigation } from "./navigation"


export function DashboardSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    return (
        <Sidebar collapsible="icon" {...props} variant="sidebar">
            <SidebarHeader className="dark:bg-neutral-950">
                <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:text-2xl data-[slot=sidebar-menu-button]:p-1.5! h-14 font-confortaa rounded-none" >

                    {/* Company */}
                    <div className='flex h-10 items-center'>
                        <div className='font-bold text-2xl'>
                            <img src="/placeholder.svg" alt="logo" className="h-8 w-auto rounded-md" />
                        </div>
                        <span className="flex flex-col data-[slot=sidebar-menu-button]:hidden">
                            <div className='font-semibold text-sm leading-none text-slate-800'>Grupo Titanium</div>
                            <span className='text-xs text-slate-500 dark:text-neutral-500'>08.908.954/0001-09</span>
                        </span>
                    </div>

                </SidebarMenuButton>
            </SidebarHeader>
            <SidebarContent className="dark:bg-neutral-950">
                <Navigation />
            </SidebarContent>
            <SidebarFooter className="dark:bg-neutral-950">
                <NavUser />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}