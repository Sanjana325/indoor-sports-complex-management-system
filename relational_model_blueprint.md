# Relational Data Model Blueprint

This document organizes all **23 tables** of the system into logical clusters to guide you in sketching or building the database model.

---

## 🏗️ Virtual Layout Strategy
To make a clear diagram, place these clusters in the following zones on your diagram:

### 1. Identity & Access (Top Left)
*Handled during registration and login.*
- `useraccount`: Master table for all personnel.
- `otpverification`: Security codes for authentication.
- `passwordresettoken`: Secure tokens for password recovery.
- `coach`: Links personal user info to professional coaching records.

### 2. Facilities & Settings (Top Right)
*The physical infrastructure and sport rules.*
- `sport`: List of allowed activities.
- `court`: Physical locations for play.
- `court_sport`: **(Junction)** Defines compatible sports for each court.
- `blockedslot`: Admin-defined maintenance or closed windows.

### 3. Core Operations (The Middle Hub)
*The internal logic of classes and coaching specialization.*
- `class`: Definitions of coaching programs.
- `class_court`: **(Junction)** Where classes take place.
- `classschedule`: Timing logic for classes.
- `classscheduleday`: Specific days for weekly classes.
- `classsession`: Individual generated class dates.
- `qualification`: Professional certifications.
- `coachqualification`: **(Junction)** Certificates held by coaches.
- `coachsport`: **(Junction)** Sports taught by specific coaches.

### 4. Activity & Records (Bottom Right)
*Logs of actual actions in the system.*
- `enrollment`: Students registered in a class.
- `attendance`: Day-to-day presence tracking.
- `enrollmentmonth`: Monthly billing cycle records.

### 5. Finance & Reservations (Bottom Left)
*Handling money and one-off court bookings.*
- `booking`: One-time individual reservations.
- `payment`: Financial transaction logs.
- `bookingpayment`: **(Link)** Matches payment to a court reservation.
- `enrollmentmonthpayment`: **(Link)** Matches payment to a class fee.

---

## 📐 Conceptual Visual Structure (Mermaid)

```mermaid
erDiagram
    subgraph "Identity & Auth"
        useraccount ||--o{ otpverification : "authenticates"
        useraccount ||--o{ passwordresettoken : "recovers"
        useraccount ||--o| coach : "maps"
    }

    subgraph "Facility & Configuration"
        sport ||--|{ court_sport : "configured"
        court ||--|{ court_sport : "configured"
        court ||--o{ blockedslot : "maintained"
        sport ||--o{ coachsport : "specializes"
        coach ||--o{ coachsport : "specializes"
    }

    subgraph "Class & Scheduling"
        class ||--o{ classschedule : "defined-by"
        classschedule ||--|{ classscheduleday : "split-into"
        class ||--o{ classsession : "generates"
        class ||--|{ class_court : "assigned"
        court ||--|{ class_court : "assigned"
        coach ||--o{ coachqualification : "certifies"
        qualification ||--|{ coachqualification : "certifies"
        coach ||--o{ class : "instructs"
        sport ||--o{ class : "offered"
    }

    subgraph "Enrollment & Activity"
        useraccount ||--o{ enrollment : "registers"
        class ||--o{ enrollment : "receives"
        enrollment ||--o{ attendance : "logs"
        classsession ||--o{ attendance : "logs"
        enrollment ||--o{ enrollmentmonth : "bills"
    }

    subgraph "Bookings & Finance"
        useraccount ||--o{ booking : "reserves"
        court ||--o{ booking : "at"
        sport ||--o{ booking : "for"
        payment ||--o| bookingpayment : "settles"
        booking ||--o| bookingpayment : "settles"
        payment ||--o| enrollmentmonthpayment : "settles"
        enrollmentmonth ||--o| enrollmentmonthpayment : "settles"
        useraccount ||--o{ payment : "pays"
    }
```
