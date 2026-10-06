-- ============================================================
--  AgriSL -- Clean Developer Seed
--  Generated : 2026-09-09
--  Contains  : Full schema + 3 official demo accounts only.
--              No real user data, no chat history, no disease
--              reports, no notifications -- safe to share.
-- ============================================================

CREATE DATABASE IF NOT EXISTS agrisl
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE agrisl;

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
--  SCHEMA
-- ============================================================

DROP TABLE IF EXISTS `bookmarks`;
DROP TABLE IF EXISTS `article_ratings`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `disease_reports`;
DROP TABLE IF EXISTS `advisory_articles`;
DROP TABLE IF EXISTS `chat_messages`;
DROP TABLE IF EXISTS `chat_sessions`;
DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `id`                  INT PRIMARY KEY AUTO_INCREMENT,
  `name`                VARCHAR(100)  NOT NULL,
  `email`               VARCHAR(150)  NOT NULL UNIQUE,
  `password_hash`       VARCHAR(255)  NOT NULL,
  `role`                ENUM('farmer','officer','admin') NOT NULL DEFAULT 'farmer',
  `district`            VARCHAR(100)  NULL,
  `designation`         VARCHAR(150)  NULL,
  `province`            VARCHAR(100)  NULL,
  `cert_document_path`  VARCHAR(255)  NULL,
  `rejection_reason`    TEXT          NULL,
  `deactivation_reason` TEXT          NULL,
  `profile_picture`     VARCHAR(255)  NULL,
  `is_approved`         TINYINT       NOT NULL DEFAULT 1,
  `is_active`           TINYINT       NOT NULL DEFAULT 1,
  `created_at`          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `chat_sessions` (
  `id`         INT PRIMARY KEY AUTO_INCREMENT,
  `user_id`    INT  NOT NULL,
  `crop_type`  VARCHAR(100) NULL,
  `district`   VARCHAR(100) NULL,
  `language`   ENUM('en','si') NOT NULL DEFAULT 'en',
  `status`     ENUM('active','completed') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_chat_sessions_user` FOREIGN KEY (`user_id`)
    REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `chat_messages` (
  `id`         INT PRIMARY KEY AUTO_INCREMENT,
  `session_id` INT  NOT NULL,
  `role`       ENUM('user','assistant') NOT NULL,
  `content`    TEXT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_chat_messages_session` FOREIGN KEY (`session_id`)
    REFERENCES `chat_sessions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `disease_reports` (
  `id`                  INT PRIMARY KEY AUTO_INCREMENT,
  `user_id`             INT  NOT NULL,
  `crop_type`           VARCHAR(100)  NULL,
  `district`            VARCHAR(100)  NULL,
  `image_path`          VARCHAR(255)  NULL,
  `identified_species`  VARCHAR(255)  NULL,
  `disease_name`        VARCHAR(200)  NULL,
  `confidence_level`    VARCHAR(50)   NULL,
  `symptoms`            TEXT          NULL,
  `treatment_en`        TEXT          NULL,
  `treatment_si`        TEXT          NULL,
  `ml_prediction`       VARCHAR(200)  NULL,
  `ml_confidence`       DECIMAL(5,2)  NULL,
  `ml_class_index`      INT           NULL,
  `shared_with_officer` TINYINT       NOT NULL DEFAULT 0,
  `officer_id`          INT           NULL,
  `status`              ENUM('pending','reviewed') NOT NULL DEFAULT 'pending',
  `created_at`          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_disease_reports_user`    FOREIGN KEY (`user_id`)   REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_disease_reports_officer` FOREIGN KEY (`officer_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `advisory_articles` (
  `id`         INT PRIMARY KEY AUTO_INCREMENT,
  `officer_id` INT NOT NULL,
  `title_en`   VARCHAR(255)  NULL,
  `title_si`   VARCHAR(255)  NULL,
  `content_en` LONGTEXT      NULL,
  `content_si` LONGTEXT      NULL,
  `category`   ENUM('crop_management','pest_control','seasonal_planting','disease_treatment','market_advice','general') NOT NULL DEFAULT 'general',
  `tags`       VARCHAR(255)  NULL,
  `status`     ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  `views`      INT  NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_advisory_articles_officer` FOREIGN KEY (`officer_id`)
    REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `article_ratings` (
  `id`         INT PRIMARY KEY AUTO_INCREMENT,
  `article_id` INT     NOT NULL,
  `user_id`    INT     NOT NULL,
  `rating`     TINYINT NOT NULL CHECK (`rating` BETWEEN 1 AND 5),
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_article_user` (`article_id`, `user_id`),
  CONSTRAINT `fk_article_ratings_article` FOREIGN KEY (`article_id`) REFERENCES `advisory_articles`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_article_ratings_user`    FOREIGN KEY (`user_id`)    REFERENCES `users`(`id`)            ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `notifications` (
  `id`         INT PRIMARY KEY AUTO_INCREMENT,
  `user_id`    INT  NOT NULL,
  `type`       VARCHAR(100) NULL,
  `message`    TEXT         NULL,
  `is_read`    TINYINT      NOT NULL DEFAULT 0,
  `related_id` INT          NULL,
  `created_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`)
    REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `bookmarks` (
  `id`         INT PRIMARY KEY AUTO_INCREMENT,
  `user_id`    INT NOT NULL,
  `article_id` INT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_user_article` (`user_id`, `article_id`),
  CONSTRAINT `fk_bookmarks_user`    FOREIGN KEY (`user_id`)    REFERENCES `users`(`id`)            ON DELETE CASCADE,
  CONSTRAINT `fk_bookmarks_article` FOREIGN KEY (`article_id`) REFERENCES `advisory_articles`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
--  SEED DATA -- Official demo accounts only
--
--  Passwords (bcrypt cost 10):
--    admin@agrisl.lk   -> admin123
--    farmer@agrisl.lk  -> farmer123
--    officer@agrisl.lk -> officer123
-- ============================================================

INSERT INTO `users`
  (`id`, `name`, `email`, `password_hash`, `role`, `district`, `is_approved`, `is_active`)
VALUES
  (1, 'Admin',        'admin@agrisl.lk',   '$2b$10$8Zv7uHgZRsv7U8G4DxAj6eTKGkKhZ8joVtygxHU.TW4UksAAu3wK2', 'admin',   'Colombo', 1, 1),
  (2, 'Test Farmer',  'farmer@agrisl.lk',  '$2b$10$5rxFOUJaSi9J4FoC4.7CDOGvabUV.UGz.77d4JBW4xD7ucHJKS3xG', 'farmer',  'Kalutara',1, 1),
  (3, 'Test Officer', 'officer@agrisl.lk', '$2b$10$DCcTbSLs76o5bzZFkWNzyuL/GJURHFlniURE6xc6K/GiI8bm2hot6', 'officer', 'Galle',   1, 1);

-- All other tables are intentionally empty.
-- The developer starts with a clean slate and generates
-- their own activity data through the application.
