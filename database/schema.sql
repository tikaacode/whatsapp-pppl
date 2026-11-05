

CREATE DATABASE IF NOT EXISTS whatsapp_pppl
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE whatsapp_pppl;


CREATE TABLE IF NOT EXISTS tbl_pengguna (
    id_pengguna   BIGINT       NOT NULL AUTO_INCREMENT,
    no_telepon    VARCHAR(20)  NOT NULL,
    nama_profil   VARCHAR(100) NOT NULL,
    foto_profil   VARCHAR(255) NULL,
    about         VARCHAR(255) NOT NULL DEFAULT 'Hey there! I am using WhatsApp.',
    last_seen     TIMESTAMP    NULL,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_pengguna),
    UNIQUE KEY uq_pengguna_no_telepon (no_telepon)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS tbl_kontak (
    id_kontak           BIGINT       NOT NULL AUTO_INCREMENT,
    id_pemilik          BIGINT       NOT NULL,
    id_pengguna_kontak  BIGINT       NOT NULL,
    nama_kontak         VARCHAR(100) NOT NULL,
    created_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_kontak),
    UNIQUE KEY uq_kontak_pemilik_kontak (id_pemilik, id_pengguna_kontak),
    CONSTRAINT fk_kontak_pemilik
        FOREIGN KEY (id_pemilik) REFERENCES tbl_pengguna (id_pengguna)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_kontak_pengguna_kontak
        FOREIGN KEY (id_pengguna_kontak) REFERENCES tbl_pengguna (id_pengguna)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS tbl_percakapan (
    id_percakapan  BIGINT NOT NULL AUTO_INCREMENT,
    id_pengguna_1  BIGINT NOT NULL,
    id_pengguna_2  BIGINT NOT NULL,
    PRIMARY KEY (id_percakapan),
    UNIQUE KEY uq_percakapan_pasangan (id_pengguna_1, id_pengguna_2),
    CONSTRAINT fk_percakapan_pengguna_1
        FOREIGN KEY (id_pengguna_1) REFERENCES tbl_pengguna (id_pengguna)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_percakapan_pengguna_2
        FOREIGN KEY (id_pengguna_2) REFERENCES tbl_pengguna (id_pengguna)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS tbl_pesan (
    id_pesan         BIGINT    NOT NULL AUTO_INCREMENT,
    id_pengirim      BIGINT    NOT NULL,
    id_percakapan    BIGINT    NOT NULL,
    isi_terenkripsi  BLOB      NOT NULL,
    status_pesan     ENUM('terkirim', 'diterima', 'dibaca') NOT NULL DEFAULT 'terkirim',
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    diterima_at      TIMESTAMP NULL,
    dibaca_at        TIMESTAMP NULL,
    PRIMARY KEY (id_pesan),
    KEY idx_pesan_percakapan_waktu (id_percakapan, created_at),
    CONSTRAINT fk_pesan_pengirim
        FOREIGN KEY (id_pengirim) REFERENCES tbl_pengguna (id_pengguna)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_pesan_percakapan
        FOREIGN KEY (id_percakapan) REFERENCES tbl_percakapan (id_percakapan)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS tbl_status (
    id_status        BIGINT       NOT NULL AUTO_INCREMENT,
    id_pengguna      BIGINT       NOT NULL,
    jenis_status     ENUM('teks', 'media') NOT NULL,
    isi_terenkripsi  BLOB         NULL,
    path_media       VARCHAR(255) NULL,
    created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expired_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    privasi          ENUM('semua_kontak', 'kecuali_beberapa', 'hanya_terpilih')
                     NOT NULL DEFAULT 'semua_kontak',
    warna_latar      VARCHAR(7)   NULL,
    PRIMARY KEY (id_status),
    KEY idx_status_pengguna_expired (id_pengguna, expired_at),
    CONSTRAINT fk_status_pengguna
        FOREIGN KEY (id_pengguna) REFERENCES tbl_pengguna (id_pengguna)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS tbl_status_dilihat (
    id_status_dilihat  BIGINT    NOT NULL AUTO_INCREMENT,
    id_status          BIGINT    NOT NULL,
    id_penonton        BIGINT    NOT NULL,
    dilihat_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_status_dilihat),
    UNIQUE KEY uq_status_penonton (id_status, id_penonton),
    CONSTRAINT fk_dilihat_status
        FOREIGN KEY (id_status) REFERENCES tbl_status (id_status)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_dilihat_penonton
        FOREIGN KEY (id_penonton) REFERENCES tbl_pengguna (id_pengguna)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tbl_status_audiens (
    id_audiens   BIGINT NOT NULL AUTO_INCREMENT,
    id_status    BIGINT NOT NULL,
    id_pengguna  BIGINT NOT NULL,
    PRIMARY KEY (id_audiens),
    UNIQUE KEY uq_audiens_status_pengguna (id_status, id_pengguna),
    CONSTRAINT fk_audiens_status
        FOREIGN KEY (id_status) REFERENCES tbl_status (id_status)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_audiens_pengguna
        FOREIGN KEY (id_pengguna) REFERENCES tbl_pengguna (id_pengguna)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS tbl_kunci_publik (
    id_kunci      BIGINT    NOT NULL AUTO_INCREMENT,
    id_pengguna   BIGINT    NOT NULL,
    jenis_kunci   ENUM('identity_key', 'signed_prekey', 'one_time_prekey') NOT NULL,
    kunci_publik  BLOB      NOT NULL,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_kunci),
    KEY idx_kunci_pengguna_jenis (id_pengguna, jenis_kunci),
    CONSTRAINT fk_kunci_pengguna
        FOREIGN KEY (id_pengguna) REFERENCES tbl_pengguna (id_pengguna)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;