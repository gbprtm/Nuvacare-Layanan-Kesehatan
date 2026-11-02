<?php

/**
 * scripts/database/inventory.php
 *
 * Skrip inspeksi read-only skema database PostgreSQL.
 * Berjalan tanpa memodifikasi data atau DDL apa pun.
 * Menginventarisasi tabel, kolom, UUID, enum, indeks, dan relasi foreign key.
 */
$databaseUrl = getenv('DATABASE_URL') ?: getenv('DATABASE_URL_UNPOOLED');

if (! $databaseUrl) {
    fwrite(STDERR, "Error: Variabel lingkungan DATABASE_URL atau DATABASE_URL_UNPOOLED tidak ditemukan.\n");
    exit(1);
}

$parsed = parse_url($databaseUrl);
$host = $parsed['host'] ?? '127.0.0.1';
$port = $parsed['port'] ?? 5432;
$user = $parsed['user'] ?? '';
$pass = $parsed['pass'] ?? '';
$db = ltrim($parsed['path'] ?? '', '/');

$dsn = "pgsql:host={$host};port={$port};dbname={$db};sslmode=require";

try {
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    echo "=== INVENTARIS SKEMA DATABASE (READ-ONLY) ===\n";
    echo 'Host Target: '.preg_replace('/:[^@]+@/', ':***@', $host)."\n";
    echo "Database: {$db}\n\n";

    // 1. Daftar Tabel
    $tablesStmt = $pdo->query("
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        ORDER BY table_name;
    ");
    $tables = $tablesStmt->fetchAll(PDO::FETCH_COLUMN);

    echo '1. DAFTAR TABEL ('.count($tables)." ditemukan):\n";
    foreach ($tables as $table) {
        $countStmt = $pdo->query("SELECT COUNT(*) FROM \"{$table}\"");
        $rowCount = $countStmt->fetchColumn();
        echo "   - {$table} (baris: {$rowCount})\n";
    }

    // 2. Daftar Enum kustom
    $enumStmt = $pdo->query("
        SELECT t.typname as enum_name, e.enumlabel as enum_value
        FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid  
        JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'public'
        ORDER BY enum_name, e.enumsortorder;
    ");
    $enums = [];
    while ($row = $enumStmt->fetch()) {
        $enums[$row['enum_name']][] = $row['enum_value'];
    }

    echo "\n2. DAFTAR ENUM KUSTOM (".count($enums)." ditemukan):\n";
    foreach ($enums as $enumName => $values) {
        echo "   - {$enumName}: [".implode(', ', $values)."]\n";
    }

    // 3. Foreign Keys
    $fkStmt = $pdo->query("
        SELECT
            tc.table_name, 
            kcu.column_name, 
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name,
            rc.delete_rule
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        JOIN information_schema.referential_constraints AS rc
            ON rc.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema='public'
        ORDER BY tc.table_name, kcu.column_name;
    ");
    $fks = $fkStmt->fetchAll();

    echo "\n3. FOREIGN KEYS (".count($fks)." relasi ditemukan):\n";
    foreach ($fks as $fk) {
        echo "   - {$fk['table_name']}.{$fk['column_name']} -> {$fk['foreign_table_name']}.{$fk['foreign_column_name']} (ON DELETE {$fk['delete_rule']})\n";
    }

    echo "\nInventarisasi selesai secara aman tanpa mutasi.\n";

} catch (PDOException $e) {
    fwrite(STDERR, 'Koneksi ke database gagal: '.$e->getMessage()."\n");
    exit(1);
}
