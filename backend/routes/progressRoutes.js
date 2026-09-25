const express = require("express");

const {
    updateProgress,
    getCompletedTasks,
    getMissedTasks
} = require("../controllers/progressController");

const router = express.Router();

router.put("/:id", updateProgress);

router.get("/completed", getCompletedTasks);

router.get("/missed", getMissedTasks);

module.exports = router;