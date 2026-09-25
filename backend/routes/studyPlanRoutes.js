const express = require("express");

const {
    generateStudyPlan,
    getStudyPlan
} = require("../controllers/studyPlanController");

const router = express.Router();

router.post("/generate", generateStudyPlan);

router.get("/", getStudyPlan);

module.exports = router;