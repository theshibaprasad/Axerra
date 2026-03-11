'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Mail, Phone, Pencil, Save, X, Loader2 } from 'lucide-react';

interface Company {
    _id: string;
    name: string;
    email: string;
    phone: string;
}

export default function ProfilePage() {
    const router = useRouter();
    const [company, setCompany] = useState<Company | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', phone: '' });

    const fetchCompany = async () => {
        try {
            const response = await fetch('/api/auth/me');
            if (!response.ok) {
                throw new Error('Failed to fetch company data');
            }
            const data = await response.json();
            setCompany(data);
            setEditForm({ name: data.name, phone: data.phone });
        } catch (error) {
            toast.error('Session expired. Please login again.');
            router.push('/login');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCompany();
    }, [router]);

    const handleSave = async () => {
        if (!editForm.name.trim()) {
            toast.error('Company name is required');
            return;
        }

        setIsSaving(true);
        try {
            const response = await fetch('/api/auth/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm),
            });

            if (!response.ok) {
                throw new Error('Failed to update profile');
            }

            const updatedData = await response.json();
            setCompany(updatedData);
            setIsEditing(false);
            toast.success('Profile updated successfully');
        } catch (error) {
            toast.error('Could not save changes');
        } finally {
            setIsSaving(false);
        }
    };

    const cancelEdit = () => {
        if (company) setEditForm({ name: company.name, phone: company.phone });
        setIsEditing(false);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!company) return null;

    return (
        <div className="w-full max-w-4xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-primary/80 to-primary p-[2px] shadow-sm">
                        <div className="h-full w-full bg-card rounded-[10px] flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-primary" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{company.name}</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">Manage your company details and contact information</p>
                    </div>
                </div>

                {!isEditing ? (
                    <Button onClick={() => setIsEditing(true)} size="sm" className="gap-2 shrink-0">
                        <Pencil className="h-3.5 w-3.5" /> Edit Profile
                    </Button>
                ) : (
                    <div className="flex gap-2 shrink-0">
                        <Button onClick={cancelEdit} variant="outline" size="sm">
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={isSaving} size="sm" className="gap-2">
                            {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            Save Info
                        </Button>
                    </div>
                )}
            </div>

            <div className="bg-card rounded-xl border border-border shadow-sm">
                <div className="p-6 border-b border-border">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" /> Company Details
                    </h2>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Organization Name */}
                        <div className="space-y-2.5">
                            <Label className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                                Organization Name
                            </Label>
                            {isEditing ? (
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        className="pl-9 h-10"
                                        value={editForm.name}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="Enter company name"
                                    />
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 p-2.5 rounded-md bg-muted/40 border border-border/50">
                                    <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <p className="font-medium text-sm">{company.name}</p>
                                </div>
                            )}
                        </div>

                        {/* Contact Phone */}
                        <div className="space-y-2.5">
                            <Label className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                                Contact Phone
                            </Label>
                            {isEditing ? (
                                <div className="relative">
                                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        className="pl-9 h-10"
                                        value={editForm.phone}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                                        placeholder="Enter phone number"
                                    />
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 p-2.5 rounded-md bg-muted/40 border border-border/50">
                                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <p className="font-medium text-sm">{company.phone || <span className="text-muted-foreground italic">Not provided</span>}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Admin Email */}
                    <div className="space-y-2.5 md:w-1/2 md:pr-3">
                        <Label className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                            Admin Email
                        </Label>
                        <div className="flex items-center gap-3 p-2.5 rounded-md bg-muted/40 border border-border/50 opacity-80 cursor-not-allowed" title="Email cannot be changed directly">
                            <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                            <p className="font-medium text-sm text-foreground/80">{company.email}</p>
                        </div>
                        {isEditing && <p className="text-[10.5px] text-muted-foreground">Email changes require support verification.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}
