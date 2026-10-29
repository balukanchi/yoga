
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

    cell.colSpan = 6;
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
            "Unable to connect. Check your internet connection, CORS, or Supabase configuration.";
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
        // Validate required HTML elements
        if (!records || !count || !status || !retry || !table) {
            throw new Error(
                "Required HTML elements are missing. Check your HTML element IDs."
            );
        }

        // Validate Supabase configuration
        const config = window.YOGA_CONFIG;

        if (!config) {
            throw new Error(
                "YOGA_CONFIG is missing. Load config.js before script.js."
            );
        }

        if (
            !config.supabaseUrl ||
            !config.supabasePublishableKey
        ) {
            throw new Error(
                "Supabase URL or publishable key is missing in config.js."
            );
        }

        if (
            !config.supabasePublishableKey.startsWith("sb_publishable_")
        ) {
            throw new Error(
                "Invalid key format. Use the Supabase publishable key."
            );
        }

        // Validate Supabase URL
        let supabaseUrl;

        try {
            supabaseUrl = new URL(config.supabaseUrl);
        } catch {
            throw new Error(
                "Invalid Supabase URL. Check config.js."
            );
        }

        if (
            supabaseUrl.protocol !== "https:" ||
            !supabaseUrl.hostname.endsWith(".supabase.co")
        ) {
            throw new Error(
                "The Supabase project URL must be a valid HTTPS Supabase URL."
            );
        }

        // Build REST API endpoint
        const endpoint = new URL(
            "/rest/v1/student_yoga",
            supabaseUrl.origin
        );

        endpoint.searchParams.set(
            "select",
            "id,created_at,studentname,schoolname,organizer,issuedate"
        );

        endpoint.searchParams.set(
            "order",
            "created_at.desc"
        );

        console.info("Supabase endpoint:", endpoint.href);

        // Send request
        const response = await fetch(endpoint, {
            method: "GET",
            headers: {
                apikey: config.supabasePublishableKey,
                Accept: "application/json"
            },
            signal: controller.signal
        });

        console.info(
            "Supabase HTTP Status:",
            response.status
        );

        // Handle HTTP errors
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
                details: details
            });

            if (response.status === 401) {
                throw new Error(
                    "HTTP 401: Authentication failed. Verify your publishable key."
                );
            }

            if (response.status === 403) {
                throw new Error(
                    "HTTP 403: Access denied. Check database grants and RLS policies."
                );
            }

            if (response.status === 404) {
                throw new Error(
                    "HTTP 404: Check the student_yoga table and Supabase Data API settings."
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

        // Parse JSON response
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
                "Unexpected response. Expected an array of student records."
            );
        }

        // Validate returned records
        if (
            students.some(student =>
                !student ||
                typeof student !== "object" ||
                Array.isArray(student)
            )
        ) {
            throw new Error(
                "The database returned an invalid student record."
            );
        }

        // Create table rows safely
        const fields = [
            "id",
            "created_at",
            "studentname",
            "schoolname",
            "organizer",
            "issuedate"
        ];

        const rows = students.map(student => {
            const row = document.createElement("tr");

            fields.forEach(field => {
                const cell = document.createElement("td");
                let value = student[field];

                // Format timestamps for easier reading
                if (field === "created_at" && value) {
                    const date = new Date(value);

                    value = Number.isNaN(date.getTime())
                        ? String(value)
                        : date.toLocaleString("en-IN");
                }

                // Display empty values clearly
                if (value === null || value === undefined || value === "") {
                    value = "—";
                }

                cell.textContent = String(value);
                row.appendChild(cell);
            });

            return row;
        });

        records.replaceChildren(...rows);

        if (students.length === 0) {
            showMessage("No records found.");
        }

        // Update total record count
        count.textContent = String(students.length);

        status.textContent = students.length > 0
            ? "Student records loaded successfully."
            : "Connected successfully. No student records are available.";

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

// Retry button event
retry.addEventListener("click", loadStudents);

// Load records when the page opens
loadStudents();
