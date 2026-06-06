const express = require("express");
const cors = require("cors");
const sendEmail = require("./mailer");
const app = express();
const db = require("./db");
const cron = require("node-cron");
 
app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);
 
/* ================= REGISTER ================= */
app.post("/api/register", (req, res) => {
  const { name, email, password } = req.body;
 
  db.query(
    "INSERT INTO users (name, email, password) VALUES ($1, $2, $3)",
    [name, email, password],
    (err) => {
      if (err)
        return res.status(500).json({ message: "Email already exists" });
 
      res.json({ message: "Registered" });
    }
  );
});
 
/* ================= LOGIN ================= */
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
 
  db.query(
    "SELECT * FROM users WHERE email=$1 AND password=$2",
    [email, password],
    (err, result) => {
      if (err) return res.status(500).json(err);
 
      if (result.rows.length > 0) {
        res.json({ user: result.rows[0] });
      } else {
        res.status(401).json({ message: "Invalid login" });
      }
    }
  );
});
 
/* ================= GET TASKS ================= */
app.get("/api/tasks/:userId", (req, res) => {
  const userId = req.params.userId;
 
  db.query(
    "SELECT * FROM tasks WHERE user_id=$1 ORDER BY id DESC",
    [userId],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json(result.rows);
    }
  );
});
 
/* ================= ADD TASK ================= */
app.post("/api/tasks", (req, res) => {
  const { title, description, user_id, due_datetime } = req.body;
 
  db.query(
    `INSERT INTO tasks (title, description, status, user_id, due_datetime)
     VALUES ($1, $2, $3, $4, $5)`,
    [title, description, "Pending", user_id, due_datetime],
    (err) => {
      if (err) return res.status(500).json(err);
 
      res.json({ message: "Task added" });
    }
  );
});
 
/* ================= EDIT TASK ================= */
app.put("/api/tasks/:id", (req, res) => {
  const id = req.params.id;
  const { title, description, due_datetime } = req.body;
 
  db.query(
    `UPDATE tasks
     SET title=$1,
         description=$2,
         due_datetime=$3
     WHERE id=$4`,
    [title, description, due_datetime, id],
    (err) => {
      if (err) return res.status(500).json(err);
 
      res.json({ message: "Updated" });
    }
  );
});
 
/* ================= COMPLETE TASK ================= */
app.put("/api/tasks/complete/:id", (req, res) => {
  const id = req.params.id;
 
  db.query(
    "UPDATE tasks SET status='Completed' WHERE id=$1",
    [id],
    (err) => {
      if (err) return res.status(500).json(err);
 
      res.json({ message: "Completed" });
    }
  );
});
 
/* ================= DELETE ================= */
app.delete("/api/tasks/:id", (req, res) => {
  const id = req.params.id;
 
  db.query(
    "DELETE FROM tasks WHERE id=$1",
    [id],
    (err) => {
      if (err) return res.status(500).json(err);
 
      res.json({ message: "Deleted" });
    }
  );
});
 
/* ================= AUTO CHECKER ================= */
cron.schedule("* * * * *", () => {
  console.log("Checking reminders...");
 
  db.query(
    `SELECT tasks.*, users.email
     FROM tasks
     JOIN users ON tasks.user_id = users.id
     WHERE tasks.status = 'Pending'
     AND tasks.due_datetime IS NOT NULL`,
    async (err, results) => {
      if (err) {
        console.log(err);
        return;
      }
 
      const now = new Date();
 
      for (const task of results.rows) {
        const due = new Date(task.due_datetime);
        const diffMs = due - now;
        const diffMin = Math.floor(diffMs / 60000);
 
        const sent = task.reminder_sent || "";
 
        const sendReminder = async (subject, message, code, timeText) => {
          await sendEmail(
            task.email,
            subject,
            `
            <div style="font-family:Arial,sans-serif;background:#f4f6f8;padding:30px;">
              <div style="max-width:600px;margin:auto;background:white;border-radius:14px;padding:35px;text-align:center;box-shadow:0 12px 30px rgba(0,0,0,0.08);">
 
                <img
                  src="https://raw.githubusercontent.com/vinukjithsara/Task-Maneger/main/src/assets/logo.png"
                  style="width:220px;height:auto;border-radius:22px;margin-bottom:20px;"
                />
 
                <h2 style="color:#111;">${subject}</h2>
 
                <p style="color:#555;font-size:16px;">
                  ${message}
                </p>
 
                <div style="background:#eef4ff;padding:18px;border-radius:10px;text-align:left;margin:25px 0;">
                  <p><strong>Task:</strong> ${task.title}</p>
                  <p><strong>Deadline:</strong> ${task.due_datetime}</p>
                  <p><strong>Status:</strong> Pending</p>
                  <p><strong>Time:</strong> ${timeText}</p>
                </div>
 
                <a
                  href="${process.env.FRONTEND_URL}/task"
                  style="display:inline-block;background:#2563eb;color:white;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:bold;"
                >
                  Open WorkTrack
                </a>
 
                <p style="margin-top:25px;font-size:12px;color:#888;">
                  Sent automatically by WorkTrack
                </p>
 
              </div>
            </div>
            `
          );
 
          db.query(
            `UPDATE tasks
             SET reminder_sent = COALESCE(reminder_sent, '') || $1 || ','
             WHERE id=$2`,
            [code, task.id]
          );
 
          console.log(code + " sent:", task.title);
        };
 
        /* ================= 24 HOURS ================= */
        if (diffMin <= 1440 && diffMin > 1380 && !sent.includes("24h")) {
          await sendReminder(
            "⏰ WorkTrack Reminder",
            "Your task deadline is in 24 hours.",
            "24h",
            "24 Hours Left"
          );
        }
 
        /* ================= 12 HOURS ================= */
        else if (diffMin <= 720 && diffMin > 660 && !sent.includes("12h")) {
          await sendReminder(
            "⏰ WorkTrack Reminder",
            "Your task deadline is in 12 hours.",
            "12h",
            "12 Hours Left"
          );
        }
 
        /* ================= 3 HOURS ================= */
        else if (diffMin <= 180 && diffMin > 120 && !sent.includes("3h")) {
          await sendReminder(
            "⏰ WorkTrack Reminder",
            "Your task deadline is in 3 hours.",
            "3h",
            "3 Hours Left"
          );
        }
 
        /* ================= 1 HOUR ================= */
        else if (diffMin <= 60 && diffMin > 10 && !sent.includes("1h")) {
          await sendReminder(
            "⏰ WorkTrack Reminder",
            "Your task deadline is in 1 hour.",
            "1h",
            "1 Hour Left"
          );
        }
 
        /* ================= 10 MINUTES ================= */
        else if (diffMin <= 10 && diffMin > 0 && !sent.includes("10m")) {
          await sendReminder(
            "⏰ WorkTrack Reminder",
            "Your task deadline is in 10 minutes.",
            "10m",
            diffMin + " Minutes Left"
          );
        }
 
        /* ================= OVERDUE ================= */
        else if (diffMin <= 0 && !sent.includes("overdue")) {
          await sendReminder(
            "🚨 WorkTrack Deadline Passed",
            "Your task deadline has passed and task is still pending.",
            "overdue",
            "Deadline Passed"
          );
        }
      }
    }
  );
});
 
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🚀`);
});
 