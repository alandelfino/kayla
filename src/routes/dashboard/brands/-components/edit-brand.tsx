import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Edit, Loader } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"
import { privateInstance } from "@/lib/auth"
import { useEffect, useState } from "react"



const formSchema = z.object({
    name: z.string().min(1, { message: "Nome é obrigatório" }),
})

export function EditBrandSheet({
    className,
    brandId,
    ...props
}: React.ComponentProps<"form"> & { brandId: number }) {

    const [open, setOpen] = useState(false)
    const [brandLoading, setBrandLoading] = useState(false)
    const queryClient = useQueryClient()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: ""
        },
    })

    const closeSheet = () => {
        setOpen(false)
        form.reset()
    }

    async function fetchBrand() {
        try {
            setBrandLoading(true)
            const response = await privateInstance.get(`/api:tc5G7www/brands/${brandId}`)
            const brand = response?.data
            if (!brand) {
                throw new Error('Resposta inválida ao buscar marca')
            }
            form.reset({ name: brand.name ?? "" })
        } catch (error: any) {
            toast.error(error?.message ?? 'Erro ao carregar marca')
        } finally {
            setBrandLoading(false)
        }
    }

    useEffect(() => {
        if (open && brandId) {
            fetchBrand()
        }
    }, [open, brandId])

    const { isPending, mutate } = useMutation({
        mutationFn: (values: z.infer<typeof formSchema>) => {
            return privateInstance.put(`/api:tc5G7www/brands/${brandId}`, values)
        },
        onSuccess: (response) => {
            if (response.status === 200) {
                toast.success("Marca atualizada com sucesso!")
                closeSheet()
                // Atualiza a listagem de marcas
                queryClient.invalidateQueries({ queryKey: ['brands'] })
            } else {
                toast.error('Erro ao salvar marca')
            }
        },
        onError: (error) => {
            toast.error(error.message)
        },
    })

    function onSubmit(values: z.infer<typeof formSchema>) {
        mutate(values)
    }


    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost">
                    <Edit className="w-4 h-4" />Editar
                </Button>
            </SheetTrigger>
            <SheetContent>
                <Form {...form}>
                    <form {...props} onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
                        <SheetHeader>
                            <SheetTitle>Editar marca</SheetTitle>
                            <SheetDescription>
                                {brandLoading ? (
                                    <span className="flex items-center gap-2"><Loader className="w-4 h-4 animate-spin" />Carregando dados da marca...</span>
                                ) : (
                                    <>Atualize os campos abaixo e salve as alterações.</>
                                )}
                            </SheetDescription>
                        </SheetHeader>
                        <div className="flex-1 grid auto-rows-min gap-6 px-4 py-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nome</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Digite o nome da marca..." {...field} disabled={brandLoading || isPending} />
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
                                <Button type="submit" disabled={isPending || brandLoading} className="w-full">
                                    {isPending ? <Loader className="animate-spin" /> : "Salvar"}
                                </Button>
                            </div>
                        </div>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    )
}
