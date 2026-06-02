import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, CheckCircle, Settings } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Profile', href: '/profile' },
    { title: 'Adoption Preferences', href: '/profile/preferences' },
];

const HOME_TYPES = [
    { value: 'apartment', label: 'Apartment', description: 'Small or shared living space' },
    { value: 'house', label: 'House', description: 'Private home with rooms' },
    { value: 'farm', label: 'Farm', description: 'Rural property with land' },
    { value: 'other', label: 'Other', description: 'Another type of home' },
];

const ACTIVITY_LEVELS = [
    { value: 'low', label: 'Low', description: 'Calm walks and light play' },
    { value: 'moderate', label: 'Moderate', description: 'Regular walks and daily play' },
    { value: 'high', label: 'High', description: 'Running, hiking, very active' },
];

const EXPERIENCE_LEVELS = [
    { value: 'first_time', label: 'First-time owner', description: "I've never had a pet before" },
    { value: 'some_experience', label: 'Some experience', description: "I've cared for pets before" },
    { value: 'experienced', label: 'Experienced', description: 'Long-time pet owner' },
];

const SPECIES_OPTIONS = ['Dog', 'Cat', 'Rabbit', 'Bird', 'Other'];
const SIZE_OPTIONS    = ['Small', 'Medium', 'Large', 'Extra Large'];

const YARD_OPTIONS: { value: boolean | null; label: string }[] = [
    { value: true,  label: 'Yes, I have a yard' },
    { value: false, label: 'No yard' },
    { value: null,  label: "I'm not sure" },
];

interface Profile {
    home_type: string | null;
    has_yard: boolean | null;
    activity_level: string | null;
    experience_level: string | null;
    preferred_species: string[];
    preferred_size: string[];
}

interface Props {
    profile: Profile | null;
    status?: string;
}

type FormData = {
    home_type: string;
    has_yard: boolean | null;
    activity_level: string;
    experience_level: string;
    preferred_species: string[];
    preferred_size: string[];
};

export default function Preferences({ profile, status }: Props) {
    const { data, setData, put, processing } = useForm<FormData>({
        home_type:         profile?.home_type ?? '',
        has_yard:          profile?.has_yard ?? null,
        activity_level:    profile?.activity_level ?? '',
        experience_level:  profile?.experience_level ?? '',
        preferred_species: profile?.preferred_species ?? [],
        preferred_size:    profile?.preferred_size ?? [],
    });

    const toggleArray = (key: 'preferred_species' | 'preferred_size', value: string) => {
        const current = data[key];
        setData(key, current.includes(value) ? current.filter(v => v !== value) : [...current, value]);
    };

    const toggleSingle = (key: 'home_type' | 'activity_level' | 'experience_level', value: string) => {
        setData(key, data[key] === value ? '' : value);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put('/profile/preferences');
    };

    const selectionClass = (active: boolean) =>
        `rounded-lg border text-left transition-colors p-4 ${
            active
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/40'
        }`;

    const chipClass = (active: boolean) =>
        `rounded-lg border text-sm font-medium py-3 px-4 transition-colors ${
            active
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border hover:border-primary/40'
        }`;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Adoption Preferences" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-8">
                <div className="mx-auto w-full max-w-2xl">
                    <div className="mb-6">
                        <Link
                            href="/profile"
                            className="mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Profile
                        </Link>
                        <h1 className="flex items-center gap-3 text-3xl font-serif">
                            <Settings className="h-7 w-7 text-primary" />
                            Adoption Preferences
                        </h1>
                        <p className="mt-2 text-muted-foreground">
                            Tell us about your lifestyle so we can show you pets that are a great fit.
                        </p>
                    </div>

                    {status && (
                        <div className="mb-6 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
                            <CheckCircle className="h-5 w-5 shrink-0" />
                            <p className="font-medium">{status}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Preferred Species */}
                        <div className="rounded-xl border border-border bg-card p-6">
                            <h2 className="text-lg font-semibold">Preferred Species</h2>
                            <p className="mt-1 text-sm text-muted-foreground mb-4">
                                Which types of pets are you open to adopting?
                            </p>
                            <div className="grid grid-cols-3 gap-3">
                                {SPECIES_OPTIONS.map(species => (
                                    <button
                                        key={species}
                                        type="button"
                                        onClick={() => toggleArray('preferred_species', species)}
                                        className={chipClass(data.preferred_species.includes(species))}
                                    >
                                        {species}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Preferred Size */}
                        <div className="rounded-xl border border-border bg-card p-6">
                            <h2 className="text-lg font-semibold">Preferred Size</h2>
                            <p className="mt-1 text-sm text-muted-foreground mb-4">
                                What size of pet fits your home?
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                {SIZE_OPTIONS.map(size => (
                                    <button
                                        key={size}
                                        type="button"
                                        onClick={() => toggleArray('preferred_size', size)}
                                        className={chipClass(data.preferred_size.includes(size))}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Home Type */}
                        <div className="rounded-xl border border-border bg-card p-6">
                            <h2 className="text-lg font-semibold">Home Type</h2>
                            <p className="mt-1 text-sm text-muted-foreground mb-4">
                                What kind of place do you live in?
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                {HOME_TYPES.map(type => (
                                    <button
                                        key={type.value}
                                        type="button"
                                        onClick={() => toggleSingle('home_type', type.value)}
                                        className={selectionClass(data.home_type === type.value)}
                                    >
                                        <div className={`text-sm font-medium ${data.home_type === type.value ? 'text-primary' : ''}`}>
                                            {type.label}
                                        </div>
                                        <div className="mt-0.5 text-xs text-muted-foreground">
                                            {type.description}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Has Yard */}
                        <div className="rounded-xl border border-border bg-card p-6">
                            <h2 className="text-lg font-semibold">Do you have a yard?</h2>
                            <p className="mt-1 text-sm text-muted-foreground mb-4">
                                Some pets need outdoor space to thrive.
                            </p>
                            <div className="flex gap-3">
                                {YARD_OPTIONS.map(option => (
                                    <button
                                        key={String(option.value)}
                                        type="button"
                                        onClick={() => setData('has_yard', option.value)}
                                        className={chipClass(data.has_yard === option.value)}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Activity Level */}
                        <div className="rounded-xl border border-border bg-card p-6">
                            <h2 className="text-lg font-semibold">Activity Level</h2>
                            <p className="mt-1 text-sm text-muted-foreground mb-4">
                                How active is your lifestyle?
                            </p>
                            <div className="space-y-3">
                                {ACTIVITY_LEVELS.map(level => (
                                    <button
                                        key={level.value}
                                        type="button"
                                        onClick={() => toggleSingle('activity_level', level.value)}
                                        className={`w-full ${selectionClass(data.activity_level === level.value)}`}
                                    >
                                        <div className={`text-sm font-medium ${data.activity_level === level.value ? 'text-primary' : ''}`}>
                                            {level.label}
                                        </div>
                                        <div className="mt-0.5 text-xs text-muted-foreground">
                                            {level.description}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Experience Level */}
                        <div className="rounded-xl border border-border bg-card p-6">
                            <h2 className="text-lg font-semibold">Experience with Pets</h2>
                            <p className="mt-1 text-sm text-muted-foreground mb-4">
                                How much experience do you have as a pet owner?
                            </p>
                            <div className="space-y-3">
                                {EXPERIENCE_LEVELS.map(level => (
                                    <button
                                        key={level.value}
                                        type="button"
                                        onClick={() => toggleSingle('experience_level', level.value)}
                                        className={`w-full ${selectionClass(data.experience_level === level.value)}`}
                                    >
                                        <div className={`text-sm font-medium ${data.experience_level === level.value ? 'text-primary' : ''}`}>
                                            {level.label}
                                        </div>
                                        <div className="mt-0.5 text-xs text-muted-foreground">
                                            {level.description}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end pb-4">
                            <Button type="button" variant="outline" asChild>
                                <Link href="/pets">Browse Pets</Link>
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Saving…' : 'Save Preferences'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
