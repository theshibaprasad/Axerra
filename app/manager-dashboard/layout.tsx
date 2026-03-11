'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Users, LogOut, FolderGit2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ManagerDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [open, setOpen] = useState(false);

    const handleLogout = async () => {
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
            });

            if (response.ok) {
                toast.success('Logged out successfully');
                router.push('/login');
            }
        } catch (error) {
            toast.error('Failed to logout');
        }
    };

    const menuItems = [
        { name: 'Overview', href: '/manager-dashboard', icon: LayoutDashboard },
        { name: 'Projects', href: '/manager-dashboard/projects', icon: FolderGit2 },
        { name: 'My Teams', href: '/manager-dashboard/teams', icon: Users },
    ];

    const SidebarNav = ({ isMobile = false }) => (
        <div className="flex flex-col h-full bg-card/50">
            <div className="p-6">
                <h2 className="text-2xl font-bold text-primary">Axerra</h2>
                <div className="text-xs text-muted-foreground mt-1 font-medium bg-primary/10 w-fit px-2 py-0.5 rounded-full">
                    Manager Portal
                </div>
            </div>
            <nav className="flex-1 px-4 space-y-2 mt-4">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => isMobile && setOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                                ? 'bg-primary/10 text-primary shadow-sm'
                                : 'text-muted-foreground hover:bg-card hover:text-foreground hover:shadow-sm border border-transparent hover:border-border/50'
                                }`}
                        >
                            <Icon className="h-4 w-4" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>
            <div className="p-4 border-t border-border mt-auto">
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={handleLogout}
                >
                    <LogOut className="h-4 w-4" />
                    Logout
                </Button>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col md:flex-row h-[100dvh] bg-background text-foreground overflow-hidden">
            {/* Desktop Sidebar */}
            <aside className="w-64 border-r border-border hidden md:flex flex-col h-full flex-shrink-0">
                <SidebarNav />
            </aside>

            {/* Mobile Top Header (with Logout) */}
            <div className="md:hidden flex items-center justify-between border-b border-border px-4 py-3 bg-card/50 flex-shrink-0">
                <div className="flex flex-col">
                    <h2 className="text-xl font-bold text-primary leading-tight">Axerra</h2>
                    <span className="text-[10px] text-muted-foreground font-medium">Manager Portal</span>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={handleLogout}
                >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                </Button>
            </div>

            {/* Main Content */}
            <main
                className="flex-1 overflow-y-auto w-full relative custom-scrollbar"
                data-lenis-prevent="true"
            >
                <div className="p-4 md:p-8 pb-24 md:pb-8">
                    {children}
                </div>
            </main>

            {/* Mobile Bottom Navigation Bar */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border flex items-center justify-around px-2 py-3 pb-safe shadow-lg">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center justify-center gap-1 min-w-[64px] transition-colors ${isActive
                                ? 'text-primary'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <Icon className={`h-6 w-6 ${isActive ? 'fill-primary/20' : ''}`} />
                            <span className="text-[10px] font-medium leading-none">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
