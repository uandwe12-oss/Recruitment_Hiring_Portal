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

// 🔹 Routes
const loginRoute = require("./api/login");
const demandRoute = require("./api/demand");
const usersRoute = require("./api/users");
const candidatesRoute = require("./api/candidates"); // 👈 ADD THIS LINE

// 🔹 Swagger configuration
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
        url: "http://localhost:5000"
      }
    ]
  },
  apis: ["./api/*.js"] // 👈 reads JSDoc from api folder
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// 🔹 Swagger route
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 🔹 API routes
app.use("/api/login", loginRoute);
app.use("/api/demand", demandRoute);
app.use("/api/users", usersRoute);
app.use("/api/candidates", candidatesRoute); // 👈 ADD THIS LINE

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
      users: "/api/users",
      swagger: "/api-docs"
    }
  });
});

// 🔹 Health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Server is healthy",
    timestamp: new Date().toISOString()
  });
});

// 🔹 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl
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
//   console.log(`👤 Users API: http://localhost:${PORT}/api/users`);
//   console.log(`🔐 Login API: http://localhost:${PORT}/api/login`);
//   console.log("=".repeat(50) + "\n");
// });
