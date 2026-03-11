'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, User, ArrowRight, ShieldCheck, FolderGit2, Activity, Zap, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface ManagerData {
    _id: string;
    name: string;
    email: string;
    managerId: string;
}

interface DashboardStats {
    totalDirectReports: number;
    activeProjects: number;
    completedProjects: number;
    totalIntegrations: number;
    completionRate: number;
}

export default function ManagerDashboard() {
    const [manager, setManager] = useState<ManagerData | null>(null);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch auth info
                const authResponse = await fetch('/api/auth/me');
                if (authResponse.ok) {
                    const authData = await authResponse.json();
                    setManager(authData);
                }

                // Fetch dashboard statistics
                const statsResponse = await fetch('/api/manager-dashboard/stats');
                if (statsResponse.ok) {
                    const statsData = await statsResponse.json();
                    setStats(statsData);
                } else {
                    toast.error("Failed to load dashboard statistics");
                }
            } catch (error) {
                console.error("Failed to load generic manager data", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants: import('framer-motion').Variants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 100
            }
        }
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

                <div className="z-10">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        Welcome back, {manager?.name?.split(' ')[0] || 'Manager'}
                    </h1>
                    <p className="text-muted-foreground mt-2 flex items-center gap-2">
                        Manager ID: <span className="font-mono text-xs bg-muted/80 text-foreground px-2 py-1 rounded-md border border-border/50">{manager?.managerId || 'MGR-***'}</span>
                    </p>
                </div>
                <div className="bg-primary/10 text-primary px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 z-10 border border-primary/20 backdrop-blur-sm shadow-sm transition-transform hover:scale-105">
                    <ShieldCheck className="h-4 w-4" />
                    Manager Access
                </div>
            </div>

            {/* Statistics Section */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
            >
                {/* Active Projects Stat */}
                <motion.div variants={itemVariants}>
                    <Card className="border-border/50 bg-card shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Active Projects</CardTitle>
                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                                <Activity className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="h-8 w-16 bg-muted animate-pulse rounded mt-2"></div>
                            ) : (
                                <>
                                    <div className="text-2xl font-bold mt-2">{stats?.activeProjects || 0}</div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Currently in progress
                                    </p>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Direct Reports Stat */}
                <motion.div variants={itemVariants}>
                    <Card className="border-border/50 bg-card shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Direct Reports</CardTitle>
                            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                                <Users className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="h-8 w-16 bg-muted animate-pulse rounded mt-2"></div>
                            ) : (
                                <>
                                    <div className="text-2xl font-bold mt-2">{stats?.totalDirectReports || 0}</div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Total assigned employees
                                    </p>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Completion Rate Stat */}
                <motion.div variants={itemVariants}>
                    <Card className="border-border/50 bg-card shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Completion Rate</CardTitle>
                            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                                <CheckCircle2 className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="h-8 w-16 bg-muted animate-pulse rounded mt-2"></div>
                            ) : (
                                <>
                                    <div className="text-2xl font-bold mt-2">{stats?.completionRate || 0}%</div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {stats?.completedProjects || 0} projects completely finished
                                    </p>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Integrations Stat */}
                <motion.div variants={itemVariants}>
                    <Card className="border-border/50 bg-card shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Integrations</CardTitle>
                            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                                <Zap className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="h-8 w-16 bg-muted animate-pulse rounded mt-2"></div>
                            ) : (
                                <>
                                    <div className="text-2xl font-bold mt-2">{stats?.totalIntegrations || 0}</div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Total GitHub / Slack nodes
                                    </p>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </motion.div>

            {/* Quick Links Section */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold tracking-tight text-foreground ml-1">Quick Links</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                    {/* Projects Link */}
                    <Link href="/manager-dashboard/projects" className="focus:outline-none focus:ring-2 focus:ring-primary rounded-xl group block">
                        <Card className="h-full border-border/50 hover:border-blue-500/50 hover:shadow-md hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-card to-card hover:to-blue-500/5">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300 shadow-sm border border-blue-500/20 group-hover:border-transparent">
                                        <FolderGit2 className="h-6 w-6" />
                                    </div>
                                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-blue-500 transition-colors duration-300 transform group-hover:translate-x-1" />
                                </div>
                                <CardTitle className="mt-5 text-xl font-bold">Manage Projects</CardTitle>
                                <CardDescription className="text-sm mt-2 font-medium">Create, edit, and organize project repositories with GitHub and Slack.</CardDescription>
                            </CardHeader>
                        </Card>
                    </Link>

                    {/* Team Link */}
                    <Link href="/manager-dashboard/teams" className="focus:outline-none focus:ring-2 focus:ring-primary rounded-xl group block">
                        <Card className="h-full border-border/50 hover:border-emerald-500/50 hover:shadow-md hover:shadow-emerald-500/10 transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-card to-card hover:to-emerald-500/5">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300 shadow-sm border border-emerald-500/20 group-hover:border-transparent">
                                        <Users className="h-6 w-6" />
                                    </div>
                                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-emerald-500 transition-colors duration-300 transform group-hover:translate-x-1" />
                                </div>
                                <CardTitle className="mt-5 text-xl font-bold">My Team Roster</CardTitle>
                                <CardDescription className="text-sm mt-2 font-medium">Review your direct reports and analyze team-level metrics.</CardDescription>
                            </CardHeader>
                        </Card>
                    </Link>

                    {/* Organization Locked Panel */}
                    <div className="opacity-80 cursor-not-allowed">
                        <Card className="h-full border-border/50 bg-card/40 shadow-none hover:shadow-sm transition-all duration-300">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div className="p-3 bg-purple-500/5 rounded-xl text-purple-500/60 border border-purple-500/10">
                                        <User className="h-6 w-6" />
                                    </div>
                                </div>
                                <CardTitle className="mt-5 text-xl font-bold text-muted-foreground">Admin Controls</CardTitle>
                                <CardDescription className="text-sm mt-2">Organization-level settings and management are restricted to Global Administrators.</CardDescription>
                            </CardHeader>
                        </Card>
                    </div>

                </div>
            </div>
        </div>
    );
}
