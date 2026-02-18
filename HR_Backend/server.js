if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const cors = require("cors");

const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

const app = express();
app.use(cors());
app.use(express.json());

// Routes
const loginRoute = require("./api/login");
const demandRoute = require("./api/demand");
const usersRoute = require("./api/users");
const candidatesRoute = require("./api/candidates");

// Swagger config
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "HR Backend API",
      version: "1.0.0",
      description: "API documentation for Login & Demand Management"
    },
    servers: [
      {
        url: "https://recruitment-hiring-portal.vercel.app"
      }
    ]
  },
  apis: ["./api/*.js"]
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Swagger route
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API routes
app.use("/api/login", loginRoute);
app.use("/api/demand", demandRoute);
app.use("/api/users", usersRoute);
app.use("/api/candidates", candidatesRoute);

// Test endpoint
app.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Server is running!",
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Server is healthy"
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Server Error:", err.stack);
  res.status(500).json({
    success: false,
    message: "Internal server error"
  });
});

// ✅ THIS IS THE MISSING LINE (CRITICAL)
module.exports = app;
