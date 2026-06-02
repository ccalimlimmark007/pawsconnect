@component('mail::message')
# New Adoption Application Received

Hi {{ $notifiable->name }},

A new adoption application has been submitted on **{{ config('app.name') }}** and requires your review.

@component('mail::panel')
**Pet:** {{ $application->pet?->name }} ({{ $application->pet?->species }})
**Applicant:** {{ $application->user?->name }} &lt;{{ $application->user?->email }}&gt;
**Submitted:** {{ $application->created_at?->format('F j, Y \a\t g:i A') }}
**Status:** {{ ucfirst($application->status) }}
@endcomponent

Please log in to the admin panel to review the application details, questionnaire responses, and any attached documents.

@component('mail::button', ['url' => url('/admin/applications'), 'color' => 'green'])
Review Application
@endcomponent

You are receiving this email because you are listed as shelter staff or admin on {{ config('app.name') }}.

**{{ config('app.name') }}**
@endcomponent
