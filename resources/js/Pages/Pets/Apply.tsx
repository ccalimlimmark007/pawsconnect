import React from 'react';
import { Head, usePage, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';

export default function Apply() {
  const props = usePage().props as any;
  const petId = props.pet || (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('pet') : null);

  return (
    <AppLayout>
      <Head title="Apply to Adopt" />

      <div className="container mx-auto px-4 py-20">
        <div className="max-w-2xl mx-auto bg-card rounded-xl border p-8">
          <h1 className="text-2xl font-display mb-4">Adoption Application</h1>
          <p className="text-muted-foreground mb-6">You are applying for pet ID: <strong>{petId ?? '—'}</strong></p>

          <p className="mb-6">This is a placeholder adoption form. You can collect user details, references, and schedule an appointment here.</p>

          <div className="flex gap-2">
            <Button asChild>
              <Link href="/pets">Back to pets</Link>
            </Button>
            <Button>Start Application</Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
