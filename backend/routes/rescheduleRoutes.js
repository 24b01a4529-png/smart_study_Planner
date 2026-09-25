const express = require("express");

const {
    rescheduleTask,
    rescheduleAllMissedTasks
} = require("../controllers/rescheduleController");

const router = express.Router();

router.post("/:id", rescheduleTask);

router.post("/user", rescheduleAllMissedTasks);

module.exports = router;