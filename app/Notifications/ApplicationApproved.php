<?php

namespace App\Notifications;

use App\Models\AdoptionApplication;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Messages\VonageMessage;
use Illuminate\Notifications\Notification;

class ApplicationApproved extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly AdoptionApplication $application) {}

    public function via(object $notifiable): array
    {
        $channels = ['mail'];

        if ($notifiable->phone_number && $notifiable->sms_notifications) {
            $channels[] = 'vonage';
        }

        return $channels;
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Your Application Has Been Approved — {$this->application->pet?->name} | " . config('app.name'))
            ->markdown('emails.application-approved', [
                'application' => $this->application,
                'notifiable'  => $notifiable,
            ]);
    }

    public function toVonage(object $notifiable): VonageMessage
    {
        $petName = $this->application->pet?->name ?? 'your pet';
        $appName = config('app.name');

        return (new VonageMessage)
            ->content("[{$appName}] Great news! Your adoption application for {$petName} has been approved. Log in to check next steps.");
    }
}
