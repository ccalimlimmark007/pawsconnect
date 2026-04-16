import { Head, Link, usePage } from '@inertiajs/react';
import { CheckCircle, Info, User, FileText, Plus, Eye, PawPrint, X, Upload, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { usePetEdit } from '@/hooks/use-pet-edit';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { Pet } from '@/types/pet';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Profile',
        href: '/profile',
    },
];

export default function Profile() {
    const props = usePage().props;
    const { auth, status, userPets } = props as { 
        auth?: { user?: { 
            name: string; 
            email: string; 
            created_at: string; 
            email_verified_at?: string 
        } }; 
        status?: string;
        userPets?: Pet[];
    };
    
    type EditFormData = Record<string, string | number | boolean | undefined>;

    const [showStatus, setShowStatus] = useState(!!status);
    const [editingPetId, setEditingPetId] = useState<string | null>(null);
    const [editFormData, setEditFormData] = useState<EditFormData>({});
    const [editImageFile, setEditImageFile] = useState<File | null>(null);
    const [editImagePreview, setEditImagePreview] = useState<string>('');
    const [pets, setPets] = useState<Pet[]>(Array.isArray(userPets) ? userPets : []);
    const [deleteSuccessMessage, setDeleteSuccessMessage] = useState<string | null>(null);
    const [deletingPetId, setDeletingPetId] = useState<string | null>(null);
    const {
        updatePet,
        deletePet,
        loading: updateLoading,
        error: updateError,
        success: updateSuccess,
        clearError: clearUpdateError,
        clearSuccess: clearUpdateSuccess,
    } = usePetEdit();

    useEffect(() => {
        if (status) {
            const timer = setTimeout(() => {
                setShowStatus(false);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [status]);

    useEffect(() => {
        if (updateError) {
            const timer = setTimeout(clearUpdateError, 5000);
            return () => clearTimeout(timer);
        }
    }, [updateError, clearUpdateError]);

    useEffect(() => {
        if (updateSuccess) {
            setTimeout(() => {
                setEditingPetId(null);
                setEditFormData({});
                setEditImageFile(null);
                setEditImagePreview('');
            }, 1500);
        }
    }, [updateSuccess]);

    useEffect(() => {
        if (deleteSuccessMessage) {
            const timer = setTimeout(() => {
                setDeleteSuccessMessage(null);
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [deleteSuccessMessage]);

    const user = auth?.user;

    // Debug log
    console.log('Profile Page Props:', { auth, user, status, userPets });

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

    // Handle edit button click
    const handleEditClick = (pet: Pet) => {
        setEditingPetId(pet.id);
        setEditFormData({
            name: pet.name,
            breed: pet.breed,
            age: pet.age,
            age_unit: pet.ageUnit || 'years',
            gender: pet.gender,
            size: pet.size,
            color: pet.color || '',
            availability_status: pet.availabilityStatus,
        });
        setEditImagePreview(pet.imageUrl || '');
        setEditImageFile(null);
    };

    // Handle edit form input change
    const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setEditFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? (value === '' ? undefined : parseFloat(value)) : value,
        }));
    };

    const getTextValue = (key: string): string => {
        const value = editFormData[key];
        return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
    };

    const getNumberValue = (key: string): number | '' => {
        const value = editFormData[key];
        return typeof value === 'number' ? value : '';
    };

    const getBooleanValue = (key: string, fallback = true): boolean => {
        const value = editFormData[key];
        return typeof value === 'boolean' ? value : fallback;
    };

    // Handle edit image change
    const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setEditImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Clear edit image
    const clearEditImage = () => {
        const pet = pets.find(p => p.id === editingPetId);
        setEditImageFile(null);
        setEditImagePreview(pet?.imageUrl || '');
    };

    // Handle edit form submit
    const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if (!editingPetId) return;

        const submitData: Record<string, string | number | boolean | File | undefined> = {
            ...editFormData,
        };

        if (editImageFile) {
            submitData.image = editImageFile;
        }

        await updatePet(editingPetId, submitData);
    };

    // Handle cancel edit
    const handleCancelEdit = () => {
        setEditingPetId(null);
        setEditFormData({});
        setEditImageFile(null);
        setEditImagePreview('');
        clearUpdateSuccess();
    };

    const handleDeletePet = async (pet: Pet) => {
        const confirmed = window.confirm(`Delete ${pet.name}? This action cannot be undone.`);

        if (!confirmed) {
            return;
        }

        setDeletingPetId(pet.id);

        const wasDeleted = await deletePet(pet.id);

        if (wasDeleted) {
            setPets((prevPets) => prevPets.filter((item) => item.id !== pet.id));
            setDeleteSuccessMessage(`${pet.name} has been deleted.`);

            if (editingPetId === pet.id) {
                handleCancelEdit();
            }
        }

        setDeletingPetId(null);
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

                    {deleteSuccessMessage && (
                        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
                            <div className="flex items-center gap-3">
                                <CheckCircle className="h-5 w-5" />
                                <p className="font-medium">{deleteSuccessMessage}</p>
                            </div>
                        </div>
                    )}

                    {updateError && (
                        <div className="mb-6 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive">
                            <div className="flex items-center gap-3">
                                <Info className="h-5 w-5" />
                                <p className="font-medium">{updateError}</p>
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
                                    <div>{pets.length} pet{pets.length !== 1 ? 's posted' : ' posted'}</div>
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

                        {/* Right column with two sections */}
                        <div className="lg:col-span-2 flex flex-col gap-6">
                            {/* My Applications section */}
                            <div className="rounded-xl border border-sidebar-border/70 bg-card p-8">
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

                            {/* My Listed Pets section */}
                            <div className="rounded-xl border border-sidebar-border/70 bg-card p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                        <PawPrint className="h-5 w-5 text-primary" />
                                        My Listed Pets
                                    </h3>
                                    <Link href="/post-pet">
                                        <Button size="sm" className="gap-2">
                                            <Plus className="h-4 w-4" />
                                            Post New Pet
                                        </Button>
                                    </Link>
                                </div>

                                {pets.length > 0 ? (
                                    <div className="space-y-4">
                                        {pets.map((pet) => (
                                            editingPetId === pet.id ? (
                                                // Edit Form
                                                <div key={pet.id} className="border border-border rounded-lg p-6 bg-secondary/20">
                                                    <h4 className="font-semibold text-lg mb-4">Edit {pet.name}</h4>

                                                    {updateError && (
                                                        <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                                                            {updateError}
                                                        </div>
                                                    )}

                                                    {updateSuccess && (
                                                        <div className="mb-4 p-3 rounded-lg bg-green-100 border border-green-300 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200 text-sm">
                                                            Pet updated successfully!
                                                        </div>
                                                    )}

                                                    <form onSubmit={handleEditSubmit} className="space-y-4">
                                                        {/* Image Upload */}
                                                        <div>
                                                            <label className="block text-sm font-medium mb-2">Photo</label>
                                                            <div className="flex gap-3 items-end">
                                                                <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-4 cursor-pointer hover:bg-secondary/10 transition">
                                                                    <Upload className="w-4 h-4 mb-1 text-muted-foreground" />
                                                                    <span className="text-xs text-muted-foreground text-center">Click to upload photo</span>
                                                                    <input
                                                                        type="file"
                                                                        accept="image/*"
                                                                        onChange={handleEditImageChange}
                                                                        className="hidden"
                                                                    />
                                                                </label>
                                                                {editImagePreview && (
                                                                    <div className="relative">
                                                                        <img
                                                                            src={editImagePreview}
                                                                            alt="Preview"
                                                                            className="w-16 h-16 rounded-lg object-cover"
                                                                        />
                                                                        <button
                                                                            type="button"
                                                                            onClick={clearEditImage}
                                                                            className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1"
                                                                        >
                                                                            <X className="w-3 h-3" />
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Form Fields */}
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div>
                                                                <label className="block text-xs font-medium mb-1">Name</label>
                                                                <input
                                                                    type="text"
                                                                    name="name"
                                                                    value={getTextValue('name')}
                                                                    onChange={handleEditInputChange}
                                                                    className="w-full px-2 py-1.5 rounded border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                                />
                                                            </div>

                                                            <div>
                                                                <label className="block text-xs font-medium mb-1">Breed</label>
                                                                <input
                                                                    type="text"
                                                                    name="breed"
                                                                    value={getTextValue('breed')}
                                                                    onChange={handleEditInputChange}
                                                                    className="w-full px-2 py-1.5 rounded border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                                />
                                                            </div>

                                                            <div>
                                                                <label className="block text-xs font-medium mb-1">Age</label>
                                                                <input
                                                                    type="number"
                                                                    name="age"
                                                                    value={getNumberValue('age')}
                                                                    onChange={handleEditInputChange}
                                                                    min="0"
                                                                    className="w-full px-2 py-1.5 rounded border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                                />
                                                            </div>

                                                            <div>
                                                                <label className="block text-xs font-medium mb-1">Age Unit</label>
                                                                <select
                                                                    name="age_unit"
                                                                    value={getTextValue('age_unit') || 'years'}
                                                                    onChange={handleEditInputChange}
                                                                    className="w-full px-2 py-1.5 rounded border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                                >
                                                                    <option value="months">Months</option>
                                                                    <option value="years">Years</option>
                                                                </select>
                                                            </div>

                                                            <div>
                                                                <label className="block text-xs font-medium mb-1">Gender</label>
                                                                <select
                                                                    name="gender"
                                                                    value={getTextValue('gender')}
                                                                    onChange={handleEditInputChange}
                                                                    className="w-full px-2 py-1.5 rounded border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                                >
                                                                    <option value="">Select</option>
                                                                    <option value="Male">Male</option>
                                                                    <option value="Female">Female</option>
                                                                    <option value="Unknown">Unknown</option>
                                                                </select>
                                                            </div>

                                                            <div>
                                                                <label className="block text-xs font-medium mb-1">Size</label>
                                                                <select
                                                                    name="size"
                                                                    value={getTextValue('size')}
                                                                    onChange={handleEditInputChange}
                                                                    className="w-full px-2 py-1.5 rounded border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                                >
                                                                    <option value="">Select</option>
                                                                    <option value="Small">Small</option>
                                                                    <option value="Medium">Medium</option>
                                                                    <option value="Large">Large</option>
                                                                    <option value="Extra Large">Extra Large</option>
                                                                </select>
                                                            </div>

                                                            <div>
                                                                <label className="block text-xs font-medium mb-1">Color</label>
                                                                <input
                                                                    type="text"
                                                                    name="color"
                                                                    value={getTextValue('color')}
                                                                    onChange={handleEditInputChange}
                                                                    className="w-full px-2 py-1.5 rounded border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                                />
                                                            </div>

                                                            <div>
                                                                <label className="flex items-center gap-2 text-xs font-medium mt-5 cursor-pointer">
                                                                    <input
                                                                        type="checkbox"
                                                                        name="availability_status"
                                                                        checked={getBooleanValue('availability_status')}
                                                                        onChange={(e) => setEditFormData(prev => ({ ...prev, availability_status: e.target.checked }))}
                                                                        className="rounded"
                                                                    />
                                                                    Available
                                                                </label>
                                                            </div>
                                                        </div>

                                                        {/* Form Actions */}
                                                        <div className="flex gap-2 justify-end pt-2">
                                                            <Button
                                                                type="button"
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() => handleDeletePet(pet)}
                                                                disabled={updateLoading || deletingPetId === pet.id}
                                                                className="gap-2"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                                {deletingPetId === pet.id ? 'Deleting...' : 'Delete'}
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={handleCancelEdit}
                                                                disabled={updateLoading}
                                                            >
                                                                Cancel
                                                            </Button>
                                                            <Button
                                                                type="submit"
                                                                size="sm"
                                                                disabled={updateLoading}
                                                            >
                                                                {updateLoading ? 'Updating...' : 'Save Changes'}
                                                            </Button>
                                                        </div>
                                                    </form>
                                                </div>
                                            ) : (
                                                // View Mode
                                                <div 
                                                    key={pet.id} 
                                                    className="flex items-start gap-4 p-4 rounded-lg border border-border/50 hover:bg-secondary/30 transition-colors"
                                                >
                                                    {/* Pet Image */}
                                                    <div className="shrink-0">
                                                        {pet.imageUrl ? (
                                                            <img 
                                                                src={pet.imageUrl} 
                                                                alt={pet.name}
                                                                className="w-20 h-20 rounded-lg object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-20 h-20 rounded-lg bg-secondary flex items-center justify-center">
                                                                <PawPrint className="h-8 w-8 text-muted-foreground" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Pet Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div>
                                                                <h4 className="font-semibold text-base">{pet.name}</h4>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {pet.breed} • {pet.species} • {pet.gender}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground mt-1">
                                                                    Posted {pet.datePosted ? formatDate(pet.datePosted) : 'Unknown'}
                                                                </p>
                                                            </div>

                                                            {/* Status Badge */}
                                                            <div className="shrink-0">
                                                                {pet.availabilityStatus ? (
                                                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200">
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-green-600" />
                                                                        Available
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                                                                        Adopted
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Actions */}
                                                        <div className="flex items-center gap-2 mt-3">
                                                            <Link href={`/pets/${pet.id}`}>
                                                                <Button size="sm" variant="ghost" className="gap-2">
                                                                    <Eye className="h-4 w-4" />
                                                                    View Details
                                                                </Button>
                                                            </Link>
                                                            <Button 
                                                                size="sm" 
                                                                variant="ghost" 
                                                                className="gap-2 text-muted-foreground hover:text-foreground"
                                                                onClick={() => handleEditClick(pet)}
                                                                disabled={deletingPetId === pet.id}
                                                            >
                                                                Edit
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="gap-2 text-destructive hover:text-destructive"
                                                                onClick={() => handleDeletePet(pet)}
                                                                disabled={deletingPetId === pet.id}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                                {deletingPetId === pet.id ? 'Deleting...' : 'Delete'}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12">
                                        <PawPrint className="mb-4 h-12 w-12 text-muted-foreground" />
                                        <h4 className="mb-1 text-lg font-medium">No pets posted yet</h4>
                                        <p className="text-sm text-muted-foreground mb-6">Help a pet find their forever home!</p>
                                        <Link href="/post-pet">
                                            <Button className="shadow-md bg-primary text-white gap-2">
                                                <Plus className="h-4 w-4" />
                                                Post Your First Pet
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
