import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Link } from "@tanstack/react-router";
import { ArrowLeftRight, BadgeDollarSign, BanknoteArrowDown, BetweenHorizonalStart, BookOpen, BookUser, BringToFront, ChartNoAxesColumnIncreasing, Contact, Copyright, File, FileBadge, FileClock, FolderTree, GitFork, Image, Images, Kanban, ListChecks, Mail, Package, Ruler, TextCursorInput, Users, Wallpaper } from "lucide-react";
import { useRouterState } from "@tanstack/react-router";

export function Navigation() {

    const router = useRouterState()

    const navigations = [
        {
            groupName: 'Comercial',
            items: [
                {
                    label: 'Vendas',
                    icon: <BadgeDollarSign />,
                    href: '/dashboard/sales',
                },
                {
                    label: 'Pipeline',
                    icon: <Kanban />,
                    href: '/dashboard/pipeline',
                },
                {
                    label: 'Propostas',
                    icon: <FileClock />,
                    href: '/dashboard/proposals',
                },
                {
                    label: 'Tarefas',
                    icon: <ListChecks />,
                    href: '/dashboard/tasks',
                }
            ]
        },
        {
            groupName: 'Financeiro',
            items: [
                {
                    label: 'Pagamentos',
                    icon: <BanknoteArrowDown />,
                    href: '/dashboard/payments',
                }
            ]
        },
        {
            groupName: 'Ferramentas',
            items: [
                {
                    label: 'Formulários',
                    icon: <TextCursorInput />,
                    href: '/dashboard/forms',
                },
                {
                    label: 'Catálogos',
                    icon: <BookOpen />,
                    href: '/dashboard/catalogs',
                }
            ]
        },
        {
            groupName: 'Base',
            items: [
                {
                    label: 'Contatos',
                    icon: <BookUser />,
                    href: '/dashboard/contacts',
                }
            ]
        },
        {
            groupName: 'Catalogo',
            items: [
                {
                    label: 'Categorias',
                    icon: <BetweenHorizonalStart />,
                    href: '/dashboard/categories',
                },
                {
                    label: 'Derivações',
                    icon: <GitFork />,
                    href: '/dashboard/derivations',
                },
                {
                    label: 'Marcas',
                    icon: <Copyright />,
                    href: '/dashboard/brands',
                },
                {
                    label: 'Garantias',
                    icon: <FileBadge />,
                    href: '/dashboard/warranties',
                },
                {
                    label: 'Produtos',
                    icon: <Package />,
                    href: '/dashboard/products',
                },
                {
                    label: 'Midias',
                    icon: <Images />,
                    href: '/dashboard/media',
                },
                {
                    label: 'Unidades de medida',
                    icon: <Ruler />,
                    href: '/dashboard/units',
                },
            ]
        },
        {
            groupName: 'Inventário',
            items: [
                {
                    label: 'Movimentos de estoque',
                    icon: <ArrowLeftRight />,
                    href: '/dashboard/stock-movements',
                }
            ]
        },
        {
            groupName: 'Equipe',
            items: [
                {
                    label: 'Convites',
                    icon: <Mail />,
                    href: '/dashboard/invitations',
                },
                {
                    label: 'Usuários',
                    icon: <Users />,
                    href: '/dashboard/users',
                },
                {
                    label: 'Funções',
                    icon: <Contact />,
                    href: '/dashboard/roles',
                },
                {
                    label: 'Níveis',
                    icon: <ChartNoAxesColumnIncreasing />,
                    href: '/dashboard/levels',
                },
            ]
        },
    ]

    return (

        navigations.map((group) => (
            <SidebarGroup key={group.groupName}>
                <SidebarGroupLabel className="text-neutral-400 font-normal">{group.groupName}</SidebarGroupLabel>
                <SidebarMenu>
                    {group.items.map((item) => (
                        <SidebarMenuItem key={item.href}>
                            <SidebarMenuButton asChild isActive={item.href === router.location.pathname} tooltip={item.label}>
                                <Link to={item.href} className="w-full h-full text-neutral-600 dark:text-neutral-400">
                                    {item.icon} {item.label}
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroup>
        ))

    )

}