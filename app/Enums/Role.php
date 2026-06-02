<?php

namespace App\Enums;

enum Role: string
{
    case Adopter = 'adopter';
    case ShelterStaff = 'shelter_staff';
    case Admin = 'admin';

    public function label(): string
    {
        return match($this) {
            Role::Adopter => 'Adopter',
            Role::ShelterStaff => 'Shelter Staff',
            Role::Admin => 'Admin',
        };
    }

    public function canManagePets(): bool
    {
        return $this === Role::ShelterStaff || $this === Role::Admin;
    }

    public function canManageUsers(): bool
    {
        return $this === Role::Admin;
    }
}
