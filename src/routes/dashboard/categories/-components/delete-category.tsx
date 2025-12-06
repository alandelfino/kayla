import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Loader, Trash } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { privateInstance } from "@/lib/auth"
import { useState } from "react"
import { toast } from "sonner"

export function DeleteCategory({ categoryId, disabled = false }: { categoryId: number | string; disabled?: boolean }) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const { isPending, mutate } = useMutation({
    mutationFn: async () => {
      return await privateInstance.delete(`/api:ojk_IOB-/categories/${categoryId}`)
    },
    onSuccess: (response) => {
      if (response.status === 200 || response.status === 204) {
        toast.success('Categoria excluída com sucesso!')
        setOpen(false)
        queryClient.invalidateQueries({ queryKey: ['categories'] })
        queryClient.invalidateQueries({ queryKey: ['category', categoryId] })
      } else {
        toast.error('Erro ao excluir categoria')
      }
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? 'Erro ao excluir categoria')
    }
  })

  const handleConfirmDelete = () => {
    if (!categoryId) {
      toast.error('Selecione uma categoria para excluir')
      return
    }
    mutate()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled || !categoryId}>
          <Trash /> Excluir
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tem certeza absoluta?</DialogTitle>
          <DialogDescription>
            Esta ação não pode ser desfeita. Isso excluirá permanentemente a categoria selecionada
            e removerá seus dados de nossos servidores.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>Cancelar</Button>
          <Button variant="destructive" onClick={handleConfirmDelete} disabled={isPending}>
            {isPending ? <Loader className="w-4 h-4 animate-spin" /> : 'Sim, tenho certeza'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}