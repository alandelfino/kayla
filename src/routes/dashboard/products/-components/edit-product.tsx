import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Edit, Loader } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { toast } from 'sonner'
import { privateInstance } from '@/lib/auth'
import { Switch } from '@/components/ui/switch'
import { useEffect, useState } from 'react'

const formSchema = z.object({
  sku: z.string().min(1, { message: 'Campo obrigatório' }),
  name: z.string().min(1, { message: 'Campo obrigatório' }),
  description: z.string().optional().or(z.literal('')),
  type: z.enum(['simple', 'with_derivations'] as const, { message: 'Campo obrigatório' }),
  price: z.preprocess(
    (v) => {
      if (v === '' || v === null || v === undefined) return undefined
      if (typeof v === 'string') {
        const cleaned = v.replace(/[^0-9,.-]/g, '').replace(',', '.')
        const n = Number(cleaned)
        return Number.isFinite(n) ? n : NaN
      }
      return v
    },
    z
      .number({ message: 'Campo obrigatório' })
      .refine((v) => !Number.isNaN(v), { message: 'Informe um número válido' })
      .min(0, { message: 'Informe um número válido' })
  ),
  promotional_price: z
    .preprocess(
      (v) => {
        if (v === '' || v === null || v === undefined) return undefined
        if (typeof v === 'string') {
          const cleaned = v.replace(/[^0-9,.-]/g, '').replace(',', '.')
          const n = Number(cleaned)
          return Number.isFinite(n) ? n : NaN
        }
        return v
      },
      z
        .number({ message: 'Informe um número válido' })
        .refine((v) => !Number.isNaN(v), { message: 'Informe um número válido' })
        .min(0)
    )
    .optional(),
  stock: z.preprocess(
    (v) => {
      if (v === '' || v === null || v === undefined) return undefined
      if (typeof v === 'string') {
        const cleaned = v.replace(/[^0-9,.-]/g, '').replace(',', '.')
        const n = Number(cleaned)
        return Number.isFinite(n) ? n : NaN
      }
      return v
    },
    z
      .number({ message: 'Campo obrigatório' })
      .refine((v) => !Number.isNaN(v), { message: 'Informe um número válido' })
      .min(0, { message: 'Informe um número válido' })
  ),
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
})

export function EditProductSheet({ productId, onSaved }: { productId: number, onSaved?: () => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const queryClient = useQueryClient()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      sku: '',
      name: '',
      description: '',
      type: 'simple',
      price: undefined,
      promotional_price: undefined,
      stock: undefined,
      active: true,
      promotional_price_active: false,
      managed_inventory: false,
      unit_id: undefined,
      brand_id: undefined,
    }
  })

  async function fetchProduct() {
    try {
      setLoading(true)
      const response = await privateInstance.get(`/api:c3X9fE5j/products/${productId}`)
      const p = response?.data
      if (!p) throw new Error('Resposta inválida ao buscar produto')
      form.reset({
        sku: p.sku ?? '',
        name: p.name ?? '',
        description: p.description ?? '',
        type: p.type ?? 'simple',
        price: typeof p.price === 'number' ? p.price : undefined,
        promotional_price: typeof p.promotional_price === 'number' ? p.promotional_price : undefined,
        stock: typeof p.stock === 'number' ? p.stock : undefined,
        active: !!p.active,
        promotional_price_active: !!p.promotional_price_active,
        managed_inventory: !!p.managed_inventory,
        unit_id: typeof p.unit_id === 'number' ? p.unit_id : undefined,
        brand_id: typeof p.brand_id === 'number' ? p.brand_id : undefined,
      })
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? 'Erro ao carregar produto')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (open && productId) fetchProduct() }, [open, productId])

  const { isPending, mutate } = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => privateInstance.put(`/api:c3X9fE5j/products/${productId}`, values),
    onSuccess: (response) => {
      if (response.status === 200) {
        toast.success('Produto atualizado com sucesso!')
        setOpen(false)
        onSaved?.()
        queryClient.invalidateQueries({ queryKey: ['products'] })
      } else {
        toast.error('Erro ao salvar produto')
      }
    },
    onError: (error: any) => { toast.error(error?.response?.data?.message ?? 'Erro ao atualizar produto') }
  })

  function onSubmit(values: z.infer<typeof formSchema>) { mutate(values) }

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

  // Helpers de máscara
  function formatCurrencyBRLFromNumber(num?: number) {
    if (typeof num !== 'number') return ''
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }
  function currencyMask(val: string) {
    const digits = (val || '').replace(/\D/g, '')
    if (!digits) return { text: '', value: undefined as number | undefined }
    const num = Number(digits) / 100
    return { text: num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), value: num }
  }
  function getUnitsArray(data: any): any[] {
    if (Array.isArray(data?.items)) return data.items
    if (Array.isArray(data)) return data
    return []
  }
  function findUnitTypeById(data: any, id?: number) {
    if (!id) return undefined
    const arr = getUnitsArray(data)
    const found = arr.find((u: any) => Number(u?.id) === Number(id))
    return found?.type as string | undefined
  }
  function stockMask(val: string, unitType?: string) {
    let decimals = 0
    if (unitType && /decimal/i.test(unitType)) {
      const m = unitType.match(/(\d+)/)
      decimals = m ? parseInt(m[1], 10) : 2
    }
    const digits = (val || '').replace(/\D/g, '')
    if (!digits) return { text: '', value: undefined as number | undefined }
    if (decimals === 0) {
      const num = Number(digits)
      return { text: num.toLocaleString('pt-BR'), value: num }
    }
    const num = Number(digits) / Math.pow(10, decimals)
    return { text: num.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }), value: num }
  }
  function formatStockFromNumber(num?: number, unitType?: string) {
    if (typeof num !== 'number') return ''
    let decimals = 0
    if (unitType && /decimal/i.test(unitType)) {
      const m = unitType.match(/(\d+)/)
      decimals = m ? parseInt(m[1], 10) : 2
    }
    return num.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
  }

  // Estados de exibição mascarada
  const [priceText, setPriceText] = useState('')
  const [promoPriceText, setPromoPriceText] = useState('')
  const [stockText, setStockText] = useState('')
  const unitId = form.watch('unit_id')
  const unitType = findUnitTypeById(unitsData, unitId)

  useEffect(() => {
    const p = form.getValues('price')
    const pp = form.getValues('promotional_price')
    const s = form.getValues('stock')
    setPriceText(formatCurrencyBRLFromNumber(p))
    setPromoPriceText(formatCurrencyBRLFromNumber(pp))
    setStockText(formatStockFromNumber(s, unitType))
  }, [open, unitType])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size={'sm'} variant={'ghost'}>
          <Edit className='w-4 h-4' /> Editar
        </Button>
      </SheetTrigger>
      <SheetContent className='sm:max-w-[620px]'>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='flex flex-col h-full'>
            <SheetHeader>
              <SheetTitle>Editar produto</SheetTitle>
              <SheetDescription>
                {loading ? (
                  <span className='flex items-center gap-2'><Loader className='w-4 h-4 animate-spin' />Carregando dados do produto...</span>
                ) : (
                  <>Atualize os campos abaixo e salve as alterações.</>
                )}
              </SheetDescription>
            </SheetHeader>

            <div className='flex-1 grid auto-rows-min gap-6 px-4 py-4'>
              <div className='grid grid-cols-1 md:grid-cols-[150px_1fr] gap-4'>
                <FormField control={form.control} name='sku' render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Código interno do produto'
                        className='min-w-[120px] w-[150px] max-w-[150px]'
                        {...field}
                        disabled={loading || isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name='name' render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input className='w-full' placeholder='Nome do produto' {...field} disabled={loading || isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name='description' render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input placeholder='Opcional' {...field} disabled={loading || isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <FormField control={form.control} name='type' render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className='w-full'>
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
                        disabled={loading || isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name='stock' render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estoque</FormLabel>
                    <FormControl>
                      <Input type='text' inputMode='numeric' placeholder={unitType && /decimal/i.test(unitType) ? '0,00' : '0'} value={stockText}
                        onChange={(e) => {
                          const { text, value } = stockMask(e.target.value, unitType)
                          setStockText(text)
                          field.onChange(value)
                        }}
                        disabled={loading || isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
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
                        disabled={loading || isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name='unit_id' render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidade</FormLabel>
                    <FormControl>
                      <Select value={field.value ? String(field.value) : ''} onValueChange={(v) => field.onChange(Number(v))} disabled={isUnitsLoading || loading}>
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
                      <Select value={field.value ? String(field.value) : ''} onValueChange={(v) => field.onChange(Number(v))} disabled={isBrandsLoading || loading}>
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

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <FormField control={form.control} name='active' render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ativo</FormLabel>
                    <FormControl>
                      <div className='flex items-center gap-2'>
                        <Switch checked={!!field.value} onCheckedChange={(v) => field.onChange(!!v)} disabled={loading || isPending} />
                        <span className='text-sm text-neutral-600 dark:text-neutral-300'>Produto ativo</span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name='promotional_price_active' render={({ field }) => (
                  <FormItem>
                    <FormLabel>Promoção ativa</FormLabel>
                    <FormControl>
                      <div className='flex items-center gap-2'>
                        <Switch checked={!!field.value} onCheckedChange={(v) => field.onChange(!!v)} disabled={loading || isPending} />
                        <span className='text-sm text-neutral-600 dark:text-neutral-300'>Aplicar preço promocional</span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name='managed_inventory' render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gerenciar estoque</FormLabel>
                    <FormControl>
                      <div className='flex items-center gap-2'>
                        <Switch checked={!!field.value} onCheckedChange={(v) => field.onChange(!!v)} disabled={loading || isPending} />
                        <span className='text-sm text-neutral-600 dark:text-neutral-300'>Habilitar controle de estoque</span>
                      </div>
                    </FormControl>
                    <FormMessage />
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