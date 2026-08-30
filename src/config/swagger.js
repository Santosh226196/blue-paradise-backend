import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Blue Paradise Water Club API",
      version: "1.0.0",
      description: "MongoDB REST API for the Blue Paradise Water Club web application.",
    },
    servers: [
      { url: "/api", description: "API base" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./src/routes/*.js", "./src/controllers/*.js", "./src/app.js"],
};

export const swaggerSpec = swaggerJsdoc(options);
