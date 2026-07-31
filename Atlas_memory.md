# ATLAS Application: Developer Memory & Architecture Guide

## 1. Executive Summary
ATLAS is a single-file, vanilla HTML/JS/CSS application designed for **Infrastructure Strategy** (Cell Placement Optimization)[cite: 2], **Customer Onboarding** (Project Scoping & Financial Quoting)[cite: 2], and **Gap Analysis** (EDR Analyzer for call data discrepancies)[cite: 3]. Because the app is built without a frontend framework (like React or Vue) or a bundler, state is managed globally and rendering relies on direct DOM manipulation using modern vanilla JavaScript and Tailwind CSS[cite: 2].

## 2. Technology Stack & External Dependencies
The application pulls all dependencies via CDN to maintain its zero-build, single-file nature[cite: 2].
* **Styling:** Tailwind CSS (via script tag), FontAwesome (Icons), Google Fonts (Inter)[cite: 2].
* **Mapping:** Leaflet.js (`leaflet.css`, `leaflet.js`) and CartoDB Dark Matter basemaps[cite: 2].
* **Gantt Chart:** DHTMLX Gantt (Standard Open Source)[cite: 2].
* **PDF Export:** `html2pdf.js` for generating client-facing proposals[cite: 2].
* **CSV Parsing:** PapaParse for robust CSV data ingestion[cite: 3].
* **Visualizations:** Chart.js for all statistical visualizations[cite: 3].

## 3. Global Architecture & State Management
The app uses a "module" visibility swapping approach[cite: 2]. The four main modules are:
1. `#module-gateway`: The landing page[cite: 2].
2. `#module-optimizer`: The cell placement wizard[cite: 2].
3. `#module-onboarding`: The DHTMLX Gantt timeline[cite: 2].
4. `#module-gap-analyzer`: The EDR analysis dashboard, added as a new card on the Gateway Home page[cite: 3].

* **Theming Strategy:** To differentiate the modules visually while maintaining overall aesthetic, the Onboarding Calculator uses Blue, the Cell Optimizer uses Green, and the Gap Analyzer uses a distinct Violet/Purple (`#8b5cf6`)[cite: 3].
* **State Management:** A global variable `currentAppModule` tracks the active view[cite: 2]. The `showModule('module_name')` function handles transitions and triggers specific resize events (like `map.invalidateSize()` or `gantt.render()`) to prevent layout bugs when rendering elements that were previously `display: none`[cite: 2].

---

## 4. Module Deep Dive: Cell Placement Optimizer
This module helps solutions architects determine where to deploy new AWS infrastructure based on strict SLA latency requirements[cite: 2].

### 4.1 State Variables
* `selectedFootprint` (Array of Indices): Currently deployed AWS regions[cite: 2].
* `cellCosts` (Dictionary): User-inputted monthly OPEX costs for specific regions[cite: 2].
* `customers` (Array of Objects): The target endpoints (AWS regions or World Cities)[cite: 2].
* `slaMode` & `globalSLA` / `perCustomerSLA`: Latency thresholds[cite: 2].
* `realisticMode` (Boolean): Toggles the underlying latency calculation math[cite: 2].

### 4.2 Latency Calculation Engine
The most critical part of this module is `getCustomerLatency(cellIdx, customer)`[cite: 2].
* **Naive Mode:** Uses a hardcoded 32x32 AWS ping matrix[cite: 2]. If the target is a city, it finds the geographically nearest AWS region and uses that matrix ping[cite: 2].
* **Realistic Mode:** 
  * If Target = AWS: Uses the matrix + Tier Tax[cite: 2].
  * If Target = City: Bypasses the matrix[cite: 2]. Calculates exact geographic distance using the `haversine()` formula, multiplies it by **0.012 ms/km** (speed of light through fiber optic glass round-trip), and adds a **Tier Tax** (T1: +5ms, T2: +20ms, T3: +40ms, T4: +60ms) to account for last-mile infrastructure quality[cite: 2].

### 4.3 Cost Calculator & The "Hidden Global Index"
* The app uses a relative cost index anchored to US East (`us-east-1` = 1.00x)[cite: 2]. 
* For example, Paris is `1.10x` and São Paulo is `1.50x`[cite: 2]. 
* When a user inputs a cost for a specific cell, the app **reverse-engineers a normalized base cost** by dividing the input by that region's index[cite: 2]. 
* This normalized base is then used to estimate OPEX for *any* other recommended region[cite: 2].

### 4.4 Optimization Algorithm (`analyzeCoverage`)
The algorithm is a greedy Cost-Effective Coverage model[cite: 2]:
1. Iterates over all un-covered endpoints[cite: 2].
2. Evaluates every valid AWS region to see how many endpoints it brings under SLA[cite: 2].
3. Calculates a `Cost Efficiency Score` = (Estimated Region Cost) / (Endpoints Covered)[cite: 2].
4. Picks the region with the lowest score, marks those endpoints as covered, and repeats until all possible endpoints are covered[cite: 2].

---

## 5. Module Deep Dive: Onboarding Calculator
This module scopes out engineering hours and generates a visual Gantt chart with automated financial quoting[cite: 2].

### 5.1 Financial Math & Syncing
* **Internal Cost** = Total Hours × Blended Hourly Rate[cite: 2].
* **Customer Price** = Internal Cost / (1 - Margin Percentage)[cite: 2].
* **The "Linked Duration" Toggle (`ob_linkDuration`)**:
  * *Unlinked*: Stretching a Gantt bar visually changes the calendar days, but does NOT alter the billed hours or price[cite: 2].
  * *Linked*: Stretching a Gantt bar recalculates the hours (Days × 8) and instantly spikes the project cost[cite: 2].
* **Syncing Logic**: When toggling from unlinked to linked, the app loops through tasks and forces the visual duration to match the `Estimated Hours` column (which acts as the Source of Truth)[cite: 2].

### 5.2 DHTMLX Gantt Configuration Hacks
* **Day 0 Column:** To provide a visual "planning" buffer, the project internal anchor is set to a specific Monday, but the timeline scale is configured to start one day earlier (Sunday)[cite: 2]. Because the timeline scale formatting replaces dates with "Day X", Sunday renders as "Day 0" (empty) and Monday renders as "Day 1" (where tasks snap)[cite: 2].
* **Dependency Topological Sort:** The `generateGanttStateFromTasks` function runs a custom algorithm to calculate `computed_start_days` and `computed_end_days` before feeding data to DHTMLX[cite: 2]. This ensures templates cascade perfectly based on their comma-separated dependency string (e.g., `deps: "t1, t2"`)[cite: 2].
* **Multi-Tier Caching:** `tierStates` dictionary saves the user's progress per deployment scope (Tier 1, 2, 3) so they don't lose custom tasks when toggling between dropdown templates[cite: 2].

---

## 6. Module Deep Dive: Gap Analyzer (EDR Analyzer)
Designed for Network Operations/Monitoring teams, this module analyzes CSV call data exports (Event Detail Records) to identify discrepancies between **Signing** and **Verification** requests, with a specific focus on validating **UK destination numbers**[cite: 3].

### 6.1 Data Flow & State Persistence
* **Stateless Persistence:** No data is persisted to a backend database; all analysis happens in the browser's memory[cite: 3]. Refreshing the page clears the data[cite: 3].
* **Column Mapping:** Upon uploading a CSV, users must map columns (Time, Service, From, To, Status, etc.) via a modal before processing begins[cite: 3].
* **State Variables:** Includes `gapData`, `gapFilteredData`, `gapColumnMap`, `gapPageSize`, `gapSortField`, `gapSortDirection`, and `gapChartData`[cite: 3]. Old Chart.js instances are specifically destroyed before re-rendering to prevent memory leaks[cite: 3].

### 6.2 Key Functionality & Filtering
* **Top-Level Metrics:** Displays Total Records, Signing Requests, Verification Requests, Gap Count, Gap Percentage, Invalid UK Numbers, Processing Time Outliers (>100ms), and Detected Anomalies[cite: 3].
* **Filtering:** Users can filter memory data by Service Type, Validation Status, Numbers, Status Codes, Customer, Source IP, and Processing Time[cite: 3].
* **Interactive Table:** Supports pagination (25, 50, 100 rows), column sorting, and visually highlights anomalous rows[cite: 3]. Clicking summary metric cards automatically filters the table to show specific rows (e.g., clicking "Invalid Numbers" filters the table accordingly)[cite: 3].

### 6.3 Visualizations & Anomaly Detection
* **Visualizations:** Utilizes Chart.js to render four specific charts: Gaps Over Time, Invalid Numbers Over Time, Volume Comparison (Stacked Area), and Processing Time Distribution (Histogram)[cite: 3]. 
* **Exclusions:** Bar charts, geographic maps, and scatter plots were explicitly excluded to focus on time-series trends and distributions[cite: 3].
* **Automated Anomaly Detection:** Flags gap spikes (where gap count exceeds **2.0 standard deviations** above the mean), invalid number spikes, and any requests taking longer than 100ms[cite: 3]. 

### 6.4 UK Number Validation Rules
The module strictly evaluates the "To" column to validate destination numbers[cite: 3]:
1. **Prefix:** Must start with `+44`[cite: 3].
2. **Length:** Must be between 11 and 13 digits total (after removing `+44`, remaining digits must be 9, 10, or 11)[cite: 3].
3. **Pattern Checks:** Flags repetitive digits (e.g., `+447777777777`) and obvious sequential digits (e.g., `+441234567890`)[cite: 3].
4. **Format Logic:** Validates against standard UK Mobile (`7xxx`) and Landline (`1xxx`, `2xxx`) prefixes[cite: 3].

---

## 7. Global Features & Future Expansion

### 7.1 Data Exporting & Proposal Generation
* **PDF Generation (Beta):** Uses `html2pdf.js` to generate hidden HTML strings formatted specifically for print, injecting active state data to output client-facing proposals[cite: 2].
* **JSON/CSV Export:** Users can export application state locally[cite: 2, 3]. In the Gap Analyzer, users are prompted via a modal to select between exporting "Filtered Results" or "All Results"[cite: 3].

### 7.2 How to Build on Top of This
* **Cell Optimizer:** Add New AWS Regions by updating the `regions` array, appending to the `matrix` 2D array, and updating the `AWS_PRICE_INDEX`[cite: 2]. Target cities can be appended to `worldCities` with assigned tiers (1-4)[cite: 2].
* **Gap Analyzer Future Roadmap:** Future iterations could expand validation rules beyond the UK (+44), add custom anomaly threshold sensitivities, or link Signing and Verification requests by `Call-ID` or `Trace-ID` instead of relying on counts[cite: 3].
* **Backend Integration:** The stateless HTML2PDF and JSON/CSV Export logic can easily be swapped to execute `fetch()` POST requests, sending active global state payloads to a Node.js/Python server for database storage[cite: 2].