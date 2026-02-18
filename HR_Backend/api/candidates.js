const express = require("express");
const router = express.Router();

// REMOVED: require("dotenv").config(); - This will be handled in server.js only
// REMOVED: const neo4j = require("neo4j-driver"); - Now using the shared driver
// REMOVED: All top-level Neo4j driver creation and connection testing

// Import the shared driver helper
const getDriver = require("../lib/neo4j");

// Add CORS headers to all routes in this router
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Credentials', 'true');
 
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
 
  next();
});

// REMOVED: All the Neo4j connection initialization code at the top level
// REMOVED: The console.log and (async () => {...})() connection test

// Helper function to parse skills
const parseSkills = (candidate) => {
  if (candidate.skills) {
    if (typeof candidate.skills === 'string') {
      try {
        candidate.skills = JSON.parse(candidate.skills);
      } catch {
        candidate.skills = candidate.skills.split(',').map(s => s.trim());
      }
    }
  } else {
    candidate.skills = [];
  }
  return candidate;
};

// Helper function to normalize skill string (lowercase, trim)
const normalizeSkill = (skill) => {
  return skill ? skill.toString().toLowerCase().trim() : '';
};

/**
 * @swagger
 * /api/candidates:
 *   get:
 *     summary: Get all candidates
 *     tags: [Candidates]
 *     responses:
 *       200:
 *         description: List of all candidates
 */
router.get("/", async (req, res) => {
  console.log("\n📡 GET /api/candidates - Fetching all candidates");
  
  // Get driver ONLY when handling the request
  const driver = getDriver();
  const session = driver.session();
 
  try {
    const result = await session.run(
      "MATCH (c:Candidate) RETURN c ORDER BY c.id DESC"
    );
 
    console.log(`📊 Found ${result.records.length} candidates`);
   
    const candidates = result.records.map(r => {
      const c = r.get("c").properties;
      return parseSkills(c);
    });
 
    res.json({
      success: true,
      data: candidates,
      count: candidates.length
    });
  } catch (err) {
    console.error("❌ Error fetching candidates:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch candidates",
      error: err.message
    });
  } finally {
    await session.close();
  }
});

/**
 * @swagger
 * /api/candidates/skills:
 *   get:
 *     summary: Get all unique skills and group candidates by skill (case-insensitive)
 *     tags: [Candidates]
 *     responses:
 *       200:
 *         description: Skills with candidate counts and grouped candidates
 */
router.get("/skills", async (req, res) => {
  console.log("\n📡 GET /api/candidates/skills - Fetching skills with candidate counts");
  
  const driver = getDriver();
  const session = driver.session();
 
  try {
    const result = await session.run(
      "MATCH (c:Candidate) RETURN c"
    );
 
    const candidates = result.records.map(r => {
      const c = r.get("c").properties;
      return parseSkills(c);
    });
 
    const skillMap = new Map();
   
    candidates.forEach(candidate => {
      if (candidate.skills && Array.isArray(candidate.skills)) {
        candidate.skills.forEach(skill => {
          const normalizedSkill = normalizeSkill(skill);
          if (!skillMap.has(normalizedSkill)) {
            skillMap.set(normalizedSkill, {
              skill: skill, // Keep original case for display
              normalizedSkill,
              candidates: [],
              count: 0
            });
          }
          skillMap.get(normalizedSkill).candidates.push(candidate);
          skillMap.get(normalizedSkill).count++;
        });
      }
    });
 
    const skillsData = Array.from(skillMap.values())
      .map(item => ({
        skill: item.skill,
        count: item.count,
        candidates: item.candidates
      }))
      .sort((a, b) => a.skill.localeCompare(b.skill));
 
    console.log(`📊 Found ${skillsData.length} unique skills`);
   
    res.json({
      success: true,
      data: skillsData,
      totalSkills: skillsData.length,
      totalCandidates: candidates.length
    });
  } catch (err) {
    console.error("❌ Error fetching skills data:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch skills data",
      error: err.message
    });
  } finally {
    await session.close();
  }
});

/**
 * @swagger
 * /api/candidates/skill/{skillName}:
 *   get:
 *     summary: Get candidates by specific skill (case-insensitive)
 *     tags: [Candidates]
 *     parameters:
 *       - in: path
 *         name: skillName
 *         required: true
 *         schema:
 *           type: string
 *         description: Name of the skill to filter by (case-insensitive)
 *     responses:
 *       200:
 *         description: Candidates with the specified skill
 */
router.get("/skill/:skillName", async (req, res) => {
  console.log(`\n📡 GET /api/candidates/skill/${req.params.skillName}`);
  
  const driver = getDriver();
  const session = driver.session();
  const requestedSkill = req.params.skillName;
  const normalizedRequestedSkill = normalizeSkill(requestedSkill);
 
  try {
    // Get all candidates first (since Neo4j array contains exact strings)
    const result = await session.run(
      "MATCH (c:Candidate) RETURN c"
    );
 
    const allCandidates = result.records.map(r => {
      const c = r.get("c").properties;
      return parseSkills(c);
    });
 
    // Filter candidates case-insensitively
    const candidates = allCandidates.filter(candidate => {
      return candidate.skills && candidate.skills.some(skill =>
        normalizeSkill(skill) === normalizedRequestedSkill
      );
    });
 
    // Find the original skill name (preserve case) from the first matching candidate
    let originalSkillName = requestedSkill;
    if (candidates.length > 0) {
      const matchingSkill = candidates[0].skills.find(skill =>
        normalizeSkill(skill) === normalizedRequestedSkill
      );
      if (matchingSkill) {
        originalSkillName = matchingSkill;
      }
    }
 
    console.log(`📊 Found ${candidates.length} candidates with skill: ${originalSkillName}`);
 
    // Get related skills that these candidates have
    const relatedSkills = new Map();
    candidates.forEach(candidate => {
      if (candidate.skills && Array.isArray(candidate.skills)) {
        candidate.skills.forEach(skill => {
          const normalizedSkill = normalizeSkill(skill);
          if (normalizedSkill !== normalizedRequestedSkill) {
            if (!relatedSkills.has(normalizedSkill)) {
              relatedSkills.set(normalizedSkill, {
                skill: skill,
                count: 0
              });
            }
            relatedSkills.get(normalizedSkill).count++;
          }
        });
      }
    });
 
    const relatedSkillsArray = Array.from(relatedSkills.values())
      .sort((a, b) => b.count - a.count);
 
    res.json({
      success: true,
      skill: originalSkillName,
      requestedSkill: requestedSkill,
      count: candidates.length,
      data: candidates,
      relatedSkills: relatedSkillsArray,
      summary: {
        totalCandidates: candidates.length,
        averageExperience: calculateAverageExperience(candidates),
        commonLocations: getCommonLocations(candidates),
        visaStatus: getVisaStatusDistribution(candidates)
      }
    });
  } catch (err) {
    console.error(`❌ Error fetching candidates for skill ${requestedSkill}:`, err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch candidates by skill",
      error: err.message
    });
  } finally {
    await session.close();
  }
});

/**
 * @swagger
 * /api/candidates/search/skills:
 *   get:
 *     summary: Search candidates by skill pattern (case-insensitive, partial match)
 *     tags: [Candidates]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Skill search query
 *     responses:
 *       200:
 *         description: Candidates matching skill pattern
 */
router.get("/search/skills", async (req, res) => {
  console.log(`\n📡 GET /api/candidates/search/skills?q=${req.query.q}`);
  
  const driver = getDriver();
  const session = driver.session();
  const searchQuery = req.query.q;
 
  if (!searchQuery) {
    return res.status(400).json({
      success: false,
      message: "Please provide a search query"
    });
  }
 
  const normalizedQuery = normalizeSkill(searchQuery);
 
  try {
    const result = await session.run(
      "MATCH (c:Candidate) RETURN c"
    );
 
    const allCandidates = result.records.map(r => {
      const c = r.get("c").properties;
      return parseSkills(c);
    });
 
    // Find candidates whose skills contain the search query (case-insensitive)
    const candidates = allCandidates.filter(candidate => {
      return candidate.skills && candidate.skills.some(skill =>
        normalizeSkill(skill).includes(normalizedQuery)
      );
    });
 
    // Group matching skills
    const matchingSkills = new Set();
    candidates.forEach(candidate => {
      candidate.skills.forEach(skill => {
        if (normalizeSkill(skill).includes(normalizedQuery)) {
          matchingSkills.add(skill);
        }
      });
    });
 
    console.log(`📊 Found ${candidates.length} candidates matching "${searchQuery}"`);
 
    res.json({
      success: true,
      query: searchQuery,
      count: candidates.length,
      data: candidates,
      matchingSkills: Array.from(matchingSkills),
      summary: {
        totalCandidates: candidates.length,
        averageExperience: calculateAverageExperience(candidates)
      }
    });
  } catch (err) {
    console.error(`❌ Error searching candidates:`, err.message);
    res.status(500).json({
      success: false,
      message: "Failed to search candidates",
      error: err.message
    });
  } finally {
    await session.close();
  }
});

/**
 * @swagger
 * /api/candidates/filter/by-skills:
 *   post:
 *     summary: Filter candidates by multiple skills (case-insensitive)
 *     tags: [Candidates]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["python", "java", "iot"]
 *               matchType:
 *                 type: string
 *                 enum: [ANY, ALL]
 *                 default: ANY
 *     responses:
 *       200:
 *         description: Filtered candidates
 */
router.post("/filter/by-skills", async (req, res) => {
  console.log("\n📡 POST /api/candidates/filter/by-skills - Filtering candidates by skills");
  console.log("Request body:", req.body);
 
  const driver = getDriver();
  const session = driver.session();
  const { skills, matchType = 'ANY' } = req.body;
 
  if (!skills || !Array.isArray(skills) || skills.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Please provide an array of skills to filter by"
    });
  }
 
  // Normalize all input skills
  const normalizedSkills = skills.map(s => normalizeSkill(s));
 
  try {
    const result = await session.run(
      "MATCH (c:Candidate) RETURN c"
    );
 
    const allCandidates = result.records.map(r => {
      const c = r.get("c").properties;
      return parseSkills(c);
    });
 
    // Filter candidates based on normalized skills
    const candidates = allCandidates.filter(candidate => {
      if (!candidate.skills) return false;
     
      const normalizedCandidateSkills = candidate.skills.map(s => normalizeSkill(s));
     
      if (matchType === 'ALL') {
        return normalizedSkills.every(skill =>
          normalizedCandidateSkills.includes(skill)
        );
      } else {
        return normalizedSkills.some(skill =>
          normalizedCandidateSkills.includes(skill)
        );
      }
    });
 
    // Group results by original skill names
    const skillGroups = {};
    skills.forEach((originalSkill, index) => {
      const normalized = normalizedSkills[index];
      skillGroups[originalSkill] = candidates.filter(c =>
        c.skills && c.skills.some(s => normalizeSkill(s) === normalized)
      );
    });
 
    console.log(`📊 Found ${candidates.length} candidates matching skills`);
 
    res.json({
      success: true,
      matchType,
      requestedSkills: skills,
      totalCount: candidates.length,
      data: candidates,
      groupedBySkill: skillGroups,
      skillCounts: skills.map((skill, index) => ({
        skill,
        normalized: normalizedSkills[index],
        count: skillGroups[skill]?.length || 0
      }))
    });
  } catch (err) {
    console.error("❌ Error filtering candidates by skills:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to filter candidates",
      error: err.message
    });
  } finally {
    await session.close();
  }
});

/**
 * @swagger
 * /api/candidates/skill/{skillName}/stats:
 *   get:
 *     summary: Get statistics for a specific skill (case-insensitive)
 *     tags: [Candidates]
 *     parameters:
 *       - in: path
 *         name: skillName
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Skill statistics
 */
router.get("/skill/:skillName/stats", async (req, res) => {
  console.log(`\n📡 GET /api/candidates/skill/${req.params.skillName}/stats`);
  
  const driver = getDriver();
  const session = driver.session();
  const requestedSkill = req.params.skillName;
  const normalizedRequestedSkill = normalizeSkill(requestedSkill);
 
  try {
    const result = await session.run(
      "MATCH (c:Candidate) RETURN c"
    );
 
    const allCandidates = result.records.map(r => {
      const c = r.get("c").properties;
      return parseSkills(c);
    });
 
    // Get candidates with this skill
    const candidatesWithSkill = allCandidates.filter(candidate =>
      candidate.skills && candidate.skills.some(skill =>
        normalizeSkill(skill) === normalizedRequestedSkill
      )
    );
 
    // Get all variations of this skill (different cases)
    const skillVariations = new Set();
    allCandidates.forEach(candidate => {
      if (candidate.skills) {
        candidate.skills.forEach(skill => {
          if (normalizeSkill(skill) === normalizedRequestedSkill) {
            skillVariations.add(skill);
          }
        });
      }
    });
 
    // Calculate statistics
    const totalCandidates = allCandidates.length;
    const skillCount = candidatesWithSkill.length;
    const percentage = totalCandidates > 0 ? ((skillCount / totalCandidates) * 100).toFixed(2) : 0;
 
    // Experience distribution
    const experienceRanges = {
      '0-2 years': candidatesWithSkill.filter(c => parseInt(c.experience) <= 2).length,
      '3-5 years': candidatesWithSkill.filter(c => parseInt(c.experience) >= 3 && parseInt(c.experience) <= 5).length,
      '6-10 years': candidatesWithSkill.filter(c => parseInt(c.experience) >= 6 && parseInt(c.experience) <= 10).length,
      '10+ years': candidatesWithSkill.filter(c => parseInt(c.experience) > 10).length
    };
 
    res.json({
      success: true,
      skill: {
        requested: requestedSkill,
        normalized: normalizedRequestedSkill,
        variations: Array.from(skillVariations)
      },
      statistics: {
        totalCandidates,
        candidatesWithSkill: skillCount,
        percentage: `${percentage}%`,
        experienceDistribution: experienceRanges,
        averageExperience: calculateAverageExperience(candidatesWithSkill),
        availableCount: candidatesWithSkill.filter(c => c.status === 'Available').length
      }
    });
  } catch (err) {
    console.error(`❌ Error fetching skill statistics:`, err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch skill statistics",
      error: err.message
    });
  } finally {
    await session.close();
  }
});

// Keep all your existing specific skill endpoints (/iot, /python, /java, etc.)
// but update them to use the normalized filtering

router.get("/iot", async (req, res) => {
  console.log("\n📡 GET /api/candidates/iot - Fetching IoT candidates");
  
  const driver = getDriver();
  const session = driver.session();
 
  try {
    const result = await session.run(
      "MATCH (c:Candidate) RETURN c"
    );
 
    const allCandidates = result.records.map(r => {
      const c = r.get("c").properties;
      return parseSkills(c);
    });
 
    // Case-insensitive filtering for IoT
    const candidates = allCandidates.filter(candidate =>
      candidate.skills && candidate.skills.some(skill =>
        normalizeSkill(skill) === 'iot'
      )
    );
 
    console.log(`📊 Found ${candidates.length} IoT candidates`);
 
    res.json({
      success: true,
      category: "IoT",
      count: candidates.length,
      data: candidates
    });
  } catch (err) {
    console.error("❌ Error fetching IoT candidates:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch IoT candidates",
      error: err.message
    });
  } finally {
    await session.close();
  }
});

router.get("/python", async (req, res) => {
  console.log("\n📡 GET /api/candidates/python - Fetching Python candidates");
  
  const driver = getDriver();
  const session = driver.session();
 
  try {
    const result = await session.run(
      "MATCH (c:Candidate) RETURN c"
    );
 
    const allCandidates = result.records.map(r => {
      const c = r.get("c").properties;
      return parseSkills(c);
    });
 
    // Case-insensitive filtering for Python
    const candidates = allCandidates.filter(candidate =>
      candidate.skills && candidate.skills.some(skill =>
        normalizeSkill(skill) === 'python'
      )
    );
 
    console.log(`📊 Found ${candidates.length} Python candidates`);
 
    res.json({
      success: true,
      category: "Python",
      count: candidates.length,
      data: candidates
    });
  } catch (err) {
    console.error("❌ Error fetching Python candidates:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch Python candidates",
      error: err.message
    });
  } finally {
    await session.close();
  }
});

router.get("/java", async (req, res) => {
  console.log("\n📡 GET /api/candidates/java - Fetching Java candidates");
  
  const driver = getDriver();
  const session = driver.session();
 
  try {
    const result = await session.run(
      "MATCH (c:Candidate) RETURN c"
    );
 
    const allCandidates = result.records.map(r => {
      const c = r.get("c").properties;
      return parseSkills(c);
    });
 
    // Case-insensitive filtering for Java
    const candidates = allCandidates.filter(candidate =>
      candidate.skills && candidate.skills.some(skill =>
        normalizeSkill(skill) === 'java'
      )
    );
 
    console.log(`📊 Found ${candidates.length} Java candidates`);
 
    res.json({
      success: true,
      category: "Java",
      count: candidates.length,
      data: candidates
    });
  } catch (err) {
    console.error("❌ Error fetching Java candidates:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch Java candidates",
      error: err.message
    });
  } finally {
    await session.close();
  }
});

router.get("/embedded", async (req, res) => {
  console.log("\n📡 GET /api/candidates/embedded - Fetching Embedded Systems candidates");
  
  const driver = getDriver();
  const session = driver.session();
 
  try {
    const result = await session.run(
      "MATCH (c:Candidate) RETURN c"
    );
 
    const allCandidates = result.records.map(r => {
      const c = r.get("c").properties;
      return parseSkills(c);
    });
 
    // Case-insensitive filtering for Embedded Systems
    const candidates = allCandidates.filter(candidate =>
      candidate.skills && candidate.skills.some(skill =>
        normalizeSkill(skill) === 'embedded systems'
      )
    );
 
    console.log(`📊 Found ${candidates.length} Embedded Systems candidates`);
 
    res.json({
      success: true,
      category: "Embedded Systems",
      count: candidates.length,
      data: candidates
    });
  } catch (err) {
    console.error("❌ Error fetching Embedded Systems candidates:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch Embedded Systems candidates",
      error: err.message
    });
  } finally {
    await session.close();
  }
});

router.get("/pcb-design", async (req, res) => {
  console.log("\n📡 GET /api/candidates/pcb-design - Fetching PCB Design candidates");
  
  const driver = getDriver();
  const session = driver.session();
 
  try {
    const result = await session.run(
      "MATCH (c:Candidate) RETURN c"
    );
 
    const allCandidates = result.records.map(r => {
      const c = r.get("c").properties;
      return parseSkills(c);
    });
 
    // Case-insensitive filtering for PCB Design
    const candidates = allCandidates.filter(candidate =>
      candidate.skills && candidate.skills.some(skill =>
        normalizeSkill(skill) === 'pcb design'
      )
    );
 
    console.log(`📊 Found ${candidates.length} PCB Design candidates`);
 
    res.json({
      success: true,
      category: "PCB Design",
      count: candidates.length,
      data: candidates
    });
  } catch (err) {
    console.error("❌ Error fetching PCB Design candidates:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch PCB Design candidates",
      error: err.message
    });
  } finally {
    await session.close();
  }
});

// GET candidate by ID
router.get("/:id", async (req, res) => {
  console.log(`\n📡 GET /api/candidates/${req.params.id}`);
  
  const driver = getDriver();
  const session = driver.session();
  const id = parseInt(req.params.id);
 
  try {
    const result = await session.run(
      "MATCH (c:Candidate {id: $id}) RETURN c",
      { id }
    );
 
    if (!result.records.length) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found"
      });
    }
 
    const candidate = result.records[0].get("c").properties;
    parseSkills(candidate);
 
    res.json({
      success: true,
      data: candidate
    });
  } catch (err) {
    console.error(`❌ Error fetching candidate ${id}:`, err.message);
    res.status(500).json({
      success: false,
      message: "Error fetching candidate",
      error: err.message
    });
  } finally {
    await session.close();
  }
});

// POST create new candidate
router.post("/", async (req, res) => {
  console.log("\n📡 POST /api/candidates - Creating new candidate");
  console.log("Request body:", req.body);
 
  const driver = getDriver();
  const session = driver.session();
 
  try {
    // Validation
    if (!req.body.name || !req.body.email || !req.body.mobile) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and mobile are required fields"
      });
    }
 
    // Check for duplicate email
    const emailCheck = await session.run(
      "MATCH (c:Candidate {email: $email}) RETURN c",
      { email: req.body.email }
    );
 
    if (emailCheck.records.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Candidate with this email already exists"
      });
    }
 
    // Get next ID - FIXED: Handle Neo4j integer properly
    const idResult = await session.run(
      "MATCH (c:Candidate) RETURN coalesce(MAX(c.id), 0) + 1 AS nextId"
    );
   
    // Fix: Convert Neo4j integer to JavaScript number
    const nextIdRecord = idResult.records[0].get("nextId");
    const id = nextIdRecord.low !== undefined ? nextIdRecord.toNumber() : Number(nextIdRecord);
   
    console.log("Generated ID:", id);
 
    // Prepare candidate data
    const candidateData = {
      id,
      name: req.body.name,
      email: req.body.email,
      mobile: req.body.mobile,
      location: req.body.location || "",
      visaStatus: req.body.visaStatus || "Not Required",
      passport: req.body.passport || "",
      experience: req.body.experience || "",
      currentRole: req.body.currentRole || "",
      skills: req.body.skills || [],
      status: req.body.status || "Available",
      noticePeriod: req.body.noticePeriod || "",
      salary: req.body.salary || "",
      education: req.body.education || "",
      bio: req.body.bio || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
 
    console.log("Saving candidate data:", candidateData);
 
    const result = await session.run(
      "CREATE (c:Candidate) SET c = $data RETURN c",
      { data: candidateData }
    );
 
    const created = result.records[0].get("c").properties;
   
    // Parse skills if needed
    if (created.skills && typeof created.skills === 'string') {
      try {
        created.skills = JSON.parse(created.skills);
      } catch {
        created.skills = created.skills.split(',').map(s => s.trim());
      }
    }
 
    console.log("✅ Candidate created successfully with ID:", id);
 
    res.status(201).json({
      success: true,
      message: "Candidate created successfully",
      data: created
    });
 
  } catch (err) {
    console.error("❌ Error creating candidate:", err);
    res.status(500).json({
      success: false,
      message: "Failed to create candidate",
      error: err.message
    });
  } finally {
    await session.close();
  }
});

// PUT update candidate
router.put("/:id", async (req, res) => {
  console.log(`\n📡 PUT /api/candidates/${req.params.id}`);
  
  const driver = getDriver();
  const session = driver.session();
  const id = parseInt(req.params.id);
 
  try {
    // Check if candidate exists
    const checkResult = await session.run(
      "MATCH (c:Candidate {id: $id}) RETURN c",
      { id }
    );
 
    if (!checkResult.records.length) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found"
      });
    }
 
    // Prepare update data
    const updateData = { ...req.body };
    delete updateData.id; // Don't update ID
    delete updateData.createdDate; // Don't update created date
 
    const result = await session.run(
      `MATCH (c:Candidate {id: $id})
       SET c += $data
       RETURN c`,
      { id, data: updateData }
    );
 
    const updated = result.records[0].get("c").properties;
    parseSkills(updated);
 
    res.json({
      success: true,
      message: "Candidate updated successfully",
      data: updated
    });
  } catch (err) {
    console.error(`❌ Error updating candidate ${id}:`, err.message);
    res.status(500).json({
      success: false,
      message: "Failed to update candidate",
      error: err.message
    });
  } finally {
    await session.close();
  }
});

// DELETE candidate
router.delete("/:id", async (req, res) => {
  console.log(`\n📡 DELETE /api/candidates/${req.params.id}`);
  
  const driver = getDriver();
  const session = driver.session();
  const id = parseInt(req.params.id);
 
  try {
    const result = await session.run(
      "MATCH (c:Candidate {id: $id}) DELETE c RETURN count(c) as deletedCount",
      { id }
    );
 
    const deletedCount = result.records[0].get("deletedCount").toNumber();
 
    if (deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found"
      });
    }
 
    res.json({
      success: true,
      message: "Candidate deleted successfully"
    });
  } catch (err) {
    console.error(`❌ Error deleting candidate ${id}:`, err.message);
    res.status(500).json({
      success: false,
      message: "Failed to delete candidate",
      error: err.message
    });
  } finally {
    await session.close();
  }
});

// Helper function to calculate average experience
const calculateAverageExperience = (candidates) => {
  if (candidates.length === 0) return 0;
 
  const total = candidates.reduce((sum, candidate) => {
    const exp = parseInt(candidate.experience) || 0;
    return sum + exp;
  }, 0);
 
  return (total / candidates.length).toFixed(1);
};

// Helper function to get common locations
const getCommonLocations = (candidates) => {
  const locations = {};
  candidates.forEach(candidate => {
    if (candidate.location) {
      const city = candidate.location.split(',')[0].trim();
      locations[city] = (locations[city] || 0) + 1;
    }
  });
 
  return Object.entries(locations)
    .map(([location, count]) => ({ location, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
};

// Helper function to get visa status distribution
const getVisaStatusDistribution = (candidates) => {
  const visaStatus = {};
  candidates.forEach(candidate => {
    if (candidate.visaStatus) {
      visaStatus[candidate.visaStatus] = (visaStatus[candidate.visaStatus] || 0) + 1;
    }
  });
 
  return Object.entries(visaStatus)
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);
};

module.exports = router;
