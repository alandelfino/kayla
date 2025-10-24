import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { Loader, Plus } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useNavigate } from "@tanstack/react-router"
import { toast } from "sonner"



const formSchema = z.object({
    name: z.string().min(1, { message: "Nome é obrigatório" }),
})

export function NewBrandSheet({
    className,
    ...props
}: React.ComponentProps<"form">) {

    const navigate = useNavigate();
    const closeSheet = () => {
        form.reset()
    }

    const { isPending, mutate } = useMutation({
        mutationFn: (values: z.infer<typeof formSchema>) => {
            return fetch('https://x8ki-letl-twmt.n7.xano.io/api:tc5G7www/brands', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem("kayla-token")}`,
                },
                body: JSON.stringify(values),
            })
        },
        onSuccess: (response) => {
            if (response.ok) {
                toast.success("Marca cadastrada com sucesso!")
                closeSheet()
            } else {
                toast.error('Erro ao cadastrar marca')
            }
        },
        onError: (error) => {
            toast.error(error.message)
        },
    })

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: ""
        },
    })

    function onSubmit(values: z.infer<typeof formSchema>) {

        mutate(values)

    }


    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="default">
                    <Plus className="w-4 h-4" />Cadastrar
                </Button>
            </SheetTrigger>
            <SheetContent>
                <Form {...form}>
                    <form {...props} onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
                        <SheetHeader>
                            <SheetTitle>Cadastro de marca</SheetTitle>
                            <SheetDescription>
                                Preencha os campos abaixo para cadastrar uma nova marca.
                            </SheetDescription>
                        </SheetHeader>
                        <div className="flex-1 grid auto-rows-min gap-6 px-4 py-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>E-mail</FormLabel>
                                        <FormControl>
                                            <Input placeholder="seuemail@exemplo.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="mt-auto border-t p-4">
                            <div className="grid grid-cols-2 gap-4">
                                <SheetClose asChild>
                                    <Button variant="outline" className="w-full">Cancelar</Button>
                                </SheetClose>
                                <Button type="submit" disabled={isPending} className="w-full">
                                    {isPending ? <Loader className="animate-spin" /> : "Cadastrar"}
                                </Button>
                            </div>
                        </div>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    )
}
