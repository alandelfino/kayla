import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash, Loader } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { privateInstance } from "@/lib/auth";
import { useState } from "react";
import { toast } from "sonner";

export function DeleteBrand({ brandId, disabled = false }: { brandId: number; disabled?: boolean }) {
    const [open, setOpen] = useState(false)
    const queryClient = useQueryClient()

    const { isPending, mutate } = useMutation({
        mutationFn: async () => {
            return await privateInstance.delete(`/api:tc5G7www/brands/${brandId}`)
        },
        onSuccess: (response) => {
            if (response.status === 200 || response.status === 204) {
                toast.success('Marca excluída com sucesso!')
                setOpen(false)
                queryClient.invalidateQueries({ queryKey: ['brands'] })
            } else {
                toast.error('Erro ao excluir marca')
            }
        },
        onError: (error: any) => {
            toast.error(error?.message ?? 'Erro ao excluir marca')
        }
    })

    const handleConfirmDelete = () => {
        if (!brandId) {
            toast.error('Selecione uma marca para excluir')
            return
        }
        mutate()
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" disabled={disabled || !brandId}>
                    <Trash /> Excluir
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Tem certeza absoluta?</DialogTitle>
                    <DialogDescription>
                        Esta ação não pode ser desfeita. Isso excluirá permanentemente a marca selecionada
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