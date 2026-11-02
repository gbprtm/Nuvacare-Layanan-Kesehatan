<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ResetPasswordNotification extends Notification
{
    use Queueable;

    public function __construct(public string $token) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $resetUrl = url('/reset-password.html?token='.$this->token.'&email='.urlencode($notifiable->getEmailForPasswordReset()));

        return (new MailMessage)
            ->subject('Permintaan Reset Kata Sandi - Klinik Sehat')
            ->line('Anda menerima email ini karena kami menerima permintaan reset kata sandi untuk akun Anda.')
            ->action('Atur Ulang Kata Sandi', $resetUrl)
            ->line('Tautan pengaturan ulang kata sandi ini akan kedaluwarsa dalam 60 menit.')
            ->line('Jika Anda tidak merasa meminta pengaturan ulang kata sandi, abaikan email ini.');
    }
}
