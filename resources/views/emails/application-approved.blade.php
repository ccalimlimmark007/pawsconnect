@component('mail::message')
# Your Application Has Been Approved! 🎉

Hi {{ $notifiable->name }},

Wonderful news — your adoption application for **{{ $application->pet?->name }}** has been **approved**!

@component('mail::panel')
**Pet:** {{ $application->pet?->name }} ({{ $application->pet?->species }})
**Reviewed on:** {{ $application->reviewed_at?->format('F j, Y') }}
@if($application->notes)
**Notes from the shelter:**
{{ $application->notes }}
@endif
@endcomponent

Our team will be in touch shortly to arrange the next steps, which may include a home visit or pick-up coordination.

In the meantime, you can view your application status at any time by clicking the button below.

@component('mail::button', ['url' => url('/my-applications'), 'color' => 'green'])
View My Application
@endcomponent

Thank you for choosing to give a pet a forever home. We look forward to completing your adoption!

**{{ config('app.name') }}**
@endcomponent
