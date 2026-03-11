'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, ShieldIcon, ZapIcon } from 'lucide-react';

const schema = z.object({
    email: z.string().email({ message: 'Invalid email address' }),
    password: z.string().min(1, { message: 'Password is required' }),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data: FormData) => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Something went wrong');
            }

            toast.success('Login successful! Redirecting...');

            if (result.role === 'manager') {
                router.push('/manager-dashboard');
            } else {
                router.push('/dashboard');
            }
        } catch (error) {
            toast.error((error as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full bg-background relative overflow-hidden">
            {/* Left side - Branded split */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-primary/5 flex-col justify-between p-12 border-r border-border">
                {/* Decorative blob */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden blur-3xl opacity-30 pointer-events-none z-0">
                    <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-primary/20 mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
                    <div className="absolute top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-blue-400/20 mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
                    <div className="absolute -bottom-[20%] left-[20%] w-[70%] h-[70%] rounded-full bg-purple-400/20 mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
                </div>

                <div className="z-10 relative">
                    <Link href="/" className="flex items-center w-max">
                        <div className="text-4xl font-bold">
                            <span className="text-primary">Axerra</span>
                        </div>
                    </Link>
                </div>

                <div className="space-y-8 z-10 relative max-w-md">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-4"
                    >
                        <h1 className="text-4xl font-bold tracking-tight text-foreground leading-tight">
                            Welcome back to your comprehensive dashboard
                        </h1>
                        <p className="text-lg text-muted-foreground">
                            Sign in to access your data, connect new services, and manage your team efficiently.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="space-y-4 pt-4"
                    >
                        <div className="flex gap-3 items-center">
                            <div className="bg-primary/10 p-2 rounded-full text-primary">
                                <ZapIcon size={20} />
                            </div>
                            <span className="text-foreground font-medium">Lightning fast integrations</span>
                        </div>
                        <div className="flex gap-3 items-center">
                            <div className="bg-primary/10 p-2 rounded-full text-primary">
                                <ShieldIcon size={20} />
                            </div>
                            <span className="text-foreground font-medium">Enterprise-grade security</span>
                        </div>
                        <div className="flex gap-3 items-center">
                            <div className="bg-primary/10 p-2 rounded-full text-primary">
                                <CheckCircle2 size={20} />
                            </div>
                            <span className="text-foreground font-medium">Seamless team collaboration</span>
                        </div>
                    </motion.div>
                </div>

                <div className="z-10 relative mt-12 text-sm text-muted-foreground">
                    &copy; {new Date().getFullYear()} Axerra Inc. All rights reserved.
                </div>
            </div>

            {/* Right side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10">
                <div className="absolute top-6 left-1/2 -translate-x-1/2 lg:hidden z-20">
                    <Link href="/" className="flex items-center">
                        <div className="text-2xl font-bold">
                            <span className="text-primary">Axerra</span>
                        </div>
                    </Link>
                </div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="w-full max-w-md space-y-8 bg-card/50 backdrop-blur-xl p-8 sm:p-10 rounded-3xl border border-border/50 shadow-2xl"
                >
                    <div className="text-center space-y-2">
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">
                            Sign in
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Enter your credentials to access your account
                        </p>
                    </div>

                    <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@company.com"
                                    disabled={isLoading}
                                    {...register('email')}
                                    className="h-12 bg-background/50 backdrop-blur-sm border-border/60 focus-visible:ring-primary/40 rounded-xl"
                                />
                                {errors.email && (
                                    <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                                        <span className="w-1 h-1 rounded-full bg-destructive"></span>
                                        {errors.email.message}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                                    <Link href="#" className="text-xs font-medium text-primary hover:underline underline-offset-4">
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter your password"
                                        disabled={isLoading}
                                        {...register('password')}
                                        className="h-12 bg-background/50 backdrop-blur-sm border-border/60 focus-visible:ring-primary/40 rounded-xl pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M2 12s3 7 10 7 10-7 10-7" />
                                                <path d="M12 19v3" />
                                                <path d="M5.5 16.5 3.1 18.9" />
                                                <path d="M18.5 16.5 20.9 18.9" />
                                                <path d="M8.5 18l-1.5 2.5" />
                                                <path d="M15.5 18l1.5 2.5" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                                        <span className="w-1 h-1 rounded-full bg-destructive"></span>
                                        {errors.password.message}
                                    </p>
                                )}
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 rounded-xl text-md font-medium shadow-md group relative overflow-hidden"
                            disabled={isLoading}
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                {isLoading ? 'Signing in...' : 'Sign in'}
                                {!isLoading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                            </span>
                            {/* Button shine effect */}
                            <div className="absolute inset-0 -translate-x-full group-hover:animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                        </Button>

                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-border/60"></div>
                            </div>
                            <div className="relative flex justify-center text-xs">
                                <span className="bg-card px-4 text-muted-foreground font-medium rounded-full">Or continue with</span>
                            </div>
                        </div>

                        <div className="flex w-full">
                            <Button variant="outline" type="button" className="w-full h-11 rounded-xl bg-background/30 hover:bg-background/80 border-border/60 hover:text-foreground">
                                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                Continue with Google
                            </Button>
                        </div>

                        <p className="mt-8 text-center text-sm text-muted-foreground pt-2">
                            Don't have an account?{' '}
                            <Link href="/register" className="font-semibold text-primary hover:text-primary/80 transition-colors">
                                Sign Up
                            </Link>
                        </p>
                    </form>
                </motion.div>
            </div>
        </div>
    );
}
