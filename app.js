for (const field of [
    "id",
    "created_at",
    "studentname",
    "schoolname",
    "organizer",
    "issuedate"
]) {
    const cell = document.createElement("td");
    let value = student[field];

    if (field === "created_at" && value) {
        const date = new Date(value);

        value = Number.isNaN(date.getTime())
            ? String(value)
            : date.toLocaleString("en-IN");
    }

    if (value === null || value === undefined || value === "") {
        value = "—";
    }

    cell.textContent = String(value);
    row.appendChild(cell);
}
