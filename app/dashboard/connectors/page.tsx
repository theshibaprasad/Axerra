"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Zap, RefreshCw, Users, ShieldAlert, CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function ConnectorsPage() {
  const [loading, setLoading] = useState(false);
  const [fetchingTeams, setFetchingTeams] = useState(false);

  // Dialog Open States
  const [isGithubOpen, setIsGithubOpen] = useState(false);
  const [isSlackOpen, setIsSlackOpen] = useState(false);

  const [config, setConfig] = useState({
    github: { org: "", token: "" },
    slack: { botToken: "", inviteLink: "" },
  });

  const [status, setStatus] = useState({
    github: false,
    slack: false,
  });

  const [githubTeams, setGithubTeams] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/connectors")
      .then((res) => res.json())
      .then((data) => {
        if (data.github) {
          setConfig((prev) => ({
            ...prev,
            github: { ...prev.github, org: data.github.org || "" },
          }));
          setStatus((prev) => ({ ...prev, github: data.github.isConfigured }));
        }
        if (data.slack) {
          setConfig((prev) => ({
            ...prev,
            slack: { ...prev.slack, inviteLink: data.slack.inviteLink || "" },
          }));
          setStatus((prev) => ({ ...prev, slack: data.slack.isConfigured }));
        }
      });
  }, []);

  const handleSave = async (section: "github" | "slack") => {
    setLoading(true);
    try {
      const payload: any = {};
      if (section === "github") payload.github = config.github;
      if (section === "slack") payload.slack = config.slack;

      const res = await fetch("/api/connectors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save");

      toast.success(
        `${section.charAt(0).toUpperCase() + section.slice(1)} configuration saved!`,
      );

      setStatus((prev) => ({ ...prev, [section]: true }));

      // Close modal
      if (section === "github") setIsGithubOpen(false);
      if (section === "slack") setIsSlackOpen(false);

    } catch (error) {
      toast.error("Failed to save configuration");
    } finally {
      setLoading(false);
    }
  };

  const fetchGithubTeams = async () => {
    // Deprecated fetch based on user request to remove teams sync block
  };

  const comingSoonConnectors = [
    {
      name: "Jira",
      description: "Sync IT tickets and user provisioning with Jira Service Desk.",
      icon: "jira",
    },
    {
      name: "Workday",
      description: "Automate onboarding from Workday HRIS.",
      icon: "workday",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-primary/80 to-primary p-[2px] shadow-sm">
            <div className="h-full w-full bg-card rounded-[10px] flex items-center justify-center">
              <Zap className="h-6 w-6 text-primary" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Connectors</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage integrations with your identity providers and tools</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

        {/* GitHub Connector Card -> Triggers Dialog */}
        <Dialog open={isGithubOpen} onOpenChange={setIsGithubOpen}>
          <DialogTrigger asChild>
            <Card className="flex flex-col relative overflow-hidden group shadow-sm hover:shadow-md transition-all duration-300 border-border/60 cursor-pointer hover:border-primary/40">
              <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-300 pointer-events-none">
                <svg viewBox="0 0 24 24" className="w-24 h-24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </div>
              <CardHeader className="relative z-10 pb-4 h-full">
                <CardTitle className="flex justify-between items-center text-lg">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center border border-primary/20">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 text-primary" fill="currentColor">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                      </svg>
                    </div>
                    <span className="font-semibold">GitHub</span>
                  </div>
                  {status.github ? (
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>Active
                    </span>
                  ) : (
                    <span className="text-[10px] bg-muted text-muted-foreground border border-border px-2 py-0.5 rounded-full font-medium">Not Configured</span>
                  )}
                </CardTitle>
                <CardDescription className="pt-2 text-[13px] leading-snug">
                  Manage organization access, sync teams, and automate workflow.
                </CardDescription>

                <div className="mt-8 flex items-center text-xs font-semibold text-primary group-hover:underline w-full justify-between">
                  <span>Configure Integration</span>
                  <span className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">→</span>
                </div>
              </CardHeader>
            </Card>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <svg viewBox="0 0 24 24" className="w-6 h-6 border rounded-sm p-1" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                GitHub Configuration
              </DialogTitle>
              <DialogDescription>
                Authenticate your GitHub organization to manage identities and settings.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="font-medium text-sm">Organization Name</Label>
                <Input
                  placeholder="e.g. Acme-Corp"
                  value={config.github.org}
                  onChange={(e) => setConfig({ ...config, github: { ...config.github, org: e.target.value } })}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-medium text-sm">Personal Access Token</Label>
                <Input
                  type="password"
                  placeholder="••••••••••••••••"
                  value={config.github.token}
                  onChange={(e) => setConfig({ ...config, github: { ...config.github, token: e.target.value } })}
                />
                <p className="text-[11px] text-muted-foreground pt-1 flex items-start gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 mt-0.5 text-orange-500/80 shrink-0" />
                  Requires `admin:org` scoped access to interact with GitHub APIs.
                </p>
              </div>
            </div>

            <DialogFooter>
              <div className="flex gap-2 w-full pt-4 border-t border-border mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setIsGithubOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => handleSave('github')}
                  disabled={loading || !config.github.org}
                >
                  {loading ? 'Saving...' : 'Authorize GitHub'}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>


        {/* Slack Connector Card -> Triggers Dialog */}
        <Dialog open={isSlackOpen} onOpenChange={setIsSlackOpen}>
          <DialogTrigger asChild>
            <Card className="flex flex-col relative overflow-hidden group shadow-sm hover:shadow-md transition-all duration-300 border-border/60 cursor-pointer hover:border-[#E01E5A]/30">
              <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-300 pointer-events-none text-[#E01E5A]">
                <svg viewBox="0 0 24 24" className="w-24 h-24" fill="currentColor">
                  <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.523-2.522v-2.522h2.523zM15.165 17.688a2.527 2.527 0 0 1-2.523-2.523 2.526 2.526 0 0 1 2.523-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.52H15.165z" />
                </svg>
              </div>
              <CardHeader className="relative z-10 pb-4 h-full">
                <CardTitle className="flex justify-between items-center text-lg">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-md bg-[#E01E5A]/10 flex items-center justify-center border border-[#E01E5A]/20">
                      <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#E01E5A]" fill="currentColor">
                        <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.523-2.522v-2.522h2.523zM15.165 17.688a2.527 2.527 0 0 1-2.523-2.523 2.526 2.526 0 0 1 2.523-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.52H15.165z" />
                      </svg>
                    </div>
                    <span className="font-semibold">Slack</span>
                  </div>
                  {status.slack ? (
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>Active
                    </span>
                  ) : (
                    <span className="text-[10px] bg-muted text-muted-foreground border border-border px-2 py-0.5 rounded-full font-medium">Not Configured</span>
                  )}
                </CardTitle>
                <CardDescription className="pt-2 text-[13px] leading-snug">
                  Real-time notifications, access requests, and approval workflows.
                </CardDescription>

                <div className="mt-8 flex items-center text-xs font-semibold text-[#E01E5A] group-hover:underline w-full justify-between">
                  <span>Configure Integration</span>
                  <span className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">→</span>
                </div>
              </CardHeader>
            </Card>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <svg viewBox="0 0 24 24" className="w-6 h-6 border rounded-sm p-1" fill="currentColor">
                  <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.523-2.522v-2.522h2.523zM15.165 17.688a2.527 2.527 0 0 1-2.523-2.523 2.526 2.526 0 0 1 2.523-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.52H15.165z" />
                </svg>
                Slack Configuration
              </DialogTitle>
              <DialogDescription>
                Provide your Slack App's Bot Token to begin sending alerts to channels.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="font-medium text-sm">Workspace Invitation Link<span className="text-muted-foreground font-normal ml-1">(Optional)</span></Label>
                <Input
                  placeholder="https://join.slack.com/t/.../shared_invite/..."
                  value={config.slack.inviteLink}
                  onChange={(e) => setConfig({ ...config, slack: { ...config.slack, inviteLink: e.target.value } })}
                />
                <p className="text-[11px] text-muted-foreground pt-1 leading-tight">
                  Provide a permanent invitation link so new hires can easily join your Slack workspace directly from their dashboard.
                </p>
              </div>

              <div className="space-y-2">
                <Label className="font-medium text-sm">Bot User OAuth Token</Label>
                <Input
                  type="password"
                  placeholder="xoxb-••••••••"
                  value={config.slack.botToken}
                  onChange={(e) => setConfig({ ...config, slack: { ...config.slack, botToken: e.target.value } })}
                />
                <p className="text-[11px] text-muted-foreground pt-1 leading-tight">
                  You can obtain this from the "OAuth & Permissions" tab of your Slack App configuration dashboard. Look for tokens starting with `xoxb-`.
                </p>
              </div>
            </div>

            <DialogFooter>
              <div className="flex gap-2 w-full pt-4 border-t border-border mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setIsSlackOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="w-full bg-[#E01E5A] hover:bg-[#E01E5A]/90 text-white shadow-sm"
                  onClick={() => handleSave('slack')}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Authorize Slack'}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Coming Soon Connectors Placeholder */}
        {comingSoonConnectors.map((connector) => (
          <Card
            key={connector.name}
            className="flex flex-col opacity-60 bg-muted/30 border-dashed border-border/60"
          >
            <CardHeader className="pb-4">
              <CardTitle className="flex justify-between items-center text-lg">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-md bg-secondary/50 flex items-center justify-center border border-border/50">
                    <div className="w-4 h-4 rounded-full bg-muted-foreground/20"></div>
                  </div>
                  <span className="font-semibold text-muted-foreground">
                    {connector.name}
                  </span>
                </div>
                <span className="text-[10px] bg-secondary text-secondary-foreground border border-border px-2 py-0.5 rounded-full font-medium">
                  Coming Soon
                </span>
              </CardTitle>
              <CardDescription className="pt-2 text-[13px] leading-snug">
                {connector.description}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}

