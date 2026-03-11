'use client';

import { motion } from 'framer-motion';
import { FolderGit2, FolderPlus, MoreHorizontal, Edit, Trash2, Plus, X, ChevronRight, ChevronLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface Employee {
    _id: string;
    name: string;
    email: string;
    status: string;
    manager: { _id: string } | string;
}

interface ManagerData {
    _id: string;
}

interface Project {
    _id: string;
    name: string;
    projectKey: string;
    description: string;
    status: string;
    githubTeams: string[];
    slackChannelName: string;
    assignedEmployees: Employee[];
    createdAt: string;
}

const DEFAULT_FORM_DATA = {
    name: '',
    projectKey: '',
    description: '',
    status: 'active',
    githubTeams: [''],
    slackChannelName: '',
    assignedEmployees: [] as string[]
};

export default function MyProjectsPage() {
    const [manager, setManager] = useState<ManagerData | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal states
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentProject, setCurrentProject] = useState<Project | null>(null);
    const [formData, setFormData] = useState(DEFAULT_FORM_DATA);

    // Multi-step form state
    const [step, setStep] = useState(1);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // First fetch manager to filter employees
            const managerRes = await fetch('/api/auth/me');
            let managerId = null;
            if (managerRes.ok) {
                const managerData = await managerRes.json();
                setManager(managerData);
                managerId = managerData._id;
            }

            // Fetch Projects and Employees in parallel
            const [projRes, empRes] = await Promise.all([
                fetch('/api/projects'),
                fetch('/api/employees')
            ]);

            if (projRes.ok) {
                const data = await projRes.json();
                setProjects(Array.isArray(data) ? data : []);
            }
            if (empRes.ok && managerId) {
                const data = await empRes.json();
                const allEmps = Array.isArray(data) ? data : [];
                // Filter to my team
                const myTeam = allEmps.filter(emp => String(emp.manager?._id || emp.manager) === String(managerId));
                setEmployees(myTeam);
            }
        } catch (error) {
            console.error("Failed to load data", error);
            toast.error('An error occurred while loading projects');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Form handlers
    const addGithubTeam = () => {
        setFormData({ ...formData, githubTeams: [...formData.githubTeams, ''] });
    };

    const updateGithubTeam = (index: number, value: string) => {
        const newTeams = [...formData.githubTeams];
        newTeams[index] = value;
        setFormData({ ...formData, githubTeams: newTeams });
    };

    const removeGithubTeam = (index: number) => {
        const newTeams = formData.githubTeams.filter((_, i) => i !== index);
        setFormData({ ...formData, githubTeams: newTeams });
    };

    const toggleEmployee = (empId: string) => {
        setFormData(prev => {
            const isAssigned = prev.assignedEmployees.includes(empId);
            if (isAssigned) {
                return { ...prev, assignedEmployees: prev.assignedEmployees.filter(id => id !== empId) };
            } else {
                return { ...prev, assignedEmployees: [...prev.assignedEmployees, empId] };
            }
        });
    };

    const handleAddProject = async () => {
        // Clean up empty github teams
        const cleanedData = {
            ...formData,
            githubTeams: formData.githubTeams.filter(team => team.trim() !== '')
        };

        setIsSubmitting(true);
        try {
            const response = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cleanedData),
            });

            if (response.ok) {
                const newProjectData = await response.json();
                toast.success('Project created successfully');
                setIsAddDialogOpen(false);
                setStep(1);
                fetchData();
                // Open Assign Form for the new project immediately
                setCurrentProject(newProjectData);
                setFormData({ ...DEFAULT_FORM_DATA, assignedEmployees: [] });
                setIsAssignDialogOpen(true);
            } else {
                const errorData = await response.json();
                toast.error(errorData.message || 'Failed to create project');
            }
        } catch (error) {
            toast.error('An error occurred while creating project');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditProject = async () => {
        if (!currentProject) return;

        const cleanedData = {
            ...formData,
            githubTeams: formData.githubTeams.filter(team => team.trim() !== '')
        };

        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/projects/${currentProject._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cleanedData),
            });

            if (response.ok) {
                toast.success('Project updated successfully');
                setIsEditDialogOpen(false);
                setStep(1);
                fetchData();
            } else {
                const errorData = await response.json();
                toast.error(errorData.message || 'Failed to update project');
            }
        } catch (error) {
            toast.error('An error occurred while updating project');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteProject = async (id: string) => {
        if (!confirm('Are you sure you want to delete this project?')) return;

        try {
            const response = await fetch(`/api/projects/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                toast.success('Project deleted successfully');
                fetchData();
            } else {
                const errorData = await response.json();
                toast.error(errorData.message || 'Failed to delete project');
            }
        } catch (error) {
            toast.error('An error occurred while deleting project');
        }
    };

    const updateProjectStatus = async (id: string, newStatus: string) => {
        // Optimistically update UI
        setProjects(projects.map(p => p._id === id ? { ...p, status: newStatus } : p));
        toast.success(`Status updated to ${newStatus}`);

        try {
            const response = await fetch(`/api/projects/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) {
                // Revert on failure
                fetchData();
                toast.error('Failed to update status on server');
            }
        } catch (error) {
            fetchData();
            toast.error('An error occurred while updating status');
        }
    };

    const handleSaveAssignments = async () => {
        if (!currentProject) return;

        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/projects/${currentProject._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assignedEmployees: formData.assignedEmployees }),
            });

            if (response.ok) {
                toast.success('Employees assigned successfully');
                setIsAssignDialogOpen(false);
                fetchData();
            } else {
                const errorData = await response.json();
                toast.error(errorData.message || 'Failed to assign employees');
            }
        } catch (error) {
            toast.error('An error occurred while assigning employees');
        } finally {
            setIsSubmitting(false);
        }
    };

    const openEditDialog = (project: Project) => {
        setCurrentProject(project);
        setFormData({
            name: project.name,
            projectKey: project.projectKey || '',
            description: project.description || '',
            status: project.status,
            githubTeams: project.githubTeams?.length ? project.githubTeams : [''],
            slackChannelName: project.slackChannelName || '',
            assignedEmployees: project.assignedEmployees?.map(emp => emp._id) || []
        });
        setStep(1);
        setIsEditDialogOpen(true);
    };

    const openAssignDialog = (project: Project) => {
        setCurrentProject(project);
        setFormData({
            ...DEFAULT_FORM_DATA,
            assignedEmployees: project.assignedEmployees?.map(emp => emp._id) || []
        });
        setIsAssignDialogOpen(true);
    };

    // Render Steps
    const renderStep1 = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 py-4">
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-semibold">Project Name <span className="text-destructive">*</span></Label>
                    <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        placeholder="E.g., Core API Refactor"
                        className="h-11 text-base placeholder:text-muted-foreground/50"
                    />
                    <p className="text-xs text-muted-foreground">This name will be visible to your team members.</p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="projectKey" className="text-sm font-semibold">Project Key <span className="text-destructive">*</span></Label>
                    <Input
                        id="projectKey"
                        value={formData.projectKey}
                        onChange={(e) => setFormData({ ...formData, projectKey: e.target.value.toUpperCase() })}
                        required
                        placeholder="E.g., API"
                        className="uppercase h-11 text-base placeholder:text-muted-foreground/50"
                    />
                    <p className="text-xs text-muted-foreground">A short identifier for referencing this project across integrations.</p>
                </div>
            </div>
            <div className="space-y-2 mt-4">
                <Label htmlFor="description" className="text-sm font-semibold">Description</Label>
                <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description of the project's goals"
                    className="resize-none h-20 placeholder:text-muted-foreground/50"
                />
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 py-4">
            <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border/50">
                    <div>
                        <Label className="text-sm font-semibold text-foreground">GitHub Teams</Label>
                        <p className="text-xs text-muted-foreground mt-0.5">Link GitHub teams to this project for access control.</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addGithubTeam} className="h-8 gap-1">
                        <Plus className="h-3.5 w-3.5" /> Add Team
                    </Button>
                </div>

                <div className="space-y-3 mt-4">
                    {formData.githubTeams.map((team, index) => (
                        <div key={index} className="flex items-center gap-2 group">
                            <div className="flex-1">
                                <Input
                                    value={team}
                                    onChange={(e) => updateGithubTeam(index, e.target.value)}
                                    placeholder="E.g., backend-engineers"
                                    className="h-10"
                                />
                            </div>
                            {formData.githubTeams.length > 1 && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeGithubTeam(index)}
                                    className="opacity-50 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 py-4">
            <div className="space-y-4">
                <div>
                    <Label htmlFor="slackChannel" className="text-sm font-semibold">Slack Channel Name</Label>
                    <p className="text-xs text-muted-foreground mt-0.5 mb-3">Provide a dedicated Slack channel for project notifications and updates.</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center bg-muted text-muted-foreground font-semibold px-4 h-11 rounded-md border border-input shadow-sm">
                        #
                    </div>
                    <Input
                        id="slackChannel"
                        value={formData.slackChannelName}
                        onChange={(e) => setFormData({ ...formData, slackChannelName: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                        placeholder="project-updates"
                        className="h-11 text-base placeholder:text-muted-foreground/50"
                    />
                </div>
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-start gap-3 mt-4">
                    <div className="text-primary mt-0.5">ℹ️</div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        If the channel doesn&apos;t exist yet, it will be created automatically once the Axerra Slack bot is configured.
                    </p>
                </div>
            </div>
        </div>
    );

    const isStep1Valid = formData.name.trim() !== '' && formData.projectKey.trim() !== '';

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-primary/80 to-primary p-[2px] shadow-sm">
                        <div className="h-full w-full bg-card rounded-[10px] flex items-center justify-center">
                            <FolderGit2 className="h-6 w-6 text-primary" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">Manage your team&apos;s projects</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2">
                        <FolderGit2 className="h-4 w-4" />
                        {isLoading ? '...' : projects.length} Projects
                    </div>
                    <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
                        setIsAddDialogOpen(open);
                        if (!open) {
                            setStep(1);
                            setFormData(DEFAULT_FORM_DATA);
                        }
                    }}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <FolderPlus className="h-4 w-4" />
                                Create Project
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden border-border/50 shadow-2xl">
                            <div className="px-6 pt-6 pb-2 border-b border-border bg-card">
                                <DialogHeader>
                                    <DialogTitle className="text-xl">Create New Project</DialogTitle>
                                    <DialogDescription className="text-sm mt-1">
                                        Step {step} of 3: {step === 1 ? 'Basic Setup' : step === 2 ? 'GitHub Configuration' : 'Slack Configuration'}
                                    </DialogDescription>
                                </DialogHeader>

                                {/* Professional Step Indicators */}
                                <div className="flex items-center justify-between mt-6 mb-2">
                                    {[1, 2, 3].map((s) => (
                                        <div key={s} className="flex flex-col items-center flex-1 relative gap-2">
                                            {/* Progress Bar Connectors */}
                                            {s !== 1 && (
                                                <div className={`absolute top-3 right-[50%] w-full h-0.5 -z-10 transition-colors duration-500 ease-in-out ${step >= s ? 'bg-primary' : 'bg-muted'}`} />
                                            )}

                                            {/* Step Circle */}
                                            <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 shadow-sm border-2 ${step >= s ? 'bg-primary border-primary text-primary-foreground scale-110' :
                                                'bg-card border-muted text-muted-foreground'
                                                }`}>
                                                {step > s ? '✓' : s}
                                            </div>
                                            <span className={`text-[10px] font-medium tracking-wide uppercase transition-colors ${step >= s ? 'text-foreground' : 'text-muted-foreground/60'}`}>
                                                {s === 1 ? 'Details' : s === 2 ? 'GitHub' : 'Slack'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-card/50">
                                <div className="min-h-[220px] px-8 py-4">
                                    {step === 1 && renderStep1()}
                                    {step === 2 && renderStep2()}
                                    {step === 3 && renderStep3()}
                                </div>
                                <div className="flex justify-between items-center px-6 py-4 border-t border-border bg-card">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => step > 1 ? setStep(step - 1) : setIsAddDialogOpen(false)}
                                        className="h-10 px-4 shadow-sm"
                                        disabled={isSubmitting}
                                    >
                                        {step === 1 ? 'Cancel' : <><ChevronLeft className="h-4 w-4 mr-1.5" /> Back</>}
                                    </Button>

                                    {step < 3 ? (
                                        <Button
                                            type="button"
                                            onClick={() => setStep(step + 1)}
                                            disabled={(step === 1 && !isStep1Valid) || isSubmitting}
                                            className="h-10 px-6 shadow-sm"
                                        >
                                            Next <ChevronRight className="h-4 w-4 ml-1.5" />
                                        </Button>
                                    ) : (
                                        <Button type="button" onClick={handleAddProject} disabled={isSubmitting} className="h-10 px-6 shadow-sm font-semibold">
                                            {isSubmitting ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="h-4 w-4 border-2 border-background border-r-transparent rounded-full animate-spin" />
                                                    Creating...
                                                </div>
                                            ) : 'Create Project'}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card rounded-xl border border-border overflow-hidden shadow-sm min-h-[400px]"
            >
                {isLoading ? (
                    <div className="flex justify-center items-center h-full py-24">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                    </div>
                ) : projects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-24 text-center space-y-4">
                        <div className="p-5 bg-muted rounded-full shadow-inner">
                            <FolderGit2 className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold mt-2">No projects found</h3>
                            <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-2 mb-6 leading-relaxed">
                                You currently don&apos;t have any projects. Click the button below to create one and start managing your team&apos;s work.
                            </p>
                            <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2 shadow-sm h-10 px-6">
                                <FolderPlus className="h-4 w-4" />
                                Create First Project
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                                <tr>
                                    <th className="px-6 py-4 w-[35%]">Project</th>
                                    <th className="px-6 py-4 w-[25%]">Integrations</th>
                                    <th className="px-6 py-4 w-[20%]">Assignee</th>
                                    <th className="px-6 py-4 w-[15%]">Status</th>
                                    <th className="px-6 py-4 w-[5%] text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {projects.map((project) => (
                                    <tr key={project._id} className="bg-card border-t border-border hover:bg-muted/50 transition-colors">
                                        <td className="px-6 py-5 border-l-2 border-transparent group-hover:border-primary/50 transition-colors">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-foreground text-base tracking-tight">{project.name}</span>
                                                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20 font-mono font-medium">{project.projectKey}</span>
                                                </div>
                                                <p className="text-xs text-muted-foreground truncate max-w-[250px] mt-1.5 leading-relaxed" title={project.description}>
                                                    {project.description || 'No description provided.'}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1 text-xs">
                                                {project.githubTeams?.length > 0 && (
                                                    <span className="text-muted-foreground flex items-center gap-1">
                                                        <span className="h-2 w-2 rounded-full bg-neutral-800 dark:bg-neutral-300 inline-block" />
                                                        {project.githubTeams.length} GitHub Team(s)
                                                    </span>
                                                )}
                                                {project.slackChannelName && (
                                                    <span className="text-muted-foreground flex items-center gap-1">
                                                        <span className="h-2 w-2 rounded-full bg-[#E01E5A] inline-block" />
                                                        #{project.slackChannelName}
                                                    </span>
                                                )}
                                                {(!project.githubTeams?.length && !project.slackChannelName) && (
                                                    <span className="text-muted-foreground/50 italic">None</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1.5 align-middle">
                                                {project.assignedEmployees && project.assignedEmployees.map((emp, i) => (
                                                    i < 3 && (
                                                        <span key={emp._id} className="px-2 py-0.5 rounded border border-primary/20 bg-primary/10 text-[10px] font-semibold text-primary flex items-center" title={emp.name}>
                                                            {emp.name.split(' ')[0]}
                                                        </span>
                                                    )
                                                ))}
                                                {project.assignedEmployees && project.assignedEmployees.length > 3 && (
                                                    <span className="px-2 py-0.5 rounded border border-border bg-muted text-[10px] font-semibold text-muted-foreground flex items-center">
                                                        +{project.assignedEmployees.length - 3}
                                                    </span>
                                                )}
                                                {(!project.assignedEmployees || project.assignedEmployees.length === 0) && (
                                                    <span className="text-xs text-muted-foreground/50 italic py-0.5">Unassigned</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger className="focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-full">
                                                    <div className={`px-3 py-1.5 rounded-full text-[10px] font-bold border uppercase tracking-widest cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1.5
                                                        ${project.status === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' :
                                                            project.status === 'completed' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800' :
                                                                'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800'}`}>
                                                        <div className={`h-1.5 w-1.5 rounded-full ${project.status === 'active' ? 'bg-green-500' : project.status === 'completed' ? 'bg-blue-500' : 'bg-yellow-500'}`} />
                                                        {project.status.replace('-', ' ')}
                                                    </div>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="start" className="w-36">
                                                    <DropdownMenuItem onClick={() => updateProjectStatus(project._id, 'active')} className="text-xs font-semibold cursor-pointer">
                                                        <div className="h-1.5 w-1.5 rounded-full bg-green-500 mr-2" /> Active
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => updateProjectStatus(project._id, 'on-hold')} className="text-xs font-semibold cursor-pointer">
                                                        <div className="h-1.5 w-1.5 rounded-full bg-yellow-500 mr-2" /> On Hold
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => updateProjectStatus(project._id, 'completed')} className="text-xs font-semibold cursor-pointer">
                                                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mr-2" /> Completed
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => openAssignDialog(project)}>
                                                        <Plus className="mr-2 h-4 w-4" /> Assign Employees
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => openEditDialog(project)}>
                                                        <Edit className="mr-2 h-4 w-4" /> Edit Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                                                        onClick={() => handleDeleteProject(project._id)}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete Project
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </motion.div>

            {/* Edit Dialog - Exact Same Multi-step Logic */}
            <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
                setIsEditDialogOpen(open);
                if (!open) setStep(1);
            }}>
                <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden border-border/50 shadow-2xl">
                    <div className="px-6 pt-6 pb-2 border-b border-border bg-card">
                        <DialogHeader>
                            <DialogTitle className="text-xl">Edit Project: <span className="text-primary">{currentProject?.name}</span></DialogTitle>
                            <DialogDescription className="text-sm mt-1">
                                Step {step} of 3: {step === 1 ? 'Basic Setup' : step === 2 ? 'GitHub Configuration' : 'Slack Configuration'}
                            </DialogDescription>
                        </DialogHeader>

                        {/* Professional Step Indicators */}
                        <div className="flex items-center justify-between mt-6 mb-2">
                            {[1, 2, 3].map((s) => (
                                <div key={s} className="flex flex-col items-center flex-1 relative gap-2">
                                    {/* Progress Bar Connectors */}
                                    {s !== 1 && (
                                        <div className={`absolute top-3 right-[50%] w-full h-0.5 -z-10 transition-colors duration-500 ease-in-out ${step >= s ? 'bg-primary' : 'bg-muted'}`} />
                                    )}

                                    {/* Step Circle */}
                                    <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 shadow-sm border-2 ${step >= s ? 'bg-primary border-primary text-primary-foreground scale-110' :
                                        'bg-card border-muted text-muted-foreground'
                                        }`}>
                                        {step > s ? '✓' : s}
                                    </div>
                                    <span className={`text-[10px] font-medium tracking-wide uppercase transition-colors ${step >= s ? 'text-foreground' : 'text-muted-foreground/60'}`}>
                                        {s === 1 ? 'Details' : s === 2 ? 'GitHub' : 'Slack'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-card/50">
                        <div className="min-h-[220px] px-8 py-4">
                            {step === 1 && renderStep1()}
                            {step === 2 && renderStep2()}
                            {step === 3 && renderStep3()}
                        </div>
                        <div className="flex justify-between items-center px-6 py-4 border-t border-border bg-card">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => step > 1 ? setStep(step - 1) : setIsEditDialogOpen(false)}
                                className="h-10 px-4 shadow-sm"
                                disabled={isSubmitting}
                            >
                                {step === 1 ? 'Cancel' : <><ChevronLeft className="h-4 w-4 mr-1.5" /> Back</>}
                            </Button>

                            {step < 3 ? (
                                <Button
                                    type="button"
                                    onClick={() => setStep(step + 1)}
                                    disabled={(step === 1 && !isStep1Valid) || isSubmitting}
                                    className="h-10 px-6 shadow-sm"
                                >
                                    Next <ChevronRight className="h-4 w-4 ml-1.5" />
                                </Button>
                            ) : (
                                <Button type="button" onClick={handleEditProject} disabled={isSubmitting} className="h-10 px-6 shadow-sm font-semibold">
                                    {isSubmitting ? (
                                        <div className="flex items-center gap-2">
                                            <div className="h-4 w-4 border-2 border-background border-r-transparent rounded-full animate-spin" />
                                            Saving...
                                        </div>
                                    ) : 'Save Changes'}
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog >

            {/* Assign Employees Dialog */}
            <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Assign Employees to {currentProject?.name}</DialogTitle>
                        <DialogDescription>
                            Select the team members you want to assign to this project.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 max-h-[400px] overflow-y-auto space-y-4 pr-2">
                        {employees.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                                You do not have any direct reports to assign.
                            </div>
                        ) : (
                            employees.map(emp => {
                                const isAssigned = formData.assignedEmployees.includes(emp._id);
                                return (
                                    <div
                                        key={emp._id}
                                        className={`flex items-center space-x-3 space-y-0 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors ${isAssigned ? 'border-primary/50 bg-primary/5' : 'border-border'
                                            }`}
                                        onClick={() => toggleEmployee(emp._id)}
                                    >
                                        <Checkbox
                                            checked={isAssigned}
                                            onCheckedChange={() => toggleEmployee(emp._id)}
                                            className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                                        />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium leading-none">{emp.name}</p>
                                            <p className="text-xs text-muted-foreground mt-1">{emp.email}</p>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-border mt-2">
                        <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveAssignments} disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : 'Save Assignments'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div >
    );
}
