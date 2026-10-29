
"use strict";

const records = document.getElementById("records");
const count = document.getElementById("count");
const status = document.getElementById("status");
const retry = document.getElementById("retry");
const table = document.getElementById("students");

// All six database columns
const fields = [
    "id",
    "created_at",
    "studentname",
    "schoolname",
    "organizer",
    "issuedate"
];

// Display a message inside the table
function showMessage(message) {
    if (!records) {
        console.error("HTML element #records was not found.");
        return;
    }

    const row = document.createElement("tr");
    const cell = document.createElement("td");

    cell.colSpan = fields.length;
    cell.className = "empty";
    cell.textContent = message;

    row.appendChild(cell);
    records.replaceChildren(row);
}

// Display detailed error information
function showError(error) {
    console.error("Yoga Student Records Error:", error);

    if (status) {
        if (error.name === "AbortError") {
            status.textContent =
                "Request timed out. Please check your connection and retry.";
        } else if (error instanceof TypeError) {
            status.textContent =
                "Unable to connect. Check your internet, network, CORS, and Supabase configuration.";
        } else {
            status.textContent =
                error.message || "An unexpected error occurred.";
        }
    }

    showMessage("Student records could not be loaded.");

    if (retry) {
        retry.hidden = false;
    }
}

// Load student records from Supabase
async function loadStudents() {
    if (!records || !count || !status || !retry || !table) {
        console.error("Missing required HTML elements:", {
            records: !!records,
            count: !!count,
            status: !!status,
            retry: !!retry,
            students: !!table
        });

        if (status) {
            status.textContent =
                "Error: Check the HTML element IDs and script loading.";
        }

        if (records) {
            showMessage("Required HTML elements are missing.");
        }

        return;
    }

    // Keep the rest of your existing loadStudents() function here.

    retry.hidden = true;
    table.setAttribute("aria-busy", "true");

    count.textContent = "—";
    status.textContent = "Connecting to Supabase...";
    showMessage("Loading student records...");

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);

    try {
        // 1. Validate Supabase configuration
        const config = window.YOGA_CONFIG;

        if (!config) {
            throw new Error(
                "YOGA_CONFIG is missing. Load config.js before script.js."
            );
        }

        if (!config.supabaseUrl || !config.supabasePublishableKey) {
            throw new Error(
                "Supabase URL or publishable key is missing in config.js."
            );
        }

        if (
            !config.supabasePublishableKey.startsWith("sb_publishable_")
        ) {
            throw new Error(
                "Invalid key format. Use your Supabase publishable key."
            );
        }

        // 2. Validate the Supabase project URL
        let supabaseUrl;

        try {
            supabaseUrl = new URL(config.supabaseUrl);
        } catch {
            throw new Error(
                "Invalid Supabase project URL in config.js."
            );
        }

        if (
            supabaseUrl.protocol !== "https:" ||
            !supabaseUrl.hostname.endsWith(".supabase.co")
        ) {
            throw new Error(
                "Check the HTTPS Supabase project URL in config.js."
            );
        }

        // 3. Build the REST API endpoint
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

        console.info(
            "Connecting to Supabase:",
            endpoint.origin
        );

        console.info(
            "Requesting columns:",
            fields.join(", ")
        );

        // 4. Send the API request
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

        // 5. Handle HTTP errors
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
                details =
                    response.statusText || "No additional details.";
            }

            console.error("Supabase API Error:", {
                status: response.status,
                statusText: response.statusText,
                details: details
            });

            if (response.status === 400) {
                throw new Error(
                    "HTTP 400: Check the table name and all six column names. Details: " +
                    details
                );
            }

            if (response.status === 401) {
                throw new Error(
                    "HTTP 401: Authentication failed. Verify the Supabase publishable key."
                );
            }

            if (response.status === 403) {
                throw new Error(
                    "HTTP 403: Access denied. Check SELECT grants and RLS policies."
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
                "Supabase request failed (HTTP " +
                response.status +
                "): " +
                details
            );
        }

        // 6. Parse the response
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
                "Unexpected response. Expected a list of student records."
            );
        }

        // 7. Validate the returned records
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

        // 8. Display all six fields safely
        const rows = students.map(student => {
            const row = document.createElement("tr");

            fields.forEach(field => {
                const cell = document.createElement("td");
                let value = student[field];

                // Format created_at for readability
                if (field === "created_at" && value) {
                    const date = new Date(value);

                    value = Number.isNaN(date.getTime())
                        ? String(value)
                        : date.toLocaleString("en-IN");
                }

                // Display issuedate as a date
                if (field === "issuedate" && value) {
                    const dateText = String(value);

                    value = /^\d{4}-\d{2}-\d{2}$/.test(dateText)
                        ? dateText.split("-").reverse().join("-")
                        : dateText;
                }

                // Handle null and empty values
                if (
                    value === null ||
                    value === undefined ||
                    value === ""
                ) {
                    value = "—";
                }

                // Safe text rendering
                cell.textContent = String(value);
                row.appendChild(cell);
            });

            return row;
        });

        records.replaceChildren(...rows);

        // 9. Handle an empty table
        if (students.length === 0) {
            showMessage("No records found.");
        }

        // 10. Update total record count and status
        count.textContent = String(students.length);

        status.textContent = students.length > 0
            ? "Student records loaded successfully."
            : "Connected successfully. No student records are available.";

        console.info(
            "Successfully loaded " +
            students.length +
            " student record(s)."
        );

    } catch (error) {
        showError(error);

    } finally {
        clearTimeout(timer);
        table.setAttribute("aria-busy", "false");
    }
}

// 11. Retry button
if (retry) {
    retry.addEventListener("click", loadStudents);
}

// 12. Load records when the page opens
loadStudents();
