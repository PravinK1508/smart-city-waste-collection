# Smart City Waste Collection Optimization & Recycling Management System

A production-grade, full-stack municipal operations and GIS routing web application built to optimize municipal waste logistics and divert recyclable materials from landfills. The system couples citizen-reported roadside waste dumps with fixed municipal dustbin collections into single optimized collection trips, validated with real-time truck payload limits, transaction-safe MySQL persistence, and closed-loop recycling facility dispatches.

---

## 🏛 System Architecture & Technology Stack

- **Backend:** Java 21, Spring Boot 3.3.4, Spring Data JPA, Hibernate, Jakarta Validation
- **Database:** MySQL / MariaDB (Database: `smart_waste_db`)
- **Frontend:** React 19, Vite, TypeScript, Tailwind CSS, Lucide Icons
- **Mapping & GIS:** Leaflet 1.9.4, OpenStreetMap tile servers, Haversine proximity matrix
- **Port Allocations:**
  - Backend API: `http://localhost:8080`
  - Frontend Application: `http://localhost:5173`

---

## 🚀 Quick Start & Run Instructions

### 1. Database Setup
Ensure MySQL is running locally on port 3306. Execute the schema creation and initial GIS seed data:
```powershell
# From project root:
Get-Content "d:\final project\database\schema.sql" | & mysql.exe -u root
Get-Content "d:\final project\database\seed_data.sql" | & mysql.exe -u root
```

### 2. Backend Execution
Build and run the Spring Boot service:
```powershell
cd "d:\final project\backend"
# Build fat JAR (Maven):
& "D:\Miniproject 2\tools\maven\apache-maven-3.9.9\bin\mvn.cmd" clean package -DskipTests

# Run JAR:
& "C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot\bin\java.exe" -jar target\waste-management-system-1.0.0.jar
```
The backend initializes REST endpoints at `http://localhost:8080/api`.

### 3. Frontend Execution
Install dependencies (already scaffolded) and launch the Vite development server:
```powershell
cd "d:\final project\frontend"
npm run dev -- --host --port 5173
```
Access the application in any web browser at: **`http://localhost:5173`**.

---

## 🔄 Core End-to-End Operational Workflow

The application implements a strict 9-step closed-loop municipal workflow:

1. **Citizen Waste Reporting:**
   - Citizens capture GPS geotags or enter street addresses.
   - Categorize waste (Plastic, Organic, Hazardous, E-Waste, Paper, Glass).
   - Enter estimated quantities and upload photographic evidence.
   - Persisted to MySQL with `PENDING` status.

2. **Admin Operations & GIS Map Discovery:**
   - Unified operational map visualizes reports, municipal bins, truck fleet, and recycling centers.
   - Real-time telemetry inspects bin fill gauges and truck availability.

3. **Combined Collection Planning & Nearby Bins Discovery:**
   - When an admin selects a citizen report, the system executes an automated radius scan (5 km default).
   - Candidate bins are ranked by Haversine distance, fill percentage, and operational eligibility.
   - Highlights prompt: **"Additional Nearby Waste Collection Available"**.

4. **Dynamic Truck Capacity Calculations & Hard Gates:**
   - Selects fleet trucks and calculates:
     $$\text{Combined Additional Load} = \text{Roadside Waste} + \sum \text{Selected Bins}$$
     $$\text{Projected Truck Load} = \text{Current Truck Load} + \text{Combined Additional Load}$$
     $$\text{Projected Remaining Capacity} = \text{Total Truck Capacity} - \text{Projected Truck Load}$$
   - **Hard Capacity Gate:** If Projected Remaining Capacity $< 0$, the plan is flagged as infeasible and confirmation is strictly blocked on both UI and backend.

5. **Admin Confirmation & Relational Persistence:**
   - Admin confirms the feasible plan.
   - Creates a transaction in MySQL inserting `collection_trips`, `trip_bins`, and ordered `trip_stops` (Stop #1: Roadside Report, Stop #2+: Candidate Dustbins).
   - Locks truck status to `ASSIGNED`, bins to `SCHEDULED`, and report to `ASSIGNED`.

6. **Trip Execution & Measured Collection Completion:**
   - Transitions trip from `SCHEDULED` $\rightarrow$ `DISPATCHED` $\rightarrow$ `IN_PROGRESS`.
   - Driver or depot supervisor logs actual weighbridge/scale measurements.
   - **Bin Emptied:** Associated dustbins reset to `0.00 kg` fill and `IDLE` status.
   - **Truck Load Updated:** Truck payload updated to actual collected weight.
   - Trip transitions to `READY_FOR_RECYCLING`.

7. **Recycling Destination Recommendation & Closed-Loop Delivery:**
   - Destination algorithm matches trip waste category against registered facilities.
   - Facility intake capacity and route distance evaluated.
   - Dispatched $\rightarrow$ Delivered $\rightarrow$ Weighbridge slip verification recorded.
   - **Trip & Report Marked `CLOSED`**. Truck payload reset to `0.00 kg` and status returned to `AVAILABLE`.

8. **What-If Simulation Sandbox:**
   - Allows planners to simulate hypothetical volume spikes and multi-truck allocations.
   - Strict read-only isolation with prominent banner:
     `SIMULATION — HYPOTHETICAL RESULTS; NO REAL OPERATIONAL CHANGES.`

9. **Authoritative Analytics & Audit Trail:**
   - All KPIs (Total reports, recycling rates, active fleet, collected tonnage) derive from live MySQL aggregation queries.
   - Comprehensive audit log records user, action, timestamps, and status transitions.

---

## 🧪 Automated Verification Script

A complete automated PowerShell integration suite verifies all 9 workflow steps programmatically:
```powershell
powershell -ExecutionPolicy Bypass -File "d:\final project\test_e2e_workflow.ps1"
```
**Verification Status:** **100% PASS** across all assertions (ID creation, GIS matching, capacity blocking, trip dispatch, physical bin emptying, recycling receipt confirmation, audit logging).

---

## 🔒 Security & Data Integrity

- Authoritative business validation lives strictly on the Spring Boot backend.
- Database access is isolated through Spring Data JPA; no direct client database queries.
- Relational integrity enforced via Foreign Key constraints and MySQL transaction boundaries (`@Transactional(rollbackFor = Exception.class)`).
