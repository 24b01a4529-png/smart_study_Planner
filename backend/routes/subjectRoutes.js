const express = require("express");

const {
    addSubject,
    getSubjects,
    updateSubject,
    deleteSubject
} = require("../controllers/subjectController");

const router = express.Router();

router.post("/", addSubject);
router.get("/", getSubjects);
router.put("/:id", updateSubject);
router.delete("/:id", deleteSubject);

module.exports = router;