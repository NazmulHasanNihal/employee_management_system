# Attendance Sync API

## Endpoint

**POST** `/api/v1/attendance/sync`

## Protocol

HTTPS (TLS 1.3 mandated)

## Authentication

Bearer Token (Hardware Specific Pre-Shared Key)

## Request Payload

```json
{
  "device_id": "ZKT-FrontDoor-01",
  "badge_id": "EMP-8842",
  "timestamp": "2026-08-08T08:52:14Z",
  "type": "CLOCK_IN"
}
```

## Success Response

**Status:** `201 Created`

```json
{
  "status": "success",
  "logged": true
}
```