const db = require("../config/db");

// ADD CHAPTER
const addChapter = async (req, res) => {
    try {
        const {
            subject_id,
            name,
            description,
            difficulty
        } = req.body;

        const user_id = req.user.id;

        if (!subject_id || !name) {
            return res.status(400).json({
                message: "Subject ID and chapter name are required"
            });
        }

        const [subjects] = await db.promise().query(
            "SELECT id FROM subjects WHERE id = ? AND user_id = ?",
            [subject_id, user_id]
        );

        if (subjects.length === 0) {
            return res.status(403).json({
                message: "You cannot add a chapter to this subject"
            });
        }

        await db.promise().query(
            `INSERT INTO chapters
            (subject_id, name, description, difficulty)
            VALUES (?, ?, ?, ?)`,
            [
                subject_id,
                name,
                description || null,
                difficulty || "Medium"
            ]
        );

        res.status(201).json({
            message: "Chapter added successfully"
        });

    } catch (error) {
        console.error("Add chapter error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// GET ALL CHAPTERS FOR A SUBJECT
const getChapters = async (req, res) => {
    try {
        const { subject_id } = req.params;
        const user_id = req.user.id;

        const [chapters] = await db.promise().query(
            `SELECT chapters.*
             FROM chapters
             JOIN subjects
                ON chapters.subject_id = subjects.id
             WHERE chapters.subject_id = ?
             AND subjects.user_id = ?
             ORDER BY chapters.created_at DESC`,
            [subject_id, user_id]
        );

        res.status(200).json({
            chapters: chapters
        });

    } catch (error) {
        console.error("Get chapters error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// UPDATE CHAPTER
const updateChapter = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            name,
            description,
            difficulty,
            status
        } = req.body;

        const user_id = req.user.id;

        if (!name) {
            return res.status(400).json({
                message: "Chapter name is required"
            });
        }

        const [result] = await db.promise().query(
            `UPDATE chapters
             JOIN subjects
                ON chapters.subject_id = subjects.id
             SET chapters.name = ?,
                 chapters.description = ?,
                 chapters.difficulty = ?,
                 chapters.status = ?
             WHERE chapters.id = ?
             AND subjects.user_id = ?`,
            [
                name,
                description || null,
                difficulty || "Medium",
                status || "Not Started",
                id,
                user_id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Chapter not found"
            });
        }

        res.status(200).json({
            message: "Chapter updated successfully"
        });

    } catch (error) {
        console.error("Update chapter error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// DELETE CHAPTER
const deleteChapter = async (req, res) => {
    try {
        const { id } = req.params;

        const user_id = req.user.id;

        const [result] = await db.promise().query(
            `DELETE chapters
             FROM chapters
             JOIN subjects
                ON chapters.subject_id = subjects.id
             WHERE chapters.id = ?
             AND subjects.user_id = ?`,
            [id, user_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Chapter not found"
            });
        }

        res.status(200).json({
            message: "Chapter deleted successfully"
        });

    } catch (error) {
        console.error("Delete chapter error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


module.exports = {
    addChapter,
    getChapters,
    updateChapter,
    deleteChapter
};