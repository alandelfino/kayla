import { GalleryVerticalEnd } from "lucide-react"
import { createFileRoute } from '@tanstack/react-router'
import { LoginForm } from "./-components/login-form"
import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"

export const Route = createFileRoute('/sign-in/')({
    component: RouteComponent,
})

type Company = {
    id: number
    created_at: number
    updated_At: number
    name: string
    user_id: number
    alias: string
}

export default function RouteComponent() {

    const companyAlias = window.location.hostname.split('.')[0]
    const [company, setCompany] = useState<Company | null>(null)

    const { data, isLoading, isError, error, isLoadingError } = useQuery({
        queryKey: ['company'],
        queryFn: async () => {
            const response = await fetch(`https://x8ki-letl-twmt.n7.xano.io/api:3QngmZuz/companies/${companyAlias}`)
            return response.json()
        }
    })

    useEffect(() => {

        if (data) {
            setCompany(data)
        }

    })

    if (isLoading) {
        return <>
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
            </div>
        </>
    }

    if (isError || error || isLoadingError) {
        return <>
            <div className="flex justify-center items-center h-screen">
                <div className="text-red-500">{error.message}asd</div>
            </div>
        </>
    }

    if (!company) {
        return (
            <div className="grid min-h-svh lg:grid-cols-2">
                <div className="flex flex-col gap-4 p-6 md:p-10">
                    <div className="flex justify-center gap-2 md:justify-start">
                        <a href="#" className="flex items-center gap-2 font-medium">
                            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
                                <GalleryVerticalEnd className="size-4" />
                            </div>
                            {company?.name}
                        </a>
                    </div>
                    <div className="flex flex-1 items-center justify-center">
                        <div className="w-full max-w-xs">
                            <LoginForm />
                        </div>
                    </div>
                </div>
                <div className="bg-muted relative hidden lg:block">
                    <img
                        src="/placeholder.svg"
                        alt="Image"
                        className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                    />
                </div>
            </div>
        )
    }
}
