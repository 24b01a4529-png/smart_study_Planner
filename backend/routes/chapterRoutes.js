const express = require("express");

const {
    addChapter,
    getChapters,
    updateChapter,
    deleteChapter
} = require("../controllers/chapterController");

const router = express.Router();

router.post("/", addChapter);
router.get("/subject/:subject_id", getChapters);
router.put("/:id", updateChapter);
router.delete("/:id", deleteChapter);

module.exports = router;