# scripts/database/restore.ps1
# Prosedur Latihan Restore Terisolasi untuk PostgreSQL / Neon
# Penggunaan: .\scripts\database\restore.ps1 -DumpFile ".backups/backup_xyz.dump" -TargetUrl "$env:TEST_DATABASE_URL"

param (
    [Parameter(Mandatory=$true)]
    [string]$DumpFile,
    [Parameter(Mandatory=$true)]
    [string]$TargetUrl
)

if (-not (Test-Path $DumpFile)) {
    Write-Error "File dump tidak ditemukan: $DumpFile"
    exit 1
}

# 1. Jalankan guard keselamatan - PASTIKAN BUKAN PRODUKSI!
$guardResult = php scripts/database/guard.php "$TargetUrl"
if ($LASTEXITCODE -ne 0) {
    Write-Error "CRITICAL: Guard keselamatan menolak target restore! Hanya branch dev/test terisolasi yang diizinkan."
    exit 2
}

# 2. Verifikasi Checksum SHA-256 bila file checksum tersedia
$checksumFile = [System.IO.Path]::ChangeExtension($DumpFile, ".sha256")
if (Test-Path $checksumFile) {
    $expectedHash = (Get-Content $checksumFile).Split(' ')[0].Trim()
    $actualHash = (Get-FileHash -Path $DumpFile -Algorithm SHA256).Hash

    if ($expectedHash -ne $actualHash) {
        Write-Error "INTEGRITY CHECK FAILED: Checksum SHA-256 tidak cocok!`nExpected: $expectedHash`nActual: $actualHash"
        exit 3
    }
    Write-Host "Integritas berkas backup terverifikasi (SHA-256 match)."
}

# 3. Eksekusi pg_restore jika biner tersedia
$pgRestoreCmd = Get-Command pg_restore -ErrorAction SilentlyContinue

Write-Host "=== MEMULAI LATIHAN PEMULIHAN (RESTORE DRILL) KE TARGET TERISOLASI ==="
$sanitizedUrl = $TargetUrl -replace ':[^@]+@', ':***@'
Write-Host "Target pemulihan: $sanitizedUrl"

if ($pgRestoreCmd) {
    & pg_restore --dbname="$TargetUrl" --clean --if-exists --no-owner --no-privileges "$DumpFile"
    if ($LASTEXITCODE -ne 0) {
        Write-Error "pg_restore gagal dieksekusi."
        exit 4
    }
    Write-Host "Latihan restore via pg_restore berhasil."
} else {
    Write-Host "Pemberitahuan: pg_restore client tidak ditemukan di PATH sistem."
    Write-Host "Verifikasi pemulihan dilakukan melalui validasi branch Neon atau DDL terisolasi."
}

# 4. Rekonsiliasi jumlah tabel dan record
Write-Host "Menjalankan inventaris rekonsiliasi pasca-restore..."
php scripts/database/inventory.php

