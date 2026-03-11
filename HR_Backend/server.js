require("dotenv").config();
const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const path = require("path");

const app = express();

const corsOptions = {
  origin: "https://myuandwe-bg.vercel.app",
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
url: "https://recruitment-hiring-portal-c7rqt3y5w-uandwe12-oss-projects.vercel.app",
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
