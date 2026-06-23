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
-- Table structure for table `students`
--

DROP TABLE IF EXISTS `students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `students` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `grade` int NOT NULL,
  `parent_name` varchar(255) NOT NULL,
  `parent_contact` varchar(255) NOT NULL,
  `monthly_fee` float NOT NULL DEFAULT '0',
  `dob` varchar(20) DEFAULT NULL,
  `blood_group` varchar(10) DEFAULT NULL,
  `is_active` tinyint DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `students`
--

LOCK TABLES `students` WRITE;
/*!40000 ALTER TABLE `students` DISABLE KEYS */;
INSERT INTO `students` VALUES (4,'Poorani',9,'Poongodi','9698236689',350,'2011-08-04','B+',1),(5,'Honey',9,'Sakthi','9715913958',350,'2011-07-31','A+',1),(6,'Subasri',10,'Prabu','9944356583',700,'2011-06-26','B-',0),(7,'Mownitha',4,'Pandiyan','7373494962',250,'2016-09-28','O+',1),(8,'Darshana',6,'Saravanakumar','9566626664',300,'2014-05-09','B+',1),(9,'Nishanth',9,'Mohanraj','8508269878',500,'2011-10-22','A+',1),(10,'Sabari',9,'Priya','9791204282',500,'2012-02-20','O+',1),(11,'Magith kumar',11,'Prabu','9944356583',700,'2009-12-07','B+',0),(12,'Shanmugaharshan',8,'Vaithiyalingam','9677399739',400,'2012-11-07','B+',0),(13,'Saktheswaran',5,'Thamaraiselven','9677826507',250,'2015-05-13','B+',0),(14,'Kavibarathi',10,'Nallasamy','9788006867',600,'2011-05-08','O+',0),(15,'Suhirthan',4,'Saravanakumar','9566626664',250,'2016-04-10','B+',1),(16,'Ragul',10,'Dhivya','9659381203',600,'2011-04-20','B+',0),(17,'Gowshik',4,'Murugan','9894527643',250,'2016-09-26','B+',1),(18,'Vasigaran',4,'Sekar','6379245164',250,'2026-01-12','B+',1),(19,'Siddharth',3,'Ramesh','9677495942',200,'2017-04-22','O+',0);
/*!40000 ALTER TABLE `students` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-23 22:04:06
