import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Topbar } from '../-components/topbar'
import { privateInstance } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { RefreshCcw, Building2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export const Route = createFileRoute('/dashboard/company-profile/')({
  component: RouteComponent,
})

type VaultImage = {
  access?: string
  path?: string
  name?: string
  type?: string
  size?: number
  mime?: string
  meta?: { width?: number; height?: number }
  url?: string
} | null

type CompanyProfile = {
  id: number
  created_at?: number
  updated_At?: number
  name?: string
  user_id?: number
  alias?: string
  website?: string
  country?: string
  time_zone?: string
  segment?: string
  date_format?: string
  currency?: string
  number_format?: string
  image?: VaultImage
}

function getSubdomain() { return window.location.hostname.split('.')[0] }

function RouteComponent() {
  const [company, setCompany] = useState<CompanyProfile | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data, isLoading, isRefetching, isError, refetch } = useQuery({
    queryKey: ['company-profile'],
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const res = await privateInstance.get('https://x8ki-letl-twmt.n7.xano.io/api:kdrFy_tm/companies/single')
      if (res.status !== 200) {
        throw new Error(res?.data?.message ?? 'Erro ao carregar dados da empresa')
      }
      const payload = res.data as any
      // Normaliza para o formato esperado e aplica defaults conforme solicitado
      const normalized: CompanyProfile = {
        id: Number(payload?.id ?? 3),
        created_at: Number(payload?.created_at ?? 1762798128984),
        updated_At: Number(payload?.updated_At ?? 1762798129000),
        name: String(payload?.name ?? 'Di Véus'),
        user_id: Number(payload?.user_id ?? 4),
        alias: String(payload?.alias ?? 'diveus'),
        website: String(payload?.website ?? ''),
        country: String(payload?.country ?? 'Brazil'),
        time_zone: String(payload?.time_zone ?? 'America/Sao_Paulo'),
        segment: String(payload?.segment ?? ''),
        date_format: String(payload?.date_format ?? 'dd/mm/yyyy-HH:mm:ss'),
        currency: String(payload?.currency ?? 'BRL'),
        number_format: String(payload?.number_format ?? '0.000,00'),
        image: payload?.image ?? {
          access: 'public',
          path: '/vault/_nCS6eiT/JrR6xcgBLfp6an1kGIYaQABaoEg/xGyogA../d-100x100+%281%29.png',
          name: 'd-100x100 (1).png',
          type: 'image',
          size: 2084,
          mime: 'image/png',
          meta: { width: 100, height: 100 },
          url: 'https://x8ki-letl-twmt.n7.xano.io/vault/_nCS6eiT/JrR6xcgBLfp6an1kGIYaQABaoEg/xGyogA../d-100x100+%281%29.png',
        },
      }
      return normalized
    }
  })

  useEffect(() => {
    if (isError) {
      toast.error('Erro ao carregar dados da empresa')
    }
  }, [isError])

  useEffect(() => {
    if (!data) return
    setCompany(data)
    setPreviewUrl(data?.image?.url ?? null)
    // Atualiza dados locais para uso em sidebar e outras áreas
    try {
      const sub = getSubdomain()
      localStorage.setItem(`${sub}-kayla-company`, JSON.stringify(data))
      // Opcional: notificar UI de atualização (caso algum componente escute)
      try { window.dispatchEvent(new CustomEvent('kayla:company-updated', { detail: data })) } catch {}
    } catch {}
  }, [data])

  function handlePickLogo() {
    fileInputRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const blobUrl = URL.createObjectURL(file)
      setPreviewUrl(blobUrl)
      // Atualiza localStorage imediatamente para refletir no sidebar
      const sub = getSubdomain()
      const raw = localStorage.getItem(`${sub}-kayla-company`)
      let localCompany: any = null
      try { localCompany = raw ? JSON.parse(raw) : null } catch { localCompany = null }
      const nextCompany = { ...(localCompany ?? {}), image: { ...(localCompany?.image ?? {}), url: blobUrl } }
      localStorage.setItem(`${sub}-kayla-company`, JSON.stringify(nextCompany))
      try { window.dispatchEvent(new CustomEvent('kayla:company-updated', { detail: nextCompany })) } catch {}
      toast.success('Logo atualizada localmente')
    } catch {
      toast.error('Falha ao carregar a imagem da logo')
    }
  }

  return (
    <div className='flex flex-col w-full h-full'>
      <Topbar title="Perfil da Empresa" breadcrumbs={[{ label: 'Dashboard', href: '/dashboard', isLast: false }, { label: 'Perfil da Empresa', href: '/dashboard/company-profile', isLast: true }]} />

      <div className='flex flex-col w-full h-full flex-1 overflow-auto p-4 gap-4'>

        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Building2 className='h-5 w-5 text-muted-foreground' />
            <span className='text-base font-semibold'>Dados da empresa</span>
          </div>
          <div className='flex items-center gap-2'>
            <Button size={'sm'} variant={'outline'} disabled={isLoading || isRefetching} onClick={() => refetch()}>
              {(isLoading || isRefetching) ? <><RefreshCcw className='animate-spin' /> Atualizando...</> : <><RefreshCcw /> Atualizar</>}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {[1,2,3].map((i) => (
              <div key={i} className='flex flex-col gap-2'>
                <Skeleton className='h-4 w-24' />
                <Skeleton className='h-9 w-full' />
              </div>
            ))}
          </div>
        ) : company ? (
          <div className='space-y-6 pt-4'>
            <div className='flex items-center gap-2'>
              <button type='button' className='cursor-pointer' onClick={handlePickLogo} title='Clique para escolher uma imagem' aria-label='Alterar logo'>
                <Avatar className='h-24 w-24 rounded-2xl'>
                  <AvatarImage src={previewUrl || undefined} alt={company?.name || ''} />
                  <AvatarFallback className='rounded-2xl'>
                    {(company?.name ?? 'Empresa').slice(0,2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </button>
              <input ref={fileInputRef} type='file' accept='image/jpeg,image/png,image/webp' className='hidden' onChange={handleFileChange} />
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='flex flex-col gap-2'>
                <Label>Nome</Label>
                <Input value={company.name ?? ''} readOnly />
              </div>
              <div className='flex flex-col gap-2'>
                <Label>Alias</Label>
                <Input value={company.alias ?? ''} readOnly />
              </div>
              <div className='flex flex-col gap-2'>
                <Label>Website</Label>
                <Input value={company.website ?? ''} readOnly />
              </div>
              <div className='flex flex-col gap-2'>
                <Label>País</Label>
                <Input value={company.country ?? ''} readOnly />
              </div>
              <div className='flex flex-col gap-2'>
                <Label>Fuso horário</Label>
                <Input value={company.time_zone ?? ''} readOnly />
              </div>
              <div className='flex flex-col gap-2'>
                <Label>Segmento</Label>
                <Input value={company.segment ?? ''} readOnly />
              </div>
              <Separator className='md:col-span-2' />
              <div className='flex flex-col gap-2'>
                <Label>Formato de data</Label>
                <Input value={company.date_format ?? ''} readOnly />
              </div>
              <div className='flex flex-col gap-2'>
                <Label>Moeda</Label>
                <Input value={company.currency ?? ''} readOnly />
              </div>
              <div className='flex flex-col gap-2'>
                <Label>Formato numérico</Label>
                <Input value={company.number_format ?? ''} readOnly />
              </div>
            </div>
          </div>
        ) : (
          <div className='text-sm text-muted-foreground'>Nenhum dado disponível</div>
        )}
      </div>
    </div>
  )
}