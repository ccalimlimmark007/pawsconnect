<?php

namespace App\Mail;

use App\Models\HomeVisit;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class HomeVisitScheduled extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly HomeVisit $visit,
        public readonly User      $applicant,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Home Visit Scheduled — ' . config('app.name'),
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.home-visit-scheduled',
        );
    }
}
