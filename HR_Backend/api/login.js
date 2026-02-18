const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const neo4j = require("neo4j-driver");
require("dotenv").config();

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
);

router.post("/", async (req, res) => {
  const { username, password } = req.body;
  const session = driver.session();
  
  try {
    const result = await session.run(
      `MATCH (u:User {username: $username}) RETURN u.username AS username, u.passwordHash AS hash, u.role AS role`,
      { username }
    );

    if (result.records.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const record = result.records[0].toObject();
    const isValid = await bcrypt.compare(password, record.hash);

    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.json({
      message: "Login successful",
      user: { 
        username: record.username, 
        role: record.role 
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  } finally {
    await session.close();
  }
});

module.exports = router;