import z from "zod"

export const formSchema = z.object({
    email: z.string().min(2).max(50),
    password: z.string().min(2).max(50),
})

export const auth = {
    login: async (values: z.infer<typeof formSchema>) => {
        return fetch("https://x8ki-letl-twmt.n7.xano.io/api:eA5lqIuH/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(values),
        })
    }
}