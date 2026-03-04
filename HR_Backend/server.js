require("dotenv").config();
const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const path = require('path');

const app = express();

const corsOptions = {
  origin: [
    'http://localhost:3000', 
    'http://localhost:3001', 
    'http://localhost:5173', 
    'https://recruitment-hiring-portal-ibsf.vercel.app',  // 👈 Old URL (keep it)
    'https://recruitment-hiring-portal-ibsf-7ffylnjhd-uandwe12-oss-projects.vercel.app' // 👈 NEW URL - ADD THIS!
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 200
};
// Apply CORS globally
app.use(cors(corsOptions));

// ✅ FIXED: Use named wildcard parameter '/*splat' instead of '/*'
app.options('/*splat', (req, res) => {
  res.header('Access-Control-Allow-Origin', 'https://recruitment-hiring-portal-ibsf.vercel.app');
  res.header('Access-Control-Allow-Origin', 'https://recruitment-hiring-portal-ibsf-7ffylnjhd-uandwe12-oss-projects.vercel.app'); // 👈 Update this
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, X-Requested-With, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
        url: "https://recruitment-hiring-portal-c7rqt3y5w-uandwe12-oss-projects.vercel.app",
        description: "Production server"
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