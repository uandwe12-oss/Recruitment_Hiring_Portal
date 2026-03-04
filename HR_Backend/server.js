require("dotenv").config();
const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const path = require('path');

const app = express();

// ✅ Updated CORS configuration - SINGLE SOURCE OF TRUTH
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173', 'https://recruitment-hiring-portal-ibsf.vercel.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 200
}));

// ❌ REMOVE the custom preflight handler below
// The cors() middleware already handles OPTIONS requests

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 🔹 Import Routes
const loginRoute = require("./api/login");
const demandRoute = require("./api/demand");
const candidatesRoute = require("./api/candidates");
const skillsRoute = require("./api/skills");
const skillsMatchRoute = require("./api/skillsmatch");
const shortcandidatesRoute = require("./api/shortcandidates");

// 🔹 Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "HR Backend API",
      version: "1.0.0",
      description: "API documentation for HR Management System"
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Development server"
      }
    ]
  },
  apis: ["./api/*.js"]
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// 🔹 Swagger UI route
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 🔹 API Routes
app.use("/api/login", loginRoute);
app.use("/api/demand", demandRoute);
app.use("/api/candidates", candidatesRoute);
app.use("/api/skills", skillsRoute);
app.use("/api/skillsmatch", skillsMatchRoute);
app.use("/api/shortcandidates", shortcandidatesRoute);

// 🔹 Test endpoint
app.get("/test", (req, res) => {
  res.json({ 
    success: true, 
    message: "Server is running!",
    timestamp: new Date().toISOString(),
    endpoints: {
      candidates: "/api/candidates",
      demand: "/api/demand",
      login: "/api/login",
      swagger: "/api-docs"
    }
  });
});

// 🔹 Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server Error:", err.stack);
  res.status(500).json({ 
    success: false, 
    message: "Internal server error",
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

module.exports = app;

// // 🔹 Start server
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log("\n" + "=".repeat(50));
//   console.log(`🚀 Server is running on port ${PORT}`);
//   console.log("=".repeat(50));
//   console.log(`📍 Local: http://localhost:${PORT}`);
//   console.log(`📚 Swagger Docs: http://localhost:${PORT}/api-docs`);
//   console.log(`✅ Test endpoint: http://localhost:${PORT}/test`);
//   console.log(`👥 Candidates API: http://localhost:${PORT}/api/candidates`);
//   console.log(`📊 Demand API: http://localhost:${PORT}/api/demand`);
//   console.log(`🔐 Login API: http://localhost:${PORT}/api/login`);
//   console.log("=".repeat(50) + "\n");
// });