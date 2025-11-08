import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useMutation } from '@tanstack/react-query'
import { privateInstance } from '@/lib/auth'
import { toast } from 'sonner'
import { Loader, Ban } from 'lucide-react'

type InvitationLike = {
  id: number
  active?: boolean
  accepted?: boolean
  status?: 'pending' | 'canceled' | 'accepted'
  email?: string
}

export function InvitationActionsCell({ invitation, onChanged }: { invitation: InvitationLike, onChanged?: () => void }) {
  const [open, setOpen] = useState(false)
  const [confirmEmail, setConfirmEmail] = useState('')
  const rawStatus = ((invitation as any)?.status ?? '').toString().trim().toLowerCase()
  const isAccepted = invitation.accepted === true || rawStatus === 'accepted'
  const isCanceled = rawStatus === 'canceled' || rawStatus === 'cancelled'
  const canCancel = !isAccepted && !isCanceled && (rawStatus === 'pending' || rawStatus === '')
  const emailToConfirm = ((invitation as any)?.email ?? '').toString()
  const emailToConfirmNormalized = emailToConfirm.trim().toLowerCase()
  const confirmMatches = confirmEmail.trim().toLowerCase() === emailToConfirmNormalized && emailToConfirmNormalized.length > 0

  const { isPending, mutateAsync } = useMutation({
    mutationFn: async () => {
      const url = `/api:0jQElwax/invitations/${invitation.id}/cancel`
      const response = await privateInstance.post(url, {})
      if (response.status !== 200) throw new Error('Falha ao cancelar convite')
      return response.data
    },
    onSuccess: () => {
      toast.success('Convite cancelado com sucesso')
      onChanged?.()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? 'Erro ao cancelar convite')
    }
  })

  async function confirm() {
    if (!confirmMatches) {
      toast.error('Para confirmar, digite exatamente o e-mail do convite.')
      return
    }
    await mutateAsync()
    setOpen(false)
    setConfirmEmail('')
  }

  if (!canCancel) {
    // Não renderiza o botão de cancelar quando o convite já foi aceito ou cancelado
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size={'sm'} variant={'destructive'} className='w-full' disabled={isPending || !canCancel}>
          {isPending ? <Loader className='animate-spin' /> : <Ban />} Cancelar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancelar convite</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja cancelar este convite? Convites só podem ser cancelados quando estão pendentes.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-2 py-2'>
          <Label htmlFor='confirmEmail'>Para confirmar, digite o e-mail do convite</Label>
          <Input
            id='confirmEmail'
            placeholder={emailToConfirm || 'email@exemplo.com'}
            value={confirmEmail}
            onChange={(e) => setConfirmEmail(e.target.value)}
            autoFocus
          />
          {confirmEmail.length > 0 && !confirmMatches ? (
            <p className='text-xs text-red-600'>O e-mail digitado não corresponde ao convite.</p>
          ) : null}
        </div>
        <DialogFooter className='flex gap-2'>
          <Button variant={'outline'} onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={confirm} disabled={isPending || !canCancel || !confirmMatches} variant={'destructive'}>
            {isPending ? <Loader className='animate-spin' /> : null}
            Confirmar cancelamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}