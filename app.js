// List requirements
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const specs = require('./swagger');
const { body, validationResult } = require('express-validator');
const { TextAnalyticsClient, AzureKeyCredential } = require('@azure/ai-text-analytics');
const { TextAnalysisClient } = require("@azure/ai-language-text");
const TextDocumentInput = require('@azure/ai-text-analytics')
require('dotenv').config();

// Initialize express app
const app = express();
const port = 3000;

// Azure AI Language config values
const key = process.env.API_KEY;
const endpoint = process.env.API_ENDPOINT;

// Serve Swagger UI
app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs, { explorer: true }));

// Uae cors and express.json()
app.use(cors());
app.use(express.json());

// Define validation and sanitation middleware for POST (sentiment and namedEntity)
const postValidation = [
  body().isArray().withMessage('Data should be an array of Document records'),
  body().custom((value) => {
    if (value.length === 0) {
      throw new Error('At least one record is required');
    }
    return true;
  }),
  body().custom((value) => {
    // Check that each record has the required fields
    const validFields = ['id', 'text'];
    for (const record of value) {
      for (const field of validFields) {
        if (!(field in record)) {
          throw new Error(`The ${field} is missing in one or more of your records`);
        }
      }
    }
    return true;
  }),
  body().custom((value) => {
    // Validate and sanitize fields
    for (const record of value) {
      // Example validation: id should be a non-empty string
      if (typeof record.id !== 'string' || record.id.trim() === '') {
        throw new Error('id should be a non-empty string');
      }
      if (typeof record.text !== 'string' || record.text.trim() === '') {
        throw new Error('text should be a non-empty string');
      }
    }
    return true;
  }),
];

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next(); // Proceed to the next middleware or route handler
};

// Define routes
/**
 * @swagger
 * /analyzeSentiment:
 *   post:
 *     summary: Analyze the sentiment of submitted text. Is it positive, negative, neutral or mixed?
 *     tags: [Document]
 *     parameters:
 *       - in: body
 *         name: documents
 *         required: true
 *         description: |
 *           Documents to be sent for sentiment analysis.
 *           Results will return a sentiment (positive, negative, neutral, or mixed) and option mining.
 *           Please be sure to adhere to the 'Example Value'.
 *           Key/value pairs should be in order. Passing a language is optional.
 *         schema:
 *           type: array
 *           items:
 *             type: object
 *             required:
 *               - id
 *               - text
 *             properties:
 *               id:
 *                 type: string
 *               text:
 *                 type: string
 *               language:
 *                 type: string
 *     responses:
 *       200:
 *         description: Document processed successfully.
 *         schema:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               text:
 *                 type: string
 *               overallSentiment:
 *                 type: string
 *               confidenceScores:
 *                 type: object
 *                 properties:
 *                   positive:
 *                     type: number
 *                   neutral:
 *                     type: number
 *                   negative:
 *                     type: number
 *       500:
 *         description: Internal Server Error
 *       404:
 *         description: Not Found
 */

app.post('/analyzeSentiment', [postValidation, handleValidationErrors], async (req, res) => {
  const documents = req.body;

  try {
    const client = new TextAnalyticsClient(endpoint, new AzureKeyCredential(key));
    
    // Call Azure AI Language service
    const results = await client.analyzeSentiment(documents, {
      includeOpinionMining: true,
    });

    //Format output
    const sentimentResults = results.map((result, i) => {
      const document = documents[i];

      const formattedResult = {
        id: document.id,
        text: document.text,
        overallSentiment: result.sentiment,
        confidenceScores: result.confidenceScores,
        sentences: result.sentences.map(sentence => ({
          sentenceSentiment: sentence.sentiment,
          confidenceScores: sentence.confidenceScores,
          minedOpinions: sentence.opinions.map(opinion => ({
            targetText: opinion.target.text,
            targetSentiment: opinion.target.sentiment,
            targetConfidenceScores: opinion.target.confidenceScores,
            targetAssessments: opinion.assessments.map(assessment => ({
              text: assessment.text,
              sentiment: assessment.sentiment,
            })),
          })),
        })),
      };
      return formattedResult;
    });
    res.json(sentimentResults);
  } catch (error) {
    // Handle Azure AI Language service errors
    if (error.statusCode === 400){
      // Validation error from the Azure AI service
      console.error("Validation error: ", error);
      res.status(400).json({ error: "Bad Request (Validation Error)" });
    } else {
      console.error("Error processing sentiment analysis:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
});

/**
 * @swagger
 * /recognizeNamedEntity:
 *   post:
 *     summary: Recognize the named entities in submitted text. Is it a location? Maybe a building?
 *     tags: [Document]
 *     parameters:
 *       - in: body
 *         name: documents
 *         required: true
 *         description: |
 *           Documents to be sent for named entity recognition.
 *           Results will return recognized named entities along with confidence scores.
 *           Please be sure to adhere to the 'Example Value'.
 *           Key/value pairs should be in order. Passing a language is optional.
 *         schema:
 *           type: array
 *           items:
 *             type: object
 *             required:
 *               - id
 *               - text
 *             properties:
 *               id:
 *                 type: string
 *               text:
 *                 type: string
 *               language:
 *                 type: string
 *     responses:
 *       200:
 *         description: Document processed successfully.
 *         schema:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               text:
 *                 type: string
 *               entities:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     text:
 *                       type: string
 *                     category:
 *                       type: string
 *                     subCategory:
 *                       type: string
 *                     confidenceScore:
 *                       type: number 
 *       500:
 *         description: Internal Server Error
 *       404:
 *         description: Not Found
 */

app.post('/recognizeNamedEntity', [postValidation, handleValidationErrors], async (req, res) => {
  const documents = req.body;

  try {
    const client = new TextAnalyticsClient(endpoint, new AzureKeyCredential(key));
    
    // Call Azure AI Language service
    const results = await client.recognizeEntities(documents);

    //Format output
    const entityResults = results.map((result, i) => {
      const document = documents[i];

      const formattedResult = {
        id: document.id,
        text: document.text,
        entities: result.entities.map(entity => ({
          text: entity.text,
          category: entity.category,
          subCategory: entity.subCategory,
          confidenceScore: entity.confidenceScore
        }))
      };
      return formattedResult;
    });
    res.json(entityResults);
  } catch (error) {
    // Handle Azure AI Language service errors
    if (error.statusCode === 400){
      // Validation error from the Azure AI service
      console.error("Validation error: ", error);
      res.status(400).json({ error: "Bad Request (Validation Error)" });
    } else {
      console.error("Error processing sentiment analysis:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
});

/**
 * @swagger
 * /detectLanguage:
 *   post:
 *     summary: Detect the language of submitted text. 
 *     tags: [Document]
 *     parameters:
 *       - in: body
 *         name: stringsForDetection
 *         required: true
 *         description: |
 *           Documents to be sent for language detection.
 *           Results will return detected languages along with their iso6391 name and the service's confidence score.
 *           Please be sure to adhere to the 'Example Value'.
 *         schema:
 *           type: array
 *           items:
 *             type: object
 *             required:
 *               - id
 *               - text
 *             properties:
 *               id:
 *                 type: string
 *               text:
 *                 type: string
 *     responses:
 *       200:
 *         description: Document processed successfully.
 *         schema:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               text:
 *                 type: string
 *               primaryLanguage:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   iso6391Name:
 *                     type: string
 *                   confidenceScore:
 *                     type: number
 *       500:
 *         description: Internal Server Error
 *       404:
 *         description: Not Found
 */

app.post('/detectLanguage', [postValidation, handleValidationErrors], async (req, res) => {
  const documents = req.body;

  try {
    const client = new TextAnalysisClient(endpoint, new AzureKeyCredential(key));
    
    // Call Azure AI Language service
    const results = await client.analyze("LanguageDetection", documents);

    //Format output
    const languageResults = results.map((result, i) => {
      const document = documents[i];

      const formattedResult = {
        id: document.id,
        text: document.text,
        primaryLanguage: result.primaryLanguage
      };
      return formattedResult;
    });
    res.json(languageResults);
  } catch (error) {
    // Handle Azure AI Language service errors
    if (error.statusCode === 400){
      // Validation error from the Azure AI service
      console.error("Validation error: ", error);
      res.status(400).json({ error: "Bad Request (Validation Error)" });
    } else {
      console.error("Error processing sentiment analysis:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
