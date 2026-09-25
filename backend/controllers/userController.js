const db = require("../config/db");

// GET USER PROFILE
const getProfile = async (req, res) => {
    try {
        const user_id = req.user.id;

        const [users] = await db.promise().query(
            `SELECT
                id,
                name,
                email,
                daily_study_hours,
                created_at
             FROM users
             WHERE id = ?`,
            [user_id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.status(200).json({
            user: users[0]
        });

    } catch (error) {
        console.error("Get profile error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// UPDATE DAILY STUDY HOURS
const updateStudyHours = async (req, res) => {
    try {
        const user_id = req.user.id;
        const { daily_study_hours } = req.body;

        if (
            daily_study_hours === undefined ||
            daily_study_hours === null
        ) {
            return res.status(400).json({
                message: "Daily study hours are required"
            });
        }

        const hours = Number(daily_study_hours);

        if (isNaN(hours) || hours <= 0 || hours > 24) {
            return res.status(400).json({
                message: "Study hours must be between 0 and 24"
            });
        }

        await db.promise().query(
            `UPDATE users
             SET daily_study_hours = ?
             WHERE id = ?`,
            [hours, user_id]
        );

        res.status(200).json({
            message: "Daily study hours updated successfully",
            daily_study_hours: hours
        });

    } catch (error) {
        console.error("Update study hours error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


module.exports = {
    getProfile,
    updateStudyHours
};