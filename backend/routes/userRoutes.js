const express = require("express");

const {
    getProfile,
    updateStudyHours
} = require("../controllers/userController");

const router = express.Router();

router.get("/profile", getProfile);

router.put("/study-hours", updateStudyHours);

module.exports = router;