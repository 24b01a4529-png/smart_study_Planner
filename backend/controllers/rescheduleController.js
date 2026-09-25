const db = require("../config/db");

// GET USER DAILY STUDY HOURS
const getDailyStudyMinutes = async (user_id) => {
    const [users] = await db.promise().query(
        "SELECT daily_study_hours FROM users WHERE id = ?",
        [user_id]
    );

    if (users.length === 0) {
        return null;
    }

    const hours = Number(
        users[0].daily_study_hours || 2
    );

    return hours * 60;
};


// RESCHEDULE ONE MISSED TASK
const rescheduleTask = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;

        const dailyMinutes =
            await getDailyStudyMinutes(user_id);

        if (dailyMinutes === null) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const [tasks] = await db.promise().query(
            `SELECT *
             FROM study_plans
             WHERE id = ?
             AND user_id = ?
             AND status = 'Missed'`,
            [id, user_id]
        );

        if (tasks.length === 0) {
            return res.status(404).json({
                message: "Missed study task not found"
            });
        }

        const task = tasks[0];

        // Find the latest future study date
        const [latestTasks] = await db.promise().query(
            `SELECT MAX(study_date) AS latest_date
             FROM study_plans
             WHERE user_id = ?
             AND study_date >= CURDATE()`,
            [user_id]
        );

        let nextDate = new Date();

        if (latestTasks[0].latest_date) {
            nextDate = new Date(
                latestTasks[0].latest_date
            );

            nextDate.setDate(
                nextDate.getDate() + 1
            );
        }

        const formattedDate = nextDate
            .toISOString()
            .split("T")[0];

        let duration = task.duration_minutes;

        // Do not exceed daily study time
        if (duration > dailyMinutes) {
            duration = dailyMinutes;
        }

        await db.promise().query(
            `INSERT INTO study_plans
            (
                user_id,
                subject_id,
                chapter_id,
                exam_id,
                study_date,
                duration_minutes,
                priority,
                status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')`,
            [
                user_id,
                task.subject_id,
                task.chapter_id,
                task.exam_id,
                formattedDate,
                duration,
                task.priority
            ]
        );

        res.status(201).json({
            message: "Missed task rescheduled successfully",
            newStudyDate: formattedDate,
            duration_minutes: duration
        });

    } catch (error) {
        console.error(
            "Reschedule task error:",
            error
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};


// RESCHEDULE ALL MISSED TASKS
const rescheduleAllMissedTasks = async (req, res) => {
    try {
        const user_id = req.user.id;

        const dailyMinutes =
            await getDailyStudyMinutes(user_id);

        if (dailyMinutes === null) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const [tasks] = await db.promise().query(
            `SELECT *
             FROM study_plans
             WHERE user_id = ?
             AND status = 'Missed'
             ORDER BY study_date ASC`,
            [user_id]
        );

        if (tasks.length === 0) {
            return res.status(200).json({
                message: "No missed tasks found"
            });
        }

        const [latestTasks] = await db.promise().query(
            `SELECT MAX(study_date) AS latest_date
             FROM study_plans
             WHERE user_id = ?
             AND study_date >= CURDATE()`,
            [user_id]
        );

        let nextDate = new Date();

        if (latestTasks[0].latest_date) {
            nextDate = new Date(
                latestTasks[0].latest_date
            );

            nextDate.setDate(
                nextDate.getDate() + 1
            );
        }

        let usedMinutes = 0;

        for (const task of tasks) {

            let duration = task.duration_minutes;

            // If the task itself is larger than
            // the available daily time,
            // limit it to the daily time.
            if (duration > dailyMinutes) {
                duration = dailyMinutes;
            }

            // Move to the next day if today's
            // available time is not enough.
            if (
                usedMinutes + duration >
                dailyMinutes
            ) {
                nextDate.setDate(
                    nextDate.getDate() + 1
                );

                usedMinutes = 0;
            }

            const formattedDate = nextDate
                .toISOString()
                .split("T")[0];

            await db.promise().query(
                `INSERT INTO study_plans
                (
                    user_id,
                    subject_id,
                    chapter_id,
                    exam_id,
                    study_date,
                    duration_minutes,
                    priority,
                    status
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')`,
                [
                    user_id,
                    task.subject_id,
                    task.chapter_id,
                    task.exam_id,
                    formattedDate,
                    duration,
                    task.priority
                ]
            );

            usedMinutes += duration;
        }

        res.status(201).json({
            message:
                "All missed tasks rescheduled successfully",
            rescheduledTasks: tasks.length
        });

    } catch (error) {
        console.error(
            "Reschedule all tasks error:",
            error
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};


module.exports = {
    rescheduleTask,
    rescheduleAllMissedTasks
};