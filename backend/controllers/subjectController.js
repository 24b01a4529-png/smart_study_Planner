const db = require("../config/db");

// ADD SUBJECT
const addSubject = async (req, res) => {
    try {
        const { name, description } = req.body;
        const user_id = req.user.id;

        if (!name) {
            return res.status(400).json({
                message: "Subject name is required"
            });
        }

        await db.promise().query(
            "INSERT INTO subjects (user_id, name, description) VALUES (?, ?, ?)",
            [user_id, name, description || null]
        );

        res.status(201).json({
            message: "Subject added successfully"
        });

    } catch (error) {
        console.error("Add subject error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// GET ALL SUBJECTS FOR LOGGED-IN USER
const getSubjects = async (req, res) => {
    try {
        const user_id = req.user.id;

        const [subjects] = await db.promise().query(
            "SELECT * FROM subjects WHERE user_id = ? ORDER BY created_at DESC",
            [user_id]
        );

        res.status(200).json({
            subjects: subjects
        });

    } catch (error) {
        console.error("Get subjects error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// UPDATE SUBJECT
const updateSubject = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        const user_id = req.user.id;

        if (!name) {
            return res.status(400).json({
                message: "Subject name is required"
            });
        }

        const [result] = await db.promise().query(
            `UPDATE subjects
             SET name = ?, description = ?
             WHERE id = ? AND user_id = ?`,
            [name, description || null, id, user_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Subject not found"
            });
        }

        res.status(200).json({
            message: "Subject updated successfully"
        });

    } catch (error) {
        console.error("Update subject error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// DELETE SUBJECT
const deleteSubject = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;

        const [result] = await db.promise().query(
            "DELETE FROM subjects WHERE id = ? AND user_id = ?",
            [id, user_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Subject not found"
            });
        }

        res.status(200).json({
            message: "Subject deleted successfully"
        });

    } catch (error) {
        console.error("Delete subject error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


module.exports = {
    addSubject,
    getSubjects,
    updateSubject,
    deleteSubject
};