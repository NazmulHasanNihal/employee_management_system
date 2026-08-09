# Database Relationship Guide

## Overview

This document explains how data in the employee management system connects together. Think of each entity as a separate notebook, and the relationships as the threads that tie those notebooks together so information can flow logically.

---

## Core Relationships

### Employee → AttendanceLog
- **Connection**: One employee can have many attendance records.
- **How it works**: The `employee_id` in the AttendanceLog points back to the Employee who created the record.
- **Example**: If Employee #101 clocks in 20 times, there will be 20 rows in AttendanceLog, each carrying `employee_id = 101`.

### Employee → HelpdeskTicket
- **Connection**: One employee can submit many helpdesk tickets.
- **How it works**: The `employee_id` in HelpdeskTicket links the ticket to the employee who raised it.
- **Example**: Employee #205 opens three tickets; each ticket row stores `employee_id = 205`.

### Employee → PayrollStructure
- **Connection**: One employee can be assigned to one payroll structure.
- **How it works**: The `employee_id` in PayrollStructure tells us which payroll setup belongs to which employee.
- **Example**: Employee #305 is linked to a monthly salary structure via `employee_id = 305`.

### PayrollStructure → PayrollHead
- **Connection**: One payroll structure can contain many payroll heads (earnings, deductions, contributions).
- **How it works**: The `structure_id` in PayrollHead links each head to its parent structure.
- **Example**: A payroll structure for “Monthly Salary” may have heads for Basic, HRA, Tax, and PF — all pointing to the same `structure_id`.

---

## AuditLog Connections

### AuditLog → All Other Entities
- **Connection**: AuditLog is linked to every major entity in the system.
- **How it works**: The `entity_name` and `event_data` fields in AuditLog record which table was changed and what the change was. The `employee_id` or relevant ID is also captured.
- **Purpose**: This creates a complete history of who changed what and when.
- **Example**: When Employee #101 updates their phone number, an AuditLog entry is created with:
  - `entity_name = Employee`
  - `event_type = UPDATE`
  - `event_data = { old_phone: "...", new_phone: "..." }`

---

## Simple Analogy

Imagine an office filing system:

- **Employee** is the main personnel file.
- **AttendanceLog**, **HelpdeskTicket**, and **PayrollStructure** are activity journals that reference the employee file.
- **PayrollHead** is a list of salary components tied to a specific payroll setup.
- **AuditLog** is a security camera log that watches all other files and records every change.

Every time a change happens anywhere, the AuditLog notes it — making the system fully traceable.

---

## Key Takeaways

1. **Employee ID is the common thread**: It appears in AttendanceLog, HelpdeskTicket, PayrollStructure, and AuditLog to tie actions back to the right person.
2. **Structure ID groups payroll details**: It links a payroll setup to all its individual heads.
3. **AuditLog is the system’s memory**: It does not drive operations; it simply records them for accountability.
4. **No orphaned data**: Every record in child tables has a matching parent record, ensuring data stays consistent and meaningful.