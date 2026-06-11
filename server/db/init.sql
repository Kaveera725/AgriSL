-- AgriSL database schema
-- Run against a MySQL server. Creates the database and all tables.

CREATE DATABASE IF NOT EXISTS agrisl
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE agrisl;

-- Users (farmers, officers, admins)
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('farmer', 'officer', 'admin') NOT NULL DEFAULT 'farmer',
  district VARCHAR(100),
  -- Officers require admin approval, so they default to 0 at signup.
  -- Column default is 1; the signup logic sets 0 for officers.
  is_approved TINYINT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- AI chat sessions
CREATE TABLE IF NOT EXISTS chat_sessions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  crop_type VARCHAR(100),
  district VARCHAR(100),
  language ENUM('en', 'si') NOT NULL DEFAULT 'en',
  status ENUM('active', 'completed') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_chat_sessions_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Individual messages within a chat session
CREATE TABLE IF NOT EXISTS chat_messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  session_id INT NOT NULL,
  role ENUM('user', 'assistant') NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_chat_messages_session FOREIGN KEY (session_id)
    REFERENCES chat_sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Crop disease detection reports
CREATE TABLE IF NOT EXISTS disease_reports (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  crop_type VARCHAR(100),
  district VARCHAR(100),
  image_path VARCHAR(255),
  disease_name VARCHAR(200),
  confidence_level VARCHAR(50),
  symptoms TEXT,
  treatment_en TEXT,
  treatment_si TEXT,
  shared_with_officer TINYINT NOT NULL DEFAULT 0,
  officer_id INT NULL,
  status ENUM('pending', 'reviewed') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_disease_reports_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_disease_reports_officer FOREIGN KEY (officer_id)
    REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Advisory articles authored by officers
CREATE TABLE IF NOT EXISTS advisory_articles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  officer_id INT NOT NULL,
  title_en VARCHAR(255),
  title_si VARCHAR(255),
  content_en LONGTEXT,
  content_si LONGTEXT,
  category ENUM(
    'crop_management',
    'pest_control',
    'seasonal_planting',
    'disease_treatment',
    'market_advice',
    'general'
  ) NOT NULL DEFAULT 'general',
  tags VARCHAR(255),
  status ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'draft',
  views INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_advisory_articles_officer FOREIGN KEY (officer_id)
    REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Article ratings (one rating per user per article)
CREATE TABLE IF NOT EXISTS article_ratings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  article_id INT NOT NULL,
  user_id INT NOT NULL,
  rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_article_ratings_article FOREIGN KEY (article_id)
    REFERENCES advisory_articles(id) ON DELETE CASCADE,
  CONSTRAINT fk_article_ratings_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_article_user (article_id, user_id)
) ENGINE=InnoDB;

-- User notifications
CREATE TABLE IF NOT EXISTS notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  type VARCHAR(100),
  message TEXT,
  is_read TINYINT NOT NULL DEFAULT 0,
  related_id INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Article bookmarks (one bookmark per user per article)
CREATE TABLE IF NOT EXISTS bookmarks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  article_id INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_bookmarks_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_bookmarks_article FOREIGN KEY (article_id)
    REFERENCES advisory_articles(id) ON DELETE CASCADE,
  UNIQUE KEY uq_user_article (user_id, article_id)
) ENGINE=InnoDB;
