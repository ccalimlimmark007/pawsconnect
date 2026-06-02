import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Home, Users, Clock, BookOpen, Paperclip, ClipboardCheck,
    ChevronLeft, ChevronRight, Plus, Trash2, PawPrint, Check,
    FileText, FileImage, X, AlertCircle, Upload,
} from 'lucide-react';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PetInfo {
    id: string;
    name: string;
    species: string;
    breed: string;
    imageUrl?: string;
    shelterName?: string;
}

interface Reference {
    name: string;
    relationship: string;
    contact: string;
}

interface DocItem {
    uid: string;
    file: File;
    type: string;
    error?: string;
}

interface ApplicationForm {
    pet_id: string;
    home_type: 'house' | 'apartment' | 'condo' | '';
    has_yard: boolean;
    has_children: boolean;
    has_other_pets: boolean;
    other_pets_description: string;
    work_hours_per_day: number | '';
    reason_for_adopting: string;
    prior_pet_experience: string;
    references: Reference[];
}

// ─── Step config ─────────────────────────────────────────────────────────────

const STEPS = [
    { label: 'Your Home',  icon: Home          },
    { label: 'Household',  icon: Users         },
    { label: 'Lifestyle',  icon: Clock         },
    { label: 'References', icon: BookOpen      },
    { label: 'Documents',  icon: Paperclip     },
    { label: 'Review',     icon: ClipboardCheck },
];

const RELATIONSHIPS = ['Friend', 'Family', 'Colleague', 'Veterinarian', 'Neighbour', 'Other'];

const DOC_TYPES: { value: string; label: string }[] = [
    { value: 'government_id',    label: 'Government ID' },
    { value: 'proof_of_income',  label: 'Proof of Income' },
    { value: 'reference_letter', label: 'Reference Letter' },
    { value: 'other',            label: 'Other' },
];

const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
const MAX_SIZE_MB  = 5;
const MAX_FILES    = 5;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const inputClass =
    'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30';
const labelClass = 'block text-sm font-medium mb-1.5';
const errorClass = 'mt-1 text-xs text-destructive';

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DocIcon({ mime }: { mime: string }) {
    if (mime === 'application/pdf') return <FileText className="h-5 w-5 text-red-500" />;
    return <FileImage className="h-5 w-5 text-blue-500" />;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Apply({ petId, pet }: { petId?: string; pet?: PetInfo | null }) {
    const resolvedPetId = petId ?? pet?.id ?? '';
    const errors = (usePage().props as { errors?: Record<string, string> }).errors ?? {};

    const [step, setStep]           = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
    const [documents, setDocuments]   = useState<DocItem[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [form, setForm] = useState<ApplicationForm>({
        pet_id:                 resolvedPetId,
        home_type:              '',
        has_yard:               false,
        has_children:           false,
        has_other_pets:         false,
        other_pets_description: '',
        work_hours_per_day:     '',
        reason_for_adopting:    '',
        prior_pet_experience:   '',
        references:             [{ name: '', relationship: '', contact: '' }],
    });

    // ── Field helpers ──────────────────────────────────────────────────────

    const set = <K extends keyof ApplicationForm>(key: K, value: ApplicationForm[K]) =>
        setForm(prev => ({ ...prev, [key]: value }));

    const setRef = (index: number, field: keyof Reference, value: string) =>
        setForm(prev => {
            const refs = [...prev.references];
            refs[index] = { ...refs[index], [field]: value };
            return { ...prev, references: refs };
        });

    const addRef = () =>
        setForm(prev => ({
            ...prev,
            references: [...prev.references, { name: '', relationship: '', contact: '' }],
        }));

    const removeRef = (index: number) =>
        setForm(prev => ({
            ...prev,
            references: prev.references.filter((_, i) => i !== index),
        }));

    // ── Document helpers ───────────────────────────────────────────────────

    const addFiles = (files: FileList | null) => {
        if (!files) return;
        const newDocs: DocItem[] = [];
        const remaining = MAX_FILES - documents.length;

        Array.from(files).slice(0, remaining).forEach(file => {
            const error = !ALLOWED_MIME.includes(file.type)
                ? 'Only PDF, JPG, and PNG files are allowed.'
                : file.size > MAX_SIZE_MB * 1024 * 1024
                ? `File must be under ${MAX_SIZE_MB} MB.`
                : undefined;

            newDocs.push({
                uid:  `${Date.now()}-${Math.random()}`,
                file,
                type: 'other',
                error,
            });
        });

        setDocuments(prev => [...prev, ...newDocs]);
    };

    const setDocType = (uid: string, type: string) =>
        setDocuments(prev => prev.map(d => d.uid === uid ? { ...d, type } : d));

    const removeDoc = (uid: string) =>
        setDocuments(prev => prev.filter(d => d.uid !== uid));

    // ── Per-step validation ────────────────────────────────────────────────

    const validate = (): boolean => {
        const errs: Record<string, string> = {};

        if (step === 0) {
            if (!form.home_type) errs.home_type = 'Please select a home type.';
        }

        if (step === 1) {
            if (form.has_other_pets && !form.other_pets_description.trim())
                errs.other_pets_description = 'Please describe your other pets.';
        }

        if (step === 2) {
            if (form.work_hours_per_day === '') errs.work_hours_per_day = 'Required.';
            else if ((form.work_hours_per_day as number) < 0 || (form.work_hours_per_day as number) > 24)
                errs.work_hours_per_day = 'Must be between 0 and 24.';
            if (!form.reason_for_adopting.trim())
                errs.reason_for_adopting = 'Please tell us why you want to adopt.';
            else if (form.reason_for_adopting.trim().length < 20)
                errs.reason_for_adopting = 'Please provide at least 20 characters.';
        }

        if (step === 3) {
            const complete = form.references.filter(
                r => r.name.trim() && r.relationship && r.contact.trim(),
            );
            if (complete.length === 0)
                errs['references'] = 'Please complete at least one reference.';
        }

        if (step === 4) {
            const invalid = documents.some(d => !!d.error);
            if (invalid) errs['documents'] = 'Please remove invalid files before continuing.';
        }

        setStepErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const next = () => { if (validate()) setStep(s => s + 1); };
    const back = () => { setStepErrors({}); setStep(s => s - 1); };

    const submit = () => {
        if (!validate()) return;
        setSubmitting(true);

        const cleanRefs = form.references.filter(
            r => r.name.trim() && r.relationship && r.contact.trim(),
        );
        const validDocs = documents.filter(d => !d.error);

        // Inertia detects File objects and uses multipart/form-data automatically
        router.post(
            '/apply/submit',
            {
                pet_id:                  form.pet_id,
                home_type:               form.home_type,
                has_yard:                form.has_yard,
                has_children:            form.has_children,
                has_other_pets:          form.has_other_pets,
                other_pets_description:  form.other_pets_description,
                work_hours_per_day:      form.work_hours_per_day,
                reason_for_adopting:     form.reason_for_adopting,
                prior_pet_experience:    form.prior_pet_experience,
                references:              cleanRefs,
                documents:               validDocs.map(d => d.file),
                document_types:          validDocs.map(d => d.type),
            } as unknown as Record<string, string | number | boolean | File[] | null>,
            { onFinish: () => setSubmitting(false) },
        );
    };

    // ── Sub-components ─────────────────────────────────────────────────────

    const FieldError = ({ name }: { name: string }) => {
        const msg = stepErrors[name] ?? errors[name];
        return msg ? <p className={errorClass}>{msg}</p> : null;
    };

    // ── Render ─────────────────────────────────────────────────────────────

    return (
        <AppLayout>
            <Head title="Adoption Application" />

            <div className="min-h-screen bg-background py-10 px-4">
                <div className="mx-auto max-w-2xl">

                    {/* Pet card */}
                    {pet && (
                        <div className="mb-6 flex items-center gap-4 rounded-xl border border-sidebar-border/70 bg-card p-4">
                            {pet.imageUrl ? (
                                <img src={pet.imageUrl} alt={pet.name} className="h-16 w-16 rounded-lg object-cover shrink-0" />
                            ) : (
                                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-secondary shrink-0">
                                    <PawPrint className="h-8 w-8 text-muted-foreground" />
                                </div>
                            )}
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wide">Applying to adopt</p>
                                <h2 className="text-lg font-semibold">{pet.name}</h2>
                                <p className="text-sm text-muted-foreground">
                                    {pet.breed} · {pet.species}{pet.shelterName ? ` · ${pet.shelterName}` : ''}
                                </p>
                            </div>
                        </div>
                    )}

                    {!resolvedPetId && (
                        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                            No pet selected. <Link href="/pets" className="underline">Browse pets</Link>
                        </div>
                    )}

                    {/* Step progress */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between">
                            {STEPS.map((s, i) => {
                                const Icon    = s.icon;
                                const done    = i < step;
                                const current = i === step;
                                return (
                                    <div key={i} className="flex flex-1 flex-col items-center gap-1">
                                        <div className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors ${
                                            done    ? 'border-primary bg-primary text-primary-foreground'
                                            : current ? 'border-primary bg-background text-primary'
                                            : 'border-border bg-background text-muted-foreground'
                                        }`}>
                                            {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                                        </div>
                                        <span className={`hidden sm:block text-xs font-medium ${current ? 'text-primary' : 'text-muted-foreground'}`}>
                                            {s.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="relative mt-3 h-1 w-full rounded-full bg-border">
                            <div
                                className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-300"
                                style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Form card */}
                    <div className="rounded-xl border border-sidebar-border/70 bg-card p-8">
                        <h1 className="mb-1 text-2xl font-semibold">{STEPS[step].label}</h1>
                        <p className="mb-6 text-sm text-muted-foreground">Step {step + 1} of {STEPS.length}</p>

                        {/* ── Step 0: Your Home ──────────────────────────────────────── */}
                        {step === 0 && (
                            <div className="space-y-6">
                                <div>
                                    <label className={labelClass}>What type of home do you live in? *</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {(['house', 'apartment', 'condo'] as const).map(type => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => set('home_type', type)}
                                                className={`rounded-lg border-2 px-4 py-3 text-sm font-medium capitalize transition-colors ${
                                                    form.home_type === type
                                                        ? 'border-primary bg-primary/10 text-primary'
                                                        : 'border-border hover:border-primary/50'
                                                }`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                    <FieldError name="home_type" />
                                </div>

                                <label className="flex cursor-pointer items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={form.has_yard}
                                        onChange={e => set('has_yard', e.target.checked)}
                                        className="h-4 w-4 rounded border-border accent-primary"
                                    />
                                    <span className="text-sm font-medium">I have a yard or outdoor space</span>
                                </label>
                            </div>
                        )}

                        {/* ── Step 1: Household ──────────────────────────────────────── */}
                        {step === 1 && (
                            <div className="space-y-5">
                                <label className="flex cursor-pointer items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={form.has_children}
                                        onChange={e => set('has_children', e.target.checked)}
                                        className="h-4 w-4 rounded border-border accent-primary"
                                    />
                                    <span className="text-sm font-medium">There are children living in my home</span>
                                </label>

                                <label className="flex cursor-pointer items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={form.has_other_pets}
                                        onChange={e => set('has_other_pets', e.target.checked)}
                                        className="h-4 w-4 rounded border-border accent-primary"
                                    />
                                    <span className="text-sm font-medium">I currently have other pets at home</span>
                                </label>

                                {form.has_other_pets && (
                                    <div>
                                        <label className={labelClass}>Tell us about your other pets *</label>
                                        <textarea
                                            rows={3}
                                            value={form.other_pets_description}
                                            onChange={e => set('other_pets_description', e.target.value)}
                                            placeholder="Species, breeds, ages, temperament…"
                                            className={inputClass}
                                        />
                                        <FieldError name="other_pets_description" />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Step 2: Lifestyle ──────────────────────────────────────── */}
                        {step === 2 && (
                            <div className="space-y-6">
                                <div>
                                    <label className={labelClass}>
                                        How many hours per day are you typically away from home? *
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            min={0}
                                            max={24}
                                            value={form.work_hours_per_day}
                                            onChange={e =>
                                                set('work_hours_per_day', e.target.value === '' ? '' : parseInt(e.target.value))
                                            }
                                            className={`${inputClass} w-28`}
                                            placeholder="0–24"
                                        />
                                        <span className="text-sm text-muted-foreground">hours / day</span>
                                    </div>
                                    <FieldError name="work_hours_per_day" />
                                </div>

                                <div>
                                    <label className={labelClass}>Why do you want to adopt this pet? *</label>
                                    <textarea
                                        rows={4}
                                        value={form.reason_for_adopting}
                                        onChange={e => set('reason_for_adopting', e.target.value)}
                                        placeholder="Share your motivation and what kind of home you can offer…"
                                        className={inputClass}
                                    />
                                    <div className="flex items-center justify-between mt-1">
                                        <FieldError name="reason_for_adopting" />
                                        <span className={`text-xs ml-auto ${form.reason_for_adopting.length < 20 ? 'text-muted-foreground' : 'text-green-600'}`}>
                                            {form.reason_for_adopting.length} / 20 min
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <label className={labelClass}>
                                        Prior experience with pets{' '}
                                        <span className="text-muted-foreground font-normal">(optional)</span>
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={form.prior_pet_experience}
                                        onChange={e => set('prior_pet_experience', e.target.value)}
                                        placeholder="Describe any previous pets you've owned or cared for…"
                                        className={inputClass}
                                    />
                                </div>
                            </div>
                        )}

                        {/* ── Step 3: References ─────────────────────────────────────── */}
                        {step === 3 && (
                            <div className="space-y-5">
                                <p className="text-sm text-muted-foreground">
                                    Provide at least one personal or professional reference who can speak to your ability to care for a pet.
                                </p>

                                <FieldError name="references" />

                                {form.references.map((ref, i) => (
                                    <div key={i} className="rounded-lg border border-border p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-semibold text-muted-foreground">Reference {i + 1}</span>
                                            {form.references.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeRef(i)}
                                                    className="text-destructive hover:text-destructive/80 transition-colors"
                                                    aria-label="Remove reference"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className={labelClass}>Full name *</label>
                                                <input
                                                    type="text"
                                                    value={ref.name}
                                                    onChange={e => setRef(i, 'name', e.target.value)}
                                                    className={inputClass}
                                                    placeholder="Jane Smith"
                                                />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Relationship *</label>
                                                <select
                                                    value={ref.relationship}
                                                    onChange={e => setRef(i, 'relationship', e.target.value)}
                                                    className={inputClass}
                                                >
                                                    <option value="">Select…</option>
                                                    {RELATIONSHIPS.map(r => (
                                                        <option key={r} value={r}>{r}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className={labelClass}>Phone or email *</label>
                                            <input
                                                type="text"
                                                value={ref.contact}
                                                onChange={e => setRef(i, 'contact', e.target.value)}
                                                className={inputClass}
                                                placeholder="(555) 000-0000 or name@example.com"
                                            />
                                        </div>
                                    </div>
                                ))}

                                {form.references.length < 3 && (
                                    <Button type="button" variant="outline" size="sm" onClick={addRef} className="gap-2">
                                        <Plus className="h-4 w-4" />
                                        Add another reference
                                    </Button>
                                )}
                            </div>
                        )}

                        {/* ── Step 4: Documents ──────────────────────────────────────── */}
                        {step === 4 && (
                            <div className="space-y-5">
                                <div className="rounded-lg border border-border/60 bg-secondary/20 px-4 py-3 text-sm text-muted-foreground">
                                    <p className="font-medium text-foreground mb-1">Supporting documents <span className="font-normal text-muted-foreground">(optional)</span></p>
                                    <p>Upload any documents that support your application — government ID, proof of income, reference letters, etc.</p>
                                    <p className="mt-1 text-xs">Accepted: PDF, JPG, PNG · Max {MAX_SIZE_MB} MB per file · Up to {MAX_FILES} files</p>
                                </div>

                                <FieldError name="documents" />

                                {/* Drop zone */}
                                {documents.length < MAX_FILES && (
                                    <div>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            multiple
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            className="sr-only"
                                            onChange={e => addFiles(e.target.files)}
                                            onClick={e => { (e.target as HTMLInputElement).value = ''; }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-full rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-colors px-6 py-8 text-center"
                                        >
                                            <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                                            <p className="text-sm font-medium">Click to choose files</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {MAX_FILES - documents.length} file{MAX_FILES - documents.length !== 1 ? 's' : ''} remaining
                                            </p>
                                        </button>
                                    </div>
                                )}

                                {/* File list */}
                                {documents.length > 0 && (
                                    <div className="space-y-2">
                                        {documents.map(doc => (
                                            <div
                                                key={doc.uid}
                                                className={`flex items-start gap-3 rounded-lg border p-3 ${
                                                    doc.error
                                                        ? 'border-destructive/50 bg-destructive/5'
                                                        : 'border-border bg-background'
                                                }`}
                                            >
                                                <div className="mt-0.5 shrink-0">
                                                    {doc.error
                                                        ? <AlertCircle className="h-5 w-5 text-destructive" />
                                                        : <DocIcon mime={doc.file.type} />
                                                    }
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{doc.file.name}</p>
                                                    <p className="text-xs text-muted-foreground">{formatBytes(doc.file.size)}</p>
                                                    {doc.error && (
                                                        <p className="text-xs text-destructive mt-0.5">{doc.error}</p>
                                                    )}
                                                    {!doc.error && (
                                                        <select
                                                            className="mt-2 rounded-md border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
                                                            value={doc.type}
                                                            onChange={e => setDocType(doc.uid, e.target.value)}
                                                        >
                                                            {DOC_TYPES.map(t => (
                                                                <option key={t.value} value={t.value}>{t.label}</option>
                                                            ))}
                                                        </select>
                                                    )}
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => removeDoc(doc.uid)}
                                                    className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                                                    aria-label="Remove file"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {documents.length === 0 && (
                                    <p className="text-center text-sm text-muted-foreground py-2">
                                        No documents added — you can skip this step.
                                    </p>
                                )}
                            </div>
                        )}

                        {/* ── Step 5: Review ─────────────────────────────────────────── */}
                        {step === 5 && (
                            <div className="space-y-5 text-sm">
                                {Object.keys(errors).length > 0 && (
                                    <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive space-y-1">
                                        {Object.values(errors).map((e, i) => <p key={i}>{e}</p>)}
                                    </div>
                                )}

                                <ReviewSection title="Your Home">
                                    <ReviewRow label="Home type" value={form.home_type} className="capitalize" />
                                    <ReviewRow label="Has yard" value={form.has_yard ? 'Yes' : 'No'} />
                                </ReviewSection>

                                <ReviewSection title="Household">
                                    <ReviewRow label="Has children" value={form.has_children ? 'Yes' : 'No'} />
                                    <ReviewRow label="Has other pets" value={form.has_other_pets ? 'Yes' : 'No'} />
                                    {form.has_other_pets && (
                                        <ReviewRow label="Other pets" value={form.other_pets_description} />
                                    )}
                                </ReviewSection>

                                <ReviewSection title="Lifestyle">
                                    <ReviewRow label="Hours away / day" value={`${form.work_hours_per_day} hrs`} />
                                    <ReviewRow label="Reason for adopting" value={form.reason_for_adopting} />
                                    {form.prior_pet_experience && (
                                        <ReviewRow label="Prior experience" value={form.prior_pet_experience} />
                                    )}
                                </ReviewSection>

                                <ReviewSection title="References">
                                    {form.references
                                        .filter(r => r.name.trim() && r.contact.trim())
                                        .map((r, i) => (
                                            <div key={i} className="py-1">
                                                <p className="font-medium">{r.name} <span className="font-normal text-muted-foreground">· {r.relationship}</span></p>
                                                <p className="text-muted-foreground">{r.contact}</p>
                                            </div>
                                        ))}
                                </ReviewSection>

                                <ReviewSection title="Documents">
                                    {documents.filter(d => !d.error).length === 0 ? (
                                        <p className="text-muted-foreground py-1">No documents attached.</p>
                                    ) : (
                                        documents.filter(d => !d.error).map((d, i) => (
                                            <div key={i} className="flex items-center gap-2 py-1">
                                                <DocIcon mime={d.file.type} />
                                                <span className="truncate">{d.file.name}</span>
                                                <span className="ml-auto text-muted-foreground text-xs shrink-0">
                                                    {DOC_TYPES.find(t => t.value === d.type)?.label}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </ReviewSection>
                            </div>
                        )}

                        {/* Navigation */}
                        <div className="mt-8 flex items-center justify-between">
                            <div>
                                {step > 0 ? (
                                    <Button type="button" variant="outline" onClick={back} className="gap-2">
                                        <ChevronLeft className="h-4 w-4" />
                                        Back
                                    </Button>
                                ) : (
                                    <Link href="/pets">
                                        <Button variant="ghost" className="gap-2">
                                            <ChevronLeft className="h-4 w-4" />
                                            Cancel
                                        </Button>
                                    </Link>
                                )}
                            </div>

                            <div>
                                {step < STEPS.length - 1 ? (
                                    <Button type="button" onClick={next} disabled={!resolvedPetId} className="gap-2">
                                        {step === 4 && documents.length === 0 ? 'Skip' : 'Next'}
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        onClick={submit}
                                        disabled={submitting || !resolvedPetId}
                                        className="gap-2 min-w-36"
                                    >
                                        {submitting ? 'Submitting…' : 'Submit Application'}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

// ─── Review helpers ───────────────────────────────────────────────────────────

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-lg border border-border p-4">
            <h3 className="mb-3 font-semibold text-base">{title}</h3>
            <div className="space-y-2">{children}</div>
        </div>
    );
}

function ReviewRow({ label, value, className }: { label: string; value: string | number; className?: string }) {
    return (
        <div className="grid grid-cols-[160px_1fr] gap-2">
            <span className="text-muted-foreground">{label}</span>
            <span className={`wrap-break-word ${className ?? ''}`}>{value}</span>
        </div>
    );
}
