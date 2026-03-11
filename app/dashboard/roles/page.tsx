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
import { Plus, Shield, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Role {
    _id: string;
    name: string;
}

export default function RolesPage() {
    const router = useRouter();
    const [roles, setRoles] = useState<Role[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({ name: '' });
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);

    const fetchRoles = async () => {
        try {
            const response = await fetch('/api/roles');
            if (response.status === 401) {
                router.push('/login');
                return;
            }
            const data = await response.json();
            if (Array.isArray(data)) {
                setRoles(data);
            } else {
                setRoles([]);
            }
        } catch (error) {
            toast.error('Failed to load roles');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, [router]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) return;

        setIsSaving(true);
        try {
            const response = await fetch('/api/roles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!response.ok) throw new Error('Failed to create role');

            toast.success('Role created successfully');
            setFormData({ name: '' });
            setIsCreateOpen(false);
            fetchRoles();
        } catch (error) {
            toast.error('Failed to create role');
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !selectedRole) return;

        setIsSaving(true);
        try {
            const response = await fetch(`/api/roles/${selectedRole._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!response.ok) throw new Error('Failed to update role');

            toast.success('Role updated successfully');
            setIsEditOpen(false);
            fetchRoles();
        } catch (error) {
            toast.error('Failed to update role');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedRole) return;
        setIsSaving(true);
        try {
            const response = await fetch(`/api/roles/${selectedRole._id}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Failed to delete role');

            toast.success('Role deleted successfully');
            setIsDeleteOpen(false);
            fetchRoles();
        } catch (error) {
            toast.error('Failed to delete role');
        } finally {
            setIsSaving(false);
        }
    };

    const openEditModal = (role: Role) => {
        setSelectedRole(role);
        setFormData({ name: role.name });
        setIsEditOpen(true);
    };

    const openDeleteModal = (role: Role) => {
        setSelectedRole(role);
        setIsDeleteOpen(true);
    };

    if (isLoading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-primary/80 to-primary p-[2px] shadow-sm">
                        <div className="h-full w-full bg-card rounded-[10px] flex items-center justify-center">
                            <Shield className="h-6 w-6 text-primary" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Roles</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">Define permission levels and access controls</p>
                    </div>
                </div>

                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 shrink-0" onClick={() => setFormData({ name: '' })}>
                            <Plus className="h-4 w-4" /> Add Role
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Create New Role</DialogTitle>
                            <DialogDescription>
                                Create a new role definition for your workspace.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreate}>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="create-name" className="text-right">Name *</Label>
                                    <Input
                                        id="create-name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="col-span-3"
                                        placeholder="e.g. Backend Engineer"
                                        required
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={isSaving}>
                                    {isSaving ? 'Creating...' : 'Create Role'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {roles.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center bg-card border border-border rounded-xl shadow-sm col-span-full">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                        <Shield className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-semibold mb-1">No roles defined yet</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mb-4">
                        Roles help you organize permissions and connect your integrations securely.
                    </p>
                    <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                        <Plus className="h-4 w-4" /> Create your first Role
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {roles.map((role) => (
                        <div key={role._id} className="bg-card border border-border rounded-xl p-6 shadow-sm group">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                        <Shield className="h-5 w-5" />
                                    </div>
                                    <h3 className="font-semibold text-lg">{role.name}</h3>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => openEditModal(role)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => openDeleteModal(role)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit Role</DialogTitle>
                        <DialogDescription>
                            Update the role's title.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEdit}>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-name" className="text-right">Name *</Label>
                                <Input
                                    id="edit-name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="col-span-3"
                                    required
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Delete Role</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <span className="font-semibold text-foreground">{selectedRole?.name}</span>? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={isSaving}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isSaving}>
                            {isSaving ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}
