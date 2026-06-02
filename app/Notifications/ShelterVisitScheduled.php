<?php

namespace App\Notifications;

use App\Models\ShelterVisit;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ShelterVisitScheduled extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly ShelterVisit $visit) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $pet      = $this->visit->pet;
        $shelter  = $pet->shelter?->name ?? 'the shelter';

        return (new MailMessage)
            ->subject("Visit Scheduled — {$pet->name} at {$shelter}")
            ->greeting("Hello, {$this->visit->user->name}!")
            ->line('Your shelter visit has been scheduled. Here are the details:')
            ->line("Pet: {$pet->name}")
            ->line("Shelter: {$shelter}")
            ->line('Date: ' . $this->visit->visit_date->format('F j, Y'))
            ->line('Time: ' . $this->visit->visit_time)
            ->line('The shelter will confirm your visit within 24 hours.')
            ->action('View My Visits', route('visits.index'))
            ->salutation('With love, The PawsConnect Team 🐾');
    }
}
