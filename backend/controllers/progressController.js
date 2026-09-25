const db = require("../config/db");

// UPDATE STUDY TASK STATUS
const updateProgress = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const user_id = req.user.id;

        if (!status) {
            return res.status(400).json({
                message: "Status is required"
            });
        }

        const allowedStatus = [
            "Pending",
            "Completed",
            "Missed"
        ];

        if (!allowedStatus.includes(status)) {
            return res.status(400).json({
                message: "Invalid status"
            });
        }

        const [result] = await db.promise().query(
            `UPDATE study_plans
             SET status = ?
             WHERE id = ?
             AND user_id = ?`,
            [status, id, user_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Study task not found"
            });
        }

        res.status(200).json({
            message: "Study progress updated successfully"
        });

    } catch (error) {
        console.error("Update progress error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// GET COMPLETED STUDY TASKS
const getCompletedTasks = async (req, res) => {
    try {
        const user_id = req.user.id;

        const [tasks] = await db.promise().query(
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
             AND study_plans.status = 'Completed'
             ORDER BY study_plans.study_date DESC`,
            [user_id]
        );

        res.status(200).json({
            completedTasks: tasks
        });

    } catch (error) {
        console.error("Get completed tasks error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// GET MISSED STUDY TASKS
const getMissedTasks = async (req, res) => {
    try {
        const user_id = req.user.id;

        const [tasks] = await db.promise().query(
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
             AND study_plans.status = 'Missed'
             ORDER BY study_plans.study_date ASC`,
            [user_id]
        );

        res.status(200).json({
            missedTasks: tasks
        });

    } catch (error) {
        console.error("Get missed tasks error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


module.exports = {
    updateProgress,
    getCompletedTasks,
    getMissedTasks
};