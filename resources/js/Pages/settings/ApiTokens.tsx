import { Head, router, useForm } from '@inertiajs/react';
import { CheckCircle, Copy, Info, Key, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Settings', href: '/settings/profile' },
    { title: 'API Tokens', href: '/settings/api-tokens' },
];

interface Token {
    id: number;
    name: string;
    last_used: string | null;
    created_at: string;
}

interface Props {
    tokens: Token[];
    newToken?: string | null;
    status?: string | null;
}

export default function ApiTokens({ tokens, newToken, status }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({ name: '' });
    const [copied, setCopied] = useState(false);
    const tokenRef = useRef<HTMLInputElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/settings/api-tokens', { onSuccess: () => reset() });
    };

    const handleRevoke = (id: number, name: string) => {
        if (!window.confirm(`Revoke token "${name}"? This cannot be undone.`)) return;
        router.delete(`/settings/api-tokens/${id}`, { preserveScroll: true });
    };

    const copyToken = () => {
        if (newToken) {
            navigator.clipboard.writeText(newToken);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="API Tokens" />
            <SettingsLayout>
                <div className="space-y-8">
                    <Heading
                        title="API Tokens"
                        description="Tokens let external apps authenticate with the PawsConnect API."
                    />

                    {/* Newly created token — shown only once */}
                    {newToken && (
                        <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
                            <div className="mb-2 flex items-center gap-2 text-green-800 dark:text-green-200">
                                <CheckCircle className="h-4 w-4 shrink-0" />
                                <span className="text-sm font-medium">{status}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Input
                                    ref={tokenRef}
                                    readOnly
                                    value={newToken}
                                    className="font-mono text-xs"
                                    onFocus={(e) => e.target.select()}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={copyToken}
                                    className="shrink-0"
                                >
                                    <Copy className="mr-1.5 h-3.5 w-3.5" />
                                    {copied ? 'Copied!' : 'Copy'}
                                </Button>
                            </div>
                        </div>
                    )}

                    {status && !newToken && (
                        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
                            <Info className="h-4 w-4 shrink-0" />
                            {status}
                        </div>
                    )}

                    {/* Create new token */}
                    <div className="rounded-xl border border-border bg-card p-6">
                        <h2 className="mb-1 text-base font-semibold">Create new token</h2>
                        <p className="mb-4 text-sm text-muted-foreground">
                            Give your token a descriptive name so you can identify it later.
                        </p>
                        <form onSubmit={handleSubmit} className="flex items-end gap-3">
                            <div className="flex-1">
                                <Label htmlFor="token-name" className="mb-1.5 block text-sm">
                                    Token name
                                </Label>
                                <Input
                                    id="token-name"
                                    placeholder="e.g. My Mobile App"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    maxLength={80}
                                />
                                <InputError message={errors.name} className="mt-1" />
                            </div>
                            <Button type="submit" disabled={processing || !data.name.trim()}>
                                {processing ? 'Creating…' : 'Create Token'}
                            </Button>
                        </form>
                    </div>

                    {/* Token list */}
                    <div className="rounded-xl border border-border bg-card">
                        <div className="border-b border-border px-6 py-4">
                            <h2 className="text-base font-semibold">
                                Your tokens
                                {tokens.length > 0 && (
                                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                                        ({tokens.length}/10)
                                    </span>
                                )}
                            </h2>
                        </div>
                        {tokens.length === 0 ? (
                            <div className="flex flex-col items-center py-12 text-center text-muted-foreground">
                                <Key className="mb-3 h-10 w-10 opacity-40" />
                                <p className="text-sm">No API tokens yet.</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-border">
                                {tokens.map((token) => (
                                    <li key={token.id} className="flex items-center justify-between gap-4 px-6 py-4">
                                        <div>
                                            <p className="text-sm font-medium">{token.name}</p>
                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                Created {token.created_at}
                                                {token.last_used
                                                    ? ` · Last used ${token.last_used}`
                                                    : ' · Never used'}
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                            onClick={() => handleRevoke(token.id, token.name)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Usage guide */}
                    <div className="rounded-xl border border-border bg-muted/30 p-6">
                        <h2 className="mb-3 text-sm font-semibold">Using your token</h2>
                        <p className="mb-3 text-sm text-muted-foreground">
                            Include your token as a Bearer token in the Authorization header:
                        </p>
                        <pre className="overflow-x-auto rounded-lg bg-card p-3 text-xs">
                            {`curl https://yourdomain.com/api/v1/user \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Accept: application/json"`}
                        </pre>
                        <p className="mt-3 text-xs text-muted-foreground">
                            See the{' '}
                            <a href="/docs/API.md" className="underline hover:text-foreground">
                                API documentation
                            </a>{' '}
                            for all available endpoints.
                        </p>
                    </div>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
