
"use strict";

const records = document.getElementById("records");
const count = document.getElementById("count");
const status = document.getElementById("status");
const retry = document.getElementById("retry");
const table = document.getElementById("students");

// Display a message inside the table
function showMessage(message) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");

    cell.colSpan = 3;
    cell.className = "empty";
    cell.textContent = message;

    row.appendChild(cell);
    records.replaceChildren(row);
}

// Display detailed error information
function showError(error) {
    console.error("Yoga Student Records Error:", error);

    if (error.name === "AbortError") {
        status.textContent =
            "Request timed out. Please check your connection and retry.";
    } else if (error instanceof TypeError) {
        status.textContent =
            "Unable to connect. Check the Console for network, CORS, or configuration errors.";
    } else {
        status.textContent =
            error.message || "An unexpected error occurred.";
    }

    showMessage("Student records could not be loaded.");
    retry.hidden = false;
}

// Load student records from Supabase
async function loadStudents() {
    retry.hidden = true;
    table.setAttribute("aria-busy", "true");

    count.textContent = "—";
    status.textContent = "Connecting to Supabase...";
    showMessage("Loading student records...");

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);

    try {
        // 1. Validate page elements
        if (!records || !count || !status || !retry || !table) {
            throw new Error(
                "Required HTML elements are missing. Check your page IDs."
            );
        }

        // 2. Validate Supabase configuration
        const config = window.YOGA_CONFIG;

        if (!config) {
            throw new Error(
                "YOGA_CONFIG is missing. Ensure config.js loads before script.js."
            );
        }

        if (!config.supabaseUrl || !config.supabasePublishableKey) {
            throw new Error(
                "Supabase URL or publishable key is missing in config.js."
            );
        }

        if (!config.supabasePublishableKey.startsWith("sb_publishable_")) {
            throw new Error(
                "Invalid key format. Use your Supabase publishable key."
            );
        }

        // 3. Validate Supabase URL
        let supabaseUrl;

        try {
            supabaseUrl = new URL(config.supabaseUrl);
        } catch {
            throw new Error("Invalid Supabase project URL in config.js.");
        }

        if (
            supabaseUrl.protocol !== "https:" ||
            !supabaseUrl.hostname.endsWith(".supabase.co")
        ) {
            throw new Error(
                "Check the Supabase project URL. An HTTPS Supabase URL is required."
            );
        }

        // 4. Build REST API endpoint
        const endpoint = new URL(
            "/rest/v1/student_yoga",
            supabaseUrl.origin
        );

        endpoint.searchParams.set(
            "select",
            "id,created_at,studentname"
        );

        endpoint.searchParams.set(
            "order",
            "created_at.desc"
        );

        console.info("Connecting to Supabase:", endpoint.origin);
        console.info("Loading table: student_yoga");

        // 5. Send API request
        const response = await fetch(endpoint, {
            method: "GET",
            headers: {
                apikey: config.supabasePublishableKey,
                Accept: "application/json"
            },
            signal: controller.signal
        });

        console.info("Supabase HTTP Status:", response.status);

        // 6. Handle HTTP errors
        if (!response.ok) {
            let details = "";

            try {
                const errorBody = await response.json();

                details =
                    errorBody.message ||
                    errorBody.msg ||
                    errorBody.error_description ||
                    errorBody.error ||
                    JSON.stringify(errorBody);
            } catch {
                details = response.statusText || "No additional details.";
            }

            console.error("Supabase API Error:", {
                status: response.status,
                statusText: response.statusText,
                details: details
            });

            if (response.status === 401) {
                throw new Error(
                    "HTTP 401: Authentication failed. Check your Supabase publishable key."
                );
            }

            if (response.status === 403) {
                throw new Error(
                    "HTTP 403: Access denied. Check table permissions, grants, and RLS policies."
                );
            }

            if (response.status === 404) {
                throw new Error(
                    "HTTP 404: Table or API endpoint not found. Verify student_yoga and Data API settings."
                );
            }

            if (response.status === 429) {
                throw new Error(
                    "HTTP 429: Too many requests. Please wait and retry."
                );
            }

            throw new Error(
                `Supabase request failed (HTTP ${response.status}): ${details}`
            );
        }

        // 7. Parse JSON response
        let students;

        try {
            students = await response.json();
        } catch {
            throw new Error(
                "Supabase returned an invalid JSON response."
            );
        }

        if (!Array.isArray(students)) {
            throw new Error(
                "Unexpected response format. Expected a list of student records."
            );
        }

        // 8. Validate records
        const invalidRecord = students.some(student =>
            !student ||
            typeof student !== "object" ||
            Array.isArray(student)
        );

        if (invalidRecord) {
            throw new Error(
                "The database returned an invalid student record."
            );
        }

        // 9. Display records safely
        const rows = students.map(student => {
            const row = document.createElement("tr");

            for (const field of [
                "id",
                "created_at",
                "studentname"
            ]) {
                const cell = document.createElement("td");

                cell.textContent = String(student[field] ?? "");
                row.appendChild(cell);
            }

            return row;
        });

        records.replaceChildren(...rows);

        if (students.length === 0) {
            showMessage("No records found.");
        }

        // 10. Update record count and status
        count.textContent = String(students.length);

        status.textContent = students.length
            ? "Student records loaded successfully."
            : "Connection successful. No student records are available.";

        console.info(
            `Successfully loaded ${students.length} student record(s).`
        );

    } catch (error) {
        showError(error);

    } finally {
        clearTimeout(timer);
        table.setAttribute("aria-busy", "false");
    }
}

// Retry button
retry.addEventListener("click", loadStudents);

// Load records when the page starts
loadStudents();
