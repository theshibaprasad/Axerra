import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SetupAccountPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">Setup Your Account</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Create a password to access the SaaS Dashboard.
                    </p>
                </div>
                <form className="mt-8 space-y-6" action="#">
                    <div className="space-y-4 rounded-md shadow-sm">
                        <div>
                            <Label htmlFor="password">New Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="mt-1"
                                placeholder="Enter password"
                            />
                        </div>
                        <div>
                            <Label htmlFor="confirm-password">Confirm Password</Label>
                            <Input
                                id="confirm-password"
                                name="confirm-password"
                                type="password"
                                required
                                className="mt-1"
                                placeholder="Confirm password"
                            />
                        </div>
                    </div>

                    <div>
                        <Button type="submit" className="w-full">
                            Set Password & Login
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
