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
import { Plus, UserCog, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Manager {
    _id: string;
    name: string;
    email: string;
    phone: string;
    managerId: string;
    createdAt: string;
}

export default function ManagersPage() {
    const router = useRouter();
    const [managers, setManagers] = useState<Manager[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentManagerId, setCurrentManagerId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        managerId: '',
    });

    const fetchData = async () => {
        try {
            const res = await fetch('/api/managers');

            if (res.status === 401) {
                toast.error('Session expired. Please login again.');
                router.push('/login');
                return;
            }

            const data = await res.json();

            if (Array.isArray(data)) {
                setManagers(data);
            } else {
                setManagers([]);
                if (data.message) toast.error(`Error: ${data.message}`);
            }
        } catch (error) {
            toast.error('Failed to load managers');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [router]);

    const resetForm = () => {
        setFormData({ name: '', email: '', phone: '', managerId: '' });
        setIsEditMode(false);
        setCurrentManagerId(null);
    };

    const handleOpenCreate = () => {
        resetForm();
        setIsDialogOpen(true);
    };

    const handleOpenEdit = (manager: Manager) => {
        setFormData({
            name: manager.name,
            email: manager.email,
            phone: manager.phone,
            managerId: manager.managerId,
        });
        setIsEditMode(true);
        setCurrentManagerId(manager._id);
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.phone || !formData.managerId) {
            toast.error('Please fill in all required fields');
            return;
        }

        setIsSaving(true);
        try {
            const url = isEditMode
                ? `/api/managers/${currentManagerId}`
                : '/api/managers';
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
                isEditMode ? 'Manager updated successfully' : 'Manager created successfully. Credentials emailed.'
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
        if (!confirm('Are you sure you want to remove this manager?')) return;

        try {
            const response = await fetch(`/api/managers/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.message || 'Failed to delete manager');
            }

            toast.success('Manager removed successfully');
            fetchData();
        } catch (error) {
            toast.error((error as Error).message);
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
                            <UserCog className="h-6 w-6 text-primary" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Managers</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">Manage administrative and oversight personnel</p>
                    </div>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) resetForm();
                }}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 shrink-0" onClick={handleOpenCreate}>
                            <Plus className="h-4 w-4" /> Add Manager
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>{isEditMode ? 'Edit Manager' : 'Add New Manager'}</DialogTitle>
                            <DialogDescription>
                                {isEditMode ? 'Update manager contact details and IDs.' : 'Add a high-level manager. Credentials will be emailed securely to the provided address.'}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit}>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="name" className="text-right">
                                        Name *
                                    </Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="col-span-3"
                                        placeholder="Jane Doe"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="email" className="text-right">
                                        Email *
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="col-span-3"
                                        placeholder="jane.doe@example.com"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="phone" className="text-right">
                                        Phone *
                                    </Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="col-span-3"
                                        placeholder="+1 (555) 000-0000"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="managerId" className="text-right">
                                        Manager ID *
                                    </Label>
                                    <Input
                                        id="managerId"
                                        value={formData.managerId}
                                        onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                                        className="col-span-3"
                                        placeholder="MGR-001"
                                        required
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={isSaving}>
                                    {isSaving ? 'Saving...' : (isEditMode ? 'Update Manager' : 'Create Manager Account')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="bg-card rounded-xl border border-border p-6 shadow-sm min-h-[400px]">
                {managers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-12 text-center space-y-4">
                        <div className="p-4 bg-muted rounded-full">
                            <UserCog className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">No managers yet</h3>
                            <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-2">
                                Add your first manager to delegate administrative privileges.
                            </p>
                        </div>
                        <Button variant="outline" onClick={handleOpenCreate}>
                            Add Manager
                        </Button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                                <tr>
                                    <th className="px-6 py-3">Name</th>
                                    <th className="px-6 py-3">Manager ID</th>
                                    <th className="px-6 py-3">Phone</th>
                                    <th className="px-6 py-3">Joined Date</th>
                                    <th className="px-6 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {managers.map((manager) => (
                                    <tr key={manager._id} className="bg-card border-b border-border hover:bg-muted/50">
                                        <td className="px-6 py-4 font-medium text-foreground">
                                            <div className="flex flex-col">
                                                <span>{manager.name}</span>
                                                <span className="text-xs text-muted-foreground">{manager.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-xs bg-muted text-foreground px-2 py-1 rounded">
                                                {manager.managerId}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {manager.phone}
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {new Date(manager.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => handleOpenEdit(manager)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(manager._id)}>
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
