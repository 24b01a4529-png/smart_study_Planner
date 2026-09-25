const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const chapterRoutes = require("./routes/chapterRoutes");
const examRoutes = require("./routes/examRoutes");
const studyPlanRoutes = require("./routes/studyPlanRoutes");
const progressRoutes = require("./routes/progressRoutes");
const rescheduleRoutes = require("./routes/rescheduleRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const userRoutes = require("./routes/userRoutes");

const authMiddleware = require("./middleware/authMiddleware");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Public routes
app.use("/api/auth", authRoutes);

// Protected routes
app.use("/api/subjects", authMiddleware, subjectRoutes);
app.use("/api/chapters", authMiddleware, chapterRoutes);
app.use("/api/exams", authMiddleware, examRoutes);
app.use("/api/study-plan", authMiddleware, studyPlanRoutes);
app.use("/api/progress", authMiddleware, progressRoutes);
app.use("/api/reschedule", authMiddleware, rescheduleRoutes);
app.use("/api/dashboard", authMiddleware, dashboardRoutes);
app.use("/api/user", authMiddleware, userRoutes);

// Home route
app.get("/", (req, res) => {
    res.json({
        message: "Smart Study Planner Backend is running!"
    });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});