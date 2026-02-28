import { Head, Link, usePage } from '@inertiajs/react';
import { Calendar, CheckCircle, Info, Mail, Settings, User, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Profile',
        href: '/profile',
    },
];

export default function Profile() {
    const props = usePage().props;
    const { auth, status } = props as { 
        auth?: { user?: { 
            name: string; 
            email: string; 
            created_at: string; 
            email_verified_at?: string 
        } }; 
        status?: string;
    };
    
    const [showStatus, setShowStatus] = useState(!!status);

    useEffect(() => {
        if (status) {
            const timer = setTimeout(() => {
                setShowStatus(false);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [status]);

    const user = auth?.user;

    // Debug log
    console.log('Profile Page Props:', { auth, user, status });

    if (!user) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="My Profile" />
                <div className="flex items-center justify-center p-8">
                    <div className="text-center">
                        <p className="text-muted-foreground mb-4">Unable to load profile. Please try logging in again.</p>
                        <p className="text-xs text-gray-500">Auth data: {JSON.stringify(auth)}</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    // Format the date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Profile" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-8">
                <div className="mx-auto w-full max-w-6xl">
                    <div className="mb-6">
                        <h1 className="text-4xl font-serif">My Profile</h1>
                        <p className="text-muted-foreground mt-2">Manage your account and track your adoption applications</p>
                    </div>

                    {showStatus && status && (
                        <div className={`mb-6 rounded-lg border p-4 ${
                            status.includes('No changes')
                                ? 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200'
                                : 'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200'
                        }`}>
                            <div className="flex items-center gap-3">
                                {status.includes('No changes') ? (
                                    <Info className="h-5 w-5" />
                                ) : (
                                    <CheckCircle className="h-5 w-5" />
                                )}
                                <p className="font-medium">{status}</p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left profile card */}
                        <div className="rounded-xl border border-sidebar-border/70 bg-card p-6">
                            <div className="flex flex-col items-center text-center">
                                <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                    <User className="h-12 w-12" />
                                </div>
                                <h2 className="text-xl font-semibold">{user.name}</h2>
                                <p className="text-sm text-muted-foreground mt-2">{user.email}</p>

                                <div className="my-4 w-full border-t pt-4 text-sm text-muted-foreground">
                                    <div className="mb-2">Joined {formatDate(user.created_at)}</div>
                                    <div>0 applications</div>
                                </div>

                                <div className="w-full space-y-3">
                                    <Link href="/settings/profile">
                                        <Button className="w-full" variant="ghost">Update Preferences</Button>
                                    </Link>
                                    <Link href="/pets">
                                        <Button className="w-full" variant="outline">Browse Pets</Button>
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Right applications card */}
                        <div className="lg:col-span-2 rounded-xl border border-sidebar-border/70 bg-card p-8">
                            <h3 className="mb-6 text-lg font-semibold">My Applications</h3>
                            <div className="flex flex-col items-center justify-center py-12">
                                <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
                                <h4 className="mb-1 text-lg font-medium">No applications yet</h4>
                                <p className="text-sm text-muted-foreground mb-6">Take the quiz to find your perfect pet match!</p>
                                <Link href="/quiz">
                                    <Button className="shadow-md bg-primary text-white">Find My Match</Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
