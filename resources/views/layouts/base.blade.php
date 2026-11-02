<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', 'Layanan Kesehatan Personal') - Klinik Sehat</title>

    <!-- Google Fonts: Newsreader (Judul & Angka) + Plus Jakarta Sans (Isi & Kontrol) -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,500;0,6..72,600;1,6..72,500&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">

    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body>
    <!-- Aksesibilitas: Skip Link ke Konten Utama untuk Navigasi Keyboard -->
    <a href="#main-content" class="skip-link">Lewati ke konten utama</a>

    @yield('body')
</body>
</html>

