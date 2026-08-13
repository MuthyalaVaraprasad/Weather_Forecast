import express from 'express';
import { getWeather, getSearch } from '../controllers/weatherController.js';

const router = express.Router();

// Define router endpoints
router.get('/weather', getWeather);
router.get('/search', getSearch);

export default router;
