const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  swaggerDefinition: {
    info: {
      title: "Logan's Language API",
      version: '1.0.0',
      description: 
      'API for language analysis leveraging Azure AI Language.',
      contact: {
        "name": "GitHub Repo",
        "url": "https://github.com/dhasty1/Logan_Language_API"      },
    },
    host: '104.131.185.166:3000',
    basePath: '/'
  },
  apis: ['./app.js'],
};

const specs = swaggerJsdoc(options);

module.exports = specs;
