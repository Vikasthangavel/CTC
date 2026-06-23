-- MySQL dump 10.13  Distrib 8.0.40, for Win64 (x86_64)
--
-- Host: 165.99.52.33    Database: ctc_db
-- ------------------------------------------------------
-- Server version	8.0.42

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `daily_activities`
--

DROP TABLE IF EXISTS `daily_activities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `daily_activities` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `activity_date` varchar(20) NOT NULL,
  `content` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `daily_activities_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=83 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `daily_activities`
--

LOCK TABLES `daily_activities` WRITE;
/*!40000 ALTER TABLE `daily_activities` DISABLE KEYS */;
INSERT INTO `daily_activities` VALUES (2,19,'2026-01-19','All school home work completed exept maths.\r\nHindi home work completed \r\n','2026-01-19 13:26:59'),(3,4,'2026-01-19','Maths matrix basic revision ','2026-01-19 13:28:56'),(4,4,'2026-01-19','English life poem teaching ','2026-01-19 13:57:03'),(5,5,'2026-01-19','Maths matrix basic revision \r\nEnglish Life poem teaching ','2026-01-19 13:57:37'),(6,6,'2026-01-19','Science \r\n school 50 mark exam revision ','2026-01-19 13:58:26'),(7,7,'2026-01-19','School Home work completed \r\nEnglish and tamil book read practice ','2026-01-19 14:00:04'),(8,9,'2026-01-19','Maths matrix basic revision ','2026-01-19 14:00:29'),(9,10,'2026-01-19','Maths matrix basic revision ','2026-01-19 14:00:47'),(10,11,'2026-01-19','Phisics record writing work','2026-01-19 14:02:31'),(11,12,'2026-01-19','School Home work completed ','2026-01-19 14:03:45'),(12,14,'2026-01-19','School science exam revision ','2026-01-19 14:05:19'),(13,16,'2026-01-19','Maths FoG sums basic ','2026-01-19 14:09:07'),(14,17,'2026-01-19','School Home work completed \r\nTables maths\r\nTamil and English reading practice ','2026-01-19 14:09:57'),(15,4,'2026-01-20','Phisics L-1 , part one teaching ','2026-01-20 14:32:13'),(16,5,'2026-01-20','Science L-1 part-1 teaching','2026-01-20 15:58:21'),(17,6,'2026-01-20','Study for science school exam ','2026-01-20 16:00:24'),(18,9,'2026-01-20','Maths Matrix basic revision ','2026-01-20 16:01:59'),(19,7,'2026-01-20','School home work completed Tamil English 2 Page Reading','2026-01-20 16:02:20'),(20,10,'2026-01-20','Maths Matrix basic revision ','2026-01-20 16:02:24'),(21,11,'2026-01-20','Physics school exam revision ','2026-01-20 16:03:29'),(22,8,'2026-01-20','Maths School home work competed ','2026-01-20 16:04:51'),(23,14,'2026-01-20','Biology school exam revision ','2026-01-20 16:04:55'),(24,12,'2026-01-20','Completed school Home work ','2026-01-20 16:22:07'),(25,13,'2026-01-20','Completed school Home work ','2026-01-20 16:22:38'),(26,15,'2026-01-20','Completed school Home work \r\nTables revision \r\n','2026-01-20 16:23:20'),(27,17,'2026-01-20','Completed school Home work \r\nTables revision \r\n','2026-01-20 16:23:57'),(28,18,'2026-01-20','Completed school Home work \r\nTamil letters revision ','2026-01-20 16:24:50'),(29,4,'2026-01-21','10 the science part one completed','2026-01-21 15:02:19'),(30,5,'2026-01-21','10 th science part one completed','2026-01-21 15:04:40'),(31,6,'2026-01-21','Revision for school social science exam','2026-01-21 15:06:55'),(32,7,'2026-01-21','School seience home work competed and Tamil 2 Page English 2 page Reading','2026-01-21 15:08:43'),(33,8,'2026-01-21','School science home work and maths home work completed ','2026-01-21 15:10:07'),(34,14,'2026-01-21','School Tamil exam revision','2026-01-21 15:15:57'),(35,16,'2026-01-21','School social science exam revision','2026-01-21 15:17:03'),(36,9,'2026-01-21','Math\'s matrix\'s basis revision','2026-01-21 15:22:13'),(37,10,'2026-01-21','Maths matrix\'s basis revision','2026-01-21 15:24:09'),(40,12,'2026-01-21','School home work completed','2026-01-22 03:41:53'),(41,11,'2026-01-21','Physics first 3 lesson 2mark','2026-01-22 03:43:16'),(42,15,'2026-01-21','Home work completed\r\nMaths addition sums and tables','2026-01-22 03:44:28'),(43,17,'2026-01-21','Home work completed\r\nTables and Tamil letters revision','2026-01-22 03:45:17'),(44,18,'2026-01-21','Tamil letters revision\r\nAddition sums','2026-01-22 03:45:52'),(45,19,'2026-01-21','Home work completed\r\nGeneral d words- 6 words','2026-01-22 03:50:34'),(46,9,'2026-01-22','Maths matrix 3.17 sums','2026-01-22 14:22:24'),(47,10,'2026-01-22','Maths matrix 3.17 sums','2026-01-22 14:22:50'),(48,11,'2026-01-22','Physics 4 lesson ','2026-01-22 14:23:23'),(49,12,'2026-01-22','3 school home work completed ','2026-01-22 14:24:09'),(50,13,'2026-01-22','School Home work completed \r\nBasic d- word\'s ','2026-01-22 14:25:16'),(51,14,'2026-01-22','School exam revision \r\nTamil neduvina u-4  details ','2026-01-22 14:27:16'),(52,16,'2026-01-22','Study for School exam \r\nHistory and civics ','2026-01-22 14:28:05'),(53,15,'2026-01-22','School Home work completed \r\nBasic D- word\'s ','2026-01-22 14:28:48'),(54,17,'2026-01-22','School Home work completed \r\nBasic D- word\'s ','2026-01-22 14:29:22'),(55,18,'2026-01-22','தமிழ் குறில் நெடில் படித்தல் ','2026-01-22 14:30:22'),(56,19,'2026-01-22','School Home work completed \r\nBasic D-word\'s - 5 read and write ','2026-01-22 14:31:12'),(57,4,'2026-01-22','10 th science part 2 ','2026-01-22 15:17:22'),(58,5,'2026-01-22','10 th science part 2','2026-01-22 15:17:50'),(59,6,'2026-01-22','School social science exam revision','2026-01-22 15:19:05'),(60,7,'2026-01-22','School home work complete and Tamil English 2 page Reading add ,sub,mul div  compiled','2026-01-22 15:22:07'),(61,8,'2026-01-22','School home work complete Tamil English 2 page Reading Tamil first lesson memory poem completed add,sub completed','2026-01-22 15:25:02'),(62,4,'2026-01-23','10 th science part 2','2026-01-23 14:51:29'),(63,5,'2026-01-23','10 th science part 2','2026-01-23 14:52:16'),(64,6,'2026-01-23','School social science exam revision ','2026-01-23 14:54:28'),(65,7,'2026-01-23','School home work completed','2026-01-23 14:55:09'),(66,8,'2026-01-23','School Tamil composition completed and maths,English school home work completed','2026-01-23 14:56:29'),(67,9,'2026-01-23','English life poem 4 line teaching ','2026-01-23 15:43:16'),(68,10,'2026-01-23','English life poem 4 line teaching ','2026-01-23 15:43:38'),(69,11,'2026-01-23','Science important question study for exam','2026-01-23 15:48:55'),(70,14,'2026-01-23','Half session tamil full portion revision for school exam.. \r\nAnother half session leave','2026-01-23 15:50:01'),(71,15,'2026-01-23','Home work completed..\r\nEnglish D-word\'s study ','2026-01-23 15:50:53'),(72,16,'2026-01-23','Study Social for school exam ','2026-01-23 15:51:37'),(73,17,'2026-01-23','Home work completed \r\nLearn basic division \r\nEnglish D-word\'s study ','2026-01-23 15:52:25'),(74,18,'2026-01-23','School Home work completed \r\nTamil basic reading \r\n2 &3Tables','2026-01-23 15:53:17'),(75,19,'2026-01-23','School Home work completed \r\nEnglish D-word\'s study \r\n','2026-01-23 15:54:30'),(76,4,'2026-01-24','School fare note work ','2026-01-24 15:02:04'),(77,7,'2026-01-24','School home work note completed add,sub revision','2026-01-24 15:03:20'),(78,14,'2026-01-24','10 th maths 1.1 revision','2026-01-24 15:05:25'),(79,10,'2026-01-24','10 Maths matrix\'s revision','2026-01-24 15:06:45'),(80,9,'2026-01-24','10 th maths matrix revision ','2026-01-24 15:07:37'),(81,16,'2026-01-24','Study Social for school exam ','2026-01-24 15:41:37'),(82,17,'2026-01-24','School Home work completed \r\n5 D-word\'s study ','2026-01-24 15:43:27');
/*!40000 ALTER TABLE `daily_activities` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-23 22:04:03
