import { Toaster } from '@/components/ui/sonner'
import { createRootRoute, Outlet } from '@tanstack/react-router'

const RootLayout = () => (
    <>
        <Outlet />
        <Toaster richColors />
    </>
)

export const Route = createRootRoute({ component: RootLayout })