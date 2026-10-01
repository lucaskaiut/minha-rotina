<?php

namespace App\Support;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;

final class FamilyContext
{
    public static function familyId(User $user): int
    {
        if (! $user->family_id) {
            throw new AuthorizationException('Usuário sem família associada.');
        }

        return (int) $user->family_id;
    }

    public static function resolveDaughter(User $actor, string $daughterPublicId): User
    {
        $daughter = User::query()
            ->where('public_id', $daughterPublicId)
            ->where('role', UserRole::Daughter)
            ->firstOrFail();

        if ($actor->isDaughter() && $actor->public_id !== $daughterPublicId) {
            throw new AuthorizationException('Filha só pode acessar o próprio perfil.');
        }

        if ($actor->isMother() && $daughter->mother_id !== $actor->id) {
            throw new AuthorizationException('Filha não pertence a esta família.');
        }

        return $daughter;
    }

    public static function resolveDaughterByInternalId(User $actor, int $daughterId): User
    {
        $daughter = User::query()->findOrFail($daughterId);

        if ($actor->isDaughter() && $actor->id !== $daughterId) {
            throw new AuthorizationException('Filha só pode acessar o próprio perfil.');
        }

        if ($actor->isMother() && $daughter->mother_id !== $actor->id) {
            throw new AuthorizationException('Filha não pertence a esta família.');
        }

        return $daughter;
    }
}
