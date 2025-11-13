import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/settings/finance/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className='flex flex-col gap-4'>
      <h2 className='text-lg font-semibold'>Financeiro</h2>
      <p className='text-sm text-muted-foreground'>Configurações financeiras da conta.</p>
    </div>
  )
}