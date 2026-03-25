require("dotenv").config();
const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

const app = express();

/* ================================
   CORS CONFIG (FIXED FOR VERCEL)
================================ */

const allowedOrigins = [
  "http://localhost:5173",
  "https://myuandwe.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

// ✅ Handle preflight requests
app.options("*", cors());

/* ================================
   EXTRA HEADERS (VERY IMPORTANT)
================================ */

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://myuandwe.vercel.app");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

/* ================================
   BODY PARSER
================================ */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ================================
   ROUTES
================================ */

app.use("/api/login", require("./api/login"));
app.use("/api/demand", require("./api/demand"));
app.use("/api/candidates", require("./api/candidates"));
app.use("/api/skills", require("./api/skills"));
app.use("/api/skillsmatch", require("./api/skillsmatch"));
app.use("/api/shortcandidates", require("./api/shortcandidates"));
app.use("/api/users", require("./api/users"));
app.use("/api/selected-candidates", require("./api/selectedCandidates"));
app.use("/api/zone", require("./api/zone"));

/* ================================
   SWAGGER CONFIG
================================ */

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "HR Backend API",
      version: "1.0.0",
      description: "API documentation"
    },
    servers: [
      {
        url: "https://myuandwe-bg.vercel.app" // ✅ FIXED
      }
    ]
  },
  apis: ["./api/*.js"]
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/* ================================
   TEST ROUTE
================================ */

app.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    time: new Date()
  });
});

/* ================================
   ERROR HANDLER
================================ */

app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
});

module.exports = app;
