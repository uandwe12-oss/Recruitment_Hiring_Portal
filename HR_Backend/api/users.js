const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");

// Import the shared driver helper
const getDriver = require("../lib/neo4j");

/**
 * =================================================
 * GET – Get All Users (Admin only)
 * =================================================
 */
router.get("/", async (req, res) => {
  console.log("\n📡 GET /api/users - Fetching all users");
  
  const driver = getDriver();
  const session = driver.session();

  try {
    console.log("🔍 Executing Neo4j query...");
    
    const result = await session.run(
      `MATCH (u:User)
       RETURN u.username as username, 
              u.role as role,
              u.assignedClient as assignedClient,
              u.createdAt as createdAt
       ORDER BY u.createdAt DESC`
    );

    console.log(`📊 Found ${result.records.length} users`);

    const users = result.records.map(record => {
      const username = record.get("username");
      const role = record.get("role");
      const assignedClient = record.get("assignedClient");
      const createdAt = record.get("createdAt");
      
      return {
        username: username,
        role: role,
        assignedClient: assignedClient || null,
        createdAt: createdAt ? new Date(createdAt).toISOString() : null
      };
    });

    console.log("✅ Users fetched successfully");

    res.json({
      success: true,
      users: users
    });

  } catch (err) {
    console.error("❌ Error fetching users:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch users",
      error: err.message 
    });
  } finally {
    await session.close();
  }
});

/**
 * =================================================
 * POST – Create New User (Admin only)
 * =================================================
 */
router.post("/", async (req, res) => {
  console.log("\n📡 POST /api/users - Creating new user");
  console.log("Request body:", { ...req.body, password: "[HIDDEN]" });
  
  const driver = getDriver();
  const session = driver.session();
  
  try {
    const { username, password, role, assignedClient } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ 
        success: false,
        message: "Username, password and role are required" 
      });
    }

    // Check if username exists
    const checkResult = await session.run(
      "MATCH (u:User {username: $username}) RETURN u",
      { username }
    );

    if (checkResult.records.length > 0) {
      console.log(`❌ Username already exists: ${username}`);
      return res.status(400).json({ 
        success: false,
        message: "Username already exists" 
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Prepare user data
    const userData = {
      username,
      passwordHash,
      role,
      createdAt: new Date().toISOString()
    };

    // If role is Interviewer and assignedClient is provided, add it
    if (role === "Interviewer" && assignedClient) {
      userData.assignedClient = assignedClient;
    }

    // Create user
    const result = await session.run(
      `
      CREATE (u:User {
        username: $username,
        passwordHash: $passwordHash,
        role: $role,
        assignedClient: $assignedClient,
        createdAt: datetime($createdAt)
      })
      RETURN u.username as username, u.role as role, u.assignedClient as assignedClient, u.createdAt as createdAt
      `,
      {
        username,
        passwordHash,
        role,
        assignedClient: userData.assignedClient || null,
        createdAt: userData.createdAt
      }
    );

    const createdUser = result.records[0];
    const createdUsername = createdUser.get("username");
    const createdRole = createdUser.get("role");
    const createdClient = createdUser.get("assignedClient");
    const createdDate = createdUser.get("createdAt");

    console.log(`✅ User created successfully: ${createdUsername} (${createdRole})`);

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        username: createdUsername,
        role: createdRole,
        assignedClient: createdClient,
        createdAt: createdDate ? createdDate.toString() : null
      }
    });

  } catch (err) {
    console.error("❌ Error creating user:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to create user",
      error: err.message 
    });
  } finally {
    await session.close();
  }
});

/**
 * =================================================
 * PUT – Update User Role (Admin only)
 * =================================================
 */
router.put("/:username", async (req, res) => {
  console.log(`\n📡 PUT /api/users/${req.params.username} - Updating user`);
  
  const driver = getDriver();
  const session = driver.session();
  const { username } = req.params;
  const { role } = req.body;

  try {
    console.log(`📝 Updating user: ${username} to role: ${role}`);

    if (!role) {
      return res.status(400).json({ 
        success: false,
        message: "Role is required" 
      });
    }

    // Check if user exists
    const checkResult = await session.run(
      "MATCH (u:User {username: $username}) RETURN u",
      { username }
    );

    if (!checkResult.records.length) {
      console.log(`❌ User ${username} not found`);
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // Update user role
    const result = await session.run(
      `
      MATCH (u:User {username: $username})
      SET u.role = $role
      RETURN u.username as username, u.role as role, u.createdAt as createdAt
      `,
      { username, role }
    );

    const updatedUser = result.records[0];
    const updatedUsername = updatedUser.get("username");
    const updatedRole = updatedUser.get("role");
    const updatedDate = updatedUser.get("createdAt");

    console.log(`✅ User ${username} updated successfully to role: ${updatedRole}`);

    res.json({
      success: true,
      message: "User updated successfully",
      user: {
        username: updatedUsername,
        role: updatedRole,
        createdAt: updatedDate ? updatedDate.toString() : null
      }
    });

  } catch (err) {
    console.error("❌ Error updating user:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to update user",
      error: err.message 
    });
  } finally {
    await session.close();
  }
});

/**
 * =================================================
 * DELETE – Delete User (Admin only)
 * =================================================
 */
router.delete("/:username", async (req, res) => {
  console.log(`\n📡 DELETE /api/users/${req.params.username} - Deleting user`);
  
  const driver = getDriver();
  const session = driver.session();
  const { username } = req.params;

  try {
    console.log(`🔍 Checking if user ${username} exists`);

    // Check if user exists
    const checkResult = await session.run(
      "MATCH (u:User {username: $username}) RETURN u",
      { username }
    );

    if (!checkResult.records.length) {
      console.log(`❌ User ${username} not found`);
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // Delete user
    await session.run(
      "MATCH (u:User {username: $username}) DELETE u",
      { username }
    );

    console.log(`✅ User ${username} deleted successfully`);

    res.json({
      success: true,
      message: "User deleted successfully"
    });

  } catch (err) {
    console.error("❌ Error deleting user:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to delete user",
      error: err.message 
    });
  } finally {
    await session.close();
  }
});

module.exports = router;
