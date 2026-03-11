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
import { ArrowRight, CheckCircle2, ShieldIcon, ZapIcon, BarChart3Icon } from 'lucide-react';

const schema = z.object({
    name: z.string().min(2, { message: 'Company name must be at least 2 characters' }),
    email: z.string().email({ message: 'Invalid email address' }),
    phone: z.string().min(10, { message: 'Phone number must be at least 10 characters' }),
    password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
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
            const response = await fetch('/api/auth/register', {
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

            toast.success('Registration successful! Redirecting...');
            router.push('/dashboard');
        } catch (error) {
            toast.error((error as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full bg-background relative overflow-hidden">
            {/* Left side - Branded split */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-primary/5 flex-col justify-between p-8 xl:p-12 border-r border-border">
                {/* Decorative blob */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden blur-3xl opacity-30 pointer-events-none z-0">
                    <div className="absolute top-[10%] -left-[10%] w-[70%] h-[70%] rounded-full bg-indigo-400/20 mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
                    <div className="absolute top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-primary/20 mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
                    <div className="absolute -bottom-[20%] left-[20%] w-[70%] h-[70%] rounded-full bg-pink-400/20 mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
                </div>

                <div className="z-10 relative">
                    <Link href="/" className="flex items-center w-max">
                        <div className="text-4xl font-bold">
                            <span className="text-primary">Axerra</span>
                        </div>
                    </Link>
                </div>

                <div className="space-y-6 z-10 relative max-w-md my-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-3"
                    >
                        <h1 className="text-3xl xl:text-4xl font-bold tracking-tight text-foreground leading-tight">
                            Create your company workspace
                        </h1>
                        <p className="text-base text-muted-foreground leading-relaxed">
                            Join thousands of teams who use Axerra to manage their daily operations and scale their businesses.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="grid grid-cols-2 gap-5 pt-2"
                    >
                        <div className="space-y-1.5">
                            <div className="bg-primary/10 p-1.5 rounded-lg w-fit text-primary mb-1">
                                <BarChart3Icon size={18} />
                            </div>
                            <h3 className="font-medium text-sm text-foreground">Advanced Analytics</h3>
                            <p className="text-xs text-muted-foreground leading-snug">Gain deep insights into your team's performance.</p>
                        </div>
                        <div className="space-y-1.5">
                            <div className="bg-primary/10 p-1.5 rounded-lg w-fit text-primary mb-1">
                                <ShieldIcon size={18} />
                            </div>
                            <h3 className="font-medium text-sm text-foreground">Enterprise Security</h3>
                            <p className="text-xs text-muted-foreground leading-snug">Bank-grade encryption for all your company data.</p>
                        </div>
                    </motion.div>
                </div>

                <div className="z-10 relative text-xs text-muted-foreground flex justify-between items-center pr-12">
                    <span>&copy; {new Date().getFullYear()} Axerra Inc.</span>
                    <div className="flex gap-4">
                        <Link href="#" className="hover:text-foreground transition-colors">Privacy</Link>
                        <Link href="#" className="hover:text-foreground transition-colors">Terms</Link>
                    </div>
                </div>
            </div>

            {/* Right side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 relative z-10">
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
                    className="w-full max-w-md space-y-6 bg-card/50 backdrop-blur-xl p-6 sm:px-8 sm:py-6 rounded-2xl border border-border/50 shadow-xl my-auto"
                >
                    <div className="text-center space-y-1">
                        <h2 className="text-2xl font-bold tracking-tight text-foreground">
                            Register company
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            Let's get your workspace set up in minutes.
                        </p>
                    </div>

                    <form className="mt-5 space-y-4" onSubmit={handleSubmit(onSubmit)}>
                        <div className="space-y-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="name" className="text-xs font-medium">Company Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="Acme Corp"
                                    disabled={isLoading}
                                    {...register('name')}
                                    className="h-9 text-sm bg-background/50 backdrop-blur-sm border-border/60 focus-visible:ring-primary/40 rounded-lg"
                                />
                                {errors.name && (
                                    <p className="text-[10px] text-destructive flex items-center gap-1 mt-0.5">
                                        <span className="w-1 h-1 rounded-full bg-destructive"></span>
                                        {errors.name.message}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="email" className="text-xs font-medium">Work Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="founder@acme.com"
                                    disabled={isLoading}
                                    {...register('email')}
                                    className="h-9 text-sm bg-background/50 backdrop-blur-sm border-border/60 focus-visible:ring-primary/40 rounded-lg"
                                />
                                {errors.email && (
                                    <p className="text-[10px] text-destructive flex items-center gap-1 mt-0.5">
                                        <span className="w-1 h-1 rounded-full bg-destructive"></span>
                                        {errors.email.message}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="phone" className="text-xs font-medium">Business Phone</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    placeholder="+1 (555) 000-0000"
                                    disabled={isLoading}
                                    {...register('phone')}
                                    className="h-9 text-sm bg-background/50 backdrop-blur-sm border-border/60 focus-visible:ring-primary/40 rounded-lg"
                                />
                                {errors.phone && (
                                    <p className="text-[10px] text-destructive flex items-center gap-1 mt-0.5">
                                        <span className="w-1 h-1 rounded-full bg-destructive"></span>
                                        {errors.phone.message}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="password" className="text-xs font-medium">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Create a strong password"
                                        disabled={isLoading}
                                        {...register('password')}
                                        className="h-9 text-sm bg-background/50 backdrop-blur-sm border-border/60 focus-visible:ring-primary/40 rounded-lg pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M2 12s3 7 10 7 10-7 10-7" />
                                                <path d="M12 19v3" />
                                                <path d="M5.5 16.5 3.1 18.9" />
                                                <path d="M18.5 16.5 20.9 18.9" />
                                                <path d="M8.5 18l-1.5 2.5" />
                                                <path d="M15.5 18l1.5 2.5" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-[10px] text-destructive flex items-center gap-1 mt-0.5">
                                        <span className="w-1 h-1 rounded-full bg-destructive"></span>
                                        {errors.password.message}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="text-[10px] text-muted-foreground pt-1 text-center">
                            By registering, you agree to our{' '}
                            <Link href="#" className="underline underline-offset-2 hover:text-foreground">Terms</Link>
                            {' '}and{' '}
                            <Link href="#" className="underline underline-offset-2 hover:text-foreground">Privacy Policy</Link>.
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-10 rounded-lg text-sm font-medium shadow-sm group relative overflow-hidden mt-2"
                            disabled={isLoading}
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                {isLoading ? 'Creating...' : 'Create workspace'}
                                {!isLoading && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
                            </span>
                            {/* Button shine effect */}
                            <div className="absolute inset-0 -translate-x-full group-hover:animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                        </Button>

                        <div className="relative my-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-border/60"></div>
                            </div>
                            <div className="relative flex justify-center text-[10px]">
                                <span className="bg-card px-3 text-muted-foreground font-medium rounded-full">Or</span>
                            </div>
                        </div>

                        <div className="flex w-full pb-1">
                            <Button variant="outline" type="button" className="w-full h-9 rounded-lg bg-background/30 hover:bg-background/80 border-border/60 hover:text-foreground text-[11px] font-medium">
                                <svg className="w-3.5 h-3.5 mr-1.5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                Continue with Google
                            </Button>
                        </div>
                        <div className="flex justify-center border-t border-border/40 pt-3 mt-2">
                            <p className="text-xs text-muted-foreground">
                                Already have an account?{' '}
                                <Link href="/login" className="font-medium text-primary hover:text-primary/80 transition-colors">
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    </form>
                </motion.div>
            </div>
        </div>
    );
}
