const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const neo4j = require("neo4j-driver");
require("dotenv").config();

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
);

/**
 * =================================================
 * GET – Get All Users (Admin only)
 * =================================================
 */
router.get("/", async (req, res) => {
  const session = driver.session();

  try {
    console.log("📡 Fetching all users...");
    
    const result = await session.run(
      `MATCH (u:User)
       RETURN u.username as username, 
              u.role as role, 
              u.createdAt as createdAt
       ORDER BY u.createdAt DESC`
    );

    console.log(`📊 Found ${result.records.length} users`);

    const users = result.records.map(record => {
      const username = record.get("username");
      const role = record.get("role");
      const createdAt = record.get("createdAt");
      
      return {
        username: username,
        role: role,
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
  const session = driver.session();
  
  try {
    const { username, password, role } = req.body;

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
      return res.status(400).json({ 
        success: false,
        message: "Username already exists" 
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const result = await session.run(
      `
      CREATE (u:User {
        username: $username,
        passwordHash: $passwordHash,
        role: $role,
        createdAt: datetime()
      })
      RETURN u.username as username, u.role as role, u.createdAt as createdAt
      `,
      {
        username,
        passwordHash,
        role
      }
    );

    const createdUser = result.records[0].toObject();

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        username: createdUser.username,
        role: createdUser.role,
        createdAt: createdUser.createdAt ? createdUser.createdAt.toString() : null
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
  const session = driver.session();
  const { username } = req.params;
  const { role } = req.body;

  try {
    console.log(`📡 Updating user: ${username} to role: ${role}`);

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

    const updatedUser = result.records[0].toObject();

    console.log(`✅ User ${username} updated successfully`);

    res.json({
      success: true,
      message: "User updated successfully",
      user: {
        username: updatedUser.username,
        role: updatedUser.role,
        createdAt: updatedUser.createdAt ? updatedUser.createdAt.toString() : null
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
  const session = driver.session();
  const { username } = req.params;

  try {
    console.log(`📡 Deleting user: ${username}`);

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

    // Prevent deleting yourself (optional - can remove if you want)
    // You can add this check if needed

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