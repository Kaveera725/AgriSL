-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: agrisl
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `advisory_articles`
--

DROP TABLE IF EXISTS `advisory_articles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `advisory_articles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `officer_id` int NOT NULL,
  `title_en` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title_si` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `content_en` longtext COLLATE utf8mb4_unicode_ci,
  `content_si` longtext COLLATE utf8mb4_unicode_ci,
  `category` enum('crop_management','pest_control','seasonal_planting','disease_treatment','market_advice','general') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'general',
  `tags` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('draft','published','archived') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `views` int NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_advisory_articles_officer` (`officer_id`),
  CONSTRAINT `fk_advisory_articles_officer` FOREIGN KEY (`officer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `advisory_articles`
--

LOCK TABLES `advisory_articles` WRITE;
/*!40000 ALTER TABLE `advisory_articles` DISABLE KEYS */;
/*!40000 ALTER TABLE `advisory_articles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `article_ratings`
--

DROP TABLE IF EXISTS `article_ratings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `article_ratings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `article_id` int NOT NULL,
  `user_id` int NOT NULL,
  `rating` tinyint NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_article_user` (`article_id`,`user_id`),
  KEY `fk_article_ratings_user` (`user_id`),
  CONSTRAINT `fk_article_ratings_article` FOREIGN KEY (`article_id`) REFERENCES `advisory_articles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_article_ratings_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `article_ratings_chk_1` CHECK ((`rating` between 1 and 5))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `article_ratings`
--

LOCK TABLES `article_ratings` WRITE;
/*!40000 ALTER TABLE `article_ratings` DISABLE KEYS */;
/*!40000 ALTER TABLE `article_ratings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bookmarks`
--

DROP TABLE IF EXISTS `bookmarks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bookmarks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `article_id` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_article` (`user_id`,`article_id`),
  KEY `fk_bookmarks_article` (`article_id`),
  CONSTRAINT `fk_bookmarks_article` FOREIGN KEY (`article_id`) REFERENCES `advisory_articles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_bookmarks_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bookmarks`
--

LOCK TABLES `bookmarks` WRITE;
/*!40000 ALTER TABLE `bookmarks` DISABLE KEYS */;
/*!40000 ALTER TABLE `bookmarks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_messages`
--

DROP TABLE IF EXISTS `chat_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `session_id` int NOT NULL,
  `role` enum('user','assistant') COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_chat_messages_session` (`session_id`),
  CONSTRAINT `fk_chat_messages_session` FOREIGN KEY (`session_id`) REFERENCES `chat_sessions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_messages`
--

LOCK TABLES `chat_messages` WRITE;
/*!40000 ALTER TABLE `chat_messages` DISABLE KEYS */;
INSERT INTO `chat_messages` VALUES (1,1,'user','hi','2026-09-06 01:49:44'),(2,2,'user','hi','2026-09-06 01:50:09');
/*!40000 ALTER TABLE `chat_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_sessions`
--

DROP TABLE IF EXISTS `chat_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `crop_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `district` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `language` enum('en','si') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'en',
  `status` enum('active','completed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_chat_sessions_user` (`user_id`),
  CONSTRAINT `fk_chat_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_sessions`
--

LOCK TABLES `chat_sessions` WRITE;
/*!40000 ALTER TABLE `chat_sessions` DISABLE KEYS */;
INSERT INTO `chat_sessions` VALUES (1,2,'Rubber','Kalutara','en','active','2026-09-06 01:49:41'),(2,2,'Tea','Kalutara','en','active','2026-09-06 01:50:05');
/*!40000 ALTER TABLE `chat_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `disease_reports`
--

DROP TABLE IF EXISTS `disease_reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `disease_reports` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `crop_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `district` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `identified_species` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `disease_name` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `confidence_level` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `symptoms` text COLLATE utf8mb4_unicode_ci,
  `treatment_en` text COLLATE utf8mb4_unicode_ci,
  `treatment_si` text COLLATE utf8mb4_unicode_ci,
  `ml_prediction` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Disease class predicted by custom ML model',
  `ml_confidence` decimal(5,2) DEFAULT NULL COMMENT 'ML model confidence score as percentage',
  `ml_class_index` int DEFAULT NULL COMMENT 'Numeric class index from ML model output',
  `shared_with_officer` tinyint NOT NULL DEFAULT '0',
  `officer_id` int DEFAULT NULL,
  `status` enum('pending','reviewed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_disease_reports_user` (`user_id`),
  KEY `fk_disease_reports_officer` (`officer_id`),
  CONSTRAINT `fk_disease_reports_officer` FOREIGN KEY (`officer_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_disease_reports_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `disease_reports`
--

LOCK TABLES `disease_reports` WRITE;
/*!40000 ALTER TABLE `disease_reports` DISABLE KEYS */;
INSERT INTO `disease_reports` VALUES (1,1394,'Tomato','Kandy','1788613512438-336783594.jpg',NULL,'Test Disease','High','Test symptoms','Test treatment','පරීක්ෂණ ප්‍රතිකාර',NULL,NULL,NULL,0,NULL,'pending','2026-09-05 13:05:12'),(2,1395,'Rice','Kandy','1788613512556-11802020.jpg',NULL,'Test Disease','High','Test symptoms','Test treatment','පරීක්ෂණ ප්‍රතිකාර','Rice blast',82.00,NULL,0,NULL,'pending','2026-09-05 13:05:12'),(3,1396,'Rice','Kandy','1788613512752-307711958.jpg',NULL,'Test Disease','High','Test symptoms','Test treatment','පරීක්ෂණ ප්‍රතිකාර',NULL,NULL,NULL,0,NULL,'pending','2026-09-05 13:05:12'),(4,1397,'Tea','Galle','1788613512770-672847882.jpg',NULL,'Test Disease','High','Test symptoms','Test treatment','පරීක්ෂණ ප්‍රතිකාර',NULL,NULL,NULL,0,NULL,'pending','2026-09-05 13:05:12'),(5,2,'Chilli','Kegalle','1788636457535-459921912.JPG','Winter cherry (Withania somnifera) — 17% match','Pepper Bacterial Spot','High','The trained model identified \"Pepper Bacterial Spot\" on Bell.','Consult a local agricultural officer to confirm and obtain a treatment plan.','Consult a local agricultural officer to confirm and obtain a treatment plan.','Bell_Pepper_Bacterial_Spot',100.00,NULL,0,NULL,'pending','2026-09-05 19:27:40'),(6,2,'Tomato','Galle','1788659315910-44541839.JPG','Peppers (Capsicum annuum) — 56% match','Pepper Bacterial Spot','High','The trained model identified \"Pepper Bacterial Spot\" on Bell.','Consult a local agricultural officer to confirm and obtain a treatment plan.','Consult a local agricultural officer to confirm and obtain a treatment plan.','Bell_Pepper_Bacterial_Spot',99.97,NULL,0,NULL,'pending','2026-09-06 01:48:38'),(7,2,'Tomato','Gampaha','1788659515755-167340568.JPG','Potato (Solanum tuberosum) — 94% match','No disease detected','High','No visible signs of disease were detected.','No treatment needed. Continue good agricultural practices.','No treatment needed. Continue good agricultural practices.','Potato_Healthy',99.98,NULL,0,NULL,'pending','2026-09-06 01:51:58'),(8,2,'Tomato','Galle','1788659556396-496502590.JPG','Garden Tomato (Solanum lycopersicum) — 81% match','Septoria Leaf Spot','High','The trained model identified \"Septoria Leaf Spot\" on Tomato.','Consult a local agricultural officer to confirm and obtain a treatment plan.','Consult a local agricultural officer to confirm and obtain a treatment plan.','Tomato_Septoria_Leaf_Spot',96.95,NULL,0,NULL,'pending','2026-09-06 01:52:40');
/*!40000 ALTER TABLE `disease_reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message` text COLLATE utf8mb4_unicode_ci,
  `is_read` tinyint NOT NULL DEFAULT '0',
  `related_id` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_notifications_user` (`user_id`),
  CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,1394,'disease_result','Disease detection complete: Test Disease identified in your Tomato.',0,1,'2026-09-05 13:05:12'),(2,1395,'disease_result','Disease detection complete: Test Disease identified in your Rice.',0,2,'2026-09-05 13:05:12'),(3,1396,'disease_result','Disease detection complete: Test Disease identified in your Rice.',0,3,'2026-09-05 13:05:12'),(4,1397,'disease_result','Disease detection complete: Test Disease identified in your Tea.',0,4,'2026-09-05 13:05:12'),(5,2,'disease_result','Disease detection complete: Pepper Bacterial Spot identified in your Chilli.',0,5,'2026-09-05 19:27:40'),(6,2,'disease_result','Disease detection complete: Pepper Bacterial Spot identified in your Tomato.',0,6,'2026-09-06 01:48:38'),(7,2,'disease_result','Disease detection complete: No disease detected identified in your Tomato.',0,7,'2026-09-06 01:51:58'),(8,2,'disease_result','Disease detection complete: Septoria Leaf Spot identified in your Tomato.',0,8,'2026-09-06 01:52:40');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('farmer','officer','admin') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'farmer',
  `district` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gov_service_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `designation` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `province` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cert_document_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rejection_reason` text COLLATE utf8mb4_unicode_ci,
  `deactivation_reason` text COLLATE utf8mb4_unicode_ci,
  `is_approved` tinyint NOT NULL DEFAULT '1',
  `is_active` tinyint NOT NULL DEFAULT '1',
  `profile_picture` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=1398 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Admin','admin@agrisl.lk','$2b$10$8Zv7uHgZRsv7U8G4DxAj6eTKGkKhZ8joVtygxHU.TW4UksAAu3wK2','admin','Colombo',NULL,NULL,NULL,NULL,NULL,NULL,1,1,NULL,'2026-06-12 03:54:55'),(2,'Test Farmer','farmer@agrisl.lk','$2b$10$5rxFOUJaSi9J4FoC4.7CDOGvabUV.UGz.77d4JBW4xD7ucHJKS3xG','farmer','Kalutara',NULL,NULL,NULL,NULL,NULL,NULL,1,1,'1786250701225-905661063.jpeg','2026-06-12 03:54:55'),(3,'Test Officer','officer@agrisl.lk','$2b$10$DCcTbSLs76o5bzZFkWNzyuL/GJURHFlniURE6xc6K/GiI8bm2hot6','officer','Galle',NULL,NULL,NULL,NULL,NULL,NULL,1,1,'1786250870531-914792398.png','2026-06-12 03:54:55'),(1391,'Test User','u_1788613512004_647934@test.lk','$2b$10$H2VSKT9GCJTlBBnhKedMRuN5OClPU6mr5fKqZZUvbeJCNZHsfxWCe','farmer','Kandy',NULL,NULL,NULL,NULL,NULL,NULL,1,1,NULL,'2026-09-05 13:05:12'),(1392,'Test User','u_1788613512143_517106@test.lk','$2b$10$EV9f5d0S/Tt7Vy1Yv5gz7epFeU6WHE3RQn.gfuh6fXZKECe6EEZl6','farmer','Kandy',NULL,NULL,NULL,NULL,NULL,NULL,1,1,NULL,'2026-09-05 13:05:12'),(1393,'Test User','u_1788613512252_187488@test.lk','$2b$10$yKgsq.8sdduRA5mNmdj8guB0NFiY/Dul6UpJAL1rp1Ihj1P72rBmK','farmer','Kandy',NULL,NULL,NULL,NULL,NULL,NULL,1,1,NULL,'2026-09-05 13:05:12'),(1394,'Test User','u_1788613512348_958488@test.lk','$2b$10$hwCaU73kGEBLrdtSrdj9H.r9Vy4s3G3RUT2NVl26oo.HLpUOMshGy','farmer','Kandy',NULL,NULL,NULL,NULL,NULL,NULL,1,1,NULL,'2026-09-05 13:05:12'),(1395,'Test User','u_1788613512460_820001@test.lk','$2b$10$IQB/XnM6eTFhxbopzpf7h.KKkHvWbUiYTMLoUu2NzLtejkFRO6pXy','farmer','Kandy',NULL,NULL,NULL,NULL,NULL,NULL,1,1,NULL,'2026-09-05 13:05:12'),(1396,'Test User','u_1788613512572_301092@test.lk','$2b$10$o4NuMXYvOYPHynmwQouQ3.9B1f7uyJU7jRal32FZE6MbjKFtapuDO','farmer','Kandy',NULL,NULL,NULL,NULL,NULL,NULL,1,1,NULL,'2026-09-05 13:05:12'),(1397,'Test User','u_1788613512660_988396@test.lk','$2b$10$iC4bKvu70KiAB4PyGYF/AOC6dTJa8dgoc2ZhLsrPRxU1tLShl9by6','farmer','Kandy',NULL,NULL,NULL,NULL,NULL,NULL,1,1,NULL,'2026-09-05 13:05:12');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'agrisl'
--

--
-- Dumping routines for database 'agrisl'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-09 12:18:41
