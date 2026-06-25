# HR Module - Data Models Documentation

> **Purpose**: This document serves as a comprehensive reference for building a new HR platform using Firebase. It contains the complete data structure, field definitions, validation rules, and relationships extracted from the existing MongoDB/Mongoose models.

---

## Table of Contents

1. [Naming Conventions](#naming-conventions)
2. [Data Models Overview](#data-models-overview)
3. [Relationship Diagram](#relationship-diagram)
4. [Detailed Model Specifications](#detailed-model-specifications)
   - [Employee](#1-employee)
   - [Department](#2-department)
   - [Designation](#3-designation)
   - [Bank](#4-bank)
   - [Site](#5-site)
   - [EsiLocation](#6-esilocation)
   - [WorkOrder](#7-workorder)
   - [Attendance](#8-attendance)
   - [Wages](#9-wages)
   - [FinalSettlement](#10-finalsettlement)
5. [Embedded/Sub-Documents](#embeddedsub-documents)
   - [DamageRegister](#damageregister)
   - [AdvanceRegister](#advanceregister)
   - [Bonus](#bonus)
   - [Leave](#leave)
   - [EmployeeWorkOrder](#employeeworkorder)
   - [AttendanceDay](#attendanceday)
   - [StateDetails](#statedetails)
6. [Validation Rules Summary](#validation-rules-summary)
7. [Firebase Collection Structure Recommendation](#firebase-collection-structure-recommendation)

---

## Naming Conventions

All field names should follow **camelCase** convention. Below are the standardized names (some original fields had inconsistent casing):

| Original Name | Standardized Name |
|---------------|-------------------|
| `UAN` | `uan` |
| `ESICApplicable` | `esicApplicable` |
| `ESICNo` | `esicNo` |
| `ESILocation` | `esiLocation` |
| `DA` | `da` |
| `HRA` | `hra` |
| `CA` | `ca` |
| `LIC` | `lic` |
| `OldBasic` | `oldBasic` |
| `OldDA` | `oldDa` |
| `PayRate` | `payRate` |
| `Basic2` | `basic2` |
| `EsiNo` | `esiNo` |
| `SpValidity` | `spValidity` |
| `StateDetails` | `stateDetails` |

---

## Data Models Overview

| Model | Description | Firebase Collection |
|-------|-------------|---------------------|
| **Employee** | Core employee information including personal details, statutory info, salary components, and documents | `employees` |
| **Department** | HR departments within the organization | `departments` |
| **Designation** | Job titles with associated pay structure | `designations` |
| **Bank** | Bank details for salary disbursement | `banks` |
| **Site** | Work locations/sites | `sites` |
| **EsiLocation** | ESI (Employee State Insurance) office locations | `esiLocations` |
| **WorkOrder** | Work orders/contracts for HR operations | `workOrders` |
| **Attendance** | Monthly attendance records per employee | `attendances` |
| **Wages** | Monthly wage/salary records | `wages` |
| **FinalSettlement** | Settlement records when employee exits | `finalSettlements` |

---

## Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              HR MODULE RELATIONSHIPS                                 │
└─────────────────────────────────────────────────────────────────────────────────────┘

                                    ┌──────────────┐
                                    │  Department  │
                                    │──────────────│
                                    │ • name       │
                                    └──────┬───────┘
                                           │
                                           │ 1:N
                                           ▼
┌──────────────┐    1:N    ┌─────────────────────────────────────┐    1:N    ┌──────────────┐
│     Bank     │◄──────────│              Employee               │──────────►│     Site     │
│──────────────│           │─────────────────────────────────────│           │──────────────│
│ • name       │           │ • code (unique)                     │           │ • name       │
│ • branch     │           │ • name                              │           └──────────────┘
│ • ifsc       │           │ • workManNo                         │
└──────────────┘           │ • Personal Info (dob, sex, etc.)    │
                           │ • Statutory (pf, esic, uan)         │    1:N    ┌──────────────┐
                           │ • Salary Components                 │◄──────────│  Designation │
                           │ • Documents (URLs)                  │           │──────────────│
                           │ • bonus[] (embedded)                │           │ • designation│
                           │ • leave[] (embedded)                │           │ • basic      │
                           │ • damageRegister[] (embedded)       │           │ • oldBasic   │
                           │ • advanceRegister[] (embedded)      │           │ • da         │
                           │ • workOrderHr[] (embedded)          │           │ • oldDa      │
                           └───────────────┬─────────────────────┘           │ • payRate    │
                                           │                                 │ • basic2     │
                    ┌──────────────────────┼──────────────────────┐          └──────────────┘
                    │                      │                      │
                    │ 1:N                  │ 1:N                  │ 1:1
                    ▼                      ▼                      ▼
          ┌──────────────┐       ┌──────────────┐       ┌─────────────────┐
          │  Attendance  │       │    Wages     │       │ FinalSettlement │
          │──────────────│       │──────────────│       │─────────────────│
          │ • employee   │       │ • employee   │       │ • employee      │
          │ • year       │       │ • designation│       │ • bonus[]       │
          │ • month      │       │ • month/year │       │ • leave[]       │
          │ • days[]     │       │ • attendance │       └─────────────────┘
          │ • presentDays│       │ • deductions │
          │ • leaves     │       │ • earnings   │
          │ • workOrderHr│       │ • workOrderHr│
          └──────┬───────┘       └──────┬───────┘
                 │                      │
                 │ N:1                  │ N:1
                 ▼                      ▼
          ┌─────────────────────────────────────┐
          │             WorkOrder               │
          │─────────────────────────────────────│
          │ • workOrderNumber                   │
          │ • date, validFrom, validTo          │
          │ • jobDesc, orderDesc                │
          │ • dept, section                     │
          │ • bonusRate                         │
          │ • stateDetails (embedded)           │
          │ • lapseTill                         │
          └─────────────────────────────────────┘

                    ┌──────────────┐
                    │  EsiLocation │
                    │──────────────│
                    │ • name       │
                    │ • address    │
                    │ • esiNo      │
                    │ • branch     │
                    └──────────────┘
                           ▲
                           │ N:1
                           │
                    (Referenced by Employee.esiLocation)
```

### Relationship Summary Table

| Parent | Child | Relationship | Description |
|--------|-------|--------------|-------------|
| Department | Employee | 1:N | One department has many employees |
| Designation | Employee | 1:N | One designation can be assigned to many employees |
| Bank | Employee | 1:N | One bank can be used by many employees |
| Site | Employee | 1:N | One site can have many employees |
| EsiLocation | Employee | 1:N | One ESI location serves many employees |
| Employee | Attendance | 1:N | One employee has many attendance records (monthly) |
| Employee | Wages | 1:N | One employee has many wage records (monthly) |
| Employee | FinalSettlement | 1:1 | One employee has one final settlement |
| WorkOrder | Attendance | 1:N | One work order can have many attendance records |
| WorkOrder | Wages | 1:N | One work order can have many wage records |
| WorkOrder | Employee.workOrderHr[] | 1:N | One work order can be referenced by many employees |

---

## Detailed Model Specifications

### 1. Employee

**Firebase Collection**: `employees`

The central entity of the HR module containing all employee-related information.

#### Personal Information

| Field | Type | Required | Default | Validation | Description |
|-------|------|----------|---------|------------|-------------|
| `code` | `string` | ✅ Yes | - | **Unique** | Employee code/ID |
| `workManNo` | `string` | No | - | - | Workman number |
| `name` | `string` | No | - | - | Full name of employee |
| `fathersName` | `string` | No | - | - | Father's name |
| `sex` | `string` | No | - | Enum: `Male`, `Female`, `Other` (recommended) | Gender |
| `dob` | `string` | No | - | Format: `YYYY-MM-DD` (recommended) | Date of birth |
| `maritalStatus` | `string` | No | - | Enum: `Single`, `Married`, `Divorced`, `Widowed` (recommended) | Marital status |
| `address` | `string` | No | - | - | Residential address |
| `landlineNumber` | `string` | No | - | - | Landline contact |
| `mobileNumber` | `string` | No | - | - | Mobile contact |
| `adhaarNumber` | `string` | No | - | 12 digits (recommended) | Aadhaar number |

#### Employment Information

| Field | Type | Required | Default | Validation | Description |
|-------|------|----------|---------|------------|-------------|
| `department` | `reference` | No | - | FK → `departments` | Reference to department |
| `site` | `reference` | No | - | FK → `sites` | Reference to work site |
| `designation` | `reference` | No | - | FK → `designations` | Reference to designation |
| `workingStatus` | `boolean` | No | - | - | Currently working or not |
| `appointmentDate` | `string` | No | - | Format: `YYYY-MM-DD` | Date of joining |
| `resignDate` | `string` | No | - | Format: `YYYY-MM-DD` | Date of resignation |

#### Banking Information

| Field | Type | Required | Default | Validation | Description |
|-------|------|----------|---------|------------|-------------|
| `bank` | `reference` | No | - | FK → `banks` | Reference to bank |
| `accountNumber` | `string` | No | - | - | Bank account number |

#### Statutory Information

| Field | Type | Required | Default | Validation | Description |
|-------|------|----------|---------|------------|-------------|
| `pfApplicable` | `boolean` | No | - | - | Is PF applicable |
| `pfNo` | `string` | No | - | - | PF number |
| `uan` | `string` | No | - | 12 digits (recommended) | Universal Account Number |
| `esicApplicable` | `boolean` | No | - | - | Is ESIC applicable |
| `esicNo` | `string` | No | - | - | ESIC number |
| `esiLocation` | `reference` | No | - | FK → `esiLocations` | Reference to ESI location |

#### Salary Components

| Field | Type | Required | Default | Validation | Description |
|-------|------|----------|---------|------------|-------------|
| `basic` | `string` | No | - | Numeric string | Basic salary |
| `da` | `string` | No | - | Numeric string | Dearness Allowance |
| `hra` | `string` | No | - | Numeric string | House Rent Allowance |
| `ca` | `string` | No | - | Numeric string | Conveyance Allowance |
| `food` | `string` | No | - | Numeric string | Food allowance |
| `incentives` | `string` | No | - | Numeric string | Incentives |
| `uniform` | `string` | No | - | Numeric string | Uniform allowance |
| `medical` | `string` | No | - | Numeric string | Medical allowance |
| `loan` | `string` | No | - | Numeric string | Loan deduction |
| `lic` | `string` | No | - | Numeric string | LIC deduction |
| `oldBasic` | `string` | No | - | Numeric string | Previous basic salary |
| `oldDa` | `string` | No | - | Numeric string | Previous DA |
| `attendanceAllowance` | `boolean` | No | - | - | Attendance allowance applicable |

#### Safety & Compliance

| Field | Type | Required | Default | Validation | Description |
|-------|------|----------|---------|------------|-------------|
| `safetyPassNumber` | `string` | No | - | - | Safety pass number |
| `spValidity` | `string` | No | - | Format: `YYYY-MM-DD` | Safety pass validity |
| `policeVerificationValidityDate` | `string` | No | - | Format: `YYYY-MM-DD` | Police verification validity |
| `gatePassNumber` | `string` | No | - | - | Gate pass number |
| `gatePassValidTill` | `string` | No | - | Format: `YYYY-MM-DD` | Gate pass validity |

#### Document URLs

| Field | Type | Required | Default | Validation | Description |
|-------|------|----------|---------|------------|-------------|
| `profilePhotoUrl` | `string` | No | `''` | Valid URL | Profile photo URL |
| `drivingLicenseUrl` | `string` | No | `''` | Valid URL | Driving license document |
| `aadharCardUrl` | `string` | No | `''` | Valid URL | Aadhaar card document |
| `bankPassbookUrl` | `string` | No | `''` | Valid URL | Bank passbook document |

#### Embedded Arrays

| Field | Type | Description |
|-------|------|-------------|
| `bonus` | `array<Bonus>` | Yearly bonus records |
| `leave` | `array<Leave>` | Yearly leave records |
| `damageRegister` | `array<DamageRegister>` | Damage/loss deduction records |
| `advanceRegister` | `array<AdvanceRegister>` | Advance payment records |
| `workOrderHr` | `array<EmployeeWorkOrder>` | Work order assignments |

#### Indexes

- **Unique Index**: `code`
- **Compound Index**: `_id` + `workOrderHr.period` + `workOrderHr.workOrderHr` (unique)

---

### 2. Department

**Firebase Collection**: `departments`

| Field | Type | Required | Default | Validation | Description |
|-------|------|----------|---------|------------|-------------|
| `name` | `string` | ✅ Yes | - | **Unique** | Department name |

---

### 3. Designation

**Firebase Collection**: `designations`

| Field | Type | Required | Default | Validation | Description |
|-------|------|----------|---------|------------|-------------|
| `designation` | `string` | ✅ Yes | - | - | Designation/job title |
| `basic` | `string` | ✅ Yes | - | Numeric string | Basic salary for this designation |
| `oldBasic` | `string` | ✅ Yes | - | Numeric string | Previous basic salary |
| `da` | `string` | ✅ Yes | - | Numeric string | Dearness Allowance |
| `oldDa` | `string` | ✅ Yes | - | Numeric string | Previous DA |
| `payRate` | `string` | ✅ Yes | - | Numeric string | Pay rate |
| `basic2` | `string` | ✅ Yes | - | Numeric string | Secondary basic component |

---

### 4. Bank

**Firebase Collection**: `banks`

| Field | Type | Required | Default | Validation | Description |
|-------|------|----------|---------|------------|-------------|
| `name` | `string` | ✅ Yes | - | - | Bank name |
| `branch` | `string` | ✅ Yes | - | - | Branch name |
| `ifsc` | `string` | ✅ Yes | - | 11 characters (recommended) | IFSC code |

---

### 5. Site

**Firebase Collection**: `sites`

| Field | Type | Required | Default | Validation | Description |
|-------|------|----------|---------|------------|-------------|
| `name` | `string` | ✅ Yes | - | - | Site/location name |

---

### 6. EsiLocation

**Firebase Collection**: `esiLocations`

| Field | Type | Required | Default | Validation | Description |
|-------|------|----------|---------|------------|-------------|
| `name` | `string` | ✅ Yes | - | - | ESI office name |
| `address` | `string` | ✅ Yes | - | - | ESI office address |
| `esiNo` | `string` | ✅ Yes | - | - | ESI registration number |
| `branch` | `string` | ✅ Yes | - | - | Branch name |

---

### 7. WorkOrder

**Firebase Collection**: `workOrders`

| Field | Type | Required | Default | Validation | Description |
|-------|------|----------|---------|------------|-------------|
| `workOrderNumber` | `string` | ✅ Yes | - | - | Work order number |
| `date` | `string` | No | - | Format: `YYYY-MM-DD` | Work order date |
| `jobDesc` | `string` | No | - | - | Job description |
| `orderDesc` | `string` | No | - | - | Order description |
| `dept` | `string` | No | - | - | Department |
| `section` | `string` | No | - | - | Section |
| `validFrom` | `string` | No | - | Format: `YYYY-MM-DD` | Validity start date |
| `validTo` | `string` | No | - | Format: `YYYY-MM-DD` | Validity end date |
| `lapseTill` | `string` | No | `''` | Format: `YYYY-MM-DD` | Lapse date |
| `bonusRate` | `number` | No | `0` | - | Bonus rate percentage |
| `stateDetails` | `object<StateDetails>` | No | - | - | State-specific details |

---

### 8. Attendance

**Firebase Collection**: `attendances`

| Field | Type | Required | Default | Validation | Description |
|-------|------|----------|---------|------------|-------------|
| `employee` | `reference` | ✅ Yes | - | FK → `employees` | Reference to employee |
| `year` | `number` | ✅ Yes | - | 4-digit year | Attendance year |
| `month` | `number` | ✅ Yes | - | 1-12 | Attendance month |
| `days` | `array<AttendanceDay>` | No | - | - | Daily attendance records |
| `presentDays` | `number` | No | `0` | - | Total present days |
| `earnedLeaves` | `number` | No | `0` | - | Earned leaves taken |
| `casualLeaves` | `number` | No | `0` | - | Casual leaves taken |
| `festivalLeaves` | `number` | No | `0` | - | Festival leaves taken |
| `workOrderHr` | `reference` | No | - | FK → `workOrders` | Associated work order |
| `createdAt` | `timestamp` | No | `now()` | - | Record creation time |
| `updatedAt` | `timestamp` | No | `now()` | - | Last update time |

---

### 9. Wages

**Firebase Collection**: `wages`

#### Core Fields

| Field | Type | Required | Default | Validation | Description |
|-------|------|----------|---------|------------|-------------|
| `employee` | `reference` | ✅ Yes | - | FK → `employees` | Reference to employee |
| `designation` | `reference` | ✅ Yes | - | FK → `designations` | Reference to designation |
| `month` | `number` | ✅ Yes | - | 1-12 | Wage month |
| `year` | `number` | ✅ Yes | - | 4-digit year | Wage year |
| `workOrderHr` | `reference` | No | - | FK → `workOrders` | Associated work order |

#### Attendance & Working Days

| Field | Type | Required | Default | Validation | Description |
|-------|------|----------|---------|------------|-------------|
| `totalWorkingDays` | `number` | ✅ Yes | - | - | Total working days in month |
| `attendance` | `number` | ✅ Yes | - | - | Days attended |

#### Earnings

| Field | Type | Required | Default | Validation | Description |
|-------|------|----------|---------|------------|-------------|
| `basic` | `number` | No | - | - | Basic salary earned |
| `da` | `number` | No | - | - | DA earned |
| `payRate` | `number` | No | - | - | Pay rate applied |
| `allowances` | `number` | No | - | - | Total allowances |
| `otherCash` | `number` | No | - | - | Other cash payments |
| `otherCashDescription` | `string` | No | - | - | Description of other cash |
| `total` | `number` | ✅ Yes | - | - | Total earnings |

#### Incentives

| Field | Type | Required | Default | Validation | Description |
|-------|------|----------|---------|------------|-------------|
| `incentiveApplicable` | `boolean` | No | `false` | - | Is incentive applicable |
| `incentiveDays` | `number` | No | `0` | - | Days for incentive calculation |
| `incentiveAmount` | `number` | No | `0` | - | Incentive amount |

#### Deductions

| Field | Type | Required | Default | Validation | Description |
|-------|------|----------|---------|------------|-------------|
| `otherDeduction` | `number` | No | - | - | Other deductions |
| `otherDeductionDescription` | `string` | No | - | - | Description of other deductions |
| `advanceDeduction` | `number` | No | `0` | - | Advance deduction amount |
| `damageDeduction` | `number` | No | `0` | - | Damage deduction amount |
| `isAdvanceDeduction` | `boolean` | No | `false` | - | Is advance being deducted |
| `isDamageDeduction` | `boolean` | No | `false` | - | Is damage being deducted |

#### Net Pay

| Field | Type | Required | Default | Validation | Description |
|-------|------|----------|---------|------------|-------------|
| `netAmountPaid` | `number` | ✅ Yes | - | - | Final net amount paid |

---

### 10. FinalSettlement

**Firebase Collection**: `finalSettlements`

| Field | Type | Required | Default | Validation | Description |
|-------|------|----------|---------|------------|-------------|
| `employee` | `reference` | No | - | FK → `employees` | Reference to employee |
| `bonus` | `array<Bonus>` | No | - | - | Pending bonus settlements |
| `leave` | `array<Leave>` | No | - | - | Pending leave settlements |

---

## Embedded/Sub-Documents

These are nested objects/arrays within parent documents. In Firebase, these can be stored as subcollections or embedded maps/arrays.

### DamageRegister

**Parent**: `Employee.damageRegister[]`

| Field | Type | Required | Default | Validation | Description |
|-------|------|----------|---------|------------|-------------|
| `particularsOfDamageOrLoss` | `string` | ✅ Yes | - | - | Description of damage/loss |
| `dateOfDamageOrLoss` | `timestamp` | ✅ Yes | - | - | Date of incident |
| `didWorkmanShowCause` | `boolean` | ✅ Yes | - | - | Did workman show cause |
| `personWhoHeardExplanation` | `string` | ✅ Yes | - | - | Person who heard explanation |
| `amountOfDeductionImposed` | `number` | ✅ Yes | - | - | Total deduction amount |
| `numberOfInstallments` | `number` | No | `1` | Min: 1 | Number of installments |
| `installmentsLeft` | `number` | No | `1` | Min: 0 | Remaining installments |
| `remarks` | `string` | No | - | - | Additional remarks |

---

### AdvanceRegister

**Parent**: `Employee.advanceRegister[]`

| Field | Type | Required | Default | Validation | Description |
|-------|------|----------|---------|------------|-------------|
| `amountOfAdvanceGiven` | `number` | ✅ Yes | - | - | Advance amount |
| `dateOfAdvanceGiven` | `timestamp` | ✅ Yes | - | - | Date advance was given |
| `purposeOfAdvanceGiven` | `string` | ✅ Yes | - | - | Purpose of advance |
| `numberOfInstallments` | `number` | No | `1` | Min: 1 | Number of installments |
| `installmentsLeft` | `number` | No | `1` | Min: 0 | Remaining installments |
| `remarks` | `string` | No | - | - | Additional remarks |

---

### Bonus

**Parent**: `Employee.bonus[]`, `FinalSettlement.bonus[]`

| Field | Type | Required | Default | Validation | Description |
|-------|------|----------|---------|------------|-------------|
| `year` | `number` | ✅ Yes | - | 4-digit year | Bonus year |
| `status` | `boolean` | ✅ Yes | - | - | Bonus paid status |

---

### Leave

**Parent**: `Employee.leave[]`, `FinalSettlement.leave[]`

| Field | Type | Required | Default | Validation | Description |
|-------|------|----------|---------|------------|-------------|
| `year` | `number` | ✅ Yes | - | 4-digit year | Leave year |
| `status` | `boolean` | ✅ Yes | - | - | Leave encashed status |

---

### EmployeeWorkOrder

**Parent**: `Employee.workOrderHr[]`

| Field | Type | Required | Default | Validation | Description |
|-------|------|----------|---------|------------|-------------|
| `period` | `string` | ✅ Yes | - | Format: `MM-YYYY` | Period of assignment |
| `workOrderHr` | `reference` | ✅ Yes | - | FK → `workOrders` | Reference to work order |
| `workOrderAtten` | `number` | ✅ Yes | `0` | - | Attendance under this work order |

---

### AttendanceDay

**Parent**: `Attendance.days[]`

| Field | Type | Required | Default | Validation | Description |
|-------|------|----------|---------|------------|-------------|
| `day` | `number` | ✅ Yes | - | 1-31 | Day of month |
| `status` | `string` | ✅ Yes | - | **Enum** (see below) | Attendance status |

**Status Enum Values**:
- `Present`
- `Absent`
- `Half Day`
- `NH` (National Holiday)
- `Not Paid`
- `Earned Leave`
- `Casual Leave`
- `Festival Leave`

---

### StateDetails

**Parent**: `WorkOrder.stateDetails`

| Field | Type | Required | Default | Validation | Description |
|-------|------|----------|---------|------------|-------------|
| `stateName` | `string` | ✅ Yes | - | - | State name |
| `stateAddress` | `string` | No | - | - | State office address |
| `statePayRate` | `number` | No | - | - | State-specific pay rate |

---

## Validation Rules Summary

### Required Fields by Collection

| Collection | Required Fields |
|------------|-----------------|
| `employees` | `code` |
| `departments` | `name` |
| `designations` | `designation`, `basic`, `oldBasic`, `da`, `oldDa`, `payRate`, `basic2` |
| `banks` | `name`, `branch`, `ifsc` |
| `sites` | `name` |
| `esiLocations` | `name`, `address`, `esiNo`, `branch` |
| `workOrders` | `workOrderNumber` |
| `attendances` | `employee`, `year`, `month` |
| `wages` | `employee`, `designation`, `month`, `year`, `totalWorkingDays`, `attendance`, `netAmountPaid`, `total` |
| `finalSettlements` | None (all optional) |

### Unique Constraints

| Collection | Unique Field(s) |
|------------|-----------------|
| `employees` | `code` |
| `departments` | `name` |

### Enum Validations

| Field | Valid Values |
|-------|--------------|
| `Attendance.days[].status` | `Present`, `Absent`, `Half Day`, `NH`, `Not Paid`, `Earned Leave`, `Casual Leave`, `Festival Leave` |
| `Employee.sex` | `Male`, `Female`, `Other` (recommended) |
| `Employee.maritalStatus` | `Single`, `Married`, `Divorced`, `Widowed` (recommended) |

### Format Validations (Recommended)

| Field | Format | Example |
|-------|--------|---------|
| Date fields | `YYYY-MM-DD` | `2024-01-15` |
| `EmployeeWorkOrder.period` | `MM-YYYY` | `01-2024` |
| `Employee.adhaarNumber` | 12 digits | `123456789012` |
| `Employee.uan` | 12 digits | `100123456789` |
| `Bank.ifsc` | 11 characters | `SBIN0001234` |

### Default Values

| Collection | Field | Default |
|------------|-------|---------|
| `employees` | `profilePhotoUrl` | `''` |
| `employees` | `drivingLicenseUrl` | `''` |
| `employees` | `aadharCardUrl` | `''` |
| `employees` | `bankPassbookUrl` | `''` |
| `workOrders` | `lapseTill` | `''` |
| `workOrders` | `bonusRate` | `0` |
| `wages` | `incentiveApplicable` | `false` |
| `wages` | `incentiveDays` | `0` |
| `wages` | `incentiveAmount` | `0` |
| `wages` | `advanceDeduction` | `0` |
| `wages` | `damageDeduction` | `0` |
| `wages` | `isAdvanceDeduction` | `false` |
| `wages` | `isDamageDeduction` | `false` |
| `attendances` | `presentDays` | `0` |
| `attendances` | `earnedLeaves` | `0` |
| `attendances` | `casualLeaves` | `0` |
| `attendances` | `festivalLeaves` | `0` |
| `DamageRegister` | `numberOfInstallments` | `1` |
| `DamageRegister` | `installmentsLeft` | `1` |
| `AdvanceRegister` | `numberOfInstallments` | `1` |
| `AdvanceRegister` | `installmentsLeft` | `1` |
| `EmployeeWorkOrder` | `workOrderAtten` | `0` |

---

## Firebase Collection Structure Recommendation

```
firestore/
├── employees/
│   └── {employeeId}/
│       ├── ... (employee fields)
│       ├── bonus: [] (embedded array)
│       ├── leave: [] (embedded array)
│       ├── damageRegister: [] (embedded array)
│       ├── advanceRegister: [] (embedded array)
│       └── workOrderHr: [] (embedded array)
│
├── departments/
│   └── {departmentId}/
│       └── name: string
│
├── designations/
│   └── {designationId}/
│       └── ... (designation fields)
│
├── banks/
│   └── {bankId}/
│       └── ... (bank fields)
│
├── sites/
│   └── {siteId}/
│       └── name: string
│
├── esiLocations/
│   └── {esiLocationId}/
│       └── ... (esiLocation fields)
│
├── workOrders/
│   └── {workOrderId}/
│       ├── ... (workOrder fields)
│       └── stateDetails: {} (embedded object)
│
├── attendances/
│   └── {attendanceId}/
│       ├── ... (attendance fields)
│       └── days: [] (embedded array)
│
├── wages/
│   └── {wagesId}/
│       └── ... (wages fields)
│
└── finalSettlements/
    └── {settlementId}/
        ├── employee: reference
        ├── bonus: [] (embedded array)
        └── leave: [] (embedded array)
```

### Firebase Security Rules Considerations

1. **Employee code** must be validated for uniqueness on write
2. **Department name** must be validated for uniqueness on write
3. References should be validated to ensure they point to existing documents
4. Enum fields should be validated against allowed values

### Indexing Recommendations for Firebase

1. `employees` - Index on `code` for lookups
2. `employees` - Composite index on `department` + `workingStatus` for filtering
3. `attendances` - Composite index on `employee` + `year` + `month`
4. `wages` - Composite index on `employee` + `year` + `month`
5. `wages` - Composite index on `workOrderHr` + `year` + `month`

---

## Notes for New Developer

1. **Data Types**: The original codebase uses strings for many numeric fields (salary components). Consider using proper `number` types in Firebase for calculations.

2. **Date Handling**: Original uses string dates. Firebase Timestamps are recommended for proper date operations.

3. **References**: Use Firebase document references for foreign keys to enable easy data fetching.

4. **Embedded vs Subcollections**: 
   - Keep small, bounded arrays (bonus, leave) as embedded
   - Consider subcollections for unbounded data (if attendance records grow large)

5. **Timestamps**: Add `createdAt` and `updatedAt` to all collections for audit purposes.

---

*Last Updated: February 2026*
*Source: Extracted from MongoDB/Mongoose models in `lib/models/HR/`*
