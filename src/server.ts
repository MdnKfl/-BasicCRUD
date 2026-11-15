import "dotenv/config";
import express from "express";
import { pool } from "./config/db.js";
import { redisClient, connectRedis } from "./config/redis.js";
const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT) || 3000;


app.get("/users", async (req, res) => {
  try {
    // 1. Check Redis first
    const cachedUsers = await redisClient.get("users:all");

    if (cachedUsers) {
      console.log("Serving users from Redis cache");
      return res.json(JSON.parse(cachedUsers));
    }

    // 2. If cache is empty, query PostgreSQL
    console.log("Fetching users from PostgreSQL");

    const result = await pool.query("SELECT * FROM users");

    // 3. Store the result in Redis
    await redisClient.set(
      "users:all",
      JSON.stringify(result.rows),
      { EX: 60 }
    );

    // 4. Return the users
    res.json(result.rows);

  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      message: "Failed to fetch users",
    });
  }
});

app.post("/users", async (req, res) => {
  try {
    const { username, email } = req.body;

if (
  typeof username !== "string" ||
  typeof email !== "string" ||
  !username.trim() ||
  !email.trim()
) {
  return res.status(400).json({
    message: "Username and email are required and must be valid strings",
  });
}
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (!emailRegex.test(email.trim())) {
  return res.status(400).json({
    message: "Please provide a valid email address",
  });
}

    const result = await pool.query(
      "INSERT INTO users (username, email) VALUES ($1, $2) RETURNING *",
      [username, email]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Failed to create user" });
  }
});
app.get("/users/:id", async (req, res) => {
  try {
    const userId = Number(req.params.id);

    if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({
    message: "Invalid user ID",
  });
}

    const result = await pool.query(
      'SELECT * FROM users WHERE "userId" = $1',
      [userId]
    );
    // console.log(result);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching user:", error);

    res.status(500).json({
      message: "Failed to fetch user",
    });
  }
});
app.put("/users/:id", async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const { username, email } = req.body;

if (
  typeof username !== "string" ||
  typeof email !== "string" ||
  !username.trim() ||
  !email.trim()
) {
  return res.status(400).json({
    message: "Username and email are required and must be valid strings",
  });
}
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (!emailRegex.test(email.trim())) {
  return res.status(400).json({
    message: "Please provide a valid email address",
  });
}

    const result = await pool.query(
      `UPDATE users
       SET username = $1, email = $2
       WHERE "userId" = $3
       RETURNING *`,
      [username, email, userId]
    );
    console.log(result);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating user:", error);

    res.status(500).json({
      message: "Failed to update user",
    });
  }
});
app.delete("/users/:id", async (req, res) => {
  try {
    const userId = Number(req.params.id);

if (!Number.isInteger(userId) || userId <= 0) {
  return res.status(400).json({
    message: "Invalid user ID",
  });
}

    const result = await pool.query(
      'DELETE FROM users WHERE "userId" = $1 RETURNING *',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json({
      message: "User deleted successfully",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Error deleting user:", error);

    res.status(500).json({
      message: "Failed to delete user",
    });
  }
});
await connectRedis();
await redisClient.set("test:key", "Hello from Node.js");

const value = await redisClient.get("test:key");

console.log("Value from Redis:", value);
app.listen(PORT, () => {  
  console.log(`Server running on port ${PORT}`);
});