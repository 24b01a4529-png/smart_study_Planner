const db = require("../config/db");

// GET DASHBOARD DATA
const getDashboard = async (req, res) => {
    try {
        const user_id = req.user.id;

        // Check user
        const [users] = await db.promise().query(
            `SELECT id, name, email, daily_study_hours
             FROM users
             WHERE id = ?`,
            [user_id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const user = users[0];

        // Today's study tasks
        const [todayTasks] = await db.promise().query(
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
             AND study_plans.study_date = CURDATE()
             ORDER BY study_plans.priority DESC`,
            [user_id]
        );

        // Count completed tasks
        const [completedResult] = await db.promise().query(
            `SELECT COUNT(*) AS completed_count
             FROM study_plans
             WHERE user_id = ?
             AND status = 'Completed'`,
            [user_id]
        );

        // Count pending tasks
        const [pendingResult] = await db.promise().query(
            `SELECT COUNT(*) AS pending_count
             FROM study_plans
             WHERE user_id = ?
             AND status = 'Pending'`,
            [user_id]
        );

        // Count missed tasks
        const [missedResult] = await db.promise().query(
            `SELECT COUNT(*) AS missed_count
             FROM study_plans
             WHERE user_id = ?
             AND status = 'Missed'`,
            [user_id]
        );

        // Total study tasks
        const [totalResult] = await db.promise().query(
            `SELECT COUNT(*) AS total_tasks
             FROM study_plans
             WHERE user_id = ?`,
            [user_id]
        );

        // Upcoming exams
        const [upcomingExams] = await db.promise().query(
            `SELECT
                exams.id,
                exams.exam_name,
                exams.exam_date,
                exams.total_marks,
                subjects.name AS subject_name
             FROM exams
             JOIN subjects
                ON exams.subject_id = subjects.id
             WHERE exams.user_id = ?
             AND exams.exam_date >= CURDATE()
             ORDER BY exams.exam_date ASC
             LIMIT 5`,
            [user_id]
        );

        // Total subjects
        const [subjectResult] = await db.promise().query(
            `SELECT COUNT(*) AS subject_count
             FROM subjects
             WHERE user_id = ?`,
            [user_id]
        );

        // Total chapters
        const [chapterResult] = await db.promise().query(
            `SELECT COUNT(*) AS chapter_count
             FROM chapters
             JOIN subjects
                ON chapters.subject_id = subjects.id
             WHERE subjects.user_id = ?`,
            [user_id]
        );

        // Completed chapters
        const [completedChapterResult] = await db.promise().query(
            `SELECT COUNT(*) AS completed_chapters
             FROM chapters
             JOIN subjects
                ON chapters.subject_id = subjects.id
             WHERE subjects.user_id = ?
             AND chapters.status = 'Completed'`,
            [user_id]
        );

        const totalTasks = totalResult[0].total_tasks;
        const completedTasks = completedResult[0].completed_count;

        let completionPercentage = 0;

        if (totalTasks > 0) {
            completionPercentage =
                Math.round(
                    (completedTasks / totalTasks) * 100
                );
        }

        res.status(200).json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                daily_study_hours: user.daily_study_hours
            },

            statistics: {
                total_subjects: subjectResult[0].subject_count,
                total_chapters: chapterResult[0].chapter_count,
                completed_chapters:
                    completedChapterResult[0].completed_chapters,
                total_tasks: totalTasks,
                completed_tasks: completedTasks,
                pending_tasks: pendingResult[0].pending_count,
                missed_tasks: missedResult[0].missed_count,
                completion_percentage:
                    completionPercentage
            },

            todayTasks: todayTasks,

            upcomingExams: upcomingExams
        });

    } catch (error) {
        console.error(
            "Dashboard error:",
            error
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};

module.exports = {
    getDashboard
};