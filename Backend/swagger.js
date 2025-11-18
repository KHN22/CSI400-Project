const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'CSI400 Project API',
      version: '1.0.0',
      description: 'Backend API for cinema booking app',
    },
    servers: [
      // Prefer an explicit SWAGGER_SERVER_URL (for Render or other deployments).
      // Fallback to BACKEND_URL or localhost:4000 for local dev.
      { url: process.env.SWAGGER_SERVER_URL || process.env.BACKEND_URL || 'http://localhost:4000', description: 'API server' }
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token'
        },
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        UserRegister: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            username: { type: 'string' },
            email: { type: 'string', format: 'email' },
            password: { type: 'string' }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: { error: { type: 'string' } }
        }
      }
    }
  },
  apis: ['./routes/*.js', './models/*.js']
};

const swaggerSpec = swaggerJsDoc(options);

module.exports = { swaggerUi, swaggerSpec };