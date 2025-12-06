import { useEffect, useState } from 'react'
import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Form, FormField, FormItem, FormLabel, FormMessage, FormControl, FormDescription } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { privateInstance } from '@/lib/auth'
import { toast } from 'sonner'
import { Edit, Loader } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

type StoreItem = { id: number; name?: string; description?: string; active?: boolean; price_table_id?: number }

const formSchema = z.object({
  name: z.string().min(1, { message: 'Nome da loja é obrigatório' }),
  description: z.string().optional().or(z.literal('')),
  active: z.boolean().default(true),
  price_table_id: z.number().optional(),
})

type PriceTable = { id: number; name?: string }
type PriceTablesResponse = { items?: PriceTable[] } | PriceTable[]

export function EditStoreSheet({ storeId, onSaved }: { storeId: number, onSaved?: () => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: { name: '', description: '', active: true, price_table_id: undefined },
  })

  const { data: priceTablesData } = useQuery({
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    queryKey: ['price-tables', 'select'],
    queryFn: async () => {
      const url = `/api:m3u66HYX/price_tables?page=1&per_page=${50}`
      const response = await privateInstance.get(url)
      if (response.status !== 200) throw new Error('Erro ao carregar tabelas de preço')
      return response.data as PriceTablesResponse
    }
  })
  const priceTables = Array.isArray(priceTablesData)
    ? priceTablesData
    : Array.isArray((priceTablesData as any)?.items)
      ? (priceTablesData as any).items
      : []

  useEffect(() => {
    async function run() {
      try {
        setLoading(true)
        const response = await privateInstance.get(`/api:gI4qBCGQ/stores/${storeId}`)
        if (response.status !== 200 || !response.data) throw new Error('Falha ao carregar loja')
        const s = response.data as StoreItem
        form.reset({ name: s.name ?? '', description: s.description ?? '', active: s.active === true, price_table_id: typeof s.price_table_id === 'number' ? s.price_table_id : undefined })
      } catch (err: any) {
        toast.error(err?.response?.data?.message ?? 'Erro ao carregar loja')
      } finally {
        setLoading(false)
      }
    }
    if (open) run()
  }, [open, storeId])

  const { isPending, mutateAsync } = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const payload = { name: values.name, description: values.description ?? '', active: values.active, price_table_id: values.price_table_id }
      const response = await privateInstance.put(`/api:gI4qBCGQ/stores/${storeId}`, payload)
      if (response.status !== 200) throw new Error('Erro ao atualizar loja')
      return response.data
    },
    onSuccess: () => {
      toast.success('Loja atualizada com sucesso!')
      setOpen(false)
      onSaved?.()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? 'Erro ao atualizar loja')
    }
  })

  async function onSubmit(values: z.infer<typeof formSchema>) { await mutateAsync(values) }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant={'outline'}>
          <Edit /> Editar
        </Button>
      </SheetTrigger>
      <SheetContent className='sm:max-w-sm'>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='flex flex-col h-full'>
            <SheetHeader>
              <SheetTitle>Editar loja</SheetTitle>
              <SheetDescription>Atualize os dados da loja e salve.</SheetDescription>
            </SheetHeader>

            <div className='flex-1 grid auto-rows-min gap-6 px-4 py-4'>
              <FormField control={form.control} name='name' render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder='Nome da loja' {...field} disabled={loading || isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name='description' render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <textarea placeholder='Opcional' {...field} disabled={loading || isPending}
                      className='file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm h-28 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name='price_table_id' render={({ field }) => (
                <FormItem>
                  <FormLabel>Tabela de preço padrão</FormLabel>
                  <FormControl>
                    <Select value={field.value != null ? String(field.value) : undefined} onValueChange={(v) => field.onChange(v ? Number(v) : undefined)}>
                      <SelectTrigger className='w-full'>
                        <SelectValue placeholder='Selecione uma tabela' />
                      </SelectTrigger>
                      <SelectContent>
                        {priceTables.map((pt: PriceTable) => (
                          <SelectItem key={pt.id} value={String(pt.id)}>{pt.name ?? `Tabela ${pt.id}`}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className='grid grid-cols-1 gap-4'>
                <FormField control={form.control} name='active' render={({ field }) => (
                  <FormItem>
                    <div className='flex border items-center justify-between gap-3 bg-neutral-50 dark:bg-neutral-900 px-3 py-2.5 rounded-md'>
                      <div className='flex flex-col gap-0.5'>
                        <FormLabel>Ativo</FormLabel>
                        <FormDescription className='leading-snug text-xs'>Quando habilitada, a loja aparece ativa.</FormDescription>
                        <FormMessage />
                      </div>
                      <FormControl>
                        <Switch checked={Boolean(field.value)} onCheckedChange={(v) => field.onChange(v)} disabled={loading || isPending} />
                      </FormControl>
                    </div>
                  </FormItem>
                )} />
              </div>
            </div>

            <div className='mt-auto border-t p-4'>
              <div className='grid grid-cols-2 gap-4'>
                <SheetClose asChild>
                  <Button variant='outline' className='w-full'>Cancelar</Button>
                </SheetClose>
                <Button type='submit' disabled={isPending} className='w-full'>
                  {isPending ? <Loader className='animate-spin' /> : 'Salvar alterações'}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}