<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', 'Layanan Kesehatan Personal') - Klinik Sehat</title>

    <!-- Google Fonts: Newsreader (Judul & Nomor) + Plus Jakarta Sans (Isi & Kontrol) -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,500;0,6..72,600;1,6..72,500&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">

    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body>
    <header class="site-header">
        <div class="header-container">
            <a href="/" class="brand-link">
                Klinik Sehat
                @auth
                    @if(auth()->user()->isAdmin())
                        <span class="brand-badge">Admin</span>
                    @else
                        <span class="brand-badge">Pasien</span>
                    @endif
                @endauth
            </a>

            <nav>
                @auth
                    <form method="POST" action="{{ route('logout') }}" style="display: inline;">
                        @csrf
                        <button type="submit" class="btn btn-secondary" style="min-height: 38px; padding: 0.375rem 0.875rem;">Keluar</button>
                    </form>
                @else
                    <a href="/masuk" class="btn btn-secondary" style="min-height: 38px; padding: 0.375rem 0.875rem; text-decoration: none; margin-right: 0.5rem;">Masuk</a>
                    <a href="/daftar" class="btn btn-primary" style="min-height: 38px; padding: 0.375rem 0.875rem; text-decoration: none;">Daftar</a>
                @endauth
            </nav>
        </div>
    </header>

    <main id="main-content">
        @yield('content')
    </main>
</body>
</html>

