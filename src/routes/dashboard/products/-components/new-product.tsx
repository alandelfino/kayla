import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import DerivationsMultiSelect from './derivations-multi-select'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader, PackagePlus } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { toast } from 'sonner'
import { privateInstance } from '@/lib/auth'
import { Switch } from '@/components/ui/switch'
import { useEffect, useState } from 'react'
import { maskMoneyInput, toCents, formatMoneyFromCents } from '@/lib/format'

const formSchema = z.object({
  sku: z.string().min(1, { message: 'Campo obrigatório' }).regex(/^[a-z0-9-]+$/, 'Use apenas minúsculas, números e hífen (-)'),
  name: z.string().min(1, { message: 'Campo obrigatório' }),
  description: z.string().optional().or(z.literal('')),
  type: z.enum(['simple', 'with_derivations'] as const, { message: 'Campo obrigatório' }),
  price: z.preprocess((v) => typeof v === 'number' ? v : toCents(v), z.number({ message: 'Campo obrigatório' }).int().min(1, 'O preço deve ser maior que zero')),
  promotional_price: z.preprocess((v) => typeof v === 'number' ? v : toCents(v), z.number().int().min(0)),
  active: z.boolean({ message: 'Campo obrigatório' }),
  promotional_price_active: z.boolean({ message: 'Campo obrigatório' }),
  managed_inventory: z.boolean({ message: 'Campo obrigatório' }),
  unit_id: z.preprocess(
    (v) => {
      if (v === '' || v === null || v === undefined) return undefined
      if (typeof v === 'string') {
        const n = Number(v)
        return Number.isFinite(n) ? n : NaN
      }
      return v
    },
    z
      .number({ message: 'Campo obrigatório' })
      .refine((v) => !Number.isNaN(v), { message: 'Campo obrigatório' })
      .int()
  ),
  brand_id: z.preprocess(
    (v) => {
      if (v === '' || v === null || v === undefined) return undefined
      if (typeof v === 'string') {
        const n = Number(v)
        return Number.isFinite(n) ? n : NaN
      }
      return v
    },
    z
      .number({ message: 'Campo obrigatório' })
      .refine((v) => !Number.isNaN(v), { message: 'Campo obrigatório' })
      .int()
  ),
  derivation_ids: z.array(z.number()).default([]),
}).superRefine((data, ctx) => {
  if (data.type === 'with_derivations' && (!data.derivation_ids || data.derivation_ids.length === 0)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['derivation_ids'], message: 'Selecione pelo menos uma derivação' })
  }
})

export function NewProductSheet({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      sku: '',
      name: '',
      description: '',
      type: 'simple',
      price: 0,
      promotional_price: 0,
      active: true,
      promotional_price_active: false,
      managed_inventory: false,
      unit_id: undefined,
      brand_id: undefined,
      derivation_ids: [],
    }
  })

  const isWithDerivations = form.watch('type') === 'with_derivations'

  const { isPending, mutate } = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const response = await privateInstance.post('/api:c3X9fE5j/products', values)
      return response
    },
    onSuccess: (response) => {
      if (response.status === 200 || response.status === 201) {
        toast.success('Produto criado com sucesso!')
        setOpen(false)
        form.reset()
        onCreated?.()
        queryClient.invalidateQueries({ queryKey: ['products'] })
      } else {
        toast.error('Erro ao salvar produto')
      }
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? 'Erro ao criar produto')
    }
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    mutate(values)
  }

  // Carregar marcas e unidades do backend (Xano Products API)
  const { data: brandsData, isLoading: isBrandsLoading } = useQuery({
    queryKey: ['brands'],
    enabled: open,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    queryFn: async () => {
      const response = await privateInstance.get('/api:tc5G7www/brands?per_page=50')
      if (response.status !== 200) throw new Error('Erro ao carregar marcas')
      return response.data as any
    }
  })

  const { data: unitsData, isLoading: isUnitsLoading } = useQuery({
    queryKey: ['units'],
    enabled: open,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    queryFn: async () => {
      const response = await privateInstance.get('/api:-b71x_vk/unit_of_measurement?per_page=50')
      if (response.status !== 200) throw new Error('Erro ao carregar unidades')
      return response.data as any
    }
  })

  // Carregar derivações
  

  // Helpers de máscara
  function toSkuSlug(val: string) {
    const base = String(val || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
    const spaced = base.replace(/\s+/g, '-')
    return spaced
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-{2,}/g, '-')
  }
  function currencyMask(val: string) { return maskMoneyInput(val) }

  // Estados de exibição mascarada
  const [priceText, setPriceText] = useState('')
  const [promoPriceText, setPromoPriceText] = useState('')
  
  

  useEffect(() => {
    // Inicializa textos ao abrir/fechar e quando muda unidade
    const p = form.getValues('price')
    const pp = form.getValues('promotional_price')
    setPriceText(formatMoneyFromCents(p))
    setPromoPriceText(formatMoneyFromCents(pp))
  }, [open])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant={'default'}>
          <PackagePlus /> Novo produto
        </Button>
      </SheetTrigger>
      <SheetContent className='sm:max-w-[800px] md:max-w-[700px] lg:max-w-[600px]'>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='flex flex-col h-full'>
            <SheetHeader>
              <SheetTitle>Novo produto</SheetTitle>
              <SheetDescription>Cadastre um novo produto no catálogo.</SheetDescription>
            </SheetHeader>

            <div className='flex-1 overflow-y-auto px-4 py-4'>
              
              <Tabs defaultValue='geral' className='flex-1'>
                <TabsList>
                  <TabsTrigger value='geral' className='px-4'>Geral</TabsTrigger>
                  <TabsTrigger value='descricao' className='px-4'>Descrição</TabsTrigger>
                </TabsList>

                <TabsContent value='geral' className='mt-4'>
                  <div className='grid auto-rows-min gap-6'>
                    <div className='grid grid-cols-1 md:grid-cols-[150px_1fr] gap-4'>
                      <FormField control={form.control} name='sku' render={({ field }) => (
                        <FormItem>
                          <FormLabel>SKU</FormLabel>
                          <FormControl>
                            <Input
                              placeholder='SKU'
                              className='min-w-[120px] w-[150px] max-w-[150px]'
                              value={field.value ?? ''}
                              onChange={(e) => field.onChange(toSkuSlug(e.target.value))}
                              disabled={isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name='name' render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome</FormLabel>
                          <FormControl>
                            <Input className='w-full' placeholder='Nome do produto' {...field} disabled={isPending} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <div className='grid grid-cols-1 gap-4'>
                      <FormField control={form.control} name='type' render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo</FormLabel>
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger className='w-full' aria-label='Tipo do produto'>
                                <SelectValue placeholder='Selecione o tipo' />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  <SelectItem value='simple'>Simples</SelectItem>
                                  <SelectItem value='with_derivations'>Com variações</SelectItem>
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <div className={`overflow-hidden transition-all duration-200 ease-in-out ${isWithDerivations ? 'opacity-100 translate-y-0 max-h-[500px]' : 'opacity-0 -translate-y-1 max-h-0'}`}>
                        <FormField control={form.control} name='derivation_ids' render={({ field }) => (
                          <FormItem>
                            <FormLabel>Derivações</FormLabel>
                            <FormControl>
                              <DerivationsMultiSelect
                                value={field.value || []}
                                onChange={(next) => form.setValue('derivation_ids', next, { shouldDirty: true, shouldValidate: true })}
                                disabled={isPending}
                                enabled={open}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <FormField control={form.control} name='price' render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preço</FormLabel>
                          <FormControl>
                            <Input type='text' inputMode='numeric' placeholder='R$ 0,00' value={priceText}
                              onChange={(e) => {
                                const { text, value } = currencyMask(e.target.value)
                                setPriceText(text)
                                field.onChange(value)
                              }}
                              disabled={isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name='promotional_price' render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preço promocional</FormLabel>
                          <FormControl>
                            <Input type='text' inputMode='numeric' placeholder='R$ 0,00' value={promoPriceText}
                              onChange={(e) => {
                                const { text, value } = currencyMask(e.target.value)
                                setPromoPriceText(text)
                                field.onChange(value)
                              }}
                              disabled={isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                      <FormField control={form.control} name='unit_id' render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unidade</FormLabel>
                          <FormControl>
                            <Select value={field.value ? String(field.value) : ''} onValueChange={(v) => field.onChange(Number(v))} disabled={isUnitsLoading}>
                              <SelectTrigger className='w-full'>
                                <SelectValue placeholder={isUnitsLoading ? 'Carregando unidades...' : 'Selecione a unidade'} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  {Array.isArray((unitsData as any)?.items)
                                    ? (unitsData as any).items.map((u: any) => (
                                      <SelectItem key={u.id} value={String(u.id)}>{u.name ?? `Unidade #${u.id}`}</SelectItem>
                                    ))
                                    : Array.isArray(unitsData)
                                      ? (unitsData as any).map((u: any) => (
                                        <SelectItem key={u.id} value={String(u.id)}>{u.name ?? `Unidade #${u.id}`}</SelectItem>
                                      ))
                                      : null}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name='brand_id' render={({ field }) => (
                        <FormItem>
                          <FormLabel>Marca</FormLabel>
                          <FormControl>
                            <Select value={field.value ? String(field.value) : ''} onValueChange={(v) => field.onChange(Number(v))} disabled={isBrandsLoading}>
                              <SelectTrigger className='w-full'>
                                <SelectValue placeholder={isBrandsLoading ? 'Carregando marcas...' : 'Selecione a marca'} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  {Array.isArray((brandsData as any)?.items)
                                    ? (brandsData as any).items.map((b: any) => (
                                      <SelectItem key={b.id} value={String(b.id)}>{b.name ?? `Marca #${b.id}`}</SelectItem>
                                    ))
                                    : Array.isArray(brandsData)
                                      ? (brandsData as any).map((b: any) => (
                                        <SelectItem key={b.id} value={String(b.id)}>{b.name ?? `Marca #${b.id}`}</SelectItem>
                                      ))
                                      : null}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>

                    <div className='grid grid-cols-1 gap-4'>
                      <FormField control={form.control} name='active' render={({ field }) => (
                        <FormItem>
                          <div className='flex items-center justify-between gap-3 bg-neutral-50 dark:bg-neutral-900 px-3 py-2.5 rounded-md'>
                            <div className='flex flex-col gap-0.5'>
                              <FormLabel>Ativo</FormLabel>
                              <FormDescription className='leading-snug'>Quando habilitado, o produto aparece ativo no catálogo.</FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={!!field.value} onCheckedChange={(v) => field.onChange(!!v)} disabled={isPending} />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name='promotional_price_active' render={({ field }) => (
                        <FormItem>
                          <div className='flex items-center justify-between gap-3 bg-neutral-50 dark:bg-neutral-900 px-3 py-2.5 rounded-md'>
                            <div className='flex flex-col gap-0.5'>
                              <FormLabel>Promoção ativa</FormLabel>
                              <FormDescription className='leading-snug'>Aplica o preço promocional quando disponível.</FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={!!field.value} onCheckedChange={(v) => field.onChange(!!v)} disabled={isPending} />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name='managed_inventory' render={({ field }) => (
                        <FormItem>
                          <div className='flex items-center justify-between gap-3 bg-neutral-50 dark:bg-neutral-900 px-3 py-2.5 rounded-md'>
                            <div className='flex flex-col gap-0.5'>
                              <FormLabel>Gerenciar estoque</FormLabel>
                              <FormDescription className='leading-snug'>Controla o estoque automaticamente para vendas e entradas.</FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={!!field.value} onCheckedChange={(v) => field.onChange(!!v)} disabled={isPending} />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value='descricao' className='mt-4'>
                  <div className='grid auto-rows-min gap-6'>
                    <FormField control={form.control} name='description' render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <textarea placeholder='Opcional' {...field} disabled={isPending}
                            className='file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm h-28 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive'
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </TabsContent>

              </Tabs>
            </div>

            <div className='mt-auto border-t p-4'>
              <div className='grid grid-cols-2 gap-4'>
                <SheetClose asChild>
                  <Button variant='outline' className='w-full'>Cancelar</Button>
                </SheetClose>
                <Button type='submit' disabled={isPending} className='w-full'>
                  {isPending ? <Loader className='animate-spin' /> : 'Salvar produto'}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}