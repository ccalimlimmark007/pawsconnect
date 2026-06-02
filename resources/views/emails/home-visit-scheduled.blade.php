@component('mail::message')
# Home Visit Scheduled

Hi {{ $notifiable->name }},

Great news! A home visit has been scheduled for your adoption application.

@component('mail::panel')
**Visit Date:** {{ $visit->visit_date->format('l, F j, Y \a\t g:i A') }}
**Status:** Scheduled
@if($visit->assignedStaff)
**Assigned Staff:** {{ $visit->assignedStaff->name }}
@endif
@if($visit->notes)
**Notes:** {{ $visit->notes }}
@endif
@endcomponent

Please ensure someone is home at the scheduled time. If you need to reschedule or have any questions, contact us as soon as possible so we can make alternative arrangements.

@component('mail::button', ['url' => url('/my-applications'), 'color' => 'green'])
View My Application
@endcomponent

We look forward to meeting you and your family!

**{{ config('app.name') }}**
@endcomponent
