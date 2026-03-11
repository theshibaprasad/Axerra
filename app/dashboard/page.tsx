'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, Zap, User, ArrowRight, ShieldCheck, UserCog, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface DashboardStats {
    totalTeams: number;
    activeConnectorsCount: number;
    totalManagers: number;
    totalEmployees: number;
    totalRoles: number;
    securityStatus: string;
}

export default function DashboardOverviewPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch('/api/dashboard/stats');
                if (!response.ok) {
                    throw new Error('Failed to fetch dashboard stats');
                }
                const data = await response.json();
                setStats(data);
            } catch (error) {
                console.error("Error loading stats:", error);
                toast.error("Failed to load dashboard metrics");
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, []);

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Dashboard Overview</h1>
                    <p className="text-muted-foreground">
                        Welcome back! Here's a quick look at your workspace.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button asChild>
                        <Link href="/dashboard/connectors">
                            <Zap className="mr-2 h-4 w-4" />
                            Add Connector
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Managers</CardTitle>
                        <UserCog className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
                        ) : (
                            <div className="text-2xl font-bold">{stats?.totalManagers || 0}</div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                            Team Leaders
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Employees</CardTitle>
                        <User className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
                        ) : (
                            <div className="text-2xl font-bold">{stats?.totalEmployees || 0}</div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                            Staff Members
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Roles</CardTitle>
                        <Shield className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
                        ) : (
                            <div className="text-2xl font-bold">{stats?.totalRoles || 0}</div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                            System Policies
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
                        ) : (
                            <div className="text-2xl font-bold">{stats?.totalTeams || 0}</div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                            Active Teams
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Connectors</CardTitle>
                        <Zap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
                        ) : (
                            <div className="text-2xl font-bold">{stats?.activeConnectorsCount || 0}</div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                            Integrations
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Security</CardTitle>
                        <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="h-8 w-24 bg-muted animate-pulse rounded"></div>
                        ) : (
                            <div className="text-2xl font-bold text-green-500">{stats?.securityStatus || 'Secure'}</div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                            All Systems Normal
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Links Section */}
            <div className="space-y-6">
                <h2 className="text-xl font-semibold tracking-tight">Quick Links</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Link href="/dashboard/teams" className="focus:outline-none focus:ring-2 focus:ring-primary rounded-xl group block">
                        <Card className="h-full border-border/50 hover:border-blue-500/50 hover:shadow-md hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-card to-card hover:to-blue-500/5">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300">
                                        <Users className="h-6 w-6" />
                                    </div>
                                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-blue-500 transition-colors duration-300 transform group-hover:translate-x-1" />
                                </div>
                                <CardTitle className="mt-5 text-xl">Manage Teams</CardTitle>
                                <CardDescription className="text-sm mt-2">View and organize your team members and their roles within the workspace.</CardDescription>
                            </CardHeader>
                        </Card>
                    </Link>

                    <Link href="/dashboard/connectors" className="focus:outline-none focus:ring-2 focus:ring-primary rounded-xl group block">
                        <Card className="h-full border-border/50 hover:border-amber-500/50 hover:shadow-md hover:shadow-amber-500/10 transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-card to-card hover:to-amber-500/5">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300">
                                        <Zap className="h-6 w-6" />
                                    </div>
                                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-amber-500 transition-colors duration-300 transform group-hover:translate-x-1" />
                                </div>
                                <CardTitle className="mt-5 text-xl">Integrations</CardTitle>
                                <CardDescription className="text-sm mt-2">Configure and manage connections to external tools and services.</CardDescription>
                            </CardHeader>
                        </Card>
                    </Link>

                    <Link href="/dashboard/profile" className="focus:outline-none focus:ring-2 focus:ring-primary rounded-xl group block">
                        <Card className="h-full border-border/50 hover:border-emerald-500/50 hover:shadow-md hover:shadow-emerald-500/10 transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-card to-card hover:to-emerald-500/5">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300">
                                        <User className="h-6 w-6" />
                                    </div>
                                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-emerald-500 transition-colors duration-300 transform group-hover:translate-x-1" />
                                </div>
                                <CardTitle className="mt-5 text-xl">Company Profile</CardTitle>
                                <CardDescription className="text-sm mt-2">Update your company details, preferences, and workspace settings.</CardDescription>
                            </CardHeader>
                        </Card>
                    </Link>
                </div>
            </div>
        </div>
    );
}
