const express = require("express");
const router = express.Router();
const neo4j = require("neo4j-driver");
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { google } = require('googleapis');
const { Readable } = require('stream');
require("dotenv").config();

// ============================================
// GOOGLE DRIVE CONFIGURATION
// ============================================
const DRIVE_FOLDER_ID = '1wIQXwyPPYyfXWJ35TsmDByeg4FTxyNle'; // Your folder ID
const TOKEN_PATH = path.join(__dirname, '../config/token.json');
const CREDENTIALS_PATH = path.join(__dirname, '../config/credentials.json');

// Configure multer for memory storage (for Google Drive)
const memoryStorage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const upload = multer({
  storage: memoryStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});


// ============================================
// GOOGLE DRIVE HELPER FUNCTIONS
// ============================================

async function authorize() {
  try {
    if (!fs.existsSync(CREDENTIALS_PATH)) {
      console.warn('⚠️ Google Drive credentials not found. Local storage will be used as fallback.');
      return null;
    }

    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    if (fs.existsSync(TOKEN_PATH)) {
      const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
      oAuth2Client.setCredentials(token);
      return oAuth2Client;
    } else {
      console.warn('⚠️ Google Drive token not found. Local storage will be used as fallback.');
      return null;
    }
  } catch (error) {
    console.error('❌ Error in authorize:', error.message);
    return null;
  }
}
// Add this function near your other Google Drive helper functions
const deleteFromGoogleDrive = async (fileId) => {
  try {
    console.log(`🗑️ Deleting file from Google Drive with ID: ${fileId}`);
    
    const auth = await authorize();
    if (!auth) {
      console.log('⚠️ Google Drive not configured, skipping deletion');
      return false;
    }
    
    const drive = google.drive({ version: 'v3', auth });
    
    await drive.files.delete({
      fileId: fileId
    });
    
    console.log('✅ File deleted from Google Drive successfully');
    return true;
  } catch (error) {
    console.error('❌ Google Drive delete error:', error);
    return false;
  }
};
const uploadToGoogleDrive = async (file, candidateName) => {
  try {
    console.log('📤 Uploading to Google Drive...');
    
    const auth = await authorize();
    if (!auth) {
      console.log('⚠️ Google Drive not configured, using local storage only');
      return null;
    }
    
    const drive = google.drive({ version: 'v3', auth });
    
    const bufferStream = new Readable();
    bufferStream.push(file.buffer);
    bufferStream.push(null);
    
    const sanitizedName = candidateName.replace(/[^a-zA-Z0-9]/g, '_');
    const timestamp = Date.now();
    const fileName = `${sanitizedName}_${timestamp}_${file.originalname}`;
    
    const fileMetadata = {
      name: fileName,
      parents: [DRIVE_FOLDER_ID],
      description: `Resume for ${candidateName} uploaded on ${new Date().toISOString()}`
    };
    
    const media = {
      mimeType: 'application/pdf',
      body: bufferStream
    };
    
    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink, size, createdTime'
    });
    
    // Make the file publicly accessible
    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      }
    });
    
    console.log('✅ File uploaded to Google Drive with ID:', response.data.id);
    
    return {
      googleDriveFileId: response.data.id,
      googleDriveViewLink: `https://drive.google.com/file/d/${response.data.id}/preview`,
      googleDriveDownloadLink: `https://drive.google.com/uc?export=download&id=${response.data.id}`,
      fileName: response.data.name,
      fileSize: response.data.size
    };
    
  } catch (error) {
    console.error('❌ Google Drive upload error:', error);
    return null;
  }
};

const saveFileLocally = (file, candidateName) => {
  try {
    console.log('📁 Saving file locally as fallback...');
    
    const timestamp = Date.now();
    const uniqueSuffix = timestamp + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const filename = 'resume-' + uniqueSuffix + ext;
    const filePath = path.join(uploadDir, filename);
    
    fs.writeFileSync(filePath, file.buffer);
    console.log('✅ File saved locally at:', filePath);
    
    return {
      resumePath: `/uploads/${filename}`,
      fileName: filename,
      localPath: filePath
    };
  } catch (error) {
    console.error('❌ Local file save error:', error);
    return null;
  }
};

// ============================================
// NEO4J CONNECTION
// ============================================
console.log("\n" + "=".repeat(50));
console.log("🔌 Initializing Neo4j Connection for Candidate Profiles...");
console.log("=".repeat(50));

let driver;
try {
  const uri = process.env.NEO4J_URI || 'neo4j+s://48046602.databases.neo4j.io';
  const user = process.env.NEO4J_USER || 'neo4j';
  const password = process.env.NEO4J_PASSWORD || '5CFMv9N5rc4lJgSnXJm68eYpRw4DynDCov-0Fyy3m1Q';
  
  console.log(`📡 Connecting to Neo4j at: ${uri}`);
  
  driver = neo4j.driver(
    uri,
    neo4j.auth.basic(user, password),
    {
      maxConnectionLifetime: 3 * 60 * 60 * 1000,
      maxConnectionPoolSize: 50,
      connectionAcquisitionTimeout: 2 * 60 * 1000,
      disableLosslessIntegers: true
    }
  );

  // Test connection
  (async () => {
    try {
      const session = driver.session();
      const result = await session.run("MATCH (c:Candidate_Profile) RETURN count(c) as count");
      const count = toNumber(result.records[0].get('count'));
      console.log(`✅ Neo4j connected successfully. Found ${count} Candidate_Profile nodes`);
      await session.close();
    } catch (err) {
      console.error("❌ Neo4j connection failed:", err.message);
    }
  })();
} catch (err) {
  console.error("❌ Failed to create Neo4j driver:", err.message);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

const toNumber = (value) => {
  if (value === null || value === undefined) return value;
  if (typeof value === 'object' && value.low !== undefined) {
    return value.toNumber ? value.toNumber() : value.low;
  }
  // Handle string numbers
  if (typeof value === 'string' && !isNaN(parseFloat(value))) {
    return parseFloat(value);
  }
  return value;
};

router.use((req, res, next) => {
  res.header(
    'Access-Control-Allow-Origin',
    'http://localhost:5173'
  );

  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );

  res.header(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS'
  );

  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

router.use((req, res, next) => {
  console.log(`🔍 Route accessed: ${req.method} ${req.originalUrl}`);
  next();
});

// Extract skills array from profile
const extractSkillsArray = (profile) => {
  if (!profile.keySkills) return [];
  
  if (Array.isArray(profile.keySkills)) {
    return profile.keySkills;
  } else if (typeof profile.keySkills === 'string') {
    try {
      const parsed = JSON.parse(profile.keySkills);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return profile.keySkills.split(',').map(s => s.trim()).filter(s => s);
    }
  }
  return [];
};

// Parse experience string to number (in years)
const parseExperience = (expString) => {
  if (!expString) return 0;
  
  // If it's already a number
  if (typeof expString === 'number') return expString;
  
  // Try to extract number from string (e.g., "5 years", "3.5 yrs", "2")
  const match = expString.toString().match(/(\d+(\.\d+)?)/);
  return match ? parseFloat(match[0]) : 0;
};

// Normalize field names
const normalizeProfileFields = (profile) => {
  const normalized = {};
  
  for (const [key, value] of Object.entries(profile)) {
    const lowerKey = key.toLowerCase().replace(/\s+/g, '');
    
    if (key === 'Candidate Name' || key === 'candidateName' || key === 'name') {
      normalized.name = value;
    } else if (key === 'Email' || key === 'email') {
      normalized.email = value;
    } else if (key === 'Mobile No' || key === 'mobileNo' || key === 'mobile') {
      normalized.mobile = value;
    } else if (key === 'Experience' || key === 'experience') {
      normalized.experience = value;
      normalized.experienceYears = parseExperience(value);
    } else if (key === 'Current Org' || key === 'currentOrg') {
      normalized.currentOrg = value;
    } else if (key === 'Current CTC' || key === 'currentCTC') {
      normalized.currentCTC = value;
    } else if (key === 'Expected CTC' || key === 'expectedCTC') {
      normalized.expectedCTC = value;
    } else if (key === 'Notice Period in days' || key === 'noticePeriod') {
      normalized.noticePeriod = value;
    } else if (key === 'Profiles sourced by' || key === 'profileSourcedBy') {
      normalized.profileSourcedBy = value;
    } else if (key === 'Client Name' || key === 'clientName') {
      normalized.clientName = value;
    } else if (key === 'Profile submission date' || key === 'profileSubmissionDate') {
      normalized.profileSubmissionDate = value;
    } else if (key === 'Key Skills' || key === 'keySkills') {
      normalized.keySkills = value;
    } else if (key === 'Can_ID' || key === 'canId' || key === 'Can ID') {
      normalized.canId = toNumber(value);
    } else if (key === 'Visa type' || key === 'visaType') {
      normalized.visaType = value;
    } else if (key === 'resumePath') {
      normalized.resumePath = value;
    } else if (key === 'googleDriveFileId') {
      normalized.googleDriveFileId = value;
    } else if (key === 'googleDriveViewLink') {
      normalized.googleDriveViewLink = value;
    } else if (key === 'googleDriveDownloadLink') {
      normalized.googleDriveDownloadLink = value;
    } else if (key === 'createdAt') {
      normalized.createdAt = value;
    } else if (key === 'updatedAt') {
      normalized.updatedAt = value;
    } else if (key === 'id') {
      normalized.id = toNumber(value);
    } else {
      normalized[key] = value;
    }
  }
  
  return normalized;
};

// Format profile for response
const formatProfileForResponse = (profile) => {
  const normalized = normalizeProfileFields(profile);
  
  // Ensure skills is always an array
  normalized.keySkills = extractSkillsArray(normalized);
  
  return normalized;
};

// ============================================
// SWAGGER COMPONENTS SCHEMAS
// ============================================

/**
 * @swagger
 * components:
 *   schemas:
 *     CandidateProfile:
 *       type: object
 *       properties:
 *         canId:
 *           type: integer
 *           description: Candidate ID (Can_ID)
 *         name:
 *           type: string
 *           description: Candidate name
 *         email:
 *           type: string
 *           description: Candidate email
 *         mobile:
 *           type: string
 *           description: Candidate mobile number
 *         experience:
 *           type: string
 *           description: Experience in years
 *         experienceYears:
 *           type: number
 *           description: Experience as numeric value
 *         currentOrg:
 *           type: string
 *           description: Current organization
 *         currentCTC:
 *           type: string
 *           description: Current CTC
 *         expectedCTC:
 *           type: string
 *           description: Expected CTC
 *         noticePeriod:
 *           type: string
 *           description: Notice period in days
 *         profileSourcedBy:
 *           type: string
 *           description: Source of profile
 *         clientName:
 *           type: string
 *           description: Client name
 *         profileSubmissionDate:
 *           type: string
 *           description: Profile submission date
 *         keySkills:
 *           type: array
 *           items:
 *             type: string
 *           description: Candidate skills
 *         visaType:
 *           type: string
 *           description: Visa type
 *         resumePath:
 *           type: string
 *           description: Local resume path
 *         googleDriveFileId:
 *           type: string
 *           description: Google Drive file ID
 *         googleDriveViewLink:
 *           type: string
 *           description: Google Drive view link
 *         googleDriveDownloadLink:
 *           type: string
 *           description: Google Drive download link
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     
 *     CandidateInput:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - mobile
 *       properties:
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         mobile:
 *           type: string
 *         experience:
 *           type: string
 *         currentOrg:
 *           type: string
 *         currentCTC:
 *           type: string
 *         expectedCTC:
 *           type: string
 *         noticePeriod:
 *           type: string
 *         profileSourcedBy:
 *           type: string
 *         clientName:
 *           type: string
 *         profileSubmissionDate:
 *           type: string
 *         keySkills:
 *           type: array
 *           items:
 *             type: string
 *         visaType:
 *           type: string
 *         resume:
 *           type: string
 *           format: binary
 *     
 *     ApiResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           oneOf:
 *             - type: array
 *               items:
 *                 $ref: '#/components/schemas/CandidateProfile'
 *             - $ref: '#/components/schemas/CandidateProfile'
 *         count:
 *           type: integer
 *         totalCount:
 *           type: integer
 *         currentPage:
 *           type: integer
 *         totalPages:
 *           type: integer
 *         limit:
 *           type: integer
 *     
 *     NextIdResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         nextCanId:
 *           type: integer
 *         currentMaxId:
 *           type: integer
 */

// ============================================
// CANDIDATE ROUTES
// ============================================

/**
 * @swagger
 * /api/candidates:
 *   get:
 *     summary: Get all candidates with pagination
 *     tags: [Candidates]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 4
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.get("/", async (req, res) => {
  console.log("\n📡 GET /api/candidates - Fetching candidates with pagination");
  
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 4;
  const skip = (page - 1) * limit;
  
  const session = driver.session();
  
  try {
    // Get total count
    const countResult = await session.run("MATCH (c:Candidate_Profile) RETURN count(c) as total");
    const totalCount = toNumber(countResult.records[0].get('total'));
    
    // Get paginated results
    const result = await session.run(
      "MATCH (c:Candidate_Profile) RETURN c ORDER BY c.Can_ID DESC SKIP $skip LIMIT $limit",
      { skip: neo4j.int(skip), limit: neo4j.int(limit) }
    );

    console.log(`📊 Found ${result.records.length} candidate profiles (page ${page})`);
    
    const profiles = result.records.map(r => {
      const profile = r.get("c").properties;
      return formatProfileForResponse(profile);
    });

    res.json({
      success: true,
      data: profiles,
      currentPage: page,
      limit: limit,
      totalCount: totalCount,
      totalPages: Math.ceil(totalCount / limit)
    });
  } catch (err) {
    console.error("❌ Error fetching candidate profiles:", err.message);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch candidate profiles",
      error: err.message 
    });
  } finally {
    await session.close();
  }
});

/**
 * @swagger
 * /api/candidates/all:
 *   get:
 *     summary: Get ALL candidate profiles
 *     tags: [Candidates]
 *     responses:
 *       200:
 *         description: Successful response
 */
router.get("/all", async (req, res) => {
  console.log("\n📡 GET /api/candidates/all - Fetching ALL candidate profiles");
  
  const session = driver.session();
  
  try {
    const result = await session.run("MATCH (c:Candidate_Profile) RETURN c ORDER BY c.Can_ID DESC");

    console.log(`📊 Found ${result.records.length} candidate profiles`);
    
    const profiles = result.records.map(r => {
      const profile = r.get("c").properties;
      return formatProfileForResponse(profile);
    });

    res.json({
      success: true,
      data: profiles,
      count: profiles.length
    });
  } catch (err) {
    console.error("❌ Error fetching candidate profiles:", err.message);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch candidate profiles",
      error: err.message 
    });
  } finally {
    await session.close();
  }
});

/**
 * @swagger
 * /api/candidates/next-id:
 *   get:
 *     summary: Get next available Can_ID
 *     tags: [Candidates]
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NextIdResponse'
 */
router.get("/next-id", async (req, res) => {
  console.log("\n📡 GET /api/candidates/next-id - Getting next available Can_ID");
  
  const session = driver.session();
  
  try {
    // FIXED: Use the correct property name 'Can_ID'
    const result = await session.run(
      "MATCH (c:Candidate_Profile) RETURN max(c.Can_ID) as maxCanId"
    );
    
    const maxCanId = toNumber(result.records[0].get('maxCanId')) || 0;
    const nextCanId = maxCanId + 1;
    
    console.log(`📊 Current max Can_ID: ${maxCanId}`);
    console.log(`🔢 Next available Can_ID: ${nextCanId}`);
    
    res.json({
      success: true,
      nextCanId: nextCanId,
      currentMaxId: maxCanId
    });
  } catch (err) {
    console.error("❌ Error getting next ID:", err.message);
    res.status(500).json({ 
      success: false, 
      message: "Failed to get next ID",
      error: err.message 
    });
  } finally {
    await session.close();
  }
});

/**
 * @swagger
 * /api/candidates/check-email/{email}:
 *   get:
 *     summary: Check if email already exists
 *     tags: [Candidates]
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: excludeId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Successful response
 */
router.get("/check-email/:email", async (req, res) => {
  console.log(`\n📡 GET /api/candidates/check-email/${req.params.email}`);
  const session = driver.session();
  const email = req.params.email;
  const excludeId = req.query.excludeId ? parseInt(req.query.excludeId) : null;

  try {
    const result = await session.run(
      "MATCH (c:Candidate_Profile {Email: $email}) RETURN c",
      { email }
    );

    let exists = false;
    if (result.records.length > 0) {
      if (excludeId) {
        exists = result.records.some(record => {
          const profile = record.get("c").properties;
          const canId = toNumber(profile.Can_ID);
          return canId !== excludeId;
        });
      } else {
        exists = true;
      }
    }

    res.json({
      success: true,
      exists
    });
  } catch (err) {
    console.error("❌ Error checking email:", err.message);
    res.status(500).json({ 
      success: false, 
      message: "Failed to check email",
      error: err.message 
    });
  } finally {
    await session.close();
  }
});

/**
 * @swagger
 * /api/candidates/check-mobile/{mobile}:
 *   get:
 *     summary: Check if mobile number already exists
 *     tags: [Candidates]
 *     parameters:
 *       - in: path
 *         name: mobile
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: excludeId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Successful response
 */
router.get("/check-mobile/:mobile", async (req, res) => {
  console.log(`\n📡 GET /api/candidates/check-mobile/${req.params.mobile}`);
  const session = driver.session();
  const mobile = req.params.mobile;
  const excludeId = req.query.excludeId ? parseInt(req.query.excludeId) : null;

  try {
    const result = await session.run(
      "MATCH (c:Candidate_Profile {`Mobile No`: $mobile}) RETURN c",
      { mobile }
    );

    let exists = false;
    if (result.records.length > 0) {
      if (excludeId) {
        exists = result.records.some(record => {
          const profile = record.get("c").properties;
          const canId = toNumber(profile.Can_ID);
          return canId !== excludeId;
        });
      } else {
        exists = true;
      }
    }

    res.json({
      success: true,
      exists
    });
  } catch (err) {
    console.error("❌ Error checking mobile:", err.message);
    res.status(500).json({ 
      success: false, 
      message: "Failed to check mobile",
      error: err.message 
    });
  } finally {
    await session.close();
  }
});

/**
 * @swagger
 * /api/candidates/{id}:
 *   get:
 *     summary: Get candidate profile by ID
 *     tags: [Candidates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Successful response
 *       404:
 *         description: Candidate not found
 */
router.get("/:id", async (req, res) => {
  console.log(`\n📡 GET /api/candidates/${req.params.id}`);
  const session = driver.session();
  const id = parseInt(req.params.id);

  try {
    const result = await session.run(
      "MATCH (c:Candidate_Profile) WHERE c.Can_ID = $id RETURN c",
      { id }
    );

    if (!result.records.length) {
      return res.status(404).json({ 
        success: false,
        message: "Candidate profile not found" 
      });
    }

    const profile = result.records[0].get("c").properties;
    const formatted = formatProfileForResponse(profile);

    res.json({
      success: true,
      data: formatted
    });
  } catch (err) {
    console.error(`❌ Error fetching candidate profile ${id}:`, err.message);
    res.status(500).json({ 
      success: false,
      message: "Error fetching candidate profile",
      error: err.message 
    });
  } finally {
    await session.close();
  }
});

/**
 * @swagger
 * /api/candidates/:
 *   post:
 *     summary: Create new candidate profile
 *     tags: [Candidates]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/CandidateInput'
 *     responses:
 *       201:
 *         description: Candidate created successfully
 *       400:
 *         description: Validation error or duplicate entry
 *       500:
 *         description: Server error
 */
router.post("/", upload.single('resume'), async (req, res) => {
  console.log("\n📡 POST /api/candidates - Creating new candidate profile");
  console.log("Request body:", req.body);
  console.log("Request file:", req.file ? {
    originalname: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype
  } : 'No file');
  
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
      "MATCH (c:Candidate_Profile {Email: $email}) RETURN c",
      { email: req.body.email }
    );

    if (emailCheck.records.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Candidate with this email already exists"
      });
    }

    // Check for duplicate mobile
    const mobileCheck = await session.run(
      "MATCH (c:Candidate_Profile {`Mobile No`: $mobile}) RETURN c",
      { mobile: req.body.mobile }
    );

    if (mobileCheck.records.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Candidate with this mobile number already exists"
      });
    }

    // ✅ FIXED: Get all existing IDs and find next available
    const existingIdsResult = await session.run(
      "MATCH (c:Candidate_Profile) RETURN c.Can_ID as canId ORDER BY c.Can_ID"
    );
    
    const existingIds = existingIdsResult.records
      .map(record => toNumber(record.get('canId')))
      .filter(id => id !== null && id !== undefined)
      .sort((a, b) => a - b);
    
    console.log("📊 Existing Can_IDs in database:", existingIds);
    
    let nextCanId = 1;
    for (let i = 0; i < existingIds.length; i++) {
      if (existingIds[i] === nextCanId) {
        nextCanId++;
      } else if (existingIds[i] > nextCanId) {
        break;
      }
    }
    
    console.log("🔢 Generated new Can_ID:", nextCanId);

    // Initialize storage variables
    let googleDriveFileId = null;
    let googleDriveViewLink = null;
    let googleDriveDownloadLink = null;
    let resumePath = null;

    // Handle file upload if present
    if (req.file) {
      console.log("File received:", {
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      });
      
      // Try Google Drive first
      const driveResult = await uploadToGoogleDrive(req.file, req.body.name);
      
      if (driveResult) {
        googleDriveFileId = driveResult.googleDriveFileId;
        googleDriveViewLink = driveResult.googleDriveViewLink;
        googleDriveDownloadLink = driveResult.googleDriveDownloadLink;
        console.log("✅ Resume stored in Google Drive");
      } else {
        // Fallback to local storage
        const localResult = saveFileLocally(req.file, req.body.name);
        if (localResult) {
          resumePath = localResult.resumePath;
          console.log("✅ Resume stored locally");
        }
      }
    }

    // Parse Key Skills
    let keySkills = req.body.keySkills;
    if (typeof keySkills === 'string') {
      if (keySkills.includes(',')) {
        keySkills = keySkills.split(',').map(s => s.trim()).filter(s => s);
      } else {
        try {
          const parsed = JSON.parse(keySkills);
          keySkills = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          keySkills = [keySkills];
        }
      }
    }

    if (!Array.isArray(keySkills)) {
      keySkills = keySkills ? [keySkills] : [];
    }

    // Prepare profile data
    const profileData = {
      "Candidate Name": req.body.name,
      "Email": req.body.email,
      "Mobile No": req.body.mobile,
      "Experience": req.body.experience || "",
      "Current Org": req.body.currentOrg || "",
      "Current CTC": req.body.currentCTC || "",
      "Expected CTC": req.body.expectedCTC || "",
      "Notice Period in days": req.body.noticePeriod || "",
      "Profiles sourced by": req.body.profileSourcedBy || "",
      "Client Name": req.body.clientName || "",
      "Profile submission date": req.body.profileSubmissionDate || "",
      "Key Skills": keySkills,
      "Can_ID": nextCanId,
      "Visa type": req.body.visaType || "NA",
      "resumePath": resumePath,
      "googleDriveFileId": googleDriveFileId,
      "googleDriveViewLink": googleDriveViewLink,
      "googleDriveDownloadLink": googleDriveDownloadLink,
      "createdAt": new Date().toISOString(),
      "updatedAt": new Date().toISOString(),
      "id": nextCanId
    };

    console.log("Saving candidate profile with Can_ID:", nextCanId);
    console.log("Skills:", keySkills);

    // Create the candidate
    const result = await session.run(
      "CREATE (c:Candidate_Profile) SET c = $data RETURN c",
      { data: profileData }
    );

    const created = result.records[0].get("c").properties;
    const formatted = formatProfileForResponse(created);

    console.log("✅ Candidate profile created successfully with Can_ID:", nextCanId);

    res.status(201).json({
      success: true,
      message: "Candidate profile created successfully",
      data: formatted
    });

  } catch (err) {
    console.error("❌ Error creating candidate profile:", err);
    
    // Check for duplicate email/mobile errors
    if (err.message && (err.message.includes("Email") || err.message.includes("Mobile"))) {
      return res.status(400).json({
        success: false,
        message: err.message,
        error: err.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Failed to create candidate profile",
      error: err.message
    });
  } finally {
    await session.close();
  }
});

/**
 * @swagger
 * /api/candidates/{id}:
 *   put:
 *     summary: Update candidate profile
 *     tags: [Candidates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/CandidateInput'
 *     responses:
 *       200:
 *         description: Candidate updated successfully
 *       404:
 *         description: Candidate not found
 *       500:
 *         description: Server error
 */
router.put("/:id", upload.single('resume'), async (req, res) => {
  console.log(`\n📡 PUT /api/candidates/${req.params.id} - Updating candidate profile`);
  
  const session = driver.session();
  const id = parseInt(req.params.id);

  try {
    // Check if candidate profile exists
    const checkResult = await session.run(
      "MATCH (c:Candidate_Profile) WHERE c.Can_ID = $id RETURN c",
      { id }
    );

    if (!checkResult.records.length) {
      return res.status(404).json({ 
        success: false,
        message: "Candidate profile not found" 
      });
    }

    const existingProfile = checkResult.records[0].get("c").properties;
    const formattedExisting = formatProfileForResponse(existingProfile);

    // Validation
    if (!req.body.name || !req.body.email || !req.body.mobile) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and mobile are required fields"
      });
    }

    // Check for duplicate email (excluding current candidate)
    const emailCheck = await session.run(
      "MATCH (c:Candidate_Profile {Email: $email}) WHERE c.Can_ID <> $id RETURN c",
      { email: req.body.email, id }
    );

    if (emailCheck.records.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Candidate with this email already exists"
      });
    }

    // Check for duplicate mobile (excluding current candidate)
    const mobileCheck = await session.run(
      "MATCH (c:Candidate_Profile {`Mobile No`: $mobile}) WHERE c.Can_ID <> $id RETURN c",
      { mobile: req.body.mobile, id }
    );

    if (mobileCheck.records.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Candidate with this mobile number already exists"
      });
    }

    // Initialize storage variables with existing values
    let googleDriveFileId = formattedExisting.googleDriveFileId;
    let googleDriveViewLink = formattedExisting.googleDriveViewLink;
    let googleDriveDownloadLink = formattedExisting.googleDriveDownloadLink;
    let resumePath = formattedExisting.resumePath;

    // Handle new file upload if present
    if (req.file) {
      console.log("New file received for update:", {
        originalname: req.file.originalname,
        size: req.file.size
      });
      
      // Try Google Drive first
      const driveResult = await uploadToGoogleDrive(req.file, req.body.name);
      
      if (driveResult) {
        // Google Drive upload successful
        googleDriveFileId = driveResult.googleDriveFileId;
        googleDriveViewLink = driveResult.googleDriveViewLink;
        googleDriveDownloadLink = driveResult.googleDriveDownloadLink;
        
        // If there was an old local file, delete it
        if (formattedExisting.resumePath) {
          const oldResumePath = path.join(__dirname, '..', formattedExisting.resumePath);
          if (fs.existsSync(oldResumePath)) {
            fs.unlinkSync(oldResumePath);
            console.log("✅ Old local resume deleted");
          }
        }
        
        resumePath = null;
        console.log("✅ New resume stored in Google Drive");
      } else {
        // Fallback to local storage
        const localResult = saveFileLocally(req.file, req.body.name);
        if (localResult) {
          resumePath = localResult.resumePath;
          console.log("✅ New resume stored locally");
        }
      }
    }

    // Parse Key Skills
    let keySkills = req.body.keySkills;
    if (typeof keySkills === 'string') {
      if (keySkills.includes(',')) {
        keySkills = keySkills.split(',').map(s => s.trim()).filter(s => s);
      } else {
        try {
          const parsed = JSON.parse(keySkills);
          keySkills = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          keySkills = [keySkills];
        }
      }
    }

    if (!Array.isArray(keySkills)) {
      keySkills = keySkills ? [keySkills] : [];
    }

    // Prepare update data
// Prepare update data - with non-editable submission date
const updateData = {
  "Candidate Name": req.body.name,
  "Email": req.body.email,
  "Mobile No": req.body.mobile,
  "Experience": req.body.experience || formattedExisting.experience || "",
  "Current Org": req.body.currentOrg || formattedExisting.currentOrg || "",
  "Current CTC": req.body.currentCTC || formattedExisting.currentCTC || "",
  "Expected CTC": req.body.expectedCTC || formattedExisting.expectedCTC || "",
  "Notice Period in days": req.body.noticePeriod || formattedExisting.noticePeriod || "",
  "Profiles sourced by": req.body.profileSourcedBy || formattedExisting.profileSourcedBy || "",
  "Client Name": req.body.clientName || formattedExisting.clientName || "",
  // IMPORTANT: Always use existing submission date - never allow updates
  "Profile submission date": formattedExisting.profileSubmissionDate || "",
  "Key Skills": Array.isArray(keySkills) ? keySkills : (keySkills || formattedExisting.keySkills || []),
  "Can_ID": formattedExisting.canId || id,
  "Visa type": req.body.visaType || formattedExisting.visaType || "NA",
  "resumePath": resumePath,
  "googleDriveFileId": googleDriveFileId,
  "googleDriveViewLink": googleDriveViewLink,
  "googleDriveDownloadLink": googleDriveDownloadLink,
  "updatedAt": new Date().toISOString(),
  "createdAt": formattedExisting.createdAt,
  "id": formattedExisting.id || id
};

    console.log("Updating candidate profile...");

    const result = await session.run(
      `MATCH (c:Candidate_Profile) WHERE c.Can_ID = $id
       SET c = $data
       RETURN c`,
      { id, data: updateData }
    );

    const updated = result.records[0].get("c").properties;
    const formatted = formatProfileForResponse(updated);

    console.log("✅ Candidate profile updated successfully with Can_ID:", id);

    res.json({
      success: true,
      message: "Candidate profile updated successfully",
      data: formatted
    });
  } catch (err) {
    console.error(`❌ Error updating candidate profile ${id}:`, err);
    res.status(500).json({ 
      success: false,
      message: "Failed to update candidate profile",
      error: err.message 
    });
  } finally {
    await session.close();
  }
});

/**
 * @swagger
 * /api/candidates/{id}:
 *   delete:
 *     summary: Delete candidate profile
 *     tags: [Candidates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Candidate deleted successfully
 *       404:
 *         description: Candidate not found
 *       500:
 *         description: Server error
 */
router.delete("/:id", async (req, res) => {
  console.log(`\n📡 DELETE /api/candidates/${req.params.id} - Deleting candidate profile`);
  const session = driver.session();
  const id = parseInt(req.params.id);

  try {
    // First get the candidate profile to check for resume
    const checkResult = await session.run(
      "MATCH (c:Candidate_Profile) WHERE c.Can_ID = $id RETURN c",
      { id }
    );

    if (!checkResult.records.length) {
      return res.status(404).json({
        success: false,
        message: "Candidate profile not found"
      });
    }

    const profile = checkResult.records[0].get("c").properties;
    const formatted = formatProfileForResponse(profile);

    // Delete from Google Drive if file exists
    if (formatted.googleDriveFileId) {
      console.log(`🗑️ Deleting from Google Drive: ${formatted.googleDriveFileId}`);
      await deleteFromGoogleDrive(formatted.googleDriveFileId);
    }

    // Delete local resume file if it exists
    if (formatted.resumePath) {
      const resumeFilePath = path.join(__dirname, '..', formatted.resumePath);
      if (fs.existsSync(resumeFilePath)) {
        fs.unlinkSync(resumeFilePath);
        console.log("✅ Local resume deleted");
      }
    }

    // Delete the candidate profile node
    const result = await session.run(
      "MATCH (c:Candidate_Profile) WHERE c.Can_ID = $id DELETE c RETURN count(c) as deletedCount",
      { id }
    );

    const countValue = result.records[0].get("deletedCount");
    const deletedCount = toNumber(countValue);

    if (deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Candidate profile not found"
      });
    }

    console.log("✅ Candidate profile deleted successfully with Can_ID:", id);

    res.json({
      success: true,
      message: "Candidate profile deleted successfully"
    });
  } catch (err) {
    console.error(`❌ Error deleting candidate profile ${id}:`, err.message);
    res.status(500).json({
      success: false,
      message: "Failed to delete candidate profile",
      error: err.message
    });
  } finally {
    await session.close();
  }
});
/**
 * @swagger
 * /api/candidates/resume/{filename}:
 *   get:
 *     summary: Serve resume file
 *     tags: [Candidates]
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Resume file
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Resume not found
 */
router.get("/resume/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, "../uploads", filename);
  
  console.log("Looking for resume at:", filePath);
  
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.sendFile(filePath);
  } else {
    console.error("Resume not found:", filePath);
    res.status(404).json({ 
      success: false, 
      message: "Resume not found" 
    });
  }
});
// Add to candidates.js
/**
 * GET /api/candidates/check-zone/:candidateId/:clientName
 * Check if candidate is in zone for a specific client
 */
router.get("/check-zone/:candidateId/:clientName", async (req, res) => {
  const { candidateId, clientName } = req.params;
  
  console.log(`\n📡 GET /api/candidates/check-zone/${candidateId}/${clientName}`);
  
  const driver = getDriver();
  const session = driver.session();
  
  try {
    const result = await session.run(`
      MATCH (z:Zone {candidateId: $candidateId, clientName: $clientName})
      WHERE z.expiryDate > datetime()
      RETURN z
    `, {
      candidateId: parseInt(candidateId),
      clientName: clientName
    });
    
    if (result.records.length === 0) {
      return res.json({
        success: true,
        inZone: false,
        eligible: true,
        message: "Candidate is eligible for this client"
      });
    }
    
    const zoneEntry = result.records[0].get('z').properties;
    const expiryDate = new Date(zoneEntry.expiryDate);
    const now = new Date();
    const daysRemaining = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
    
    res.json({
      success: true,
      inZone: true,
      eligible: false,
      data: {
        candidateId: toNumber(zoneEntry.candidateId),
        clientName: zoneEntry.clientName,
        rejectedStatus: zoneEntry.rejectedStatus,
        reason: zoneEntry.reason,
        rejectedAt: zoneEntry.rejectedAt,
        expiryDate: zoneEntry.expiryDate,
        daysRemaining: daysRemaining
      },
      message: `Candidate cannot be selected for ${clientName}. In zone for ${daysRemaining} more days.`
    });
    
  } catch (err) {
    console.error("❌ Error checking zone:", err);
    res.status(500).json({
      success: false,
      message: "Failed to check zone status",
      error: err.message
    });
  } finally {
    await session.close();
  }
});
module.exports = router;
