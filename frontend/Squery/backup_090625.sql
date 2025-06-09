CREATE DATABASE  IF NOT EXISTS `educa_db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;
USE `educa_db`;
-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: educa_db
-- ------------------------------------------------------
-- Server version	5.5.5-10.4.32-MariaDB

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
-- Table structure for table `docente_materia`
--

DROP TABLE IF EXISTS `docente_materia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `docente_materia` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `docente_id` int(11) NOT NULL,
  `materia_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_doc_mat` (`docente_id`,`materia_id`),
  KEY `materia_id` (`materia_id`),
  CONSTRAINT `docente_materia_ibfk_1` FOREIGN KEY (`docente_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `docente_materia_ibfk_2` FOREIGN KEY (`materia_id`) REFERENCES `materias` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `docente_materia`
--

LOCK TABLES `docente_materia` WRITE;
/*!40000 ALTER TABLE `docente_materia` DISABLE KEYS */;
INSERT INTO `docente_materia` VALUES (2,1,1),(1,1,4),(3,1,8),(4,18,1);
/*!40000 ALTER TABLE `docente_materia` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `estudiante_materia`
--

DROP TABLE IF EXISTS `estudiante_materia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `estudiante_materia` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `estudiante_id` int(11) NOT NULL,
  `materia_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `estudiante_id` (`estudiante_id`),
  KEY `materia_id` (`materia_id`),
  CONSTRAINT `estudiante_materia_ibfk_1` FOREIGN KEY (`estudiante_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `estudiante_materia_ibfk_2` FOREIGN KEY (`materia_id`) REFERENCES `materias` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=126 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `estudiante_materia`
--

LOCK TABLES `estudiante_materia` WRITE;
/*!40000 ALTER TABLE `estudiante_materia` DISABLE KEYS */;
INSERT INTO `estudiante_materia` VALUES (9,3,8),(10,3,4),(11,3,7),(12,3,3),(13,3,5),(14,3,6),(15,3,1),(16,3,2),(17,3,9),(18,6,4),(19,6,1),(20,6,8),(21,6,7),(22,6,3),(23,6,5),(24,6,6),(25,6,2),(26,6,9),(27,7,8),(28,7,4),(29,7,7),(30,7,3),(31,7,5),(32,7,6),(33,7,1),(34,7,2),(35,7,9),(36,8,8),(37,8,4),(38,8,7),(39,8,3),(40,8,5),(41,8,6),(42,8,1),(43,8,2),(44,8,9),(45,9,8),(46,9,4),(47,9,7),(48,9,3),(49,9,5),(50,9,6),(51,9,1),(52,9,2),(53,9,9),(54,10,8),(55,10,4),(56,10,7),(57,10,3),(58,10,5),(59,10,6),(60,10,1),(61,10,2),(62,10,9),(63,11,8),(64,11,4),(65,11,7),(66,11,3),(67,11,5),(68,11,6),(69,11,1),(70,11,2),(71,11,9),(72,12,8),(73,12,4),(74,12,7),(75,12,3),(76,12,5),(77,12,6),(78,12,1),(79,12,2),(80,12,9),(81,13,8),(82,13,4),(83,13,7),(84,13,3),(85,13,5),(86,13,6),(87,13,1),(88,13,2),(89,13,9),(90,14,8),(91,14,4),(92,14,7),(93,14,3),(94,14,5),(95,14,6),(96,14,1),(97,14,2),(98,14,9),(99,15,8),(100,15,4),(101,15,7),(102,15,3),(103,15,5),(104,15,6),(105,15,1),(106,15,2),(107,15,9),(108,16,8),(109,16,4),(110,16,7),(111,16,3),(112,16,5),(113,16,6),(114,16,1),(115,16,2),(116,16,9),(117,17,8),(118,17,4),(119,17,7),(120,17,3),(121,17,5),(122,17,6),(123,17,1),(124,17,2),(125,17,9);
/*!40000 ALTER TABLE `estudiante_materia` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `materias`
--

DROP TABLE IF EXISTS `materias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `materias` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `codigo` varchar(50) NOT NULL,
  `facultad` varchar(100) NOT NULL,
  `jefe_carrera` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `materias`
--

LOCK TABLES `materias` WRITE;
/*!40000 ALTER TABLE `materias` DISABLE KEYS */;
INSERT INTO `materias` VALUES (1,'Primeros Auxilios','PAU','Fundacion Sedes Sapientiae','Mgr. Oscar Velasco'),(2,'Primeros Auxilios Psicologicos','PAPS','Fundacion Sedes Sapientiae','Mgr. Oscar Velasco'),(3,'Etica','Etica','Fundacion Sedes Sapientiae','Mgr. Oscar Velasco'),(4,'Comunicaciones','COM','Fundacion Sedes Sapientiae','Mgr. Oscar Velasco'),(5,'Lucha contra Incendios','LCI','Fundacion Sedes Sapientiae','Mgr. Oscar Velasco'),(6,'Orden Cerrado','OCE','Fundacion Sedes Sapientiae','Mgr. Oscar Velasco'),(7,'Ejercicio Fisico de Rescate','EFR','Fundacion Sedes Sapientiae','Mgr. Oscar Velasco'),(8,'Busqueda y Rescate','BRE','Fundacion Sedes Sapientiae','Mgr. Oscar Velasco'),(9,'Seguridad en Escena','SESC','Fundacion Sedes Sapientiae','Mgr. Oscar Velasco');
/*!40000 ALTER TABLE `materias` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) DEFAULT NULL,
  `apellido_paterno` varchar(100) NOT NULL,
  `apellido_materno` varchar(100) NOT NULL,
  `correo` varchar(100) DEFAULT NULL,
  `fecha_nacimiento` date NOT NULL DEFAULT '2020-01-01',
  `contrasena` varchar(255) DEFAULT NULL,
  `rol` enum('admin','docente','estudiante') DEFAULT NULL,
  `estado` tinyint(4) NOT NULL DEFAULT 1,
  `telefono` varchar(20) NOT NULL,
  `carnet_identidad` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `correo` (`correo`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'Andres Azcárraga','','','carlos@demo.com','2020-01-01','123456','docente',1,'',NULL),(2,'Carlos Azcárraga','','','admin@demo.com','2020-01-01','123456','admin',1,'70776212','4947021'),(3,'Carlos','Azcarraga','Esquivel','estudiante@demo.com','2000-11-29','4947021','estudiante',1,'70776212','4947021'),(4,'Carlos','Azcarraga','Esquivel','docente@demo.com','2000-11-29','4947022','docente',1,'70776212','4947022'),(5,'Carlos','Alvarez','Azcarraga','administrador@demo.com','2000-12-29','4947022','admin',1,'70776212','4947022'),(6,'Pablo','Azcarraga','Esquivel','pablo@demo.com','2000-10-29','4947022','estudiante',1,'79361121','4947022'),(7,'Josué','Monroy','Ardaya','josuema96@gmail.com','2020-05-10','7620920','estudiante',1,'75058741','7620920'),(8,'Luz Zarela ','Perez','Rocha','luzzarelaperezrocha@gmail.com','2020-10-10','12681939','estudiante',1,'76439273','12681939'),(9,'Patricia','Castellon','Flores','castellonflorespatricia@gmail.com','2020-01-10','14440582','estudiante',1,'65711047','14440582'),(10,'Alvaro Marcelo','Melgar','Mejia','melgaralvaro8@gmail.com','2020-01-10','14092936','estudiante',1,'76982189','14092936'),(11,'Andrea Patricia','Ballesteros','Chumacero','andrea.ballesteros@ucb.edu.bo','2020-01-10','13590075','estudiante',1,'67429432','13590075'),(12,'Alejandro','Miranda','Andia','mirandaalejando3@gmail.com','2020-01-10','8755165','estudiante',1,'75498373','8755165'),(13,'Livan Jossue','Cordova','Viscarra','7.huecomundo@gmail.com','2020-01-10','8676325','estudiante',1,'74310992','8676325'),(14,'Juan Pablo','Mendoza','Peña','juan.pablo.mendoza.pena@gmail.com','2020-01-10','4411474','estudiante',1,'79325675','4411474'),(15,'Mauricio Alejandro','Vera','Monroy','mvera@demo.com','2020-01-10','3802856','estudiante',1,'70368508','3802856'),(16,'Camilo Alberto ','Meruvia','Zegarra','cmeruvia@demo.com','2020-01-10','13192888','estudiante',1,'74838973','13192888'),(17,'Jesús Rafael','Serrudo','Moscoso','jmoscoso@demo.com','2020-01-10','5261496','estudiante',1,'71730168','5261496'),(18,'Juan Carlos','Zegada','Bazan','jzegada@demo.com','2020-10-10','1234567','docente',1,'72225515','1234567');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-06-09 16:25:17
