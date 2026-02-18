const express = require("express");
const router = express.Router();
const neo4j = require("neo4j-driver");
require("dotenv").config();

// 🔹 Neo4j connection - add verification
console.log("\n" + "=".repeat(50));
console.log("🔌 Initializing Neo4j Connection...");
console.log("=".repeat(50));
console.log("🔌 Neo4j URI:", process.env.NEO4J_URI ? "✓ Set" : "✗ Missing");
console.log("🔌 Neo4j USER:", process.env.NEO4J_USER ? "✓ Set" : "✗ Missing");
console.log("🔌 Neo4j PASSWORD:", process.env.NEO4J_PASSWORD ? "✓ Set" : "✗ Missing");

// Create driver
let driver;
try {
  driver = neo4j.driver(
    process.env.NEO4J_URI,
    neo4j.auth.basic(
      process.env.NEO4J_USER,
      process.env.NEO4J_PASSWORD
    ),
    {
      maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
      maxConnectionPoolSize: 50,
      connectionAcquisitionTimeout: 2 * 60 * 1000 // 2 minutes
    }
  );

  // Test connection immediately
  (async () => {
    try {
      const session = driver.session();
      const result = await session.run("RETURN 1 as test");
      console.log("✅ Neo4j connection test successful");
      await session.close();
    } catch (err) {
      console.error("❌ Neo4j connection failed:", err.message);
      console.error("❌ Please check:");
      console.error("   1. Is Neo4j running?");
      console.error("   2. Are credentials correct?");
      console.error("   3. Is bolt://localhost:7687 accessible?");
    }
  })();
} catch (err) {
  console.error("❌ Failed to create Neo4j driver:", err.message);
  process.exit(1);
}

/**
 * =================================================
 * Test Endpoint
 * =================================================
 */
router.get("/test", async (req, res) => {
  console.log("\n📡 GET /api/demand/test - Called");
  const session = driver.session();
  
  try {
    console.log("🔍 Testing Neo4j connection...");
    const result = await session.run("RETURN 'Backend is working!' as message, datetime() as timestamp");
    const message = result.records[0].get("message");
    const timestamp = result.records[0].get("timestamp");
    
    console.log("✅ Test successful:", message);
    
    res.json({
      success: true,
      message: message,
      timestamp: timestamp.toString(),
      neo4jConnected: true
    });
  } catch (error) {
    console.error("❌ Test endpoint error:", error.message);
    res.status(500).json({
      success: false,
      message: "Backend test failed",
      error: error.message,
      neo4jConnected: false
    });
  } finally {
    await session.close();
  }
});

/**
 * =================================================
 * GET – Fetch all Demands
 * =================================================
 */
router.get("/", async (req, res) => {
  console.log("\n📡 GET /api/demand - Fetching all demands");
  const session = driver.session();

  try {
    console.log("🔍 Executing Neo4j query...");
    const result = await session.run(
      "MATCH (d:Demand) RETURN d ORDER BY d.createdDate DESC"
    );

    console.log(`📊 Found ${result.records.length} demands`);
    
    const demands = result.records.map(r => {
      const d = r.get("d").properties;
      Object.keys(d).forEach(k => {
        if (neo4j.isInt(d[k])) d[k] = d[k].toNumber();
      });
      return d;
    });

    console.log("✅ Successfully fetched demands");
    res.json(demands);
  } catch (err) {
    console.error("❌ Error fetching demands:", err.message);
    console.error("❌ Stack trace:", err.stack);
    res.status(500).json({ 
      message: "Failed to fetch demands",
      error: err.message 
    });
  } finally {
    await session.close();
  }
});

/**
 * =================================================
 * GET – Demand by ID
 * =================================================
 */
router.get("/:id", async (req, res) => {
  console.log(`\n📡 GET /api/demand/${req.params.id} - Fetching demand by ID`);
  const session = driver.session();
  const id = Number(req.params.id);

  try {
    console.log(`🔍 Looking for demand with ID: ${id}`);
    const result = await session.run(
      "MATCH (d:Demand {id:$id}) RETURN d",
      { id }
    );

    if (!result.records.length) {
      console.log(`❌ Demand with ID ${id} not found`);
      return res.status(404).json({ message: "Demand not found" });
    }

    console.log(`✅ Found demand with ID ${id}`);
    res.json(result.records[0].get("d").properties);
  } catch (err) {
    console.error(`❌ Error fetching demand ${id}:`, err.message);
    res.status(500).json({ 
      message: "Error fetching demand",
      error: err.message 
    });
  } finally {
    await session.close();
  }
});

/**
 * =================================================
 * PUT – Update Demand
 * =================================================
 */
router.put("/:id", async (req, res) => {
  console.log(`\n📡 PUT /api/demand/${req.params.id} - Updating demand`);
  const session = driver.session();
  const id = Number(req.params.id);

  try {
    console.log(`🔍 Updating demand ID: ${id}`);
    console.log("📝 Update data:", req.body);
    
    const result = await session.run(
      `MATCH (d:Demand {id:$id})
       SET d += $data
       RETURN d`,
      { id, data: req.body }
    );

    if (!result.records.length) {
      console.log(`❌ Demand with ID ${id} not found for update`);
      return res.status(404).json({ message: "Demand not found" });
    }

    console.log(`✅ Successfully updated demand ${id}`);
    res.json({
      message: "Demand updated successfully",
      data: result.records[0].get("d").properties
    });
  } catch (err) {
    console.error(`❌ Error updating demand ${id}:`, err.message);
    console.error("❌ Stack trace:", err.stack);
    res.status(500).json({ 
      message: "Failed to update demand",
      error: err.message 
    });
  } finally {
    await session.close();
  }
});

/**
 * =================================================
 * POST – Create Demand (AUTO ID) - DEBUG VERSION
 * =================================================
 */
router.post("/", async (req, res) => {
  const session = driver.session();

  try {
    // Get next ID
    const idResult = await session.run(
      "MATCH (d:Demand) RETURN coalesce(MAX(d.id), 0) + 1 AS nextId"
    );
    const id = idResult.records[0].get("nextId");

    const demandData = {
      id,
      clientName: req.body.clientName || "",
      country: req.body.country || "",
      createdDate: req.body.createdDate || new Date().toISOString().split("T")[0],
      expFrom: Number(req.body.expFrom || 0),
      expTo: Number(req.body.expTo || 0),
      interviewer1: req.body.interviewer1 || "",
      interviewer2: req.body.interviewer2 || "",
      jobDescription: req.body.jobDescription || "",
      jobPriority: req.body.jobPriority || "Medium",
      location: req.body.location || "",
      primarySkill: req.body.primarySkill || [],
      secondarySkill: req.body.secondarySkill || [],
      recruiterPOC: req.body.recruiterPOC || "",
      status: req.body.status || "Active"
    };

    const result = await session.run(
      `
      CREATE (d:Demand)
      SET d = $data
      RETURN d
      `,
      { data: demandData }
    );

    const created = result.records[0].get("d").properties;

    res.status(201).json({
      success: true,
      message: "Demand created successfully",
      data: created
    });

  } catch (err) {
    console.error("❌ CREATE ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to create demand",
      error: err.message
    });
  } finally {
    await session.close();
  }
});

/**
 * =================================================
 * DELETE – Delete Demand by ID
 * =================================================
 */
router.delete("/:id", async (req, res) => {
  console.log(`\n📡 DELETE /api/demand/${req.params.id} - Deleting demand`);
  const session = driver.session();
  const id = Number(req.params.id);

  try {
    console.log(`🔍 Checking if demand ID ${id} exists`);
    const checkResult = await session.run(
      "MATCH (d:Demand {id: $id}) RETURN d",
      { id }
    );

    if (!checkResult.records.length) {
      console.log(`❌ Demand with ID ${id} not found`);
      return res.status(404).json({ message: "Demand not found" });
    }

    console.log(`🗑️ Deleting demand ID ${id}`);
    await session.run(
      "MATCH (d:Demand {id: $id}) DELETE d",
      { id }
    );

    console.log(`✅ Successfully deleted demand ${id}`);
    res.json({
      success: true,
      message: "Demand deleted successfully"
    });

  } catch (err) {
    console.error(`❌ Error deleting demand ${id}:`, err.message);
    res.status(500).json({ 
      message: "Failed to delete demand",
      error: err.message 
    });
  } finally {
    await session.close();
  }
});

module.exports = router;