const db = require("../config/db");

// GENERATE STUDY PLAN
const generateStudyPlan = async (req, res) => {
    try {
        const user_id = req.user.id;

        // Get user's available study hours
        const [users] = await db.promise().query(
            "SELECT daily_study_hours FROM users WHERE id = ?",
            [user_id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const dailyStudyHours = Number(
            users[0].daily_study_hours || 2
        );

        const dailyMinutes = dailyStudyHours * 60;

        // Get chapters with the nearest upcoming exam
        const [chapters] = await db.promise().query(
            `SELECT
                chapters.id AS chapter_id,
                chapters.name AS chapter_name,
                chapters.difficulty,
                chapters.status,
                subjects.id AS subject_id,
                subjects.name AS subject_name,
                exams.id AS exam_id,
                exams.exam_date
             FROM chapters
             JOIN subjects
                ON chapters.subject_id = subjects.id
             LEFT JOIN exams
                ON exams.id = (
                    SELECT e.id
                    FROM exams e
                    WHERE e.subject_id = subjects.id
                    AND e.exam_date >= CURDATE()
                    ORDER BY e.exam_date ASC
                    LIMIT 1
                )
             WHERE subjects.user_id = ?
             ORDER BY exams.exam_date ASC`,
            [user_id]
        );

        if (chapters.length === 0) {
            return res.status(404).json({
                message: "No chapters found. Add subjects and chapters first."
            });
        }

        const today = new Date();

        const pendingChapters = chapters.filter(
            chapter => chapter.status !== "Completed"
        );

        if (pendingChapters.length === 0) {
            return res.status(200).json({
                message: "All chapters are already completed!",
                studyPlan: []
            });
        }

        // Calculate priority
        const calculatePriority = (chapter) => {
            let priorityScore = 0;

            // Difficulty
            if (chapter.difficulty === "Hard") {
                priorityScore += 3;
            } else if (chapter.difficulty === "Medium") {
                priorityScore += 2;
            } else {
                priorityScore += 1;
            }

            // Exam proximity
            if (chapter.exam_date) {
                const examDate = new Date(chapter.exam_date);

                const difference =
                    examDate.getTime() - today.getTime();

                const daysRemaining =
                    Math.ceil(
                        difference /
                        (1000 * 60 * 60 * 24)
                    );

                if (daysRemaining <= 3) {
                    priorityScore += 5;
                } else if (daysRemaining <= 7) {
                    priorityScore += 4;
                } else if (daysRemaining <= 14) {
                    priorityScore += 3;
                } else if (daysRemaining <= 30) {
                    priorityScore += 2;
                } else {
                    priorityScore += 1;
                }
            }

            return priorityScore;
        };

        // Add priority score
        pendingChapters.forEach(chapter => {
            chapter.priorityScore =
                calculatePriority(chapter);
        });

        // Highest priority first
        pendingChapters.sort(
            (a, b) =>
                b.priorityScore - a.priorityScore
        );

        const studyPlan = [];

        let dayOffset = 0;
        let usedMinutes = 0;

        for (const chapter of pendingChapters) {

            let duration = 60;

            if (chapter.difficulty === "Easy") {
                duration = 45;
            } else if (chapter.difficulty === "Hard") {
                duration = 90;
            }

            if (
                usedMinutes + duration >
                dailyMinutes
            ) {
                dayOffset++;
                usedMinutes = 0;
            }

            if (duration > dailyMinutes) {
                duration = dailyMinutes;
            }

            const studyDate = new Date(today);

            studyDate.setDate(
                today.getDate() + dayOffset
            );

            let priority = "Medium";

            if (chapter.priorityScore >= 7) {
                priority = "High";
            } else if (chapter.priorityScore <= 3) {
                priority = "Low";
            }

            const formattedDate = studyDate
                .toISOString()
                .split("T")[0];

            studyPlan.push({
                user_id: user_id,
                subject_id: chapter.subject_id,
                chapter_id: chapter.chapter_id,
                exam_id: chapter.exam_id,
                study_date: formattedDate,
                duration_minutes: duration,
                priority: priority
            });

            usedMinutes += duration;
        }

        // Save generated study plan
        for (const task of studyPlan) {
            await db.promise().query(
                `INSERT INTO study_plans
                (
                    user_id,
                    subject_id,
                    chapter_id,
                    exam_id,
                    study_date,
                    duration_minutes,
                    priority
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    task.user_id,
                    task.subject_id,
                    task.chapter_id,
                    task.exam_id,
                    task.study_date,
                    task.duration_minutes,
                    task.priority
                ]
            );
        }

        res.status(201).json({
            message: "Study plan generated successfully",
            daily_study_hours: dailyStudyHours,
            studyPlan: studyPlan
        });

    } catch (error) {
        console.error(
            "Generate study plan error:",
            error
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};


// GET USER STUDY PLAN
const getStudyPlan = async (req, res) => {
    try {
        const user_id = req.user.id;

        const [studyPlan] = await db.promise().query(
            `SELECT
                study_plans.*,
                subjects.name AS subject_name,
                chapters.name AS chapter_name
             FROM study_plans
             JOIN subjects
                ON study_plans.subject_id = subjects.id
             JOIN chapters
                ON study_plans.chapter_id = chapters.id
             WHERE study_plans.user_id = ?
             ORDER BY study_plans.study_date ASC`,
            [user_id]
        );

        res.status(200).json({
            studyPlan: studyPlan
        });

    } catch (error) {
        console.error(
            "Get study plan error:",
            error
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};


module.exports = {
    generateStudyPlan,
    getStudyPlan
};