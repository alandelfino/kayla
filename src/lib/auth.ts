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
        // Novo endpoint de login sem subdomínio na URL
        return loginInstance.post(`/api:eA5lqIuH/auth/login`, values)
    },
    getCompany: async () => {
        const response = await publicInstance.get(`/api:3QngmZuz/companies/${getSubdomain()}`)
        if (response.status === 200) {
            localStorage.setItem(`${getSubdomain()}-kayla-company`, JSON.stringify(response.data))
            return { status: response.status, data: response.data }
        }
        return { status: response.status, data: null }
    },
    userGuard: async () => {
        const authToken = getToken()
        if (!authToken) {
            // Sem token: redireciona imediatamente
            //window.location.href = '/sign-in'
            return
        }

        try {
            const response = await privateInstance.get('/api:eA5lqIuH/auth/me')
            if (response.status !== 200) {
                // Apenas se for 401/403 consideramos sessão inválida
                const status = response.status
                if (status === 401 || status === 403) {
                    //window.location.href = '/sign-in'
                }
                return
            }

            // Novo formato: API pode retornar um array com 1 usuário.
            const data = response?.data
            const user = Array.isArray(data) ? (data[0] ?? null) : data
            if (!user || !user.id) {
                // Apenas se não houver usuário válido e houver erro de autorização, redireciona
                //window.location.href = '/sign-in'
                return
            }

            // Persiste usuário (inclui imagem) para que o sidebar/menus tenham a URL do avatar
            try {
                localStorage.setItem(`${getSubdomain()}-kayla-user`, JSON.stringify(user))
            } catch {}
            // Notifica UI (sidebar/nav) que o usuário foi carregado/atualizado
            try {
                const avatarUrl = user?.image?.url ?? user?.avatar_url ?? null
                window.dispatchEvent(new CustomEvent('kayla:user-updated', {
                    detail: { name: user?.name, email: user?.email, avatarUrl }
                }))
            } catch {}
        } catch (err: any) {
            // Em falha de rede (timeout, abort, CORS), não redireciona.
            // Só redireciona se o backend respondeu 401/403.
            const status = err?.response?.status
            if (status === 401 || status === 403) {
                //window.location.href = '/sign-in'
            } else {
                console.warn('userGuard: falha ao validar sessão, mantendo usuário na página:', err?.message ?? err)
            }
        }
    }
}