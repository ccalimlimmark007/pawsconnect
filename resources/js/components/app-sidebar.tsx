import { Link, usePage } from '@inertiajs/react';
import {
    Activity,
    BarChart2,
    BookOpen,
    FileText,
    Folder,
    Home,
    Key,
    LayoutGrid,
    PawPrint,
    Sliders,
    ShieldCheck,
    Trash2,
    User,
    Users,
} from 'lucide-react';

import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavItem } from '@/types';
import type { Auth } from '@/types/auth';
import AppLogo from './app-logo';

const settingsItems: NavItem[] = [
    { title: 'Appearance', href: '/settings/appearance', icon: Sliders },
    { title: 'Change Password', href: '/settings/password', icon: Key },
    { title: 'Two-Factor', href: '/settings/two-factor', icon: ShieldCheck },
];

const adopterNavItems: NavItem[] = [
    { title: 'Home', href: '/', icon: Home },
    { title: 'Dashboard', href: '/dashboard', icon: LayoutGrid },
    { title: 'Profile', href: '/profile', icon: User },
    { title: 'Browse Pets', href: '/pets', icon: PawPrint },
    { title: 'My Applications', href: '/my-applications', icon: FileText },
    ...settingsItems,
];

const staffNavItems: NavItem[] = [
    { title: 'Home', href: '/', icon: Home },
    { title: 'Staff Dashboard', href: '/staff/dashboard', icon: LayoutGrid },
    { title: 'Post Animal', href: '/post-pet', icon: PawPrint },
    { title: 'Applications', href: '/admin/applications', icon: FileText },
    { title: 'Profile', href: '/profile', icon: User },
    ...settingsItems,
];

const adminNavItems: NavItem[] = [
    { title: 'Home', href: '/', icon: Home },
    { title: 'Admin Dashboard', href: '/admin', icon: LayoutGrid },
    { title: 'Applications', href: '/admin/applications', icon: FileText },
    { title: 'Users', href: '/admin/users', icon: Users },
    { title: 'Analytics', href: '/admin/analytics', icon: BarChart2 },
    { title: 'Activity Log', href: '/admin/activity', icon: Activity },
    { title: 'Trash', href: '/admin/trash', icon: Trash2 },
    { title: 'Post Animal', href: '/post-pet', icon: PawPrint },
    { title: 'Profile', href: '/profile', icon: User },
    ...settingsItems,
];

const footerNavItems: NavItem[] = [
    { title: 'Repository', href: 'https://github.com/laravel/react-starter-kit', icon: Folder },
    { title: 'Documentation', href: 'https://laravel.com/docs/starter-kits#react', icon: BookOpen },
];

export function AppSidebar() {
    const { auth } = usePage<{ auth: Auth }>().props;
    const role = auth?.user?.role;

    const navItems =
        role === 'admin'
            ? adminNavItems
            : role === 'shelter_staff'
              ? staffNavItems
              : adopterNavItems;

    const logoHref =
        role === 'admin'
            ? '/admin'
            : role === 'shelter_staff'
              ? '/staff/dashboard'
              : '/dashboard';

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={logoHref} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={navItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
