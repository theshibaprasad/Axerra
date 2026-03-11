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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Users, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Team {
    _id: string;
    name: string;
    githubTeam?: string;
}

export default function TeamsPage() {
    const router = useRouter();
    const [teams, setTeams] = useState<Team[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [saveState, setSaveState] = useState<'idle' | 'checking' | 'saving'>('idle');
    const [mode, setMode] = useState<'create' | 'edit'>('create');
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
    const [showGithubDialog, setShowGithubDialog] = useState(false);
    const [githubTeamToCreate, setGithubTeamToCreate] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        githubTeam: '',
    });

    const fetchTeams = async () => {
        try {
            const response = await fetch('/api/teams');
            if (response.status === 401) {
                router.push('/login');
                return;
            }
            const data = await response.json();
            if (Array.isArray(data)) {
                setTeams(data);
            } else {
                setTeams([]);
                console.error('Invalid teams format', data);
            }
        } catch (error) {
            toast.error('Failed to load teams');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTeams();
    }, [router]);

    const handleOpenCreateDialog = () => {
        setMode('create');
        setSelectedTeamId(null);
        setFormData({ name: '', githubTeam: '' });
        setIsDialogOpen(true);
    };

    const handleEdit = (team: Team) => {
        setMode('edit');
        setSelectedTeamId(team._id);
        setFormData({
            name: team.name,
            githubTeam: team.githubTeam || '',
        });
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this team?')) return;

        try {
            const response = await fetch(`/api/teams/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Failed to delete team');

            toast.success('Team deleted successfully');
            fetchTeams();
        } catch (error) {
            toast.error('Failed to delete team');
        }
    };

    const saveInternalTeam = async (githubTeamName: string) => {
        setSaveState('saving');
        try {
            const url = mode === 'create' ? '/api/teams' : `/api/teams/${selectedTeamId}`;
            const method = mode === 'create' ? 'POST' : 'PATCH';

            const payload = { ...formData, githubTeam: githubTeamName };

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                // If the response failed due to HTTP status, we check if it sent down a JSON message
                const errorData = await response.json().catch(() => null);

                // Then we surface that message directly here, halting exactly on what the database complained about
                if (errorData?.message) toast.error(errorData.message);
                else toast.error(`Failed to ${mode} team`);
                return false;
            }

            return true; // Successfully saved
        } catch (error: any) {
            console.error(error);
            // Finally this functions as a catch all for non HTTP crash states (e.g no internet connection)
            toast.error(error?.message || `Failed to ${mode} team`);
            return false; // Failed to save
        } finally {
            setSaveState('idle');
        }
    };

    const handleSuccessSave = () => {
        toast.success(`Team ${mode === 'create' ? 'created' : 'updated'} successfully`);
        setFormData({ name: '', githubTeam: '' });
        setIsDialogOpen(false);
        fetchTeams();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) return;

        if (formData.githubTeam) {
            // Check Github Team existence BEFORE saving internal
            setSaveState('checking');

            // 1. Blind save to internal DB first. This handles standard collisions.
            const savedInternally = await saveInternalTeam(formData.githubTeam);

            // If internal save failed (e.g. duplicate name or github mapping), stop here.
            if (!savedInternally) {
                // error toast is already shown inside saveInternalTeam
                return;
            }

            // 2. If it did save securely, let's now check GitHub's existence
            let existsInGithub = true;
            try {
                const res = await fetch(`/api/github/team?name=${encodeURIComponent(formData.githubTeam)}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.exists === false) {
                        existsInGithub = false;
                        setGithubTeamToCreate(formData.githubTeam);
                        setShowGithubDialog(true);
                        setSaveState('idle');
                        return; // Wait for dialog response
                    }
                }
            } catch (error) {
                console.error("Error checking GitHub team", error);
            }

            // 3. If exists logically, we are done
            if (existsInGithub) {
                handleSuccessSave();
            }

        } else {
            const saved = await saveInternalTeam('');
            if (saved) handleSuccessSave();
        }
    };

    const handleGithubDialogClose = async (shouldCreate: boolean) => {
        setShowGithubDialog(false);
        if (shouldCreate) {
            setSaveState('saving');
            try {
                const res = await fetch('/api/github/team', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: githubTeamToCreate }),
                });

                if (!res.ok) {
                    toast.error('Failed to create team in GitHub');
                    setSaveState('idle');
                    return;
                }
                toast.success('GitHub team created successfully');
            } catch (error) {
                toast.error('Failed to create team in GitHub');
                setSaveState('idle');
                return;
            }
        }

        // We already performed the blind save previously!
        handleSuccessSave();
    };

    if (isLoading) return <div>Loading...</div>;

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
                        <h1 className="text-2xl font-bold tracking-tight">Teams</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">Manage your organizational groups and mappings</p>
                    </div>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 shrink-0" onClick={handleOpenCreateDialog}>
                            <Plus className="h-4 w-4" /> Add Team
                        </Button>
                    </DialogTrigger>

                    <AlertDialog open={showGithubDialog} onOpenChange={setShowGithubDialog}>
                        <AlertDialogContent className="z-[100]">
                            <AlertDialogHeader>
                                <AlertDialogTitle>GitHub Team Not Found</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This team does not exist in the connected GitHub organization. Want to create a new team with this name in GitHub?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => handleGithubDialogClose(false)}>No</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleGithubDialogClose(true)}>Yes</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>{mode === 'create' ? 'Create New Team' : 'Edit Team'}</DialogTitle>
                            <DialogDescription>
                                {mode === 'create' ? 'Define a new team and map it to external resources.' : 'Update team details.'}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit}>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="name" className="text-right">Name *</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="col-span-3"
                                        placeholder="e.g. Engineering"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="githubTeam" className="text-right">GitHub Team</Label>
                                    <Input
                                        id="githubTeam"
                                        value={formData.githubTeam}
                                        onChange={(e) => setFormData({ ...formData, githubTeam: e.target.value })}
                                        className="col-span-3"
                                        placeholder="e.g. backend-devs"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={saveState !== 'idle'}>
                                    {saveState === 'checking'
                                        ? 'Checking...'
                                        : saveState === 'saving'
                                            ? 'Saving...'
                                            : (mode === 'create' ? 'Create Team' : 'Save Changes')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teams.map((team) => (
                    <div key={team._id} className="bg-card border border-border rounded-xl p-6 shadow-sm group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                    <Users className="h-5 w-5" />
                                </div>
                                <h3 className="font-semibold text-lg">{team.name}</h3>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => handleEdit(team)}>
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(team._id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-2 text-sm text-muted-foreground">
                            <div className="flex justify-between">
                                <span>GitHub Team:</span>
                                <span className="font-medium text-foreground">{team.githubTeam || '-'}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div >
    );
}
