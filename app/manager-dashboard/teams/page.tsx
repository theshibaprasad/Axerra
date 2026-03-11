'use client';

import { motion } from 'framer-motion';
import { Users, User, Github } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

// Optional interface representing the decoded response
interface ManagerData {
    _id: string;
    name: string;
    email: string;
    managerId: string;
}

interface Role {
    _id: string;
    name: string;
}

interface Manager {
    _id: string;
    name: string;
    email: string;
}

interface Employee {
    _id: string;
    name: string;
    email: string;
    phone: string;
    role: Role; // Populated role object
    manager: Manager; // Populated manager object
    githubProfileLink?: string;
    status: string;
    createdAt: string;
}

export default function MyTeamsPage() {
    const [manager, setManager] = useState<ManagerData | null>(null);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchManagerData = async () => {
            try {
                const response = await fetch('/api/auth/me');
                if (response.ok) {
                    const data = await response.json();
                    setManager(data);
                }
            } catch (error) {
                console.error("Failed to load manager data", error);
            }
        };

        const fetchEmployees = async () => {
            try {
                const response = await fetch('/api/employees');
                if (response.ok) {
                    const data = await response.json();
                    setEmployees(Array.isArray(data) ? data : []);
                } else {
                    toast.error('Failed to load team data');
                }
            } catch (error) {
                console.error("Failed to load employees", error);
                toast.error('An error occurred while loading team data');
            } finally {
                setIsLoading(false);
            }
        };

        fetchManagerData().then(fetchEmployees);
    }, []);

    // Filter employees to only show those reporting to the current manager
    const myTeam = employees.filter(emp => {
        const empManagerId = emp.manager?._id || emp.manager;
        return String(empManagerId) === String(manager?._id);
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-primary/80 to-primary p-[2px] shadow-sm">
                        <div className="h-full w-full bg-card rounded-[10px] flex items-center justify-center">
                            <Users className="h-6 w-6 text-primary" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">My Team</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">View and manage your direct reports</p>
                    </div>
                </div>

                <div className="bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {isLoading ? '...' : myTeam.length} Members
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card rounded-xl border border-border overflow-hidden shadow-sm min-h-[400px]"
            >
                {isLoading ? (
                    <div className="flex justify-center items-center h-full py-16">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : myTeam.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-16 text-center space-y-4">
                        <div className="p-4 bg-muted rounded-full">
                            <Users className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">No team members assigned</h3>
                            <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-2">
                                You currently do not have any direct reports assigned to you.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                                <tr>
                                    <th className="px-6 py-4">Employee</th>
                                    <th className="px-6 py-4">Contact</th>
                                    <th className="px-6 py-4">Role Assignment</th>
                                    <th className="px-6 py-4">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {myTeam.map((employee) => (
                                    <tr key={employee._id} className="bg-card border-t border-border hover:bg-muted/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                                                    {employee.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-foreground">{employee.name}</span>
                                                    {employee.githubProfileLink && (
                                                        <a href={employee.githubProfileLink} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-0.5">
                                                            <Github className="h-3 w-3" /> GitHub Profile
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm">{employee.email}</span>
                                                <span className="text-xs text-muted-foreground">{employee.phone}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-full text-xs font-medium border border-primary/20">
                                                {employee.role?.name || 'Unassigned'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border 
                                                ${employee.status === 'active' ? 'bg-green-100 text-green-800 border-green-200' :
                                                    employee.status === 'inactive' ? 'bg-gray-100 text-gray-800 border-gray-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'}`}>
                                                {employee.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
