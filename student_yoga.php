
<?php
// student_yoga.php

$supabaseUrl = "https://wzwozltqihxnmjjukcab.supabase.co";
$supabaseKey = "YOUR_SUPABASE_PUBLISHABLE_KEY";

$endpoint = $supabaseUrl
    . "/rest/v1/student_yoga"
    . "?select=id,created_at,studentname"
    . "&order=created_at.desc";

$ch = curl_init($endpoint);

curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        "apikey: " . $supabaseKey,
        "Accept: application/json"
    ],
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_TIMEOUT => 20
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);

curl_close($ch);

$students = [];

if ($response !== false && $httpCode >= 200 && $httpCode < 300) {
    $data = json_decode($response, true);

    if (is_array($data)) {
        $students = $data;
    }
} else {
    error_log("Supabase request failed. HTTP: "
        . $httpCode . " Error: " . $error);
}

function e($value) {
    return htmlspecialchars(
        (string)($value ?? ""),
        ENT_QUOTES,
        "UTF-8"
    );
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport"
          content="width=device-width, initial-scale=1">

    <title>Student Yoga Details</title>

    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 30px;
            background: #f4f7fb;
        }

        h2 {
            text-align: center;
            color: #234c72;
        }

        .container {
            max-width: 900px;
            margin: auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        th, td {
            padding: 12px;
            border: 1px solid #ddd;
            text-align: left;
        }

        th {
            background: #234c72;
            color: white;
        }

        tr:nth-child(even) {
            background: #f2f6fa;
        }

        .count {
            margin-bottom: 15px;
        }

        .empty {
            text-align: center;
            padding: 20px;
        }
    </style>
</head>

<body>
<div class="container">

    <h2>Student Yoga Details</h2>

    <p class="count">
        Total Records: <strong><?= count($students) ?></strong>
    </p>

    <table>
        <thead>
        <tr>
            <th>ID</th>
            <th>Created Date</th>
            <th>Student Name</th>
        </tr>
        </thead>

        <tbody>
        <?php if (count($students) > 0): ?>

            <?php foreach ($students as $student): ?>
            <tr>
                <td><?= e($student["id"] ?? "") ?></td>
                <td><?= e($student["created_at"] ?? "") ?></td>
                <td><?= e($student["studentname"] ?? "") ?></td>
            </tr>
            <?php endforeach; ?>

        <?php else: ?>
            <tr>
                <td colspan="3" class="empty">
                    No records found, or the database
                    request could not be completed.
                </td>
            </tr>
        <?php endif; ?>
        </tbody>
    </table>

</div>
</body>
</html>
