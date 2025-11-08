import z, { success } from "zod"
import axios from 'axios'

export const formSchema = z.object({
    email: z.email(),
    password: z.string().min(2, 'A senha deve ter pelo menos 2 caracteres'),
})

const getSubdomain = () => {
    const subdomain = window.location.hostname.split('.')[0]
    return subdomain
}

const getCompanyId = () => {
    const company = localStorage.getItem(`${getSubdomain()}-kayla-company`)
    if (company) {
        return JSON.parse(company).id
    }
    return null
}

const getToken = () => {
    return localStorage.getItem(`${getSubdomain()}-kayla-authToken`)
}

const publicInstance = axios.create({
    baseURL: "https://x8ki-letl-twmt.n7.xano.io",
    headers: {
        "Content-Type": "application/json",
    },
})

const loginInstance = axios.create({
    baseURL: "https://x8ki-letl-twmt.n7.xano.io",
    headers: {
        "Content-Type": "application/json",
    },
})

loginInstance.interceptors.response.use((response) => {
    if (response.status === 200) {
        const authToken = response.data.authToken
        localStorage.setItem(`${getSubdomain()}-kayla-authToken`, authToken)
        localStorage.setItem(`${getSubdomain()}-kayla-user`, JSON.stringify(response.data.user))
        // Notifica UI (sidebar/nav) que o usuário foi carregado/atualizado
        try {
            const avatarUrl = response?.data?.user?.image?.url ?? response?.data?.user?.avatar_url ?? null
            window.dispatchEvent(new CustomEvent('kayla:user-updated', {
                detail: { name: response?.data?.user?.name, email: response?.data?.user?.email, avatarUrl }
            }))
        } catch {}
    }
    return response
})

export const privateInstance = axios.create({
    baseURL: "https://x8ki-letl-twmt.n7.xano.io",
})

privateInstance.interceptors.request.use((config) => {
    // Preserve existing Content-Type if already set (e.g., multipart/form-data for file uploads)
    if (!config.headers['Content-Type']) {
        config.headers['Content-Type'] = 'application/json'
    }
    config.headers.Authorization = `Bearer ${localStorage.getItem(`${getSubdomain()}-kayla-authToken`)}`
    return config
})

export const auth = {
    login: async (values: z.infer<typeof formSchema>) => {
        return loginInstance.post(`/api:eA5lqIuH/auth/${getSubdomain()}/login`, values)
    },
    getCompany: async () => {
        const response = await publicInstance.get(`/api:3QngmZuz/companies/${getSubdomain()}`)
        if (response.status === 200) {
            localStorage.setItem(`${getSubdomain()}-kayla-company`, JSON.stringify(response.data))
            return { status: response.status, data: response.data }
        }
        return { status: response.status, data: null }
    },
    userGuard: () => {

        const authToken = getToken()
        if (!authToken) {
            window.location.href = '/sign-in'
        }

        privateInstance.get('/api:eA5lqIuH/auth/me')
            .then((response) => {
                if (response.status !== 200) {
                    window.location.href = '/sign-in'
                } else {
                    // Persiste usuário (inclui imagem) para que o sidebar/menus tenham a URL do avatar
                    try {
                        localStorage.setItem(`${getSubdomain()}-kayla-user`, JSON.stringify(response.data))
                    } catch {}
                    // Notifica UI (sidebar/nav) que o usuário foi carregado/atualizado
                    try {
                        const avatarUrl = response?.data?.image?.url ?? response?.data?.avatar_url ?? null
                        window.dispatchEvent(new CustomEvent('kayla:user-updated', {
                            detail: { name: response?.data?.name, email: response?.data?.email, avatarUrl }
                        }))
                    } catch {}
                }
            })
            .catch(() => {
                window.location.href = '/sign-in'
            })

    }
}