<?php

namespace App\Notifications;

use App\Models\AdoptionApplication;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ApplicationSubmitted extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly AdoptionApplication $application) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("New Adoption Application — {$this->application->pet?->name} | " . config('app.name'))
            ->markdown('emails.application-submitted', [
                'application' => $this->application,
                'notifiable'  => $notifiable,
            ]);
    }
}
