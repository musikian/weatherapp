const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const API_KEY = '9ec4a18095467cb1bab5b16043f23c2d'; 
const HISTORY_FILE = path.join(__dirname, 'search_history.json');

app.use(express.json());
app.use(express.static('public'));

const saveToHistory = (city) => {
    let history = [];
    if (fs.existsSync(HISTORY_FILE)) {
        const data = fs.readFileSync(HISTORY_FILE);
        history = JSON.parse(data);
    }
    // Keep only last 5 searches, avoid duplicates
    history = [city, ...history.filter(c => c !== city)].slice(0, 5);
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
};

app.get('/api/weather', async (req, res) => {
    const { city } = req.query;
    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`;
        const response = await axios.get(url);
        
        const data = response.data;
        const simplified = {
            name: data.name,
            country: data.sys.country,
            temp: Math.round(data.main.temp),
            feels_like: Math.round(data.main.feels_like),
            description: data.weather[0].description,
            icon: data.weather[0].icon,
            humidity: data.main.humidity,
            wind: data.wind.speed
        };

        saveToHistory(data.name);
        res.json(simplified);
    } catch (error) {
        res.status(404).json({ error: "City not found" });
    }
});

// Route to get history for the UI
app.get('/api/history', (req, res) => {
    if (fs.existsSync(HISTORY_FILE)) {
        res.json(JSON.parse(fs.readFileSync(HISTORY_FILE)));
    } else {
        res.json([]);
    }
});

app.listen(PORT, () => console.log(`🚀 Server: http://localhost:${PORT}`));