-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: indoor_sports_complex_db
-- ------------------------------------------------------
-- Server version	8.0.44

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
-- Table structure for table `attendance`
--

DROP TABLE IF EXISTS `attendance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance` (
  `AttendanceID` int NOT NULL AUTO_INCREMENT,
  `EnrollmentID` int NOT NULL,
  `SessionID` int NOT NULL,
  `Status` enum('NOT_MARKED','PRESENT','ABSENT') DEFAULT 'NOT_MARKED',
  `MarkedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`AttendanceID`),
  UNIQUE KEY `EnrollmentID` (`EnrollmentID`,`SessionID`),
  KEY `SessionID` (`SessionID`),
  CONSTRAINT `attendance_ibfk_1` FOREIGN KEY (`EnrollmentID`) REFERENCES `enrollment` (`EnrollmentID`),
  CONSTRAINT `attendance_ibfk_2` FOREIGN KEY (`SessionID`) REFERENCES `classsession` (`SessionID`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `blockedslot`
--

DROP TABLE IF EXISTS `blockedslot`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `blockedslot` (
  `BlockedSlotID` int NOT NULL AUTO_INCREMENT,
  `CourtID` int NOT NULL,
  `StartDateTime` datetime NOT NULL,
  `EndDateTime` datetime NOT NULL,
  `Reason` varchar(255) DEFAULT NULL,
  `CreatedBy` int NOT NULL,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`BlockedSlotID`),
  KEY `CreatedBy` (`CreatedBy`),
  KEY `idx_blockedslot_court_time` (`CourtID`,`StartDateTime`,`EndDateTime`),
  CONSTRAINT `blockedslot_ibfk_1` FOREIGN KEY (`CourtID`) REFERENCES `court` (`CourtID`),
  CONSTRAINT `blockedslot_ibfk_2` FOREIGN KEY (`CreatedBy`) REFERENCES `useraccount` (`UserID`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `booking`
--

DROP TABLE IF EXISTS `booking`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `booking` (
  `BookingID` int NOT NULL AUTO_INCREMENT,
  `CourtID` int NOT NULL,
  `SportID` int NOT NULL,
  `UserID` int NOT NULL,
  `StartDateTime` datetime NOT NULL,
  `EndDateTime` datetime NOT NULL,
  `Status` enum('PENDING_PAYMENT','WAITING_VERIFICATION','CONFIRMED','CANCELLED','EXPIRED') DEFAULT 'PENDING_PAYMENT',
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `ReminderSent` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`BookingID`),
  KEY `UserID` (`UserID`),
  KEY `SportID` (`SportID`),
  KEY `idx_booking_court_time` (`CourtID`,`StartDateTime`,`EndDateTime`),
  CONSTRAINT `booking_ibfk_1` FOREIGN KEY (`CourtID`) REFERENCES `court` (`CourtID`),
  CONSTRAINT `booking_ibfk_2` FOREIGN KEY (`UserID`) REFERENCES `useraccount` (`UserID`),
  CONSTRAINT `booking_ibfk_3` FOREIGN KEY (`SportID`) REFERENCES `sport` (`SportID`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `bookingpayment`
--

DROP TABLE IF EXISTS `bookingpayment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bookingpayment` (
  `BookingPaymentID` int NOT NULL AUTO_INCREMENT,
  `PaymentID` int NOT NULL,
  `BookingID` int NOT NULL,
  PRIMARY KEY (`BookingPaymentID`),
  UNIQUE KEY `PaymentID` (`PaymentID`),
  KEY `BookingID` (`BookingID`),
  CONSTRAINT `bookingpayment_ibfk_1` FOREIGN KEY (`PaymentID`) REFERENCES `payment` (`PaymentID`),
  CONSTRAINT `bookingpayment_ibfk_2` FOREIGN KEY (`BookingID`) REFERENCES `booking` (`BookingID`)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `class`
--

DROP TABLE IF EXISTS `class`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `class` (
  `ClassID` int NOT NULL AUTO_INCREMENT,
  `SportID` int NOT NULL,
  `CoachID` int NOT NULL,
  `Title` varchar(100) NOT NULL,
  `StartDate` date NOT NULL,
  `Capacity` int NOT NULL,
  `Fee` decimal(8,2) NOT NULL,
  `Status` enum('ACTIVE','DEACTIVATED') DEFAULT 'ACTIVE',
  `BillingType` enum('MONTHLY','ONE_TIME') NOT NULL DEFAULT 'MONTHLY',
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ClassID`),
  KEY `CoachID` (`CoachID`),
  KEY `fk_class_sport` (`SportID`),
  CONSTRAINT `class_ibfk_1` FOREIGN KEY (`CoachID`) REFERENCES `coach` (`CoachID`),
  CONSTRAINT `fk_class_sport` FOREIGN KEY (`SportID`) REFERENCES `sport` (`SportID`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `class_court`
--

DROP TABLE IF EXISTS `class_court`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `class_court` (
  `ClassID` int NOT NULL,
  `CourtID` int NOT NULL,
  PRIMARY KEY (`ClassID`,`CourtID`),
  KEY `CourtID` (`CourtID`),
  CONSTRAINT `class_court_ibfk_1` FOREIGN KEY (`ClassID`) REFERENCES `class` (`ClassID`) ON DELETE CASCADE,
  CONSTRAINT `class_court_ibfk_2` FOREIGN KEY (`CourtID`) REFERENCES `court` (`CourtID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `classschedule`
--

DROP TABLE IF EXISTS `classschedule`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `classschedule` (
  `ScheduleID` int NOT NULL AUTO_INCREMENT,
  `ClassID` int NOT NULL,
  `ScheduleType` enum('WEEKLY','ONE_TIME') NOT NULL,
  `OneTimeDate` date DEFAULT NULL,
  `StartTime` time NOT NULL,
  `EndTime` time NOT NULL,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ScheduleID`),
  KEY `ClassID` (`ClassID`),
  CONSTRAINT `classschedule_ibfk_1` FOREIGN KEY (`ClassID`) REFERENCES `class` (`ClassID`),
  CONSTRAINT `chk_schedule_type` CHECK ((((`ScheduleType` = _utf8mb4'ONE_TIME') and (`OneTimeDate` is not null)) or ((`ScheduleType` = _utf8mb4'WEEKLY') and (`OneTimeDate` is null))))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `classscheduleday`
--

DROP TABLE IF EXISTS `classscheduleday`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `classscheduleday` (
  `ScheduleID` int NOT NULL,
  `Weekday` tinyint NOT NULL,
  PRIMARY KEY (`ScheduleID`,`Weekday`),
  CONSTRAINT `classscheduleday_ibfk_1` FOREIGN KEY (`ScheduleID`) REFERENCES `classschedule` (`ScheduleID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `classsession`
--

DROP TABLE IF EXISTS `classsession`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `classsession` (
  `SessionID` int NOT NULL AUTO_INCREMENT,
  `ClassID` int NOT NULL,
  `SessionDate` date NOT NULL,
  `StartTime` time NOT NULL,
  `EndTime` time NOT NULL,
  `Status` enum('SCHEDULED','CANCELLED','COMPLETED') DEFAULT 'SCHEDULED',
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `IsAcknowledged` tinyint(1) DEFAULT '0',
  `ReminderSent` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`SessionID`),
  UNIQUE KEY `ClassID` (`ClassID`,`SessionDate`),
  CONSTRAINT `classsession_ibfk_1` FOREIGN KEY (`ClassID`) REFERENCES `class` (`ClassID`)
) ENGINE=InnoDB AUTO_INCREMENT=46 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `coach`
--

DROP TABLE IF EXISTS `coach`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coach` (
  `CoachID` int NOT NULL AUTO_INCREMENT,
  `UserID` int NOT NULL,
  PRIMARY KEY (`CoachID`),
  UNIQUE KEY `UserID` (`UserID`),
  CONSTRAINT `coach_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `useraccount` (`UserID`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `coachqualification`
--

DROP TABLE IF EXISTS `coachqualification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coachqualification` (
  `CoachQualificationID` int NOT NULL AUTO_INCREMENT,
  `CoachID` int NOT NULL,
  `QualificationID` int NOT NULL,
  PRIMARY KEY (`CoachQualificationID`),
  UNIQUE KEY `CoachID` (`CoachID`,`QualificationID`),
  KEY `QualificationID` (`QualificationID`),
  CONSTRAINT `coachqualification_ibfk_1` FOREIGN KEY (`CoachID`) REFERENCES `coach` (`CoachID`),
  CONSTRAINT `coachqualification_ibfk_2` FOREIGN KEY (`QualificationID`) REFERENCES `qualification` (`QualificationID`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `coachsport`
--

DROP TABLE IF EXISTS `coachsport`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coachsport` (
  `CoachID` int NOT NULL,
  `SportID` int NOT NULL,
  PRIMARY KEY (`CoachID`,`SportID`),
  KEY `fk_coachsport_sport` (`SportID`),
  CONSTRAINT `fk_coachsport_coach` FOREIGN KEY (`CoachID`) REFERENCES `coach` (`CoachID`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_coachsport_sport` FOREIGN KEY (`SportID`) REFERENCES `sport` (`SportID`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `court`
--

DROP TABLE IF EXISTS `court`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `court` (
  `CourtID` int NOT NULL AUTO_INCREMENT,
  `CourtName` varchar(50) NOT NULL,
  `Capacity` int NOT NULL,
  `PricePerHour` decimal(8,2) NOT NULL,
  PRIMARY KEY (`CourtID`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `court_sport`
--

DROP TABLE IF EXISTS `court_sport`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `court_sport` (
  `CourtID` int NOT NULL,
  `SportID` int NOT NULL,
  PRIMARY KEY (`CourtID`,`SportID`),
  KEY `court_sport_ibfk_2` (`SportID`),
  CONSTRAINT `court_sport_ibfk_1` FOREIGN KEY (`CourtID`) REFERENCES `court` (`CourtID`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `court_sport_ibfk_2` FOREIGN KEY (`SportID`) REFERENCES `sport` (`SportID`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `enrollment`
--

DROP TABLE IF EXISTS `enrollment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `enrollment` (
  `EnrollmentID` int NOT NULL AUTO_INCREMENT,
  `ClassID` int NOT NULL,
  `UserID` int NOT NULL,
  `Status` enum('ENROLLED','CANCELLED') DEFAULT 'ENROLLED',
  `EnrolledAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`EnrollmentID`),
  UNIQUE KEY `ClassID` (`ClassID`,`UserID`),
  KEY `UserID` (`UserID`),
  CONSTRAINT `enrollment_ibfk_1` FOREIGN KEY (`ClassID`) REFERENCES `class` (`ClassID`),
  CONSTRAINT `enrollment_ibfk_2` FOREIGN KEY (`UserID`) REFERENCES `useraccount` (`UserID`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `enrollmentmonth`
--

DROP TABLE IF EXISTS `enrollmentmonth`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `enrollmentmonth` (
  `EnrollmentMonthID` int NOT NULL AUTO_INCREMENT,
  `EnrollmentID` int NOT NULL,
  `PeriodMonth` date NOT NULL,
  `FeeAmount` decimal(8,2) NOT NULL,
  `Status` enum('DUE','PAID','OVERDUE') DEFAULT 'DUE',
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`EnrollmentMonthID`),
  UNIQUE KEY `EnrollmentID` (`EnrollmentID`,`PeriodMonth`),
  CONSTRAINT `enrollmentmonth_ibfk_1` FOREIGN KEY (`EnrollmentID`) REFERENCES `enrollment` (`EnrollmentID`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `enrollmentmonthpayment`
--

DROP TABLE IF EXISTS `enrollmentmonthpayment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `enrollmentmonthpayment` (
  `EnrollmentMonthPaymentID` int NOT NULL AUTO_INCREMENT,
  `PaymentID` int NOT NULL,
  `EnrollmentMonthID` int NOT NULL,
  PRIMARY KEY (`EnrollmentMonthPaymentID`),
  UNIQUE KEY `PaymentID` (`PaymentID`),
  KEY `EnrollmentMonthID` (`EnrollmentMonthID`),
  CONSTRAINT `enrollmentmonthpayment_ibfk_1` FOREIGN KEY (`PaymentID`) REFERENCES `payment` (`PaymentID`),
  CONSTRAINT `enrollmentmonthpayment_ibfk_2` FOREIGN KEY (`EnrollmentMonthID`) REFERENCES `enrollmentmonth` (`EnrollmentMonthID`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `otpverification`
--

DROP TABLE IF EXISTS `otpverification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `otpverification` (
  `OTPID` int NOT NULL AUTO_INCREMENT,
  `UserID` int NOT NULL,
  `Email` varchar(255) NOT NULL,
  `OtpCode` varchar(6) NOT NULL,
  `ExpiresAt` datetime NOT NULL,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `Attempts` int DEFAULT '0',
  PRIMARY KEY (`OTPID`),
  KEY `UserID` (`UserID`),
  CONSTRAINT `otpverification_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `useraccount` (`UserID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `passwordresettoken`
--

DROP TABLE IF EXISTS `passwordresettoken`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `passwordresettoken` (
  `ResetID` int NOT NULL AUTO_INCREMENT,
  `UserID` int NOT NULL,
  `TokenHash` char(64) NOT NULL,
  `ExpiresAt` datetime NOT NULL,
  `UsedAt` datetime DEFAULT NULL,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ResetID`),
  UNIQUE KEY `uq_tokenhash` (`TokenHash`),
  KEY `idx_userid` (`UserID`),
  CONSTRAINT `fk_prt_user` FOREIGN KEY (`UserID`) REFERENCES `useraccount` (`UserID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `payment`
--

DROP TABLE IF EXISTS `payment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment` (
  `PaymentID` int NOT NULL AUTO_INCREMENT,
  `UserID` int NOT NULL,
  `Amount` decimal(8,2) NOT NULL,
  `Method` enum('ONLINE','BANK_SLIP') NOT NULL,
  `SlipPath` varchar(255) DEFAULT NULL,
  `Status` enum('PENDING','VERIFIED','REJECTED') DEFAULT 'PENDING',
  `PaidAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `VerifiedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`PaymentID`),
  KEY `UserID` (`UserID`),
  CONSTRAINT `payment_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `useraccount` (`UserID`)
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `qualification`
--

DROP TABLE IF EXISTS `qualification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `qualification` (
  `QualificationID` int NOT NULL AUTO_INCREMENT,
  `QualificationName` varchar(150) NOT NULL,
  PRIMARY KEY (`QualificationID`),
  UNIQUE KEY `QualificationName` (`QualificationName`),
  UNIQUE KEY `QualificationName_2` (`QualificationName`),
  UNIQUE KEY `QualificationName_3` (`QualificationName`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sport`
--

DROP TABLE IF EXISTS `sport`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sport` (
  `SportID` int NOT NULL AUTO_INCREMENT,
  `SportName` varchar(150) NOT NULL,
  `IsActive` tinyint(1) DEFAULT '1',
  `ColorCode` varchar(7) DEFAULT '#1976d2',
  `IsBookable` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`SportID`),
  UNIQUE KEY `SportName` (`SportName`)
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `useraccount`
--

DROP TABLE IF EXISTS `useraccount`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `useraccount` (
  `UserID` int NOT NULL AUTO_INCREMENT,
  `FirstName` varchar(50) NOT NULL,
  `LastName` varchar(50) NOT NULL,
  `Email` varchar(100) NOT NULL,
  `PasswordHash` varchar(255) NOT NULL,
  `PhoneNumber` varchar(20) NOT NULL,
  `Role` enum('SUPER_ADMIN','ADMIN','STAFF','COACH','PLAYER') NOT NULL,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `IsActive` tinyint(1) DEFAULT '1',
  `MustChangePassword` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`UserID`),
  UNIQUE KEY `Email` (`Email`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-17  9:06:21
