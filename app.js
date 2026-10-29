"use strict";

const records = document.getElementById("records");
const count = document.getElementById("count");
const status = document.getElementById("status");
const retry = document.getElementById("retry");
const table = document.getElementById("students");

function showMessage(message) {
  const row = document.createElement("tr");
  const cell = document.createElement("td");
  cell.colSpan = 3;
  cell.className = "empty";
  cell.textContent = message;
  row.append(cell);
  records.replaceChildren(row);
}

async function loadStudents() {
  retry.hidden = true;
  table.setAttribute("aria-busy", "true");
  count.textContent = "—";
  status.textContent = "Loading student records…";
  showMessage("Loading…");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const config = window.YOGA_CONFIG;
    if (!config?.supabasePublishableKey || config.supabasePublishableKey === "YOUR_SUPABASE_PUBLISHABLE_KEY") {
      throw new Error("Add your Supabase publishable key to config.js to load student records.");
    }
    if (!config.supabasePublishableKey.startsWith("sb_publishable_")) {
      throw new Error("Use a Supabase publishable key beginning with sb_publishable_ in config.js.");
    }
    const endpoint = new URL("/rest/v1/student_yoga", config.supabaseUrl);
    endpoint.searchParams.set("select", "id,created_at,studentname");
    endpoint.searchParams.set("order", "created_at.desc");
    const response = await fetch(endpoint, {
      headers: { apikey: config.supabasePublishableKey, Accept: "application/json" },
      signal: controller.signal
    });
    if (!response.ok) {
      throw new Error(`Database request failed (HTTP ${response.status}). Check the publishable key and Supabase read permissions.`);
    }
    const students = await response.json();
    if (!Array.isArray(students) || students.some(student => !student || typeof student !== "object" || Array.isArray(student))) {
      throw new Error("The database returned an unexpected response.");
    }
    const rows = students.map(student => {
      const row = document.createElement("tr");
      for (const field of ["id", "created_at", "studentname"]) {
        const cell = document.createElement("td");
        cell.textContent = String(student[field] ?? "");
        row.append(cell);
      }
      return row;
    });
    records.replaceChildren(...rows);
    if (!students.length) showMessage("No records found.");
    count.textContent = String(students.length);
    status.textContent = students.length ? "Student records loaded." : "No student records are available.";
  } catch (error) {
    status.textContent = error.name === "AbortError"
      ? "The database request timed out. Please try again."
      : error instanceof TypeError
        ? "Unable to connect. Check your internet connection and Supabase configuration."
        : error.message;
    showMessage("Student records could not be loaded.");
    retry.hidden = false;
  } finally {
    clearTimeout(timer);
    table.setAttribute("aria-busy", "false");
  }
}

retry.addEventListener("click", loadStudents);
loadStudents();
