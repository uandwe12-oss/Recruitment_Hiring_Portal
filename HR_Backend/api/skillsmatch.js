const express = require("express");
const router = express.Router();
const getDriver = require("../lib/neo4j");
const neo4j = require('neo4j-driver');

/**
 * @swagger
 * tags:
 *   name: SkillsMatch
 *   description: Match candidates based on selected skill
 */

// Helper function to convert Neo4j integer to number
const toNumber = (value) => {
  if (neo4j.isInt(value)) {
    return value.toNumber();
  }
  return value || 0;
};

// Helper function to safely extract and split skills from various formats
const extractSkills = (skillsField) => {
  if (!skillsField) return [];
  
  // If it's already an array, return it
  if (Array.isArray(skillsField)) {
    return skillsField.map(s => s.trim()).filter(s => s);
  }
  
  // If it's a string, split by commas and clean up
  if (typeof skillsField === 'string') {
    return skillsField.split(',').map(s => s.trim()).filter(s => s);
  }
  
  return [];
};

/**
 * =================================================
 * GET – Fetch All Skills with Counts (For Dropdown)
 * =================================================
 */

/**
 * @swagger
 * /api/skillsmatch/skills:
 *   get:
 *     summary: Get all available skills with candidate counts
 *     tags: [SkillsMatch]
 *     responses:
 *       200:
 *         description: List of skills with counts
 */
router.get("/skills", async (req, res) => {
  const driver = getDriver();
  const session = driver.session();

  try {
    // Get all unique skills directly from Candidate_Profile nodes
    const result = await session.run(
      `
      MATCH (c:Candidate_Profile)
      WHERE c.\`Key Skills\` IS NOT NULL AND c.\`Key Skills\` <> ''
      RETURN c.\`Key Skills\` AS skillsField
      `
    );

    // Process all skills to build unique skill list with counts
    const skillCountMap = new Map();
    
    result.records.forEach(record => {
      const skillsField = record.get("skillsField");
      const skills = extractSkills(skillsField);
      
      skills.forEach(skill => {
        if (skill) {
          const count = skillCountMap.get(skill) || 0;
          skillCountMap.set(skill, count + 1);
        }
      });
    });

    // Convert map to array and sort by count (descending) then name (ascending)
    const skills = Array.from(skillCountMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.name.localeCompare(b.name);
      });

    // Get total candidates count
    const totalCandidatesResult = await session.run(
      "MATCH (c:Candidate_Profile) RETURN COUNT(c) AS total"
    );
    const totalCandidates = toNumber(totalCandidatesResult.records[0].get("total"));

    res.json({
      success: true,
      totalSkills: skills.length,
      totalCandidates: totalCandidates,
      data: skills
    });

  } catch (err) {
    console.error("Error fetching skills with counts:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch skills",
      error: err.message
    });
  } finally {
    await session.close();
  }
});

/**
 * =================================================
 * GET – Fetch Single Skill with Its Candidates
 * =================================================
 */

/**
 * @swagger
 * /api/skillsmatch/skill/{skillName}:
 *   get:
 *     summary: Get a specific skill with its candidates
 *     tags: [SkillsMatch]
 *     parameters:
 *       - in: path
 *         name: skillName
 *         required: true
 *         schema:
 *           type: string
 *         description: Skill name
 *     responses:
 *       200:
 *         description: Skill details with candidates
 */
router.get("/skill/:skillName", async (req, res) => {
  const { skillName } = req.params;
  
  if (!skillName) {
    return res.status(400).json({
      success: false,
      message: "Skill name is required"
    });
  }

  const driver = getDriver();
  const session = driver.session();

  try {
    // Get all candidates and filter those with the matching skill
    const result = await session.run(
      `
      MATCH (c:Candidate_Profile)
      WHERE c.\`Key Skills\` IS NOT NULL
      RETURN c
      ORDER BY c.\`Candidate Name\`
      `
    );

    // Find candidates that have the specified skill
    const candidates = [];
    result.records.forEach(record => {
      const candidate = record.get("c").properties;
      const skillsField = candidate["Key Skills"];
      const skills = extractSkills(skillsField);
      
      // Check if any skill matches (case-insensitive)
      if (skills.some(s => s.toLowerCase() === skillName.toLowerCase())) {
        candidates.push(candidate);
      }
    });

    if (candidates.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Skill not found or no candidates with this skill"
      });
    }

    res.json({
      success: true,
      data: {
        name: skillName,
        count: candidates.length,
        candidates: candidates
      }
    });

  } catch (err) {
    console.error("Error fetching skill details:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch skill details",
      error: err.message
    });
  } finally {
    await session.close();
  }
});

/**
 * =================================================
 * GET – Match Candidates by Skill
 * =================================================
 */

/**
 * @swagger
 * /api/skillsmatch:
 *   get:
 *     summary: Get candidates by selected skill
 *     tags: [SkillsMatch]
 *     parameters:
 *       - in: query
 *         name: skill
 *         required: true
 *         schema:
 *           type: string
 *         description: Select skill name
 *     responses:
 *       200:
 *         description: Matching candidates
 */
router.get("/", async (req, res) => {
  const { skill } = req.query;

  if (!skill) {
    return res.status(400).json({
      success: false,
      message: "Skill query parameter is required"
    });
  }

  const driver = getDriver();
  const session = driver.session();

  try {
    // Get all candidates
    const result = await session.run(
      `
      MATCH (c:Candidate_Profile)
      WHERE c.\`Key Skills\` IS NOT NULL
      RETURN c
      ORDER BY c.\`Candidate Name\`
      `
    );

    // Filter candidates that have the matching skill
    const candidates = [];
    result.records.forEach(record => {
      const candidate = record.get("c").properties;
      const skillsField = candidate["Key Skills"];
      const skills = extractSkills(skillsField);
      
      // Check if any skill matches (case-insensitive)
      if (skills.some(s => s.toLowerCase() === skill.toLowerCase())) {
        candidates.push(candidate);
      }
    });

    res.json({
      success: true,
      selectedSkill: skill,
      count: candidates.length,
      data: candidates
    });

  } catch (err) {
    console.error("Error matching candidates:", err);
    res.status(500).json({
      success: false,
      message: "Failed to match candidates",
      error: err.message
    });
  } finally {
    await session.close();
  }
});

/**
 * =================================================
 * GET – Get All Skills Summary (Dashboard View)
 * =================================================
 */

/**
 * @swagger
 * /api/skillsmatch/summary:
 *   get:
 *     summary: Get summary of all skills with counts
 *     tags: [SkillsMatch]
 *     responses:
 *       200:
 *         description: Skills summary for dashboard
 */
router.get("/summary", async (req, res) => {
  const driver = getDriver();
  const session = driver.session();

  try {
    // Get all candidates with their skills
    const candidatesResult = await session.run(
      `
      MATCH (c:Candidate_Profile)
      WHERE c.\`Key Skills\` IS NOT NULL AND c.\`Key Skills\` <> ''
      RETURN c.\`Key Skills\` AS skillsField
      `
    );

    // Build skill counts from all candidates
    const skillCountMap = new Map();
    let totalCandidates = 0;
    
    candidatesResult.records.forEach(record => {
      totalCandidates++;
      const skillsField = record.get("skillsField");
      const skills = extractSkills(skillsField);
      
      // Use a Set to avoid counting the same skill multiple times for one candidate
      const uniqueSkillsForCandidate = new Set();
      skills.forEach(skill => {
        if (skill) {
          uniqueSkillsForCandidate.add(skill);
        }
      });
      
      // Count each unique skill for this candidate
      uniqueSkillsForCandidate.forEach(skill => {
        skillCountMap.set(skill, (skillCountMap.get(skill) || 0) + 1);
      });
    });

    // Convert map to array and sort by count (descending) then name (ascending)
    const allSkills = Array.from(skillCountMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.name.localeCompare(b.name);
      });

    // Get top 10 skills by candidate count
    const topSkills = allSkills.slice(0, 10);

    // Calculate statistics
    const totalSkills = allSkills.length;
    const skillsWithCandidates = allSkills.filter(s => s.count > 0).length;

    res.json({
      success: true,
      summary: {
        totalCandidates: totalCandidates,
        totalUniqueSkills: totalSkills,
        activeSkills: skillsWithCandidates,
        avgSkillsPerCandidate: totalCandidates > 0 
          ? (allSkills.reduce((sum, s) => sum + s.count, 0) / totalCandidates).toFixed(2)
          : 0
      },
      topSkills: topSkills,
      allSkills: allSkills
    });

  } catch (err) {
    console.error("Error fetching skills summary:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch skills summary",
      error: err.message
    });
  } finally {
    await session.close();
  }
});

module.exports = router;