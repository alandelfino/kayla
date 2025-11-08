import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { useMutation } from '@tanstack/react-query'
import { privateInstance } from '@/lib/auth'
import { toast } from 'sonner'
import { Loader, Power } from 'lucide-react'

type InvitationLike = {
  id: number
  active?: boolean
  accepted?: boolean
}

export function InvitationActionsCell({ invitation, onChanged }: { invitation: InvitationLike, onChanged?: () => void }) {
  const [open, setOpen] = useState(false)
  const isActive = invitation.active === true
  const isAccepted = invitation.accepted === true

  const { isPending, mutateAsync } = useMutation({
    mutationFn: async (nextActive: boolean) => {
      const url = `/api:0jQElwax/invitations/${invitation.id}/status`
      const response = await privateInstance.put(url, { active: nextActive })
      if (response.status !== 200) throw new Error('Falha ao alterar status do convite')
      return response.data
    },
    onSuccess: () => {
      toast.success('Status do convite atualizado')
      onChanged?.()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? 'Erro ao atualizar convite')
    }
  })

  async function confirm() {
    await mutateAsync(!isActive)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size={'sm'} variant={isActive ? 'destructive' : 'default'} className='w-full' disabled={isPending || isAccepted}>
          {isPending ? <Loader className='animate-spin' /> : <Power />} {isActive ? 'Desativar' : 'Ativar'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isActive ? 'Desativar convite' : 'Ativar convite'}</DialogTitle>
          <DialogDescription>
            {isActive
              ? 'Tem certeza que deseja desativar este convite? O usuário não poderá utilizá-lo até ser reativado.'
              : 'Tem certeza que deseja ativar este convite? O usuário poderá utilizá-lo para acessar.'}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className='flex gap-2'>
          <Button variant={'outline'} onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={confirm} disabled={isPending || isAccepted} variant={isActive ? 'destructive' : 'default'}>
            {isPending ? <Loader className='animate-spin' /> : null}
            {isActive ? 'Desativar' : 'Ativar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}