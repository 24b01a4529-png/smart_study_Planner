const db = require("../config/db");

// ADD EXAM
const addExam = async (req, res) => {
    try {
        const {
            subject_id,
            exam_name,
            exam_date,
            total_marks
        } = req.body;

        const user_id = req.user.id;

        if (!subject_id || !exam_name || !exam_date) {
            return res.status(400).json({
                message: "Subject ID, exam name and exam date are required"
            });
        }

        const [subjects] = await db.promise().query(
            "SELECT id FROM subjects WHERE id = ? AND user_id = ?",
            [subject_id, user_id]
        );

        if (subjects.length === 0) {
            return res.status(403).json({
                message: "You cannot add an exam for this subject"
            });
        }

        await db.promise().query(
            `INSERT INTO exams
            (user_id, subject_id, exam_name, exam_date, total_marks)
            VALUES (?, ?, ?, ?, ?)`,
            [
                user_id,
                subject_id,
                exam_name,
                exam_date,
                total_marks || null
            ]
        );

        res.status(201).json({
            message: "Exam added successfully"
        });

    } catch (error) {
        console.error("Add exam error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// GET ALL EXAMS FOR LOGGED-IN USER
const getExams = async (req, res) => {
    try {
        const user_id = req.user.id;

        const [exams] = await db.promise().query(
            `SELECT
                exams.*,
                subjects.name AS subject_name
             FROM exams
             JOIN subjects
                ON exams.subject_id = subjects.id
             WHERE exams.user_id = ?
             ORDER BY exams.exam_date ASC`,
            [user_id]
        );

        res.status(200).json({
            exams: exams
        });

    } catch (error) {
        console.error("Get exams error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// UPDATE EXAM
const updateExam = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            subject_id,
            exam_name,
            exam_date,
            total_marks
        } = req.body;

        const user_id = req.user.id;

        if (!subject_id || !exam_name || !exam_date) {
            return res.status(400).json({
                message: "Subject ID, exam name and exam date are required"
            });
        }

        const [subjects] = await db.promise().query(
            "SELECT id FROM subjects WHERE id = ? AND user_id = ?",
            [subject_id, user_id]
        );

        if (subjects.length === 0) {
            return res.status(403).json({
                message: "You cannot use this subject"
            });
        }

        const [result] = await db.promise().query(
            `UPDATE exams
             SET subject_id = ?,
                 exam_name = ?,
                 exam_date = ?,
                 total_marks = ?
             WHERE id = ?
             AND user_id = ?`,
            [
                subject_id,
                exam_name,
                exam_date,
                total_marks || null,
                id,
                user_id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Exam not found"
            });
        }

        res.status(200).json({
            message: "Exam updated successfully"
        });

    } catch (error) {
        console.error("Update exam error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// DELETE EXAM
const deleteExam = async (req, res) => {
    try {
        const { id } = req.params;

        const user_id = req.user.id;

        const [result] = await db.promise().query(
            `DELETE FROM exams
             WHERE id = ?
             AND user_id = ?`,
            [id, user_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Exam not found"
            });
        }

        res.status(200).json({
            message: "Exam deleted successfully"
        });

    } catch (error) {
        console.error("Delete exam error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


module.exports = {
    addExam,
    getExams,
    updateExam,
    deleteExam
};