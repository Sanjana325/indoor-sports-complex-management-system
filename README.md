# Indoor Sports Complex Management System

A full-stack web-based management platform developed to streamline and digitize the daily operations of an indoor sports complex.

This system was designed to replace manual workflows such as phone bookings, WhatsApp coordination, spreadsheet tracking, Google Calendar scheduling, and manual payment handling with a centralized digital solution.

The platform supports court booking, class scheduling, payment verification, attendance tracking, reporting, and role-based operational management for Admins, Staff, Coaches, and Players.

---

# Project Overview

The Indoor Sports Complex Management System was developed as a major undergraduate software engineering project to solve real-world operational challenges faced by indoor sports facilities.

The system focuses on:
- Reducing booking conflicts
- Improving operational efficiency
- Automating scheduling workflows
- Centralizing payments and attendance
- Improving communication between users
- Providing analytics and reporting capabilities

---

# Main Features

- Real-time court booking & scheduling
- Booking conflict prevention
- Class and session management
- Player class enrollment
- Payment slip upload & verification workflow
- Online payment integration support
- OTP verification system
- Attendance tracking and management
- Automated reminders & notifications
- Role-based dashboards
- Blocked slot management
- Reporting & analytics dashboards
- Password recovery & secure authentication

---

# User Roles

## Admin
- User management
- Court management
- Sports management
- Class scheduling
- Blocked slot management
- Payment monitoring
- Attendance monitoring
- Analytics & reports

## Staff
- Payment verification
- Attendance management
- Schedule monitoring

## Coach
- Class session management
- Attendance tracking
- Session cancellation

## Player
- Court booking
- Class enrollment
- Payment submission
- Booking & schedule tracking

---

# System Modules

## Authentication & Authorization
- JWT-based authentication
- Role-Based Access Control (RBAC)
- Password hashing using Bcrypt
- OTP verification
- Password recovery system

## Court Booking Management
- Real-time availability checking
- Conflict detection
- Slot blocking functionality
- Automated booking status handling

## Class Management
- Class scheduling
- Session generation
- Enrollment handling
- Coach assignment

## Payment Management
- Bank slip upload
- Payment verification workflow
- Online payment support
- Payment tracking

## Attendance Management
- Session-based attendance
- Attendance reports
- Participation tracking

## Reporting & Analytics
- Booking reports
- Payment reports
- Enrollment reports
- Attendance reports

---

# Technical Implementations

## Concurrency Handling
Implemented database-level locking using SQL transactions and `FOR UPDATE` queries to prevent double bookings and race conditions.

## Automated Background Tasks
Used Node-Cron to automate:
- Booking expiration
- Session reminders
- Notification workflows

## Secure File Upload Handling
Integrated Cloudinary for secure storage and management of uploaded payment slips.

## Transactional Integrity
Implemented atomic SQL transactions to ensure data consistency during booking and payment operations.

---

# Tech Stack

## Frontend
- React
- Vite
- Material UI (MUI)
- Axios
- FullCalendar
- Recharts

## Backend
- Node.js
- Express.js
- JWT Authentication
- Bcrypt
- Node-Cron

## Database
- MySQL

## Third-Party Services
- Cloudinary
- PayHere
- Brevo Email Service

---

# Database Design

The system uses a relational MySQL database with normalized table structures and foreign key constraints to maintain data integrity.

Core entities include:
- UserAccount
- Booking
- Payment
- Court
- Sport
- Class
- Enrollment
- Attendance
- OTPVerification

---

# Screenshots

## Login Page
_Add screenshot here_

## Admin Dashboard
_Add screenshot here_

## Court Booking Page
_Add screenshot here_

## Calendar View
_Add screenshot here_

## Reports Dashboard
_Add screenshot here_

---

# Project Architecture

The system follows a client-server architecture:

Frontend:
- React-based Single Page Application (SPA)

Backend:
- RESTful API built using Express.js

Database:
- MySQL relational database

The architecture separates:
- UI Layer
- Business Logic Layer
- Database Layer

to improve scalability and maintainability.

---

# Project Goals

- Digitize sports complex operations
- Improve operational efficiency
- Reduce manual scheduling conflicts
- Improve communication between stakeholders
- Centralize operational data
- Support future scalability and expansion

---

# Future Improvements

- QR-based attendance system
- Multi-language support
- Mobile application
- AI-based demand forecasting
- Automated bank reconciliation
- Enhanced analytics dashboard

---

# Project Status

Completed major undergraduate project.

---

# Author

Tharushi Sanjana

GitHub:
https://github.com/Sanjana325/indoor-sports-complex-management-system
