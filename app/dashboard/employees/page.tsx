'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Plus, User, Github, Pencil, Trash2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

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

export default function EmployeesPage() {
    const router = useRouter();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [managers, setManagers] = useState<Manager[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Multi-Step Form State
    const [step, setStep] = useState(1);

    // Form Data
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        role: '',
        manager: '',
        githubProfileLink: '',
    });

    const fetchData = async () => {
        try {
            const [employeesRes, rolesRes, managersRes] = await Promise.all([
                fetch('/api/employees'),
                fetch('/api/roles'),
                fetch('/api/managers')
            ]);

            if (employeesRes.status === 401 || rolesRes.status === 401 || managersRes.status === 401) {
                toast.error('Session expired. Please login again.');
                router.push('/login');
                return;
            }

            const employeesData = await employeesRes.json();
            const rolesData = await rolesRes.json();
            const managersData = await managersRes.json();

            setEmployees(Array.isArray(employeesData) ? employeesData : []);
            setRoles(Array.isArray(rolesData) ? rolesData : []);
            setManagers(Array.isArray(managersData) ? managersData : []);

            if (!Array.isArray(employeesData) && employeesData.message) {
                toast.error(`Error: ${employeesData.message}`);
            }
        } catch (error) {
            toast.error('Failed to load data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [router]);

    const resetForm = () => {
        setFormData({ name: '', email: '', phone: '', role: '', manager: '', githubProfileLink: '' });
        setIsEditMode(false);
        setCurrentEmployeeId(null);
        setStep(1);
    };

    const handleOpenCreate = () => {
        resetForm();
        setIsDialogOpen(true);
    };

    const handleOpenEdit = (employee: Employee) => {
        setFormData({
            name: employee.name || '',
            email: employee.email || '',
            phone: employee.phone || '',
            role: employee.role?._id || '',
            manager: employee.manager?._id || '',
            githubProfileLink: employee.githubProfileLink || '',
        });
        setIsEditMode(true);
        setCurrentEmployeeId(employee._id);
        setStep(1); // Start editing from step 1
        setIsDialogOpen(true);
    };

    const nextStep = () => {
        if (step === 1) {
            if (!formData.name) {
                toast.error('Please fill in Name before proceeding.');
                return;
            }
        }
        if (step === 2) {
            if (!formData.email || !formData.phone) {
                toast.error('Please fill in Email and Phone before proceeding.');
                return;
            }
        }
        setStep((prev) => prev + 1);
    };

    const prevStep = () => {
        setStep((prev) => Math.max(prev - 1, 1));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Final validation
        if (!formData.name || !formData.email || !formData.phone || !formData.role || !formData.manager) {
            toast.error('Please fill in all required fields');
            return;
        }

        setIsSaving(true);
        try {
            const url = isEditMode
                ? `/api/employees/${currentEmployeeId}`
                : '/api/employees';
            const method = isEditMode ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Operation failed');
            }

            toast.success(
                isEditMode ? 'Employee updated successfully' : 'Employee created successfully'
            );
            resetForm();
            setIsDialogOpen(false);
            fetchData();
        } catch (error) {
            toast.error((error as Error).message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to remove this employee?')) return;

        try {
            const response = await fetch(`/api/employees/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete employee');
            }

            toast.success('Employee removed successfully');
            fetchData();
        } catch (error) {
            toast.error('Failed to remove employee');
        }
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-primary/80 to-primary p-[2px] shadow-sm">
                        <div className="h-full w-full bg-card rounded-[10px] flex items-center justify-center">
                            <User className="h-6 w-6 text-primary" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Employees</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">Manage your workforce, roles, and manager assignments</p>
                    </div>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) resetForm();
                }}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 shrink-0" onClick={handleOpenCreate}>
                            <Plus className="h-4 w-4" /> Add Employee
                        </Button>
                    </DialogTrigger>

                    {/* Increased Max Width for better visual breathing room */}
                    <DialogContent className="sm:max-w-[650px] overflow-hidden">
                        <DialogHeader>
                            <DialogTitle>{isEditMode ? 'Edit Employee Details' : 'Onboard New Employee'}</DialogTitle>
                            <DialogDescription>
                                {isEditMode ? 'Modify employee profile and role assignments.' : 'Fill out their profile and map them appropriately.'}
                            </DialogDescription>

                            {/* 3-Step Indicator */}
                            <div className="pt-6 pb-2">
                                <div className="flex items-center justify-between mb-2 px-1">
                                    <span className={`text-xs font-semibold uppercase tracking-wider ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>Identity</span>
                                    <span className={`text-xs font-semibold uppercase tracking-wider ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>Contact</span>
                                    <span className={`text-xs font-semibold uppercase tracking-wider ${step >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>Assignment</span>
                                </div>
                                <div className="h-2.5 bg-muted rounded-full overflow-hidden flex">
                                    <motion.div
                                        className="h-full bg-primary"
                                        initial={false}
                                        animate={{ width: step === 1 ? '33.33%' : step === 2 ? '66.66%' : '100%' }}
                                        transition={{ duration: 0.3, ease: 'easeOut' }}
                                    />
                                </div>
                            </div>
                        </DialogHeader>

                        {/* Animated Form Container */}
                        <form onSubmit={handleSubmit} className="relative mt-2">
                            <AnimatePresence mode="wait">
                                {step === 1 && (
                                    <motion.div
                                        key="step1"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.2 }}
                                        className="flex flex-col gap-6 py-6"
                                    >
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="text-base font-medium">Full Name <span className="text-destructive">*</span></Label>
                                            <Input
                                                id="name"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="e.g. John Doe"
                                                autoFocus
                                                className="h-12 text-base"
                                            />
                                            <p className="text-sm text-muted-foreground mt-1">Provide their legal first and last name.</p>
                                        </div>
                                    </motion.div>
                                )}

                                {step === 2 && (
                                    <motion.div
                                        key="step2"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.2 }}
                                        className="flex flex-col gap-5 py-4"
                                    >
                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="font-medium">Email <span className="text-destructive">*</span></Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                placeholder="john.doe@company.com"
                                                className="h-11"
                                                autoFocus
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone" className="font-medium">Mobile Phone <span className="text-destructive">*</span></Label>
                                            <Input
                                                id="phone"
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                placeholder="+1 (555) 000-0000"
                                                className="h-11"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="githubProfile" className="font-medium">GitHub Profile Link</Label>
                                            <Input
                                                id="githubProfile"
                                                value={formData.githubProfileLink}
                                                onChange={(e) => setFormData({ ...formData, githubProfileLink: e.target.value })}
                                                placeholder="https://github.com/johndoe"
                                                className="h-11"
                                            />
                                        </div>
                                    </motion.div>
                                )}

                                {step === 3 && (
                                    <motion.div
                                        key="step3"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        transition={{ duration: 0.2 }}
                                        className="flex flex-col gap-5 py-6"
                                    >
                                        <div className="space-y-2">
                                            <Label htmlFor="role" className="font-medium">Role Target <span className="text-destructive">*</span></Label>
                                            <Select
                                                value={formData.role}
                                                onValueChange={(value) => setFormData({ ...formData, role: value })}
                                            >
                                                <SelectTrigger className="h-11">
                                                    <SelectValue placeholder="Select an assigned Role" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {roles.map((role) => (
                                                        <SelectItem key={role._id} value={role._id}>
                                                            {role.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {roles.length === 0 && (
                                                <p className="text-xs text-muted-foreground mt-1 text-destructive">
                                                    No roles found. Please define Roles in the dashboard.
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="manager" className="font-medium">Direct Manager <span className="text-destructive">*</span></Label>
                                            <Select
                                                value={formData.manager}
                                                onValueChange={(value) => setFormData({ ...formData, manager: value })}
                                            >
                                                <SelectTrigger className="h-11">
                                                    <SelectValue placeholder="Assign a direct Manager" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {managers.map((manager) => (
                                                        <SelectItem key={manager._id} value={manager._id}>
                                                            {manager.name} ({manager.email})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {managers.length === 0 && (
                                                <p className="text-xs text-muted-foreground mt-1 text-destructive">
                                                    No managers found. Please add a Manager to the organization.
                                                </p>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <DialogFooter className="mt-6 flex sm:justify-between items-center w-full gap-4 pt-4 border-t border-border">
                                <div>
                                    {step > 1 && (
                                        <Button type="button" variant="outline" onClick={prevStep} disabled={isSaving} className="h-10">
                                            Back
                                        </Button>
                                    )}
                                </div>
                                <div className="flex gap-3">
                                    <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} disabled={isSaving} className="h-10">
                                        Cancel
                                    </Button>
                                    {step < 3 ? (
                                        <Button type="button" onClick={nextStep} className="gap-2 h-10 px-6 bg-primary text-primary-foreground">
                                            Continue <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    ) : (
                                        <Button type="submit" disabled={isSaving} className="h-10 px-6 bg-primary text-primary-foreground shadow-md hover:shadow-lg transition-all">
                                            {isSaving ? 'Processing...' : (isEditMode ? 'Save Changes' : 'Complete Registration')}
                                        </Button>
                                    )}
                                </div>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm min-h-[400px]">
                {employees.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-16 text-center space-y-4">
                        <div className="p-4 bg-muted rounded-full">
                            <User className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">No employees onboarded</h3>
                            <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-2">
                                Add your first employee to assign roles, managers, and provision resources automatically.
                            </p>
                        </div>
                        <Button variant="outline" onClick={handleOpenCreate}>
                            Onboard Employee
                        </Button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                                <tr>
                                    <th className="px-6 py-4">Employee</th>
                                    <th className="px-6 py-4">Contact</th>
                                    <th className="px-6 py-4">Role Assignment</th>
                                    <th className="px-6 py-4">Direct Manager</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {employees.map((employee) => (
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
                                            <div className="flex flex-col">
                                                <span className="font-medium">{employee.manager?.name || 'None'}</span>
                                                <span className="text-xs text-muted-foreground">{employee.manager?.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border 
                            ${employee.status === 'active' ? 'bg-green-100 text-green-800 border-green-200' :
                                                    employee.status === 'inactive' ? 'bg-gray-100 text-gray-800 border-gray-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'}`}>
                                                {employee.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => handleOpenEdit(employee)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(employee._id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
