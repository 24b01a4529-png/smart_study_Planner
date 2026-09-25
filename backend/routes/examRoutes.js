const express = require("express");

const {
    addExam,
    getExams,
    updateExam,
    deleteExam
} = require("../controllers/examController");

const router = express.Router();

router.post("/", addExam);
router.get("/", getExams);
router.put("/:id", updateExam);
router.delete("/:id", deleteExam);

module.exports = router;