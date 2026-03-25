require("dotenv").config();
const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const path = require("path");

const app = express();

const corsOptions = {
  origin: ["http://localhost:5173", "https://myuandwe.vercel.app"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));

/* JSON BODY PARSER */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ================================
ROUTES IMPORT
================================ */

const loginRoute = require("./api/login");
const demandRoute = require("./api/demand");
const candidatesRoute = require("./api/candidates");
const skillsRoute = require("./api/skills");
const skillsMatchRoute = require("./api/skillsmatch");
const shortcandidatesRoute = require("./api/shortcandidates");
const userRoute = require("./api/users");
const selectedCandidatesRoutes = require('./api/selectedCandidates');
const zoneRoutes = require('./api/zone');

/* ================================
ROUTE REGISTRATION
================================ */

app.use("/api/login", loginRoute);
app.use("/api/demand", demandRoute);
app.use("/api/candidates", candidatesRoute);
app.use("/api/skills", skillsRoute);
app.use("/api/skillsmatch", skillsMatchRoute);
app.use("/api/shortcandidates", shortcandidatesRoute);
app.use("/api/users", userRoute);
app.use('/api/selected-candidates', selectedCandidatesRoutes);
app.use('/api/zone', zoneRoutes);

/* ================================
START AUTO CLEANUP FOR ZONE
================================ */

// Start the auto cleanup for expired zone entries
if (zoneRoutes.startAutoCleanup) {
  console.log('🚀 Starting auto cleanup for Zone entries...');
  zoneRoutes.startAutoCleanup();
} else {
  console.log('⚠️ Warning: startAutoCleanup function not found in zone module');
  console.log('Available exports:', Object.keys(zoneRoutes));
}

/* ================================
SWAGGER CONFIG
================================ */

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
        description: "Production Server"
      }
    ]
  },
  apis: ["./api/*.js"]
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/* ================================
TEST ENDPOINT
================================ */

app.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Server is running!",
    timestamp: new Date().toISOString()
  });
});

/* ================================
ERROR HANDLING
================================ */

app.use((err, req, res, next) => {
  console.error("Server Error:", err.stack);
  res.status(500).json({
    success: false,
    message: "Internal server error"
  });
});

module.exports = app;
