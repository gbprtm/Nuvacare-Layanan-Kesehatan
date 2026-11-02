@extends('layouts.patient')

@section('title', 'Perbarui Profil Kesehatan')

@section('content')
<div class="space-y-6" style="max-width: 800px; margin: 0 auto;">
    <div class="flex items-center justify-between gap-4">
        <div>
            <h1 class="page-title text-2xl font-bold font-serif">Perbarui Profil Kesehatan</h1>
            <p class="text-sm text-muted mt-1">Perbarui data kesehatan personal Anda untuk mempermudah pelayanan klinik.</p>
        </div>
        <div>
            <a href="{{ route('profile.show') }}" class="btn btn-secondary text-sm">Kembali</a>
        </div>
    </div>

    <form method="POST" action="{{ route('profile.update') }}">
        @csrf
        @method('PATCH')

        <div class="space-y-6">
            {{-- Bagian 1: Data Identitas Fisik --}}
            <x-card title="Data Kontak & Fisik">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label for="phone_number" class="form-label text-sm font-medium">Nomor Telepon / WhatsApp</label>
                        <input type="tel" id="phone_number" name="phone_number" value="{{ old('phone_number', $profile?->nomor_telepon) }}" class="form-input" placeholder="Contoh: 081234567890">
                    </div>

                    <div>
                        <label for="birth_date" class="form-label text-sm font-medium">Tanggal Lahir</label>
                        <input type="date" id="birth_date" name="birth_date" value="{{ old('birth_date', $profile?->tanggal_lahir ? $profile->tanggal_lahir->format('Y-m-d') : '') }}" class="form-input" max="{{ date('Y-m-d') }}">
                    </div>

                    <div>
                        <label for="gender" class="form-label text-sm font-medium">Jenis Kelamin</label>
                        <select id="gender" name="gender" class="form-input">
                            <option value="">-- Pilih Jenis Kelamin --</option>
                            <option value="laki-laki" @selected(old('gender', $profile?->jenis_kelamin) === 'laki-laki')>Laki-laki</option>
                            <option value="perempuan" @selected(old('gender', $profile?->jenis_kelamin) === 'perempuan')>Perempuan</option>
                        </select>
                    </div>

                    <div>
                        <label for="blood_group" class="form-label text-sm font-medium">Golongan Darah</label>
                        <select id="blood_group" name="blood_group" class="form-input">
                            <option value="">-- Pilih Golongan Darah --</option>
                            <option value="A" @selected(old('blood_group', $profile?->golongan_darah) === 'A')>A</option>
                            <option value="B" @selected(old('blood_group', $profile?->golongan_darah) === 'B')>B</option>
                            <option value="AB" @selected(old('blood_group', $profile?->golongan_darah) === 'AB')>AB</option>
                            <option value="O" @selected(old('blood_group', $profile?->golongan_darah) === 'O')>O</option>
                        </select>
                    </div>

                    <div>
                        <label for="height_cm" class="form-label text-sm font-medium">Tinggi Badan (cm)</label>
                        <input type="number" id="height_cm" name="height_cm" value="{{ old('height_cm', $profile?->tinggi_badan) }}" min="30" max="250" class="form-input" placeholder="Contoh: 165">
                    </div>

                    <div>
                        <label for="weight_kg" class="form-label text-sm font-medium">Berat Badan (kg)</label>
                        <input type="number" id="weight_kg" name="weight_kg" value="{{ old('weight_kg', $profile?->berat_badan) }}" min="2" max="300" class="form-input" placeholder="Contoh: 60">
                    </div>
                </div>
            </x-card>

            {{-- Bagian 2: Riwayat Kesehatan --}}
            <x-card title="Riwayat Kondisi & Alergi">
                <div class="space-y-4">
                    <div>
                        <label for="health_conditions" class="form-label text-sm font-medium">Kondisi Kesehatan Terpantau</label>
                        <textarea id="health_conditions" name="health_conditions" rows="3" class="form-input" placeholder="Misal: Riwayat hipertensi sejak 2024, asam lambung ringan">{{ old('health_conditions', $profile?->kondisi_kesehatan) }}</textarea>
                    </div>

                    <div>
                        <label for="allergies" class="form-label text-sm font-medium">Riwayat Alergi (Obat / Makanan / Lingkungan)</label>
                        <textarea id="allergies" name="allergies" rows="3" class="form-input" placeholder="Misal: Alergi penisilin, alergi udang">{{ old('allergies', $profile?->riwayat_alergi) }}</textarea>
                    </div>
                </div>
            </x-card>

            {{-- Bagian 3: Kontak Darurat --}}
            <x-card title="Kontak Darurat">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label for="emergency_contact_name" class="form-label text-sm font-medium">Nama Kontak Darurat</label>
                        <input type="text" id="emergency_contact_name" name="emergency_contact_name" value="{{ old('emergency_contact_name', $profile?->kontak_darurat_nama) }}" class="form-input" placeholder="Nama keluarga/kerabat terdekat">
                    </div>

                    <div>
                        <label for="emergency_contact_phone" class="form-label text-sm font-medium">Nomor Telepon Darurat</label>
                        <input type="tel" id="emergency_contact_phone" name="emergency_contact_phone" value="{{ old('emergency_contact_phone', $profile?->kontak_darurat_telepon) }}" class="form-input" placeholder="08xxxxxxxxxx">
                    </div>
                </div>
            </x-card>

            {{-- Tombol Aksi --}}
            <div class="flex items-center justify-end gap-3 pt-2">
                <a href="{{ route('profile.show') }}" class="btn btn-secondary">Batal</a>
                <button type="submit" class="btn btn-primary" style="min-width: 140px;">
                    Simpan Perubahan
                </button>
            </div>
        </div>
    </form>
</div>
@endsection

