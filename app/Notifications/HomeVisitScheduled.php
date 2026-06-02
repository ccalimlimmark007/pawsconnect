<?php

namespace App\Notifications;

use App\Models\HomeVisit;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Messages\VonageMessage;
use Illuminate\Notifications\Notification;

class HomeVisitScheduled extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly HomeVisit $visit) {}

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
            ->subject('Home Visit Scheduled — ' . config('app.name'))
            ->markdown('emails.home-visit-scheduled', [
                'visit'      => $this->visit,
                'notifiable' => $notifiable,
            ]);
    }

    public function toVonage(object $notifiable): VonageMessage
    {
        $date    = $this->visit->visit_date->format('M j, Y \a\t g:i A');
        $appName = config('app.name');

        return (new VonageMessage)
            ->content("[{$appName}] A home visit has been scheduled for {$date}. Please be available. Check the app for details.");
    }
}
