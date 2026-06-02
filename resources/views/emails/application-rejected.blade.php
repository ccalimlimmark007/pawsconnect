@component('mail::message')
# Application Status Update

Hi {{ $notifiable->name }},

Thank you for your interest in adopting **{{ $application->pet?->name }}**. After careful consideration, we are unable to approve your application at this time.

@if($application->rejected_reason)
@component('mail::panel')
**Reason provided:**
{{ $application->rejected_reason }}
@endcomponent
@endif

@if($application->notes)
@component('mail::panel')
**Additional notes:**
{{ $application->notes }}
@endcomponent
@endif

We encourage you to browse other pets that may be a great match for you and your home.

@component('mail::button', ['url' => url('/pets'), 'color' => 'blue'])
Browse Available Pets
@endcomponent

If you have any questions about this decision, please don't hesitate to contact us. We appreciate your compassion for animals in need.

**{{ config('app.name') }}**
@endcomponent
