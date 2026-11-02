<?php

namespace App\Http\Controllers\Profile;

use App\Http\Controllers\Controller;
use App\Http\Requests\Profile\DestroyProfileRequest;
use App\Http\Requests\Profile\UpdateProfileRequest;
use App\Services\Profile\ProfileService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class ProfileController extends Controller
{
    public function __construct(
        protected ProfileService $profileService
    ) {}

    /**
     * Tampilkan profil kesehatan pasien dan capture obat.
     */
    public function show(Request $request): View
    {
        $data = $this->profileService->getProfileData($request->user());

        return view('profile.show', [
            'user' => $request->user(),
            'profile' => $data['profile'],
            'capturedMedications' => $data['capturedMedications'],
            'isComplete' => $data['isComplete'],
        ]);
    }

    /**
     * Tampilkan formulir edit profil kesehatan.
     */
    public function edit(Request $request): View
    {
        $data = $this->profileService->getProfileData($request->user());

        return view('profile.edit', [
            'user' => $request->user(),
            'profile' => $data['profile'],
            'capturedMedications' => $data['capturedMedications'],
        ]);
    }

    /**
     * Perbarui data profil kesehatan mandiri pasien.
     */
    public function update(UpdateProfileRequest $request): RedirectResponse
    {
        $this->profileService->updateProfile($request->user(), $request->validated());

        return redirect()->route('profile.show')->with('status', 'Data profil kesehatan berhasil diperbarui.');
    }

    /**
     * Kosongkan/hapus data profil kesehatan mandiri pasien.
     */
    public function destroy(DestroyProfileRequest $request): RedirectResponse
    {
        $this->profileService->destroyProfile($request->user());

        return redirect()->route('profile.show')->with('status', 'Data profil kesehatan telah berhasil dihapus.');
    }
}
