const express = require('express');
const router = express.Router();
const morgan = require('morgan');
const cors = require('cors');
const fs = require('fs');
const port = 3030;

// Function to get the file path
function getFilePath(filename) {
    return __dirname + '/' + filename;
}

// Function to read the JSON file
function readJsonFile(filename) {
    try {
        const filePath = getFilePath(filename);
        if (!fs.existsSync(filePath)) {
            return { usage: [] }; // Return an empty structure if the file doesn't exist
        }
        const jsonData = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(jsonData);
    } catch (error) {
        console.error('Error reading the JSON file:', error.message);
        return null;
    }
}

// Function to save data to the JSON file
function saveJsonFile(filename, data) {
    fs.writeFileSync(getFilePath(filename), JSON.stringify(data, null, 2), 'utf8');
}

// Assuming this function is called after each update to usage.json or on a regular basis
function updateStatistics() {
    const usageData = readJsonFile('usage.json');
    if (!usageData || !usageData.usage) return;

    const monthlyTotals = {};
    usageData.usage.forEach(entry => {
        const month = entry.date.substring(0, 7); // Extract YYYY-MM format
        monthlyTotals[month] = (monthlyTotals[month] || 0) + entry.dataInGb;
    });

    const months = Object.keys(monthlyTotals);
    if (months.length === 0) return;

    // Calculate statistics
    let [highestMonth, lowestMonth] = [months[0], months[0]];
    let totalUsage = 0;

    months.forEach(month => {
        totalUsage += monthlyTotals[month];
        if (monthlyTotals[month] > monthlyTotals[highestMonth]) highestMonth = month;
        if (monthlyTotals[month] < monthlyTotals[lowestMonth]) lowestMonth = month;
    });

    const averageUsage = Math.round((totalUsage / months.length) * 100) / 100

    // Prepare statistics object
    const statistics = {
        highestMonth: { month: highestMonth, usage: monthlyTotals[highestMonth] },
        lowestMonth: { month: lowestMonth, usage: monthlyTotals[lowestMonth] },
        averageUsage: averageUsage
    };

    // Save to statistics.json
    saveJsonFile('statistics.json', statistics);
}

router.use(cors());
router.use(express.json());
morgan.token('body', (req) => JSON.stringify(req.body));

// Use morgan with your custom format including the method, URL, status, and request body
router.use(morgan(':method :url :status :response-time ms - Body: :body'));

// Endpoint to add a new data usage entry
router.post('/add-usage', (req, res) => {
  let { dataInGb } = req.body; // Extract data usage from request body

  // Attempt to convert dataInGb to a number if it is a string
  if (typeof dataInGb === 'string') {
      dataInGb = parseFloat(dataInGb);
  }

  // Check if dataInGb is a number after potential conversion
  if (isNaN(dataInGb)) {
      return res.status(400).send('Invalid data format, please send a number representing the data usage in GB.');
  }

    const usageData = readJsonFile('usage.json');
    const newUsageEntry = {
        dataInGb,
        date: new Date().toISOString() // Store the current date and time
    };

    // Add the new entry to the usage data
    usageData.usage.push(newUsageEntry);

    // Save the updated usage data
    saveJsonFile('usage.json', usageData);
    updateStatistics()
  
    res.json(newUsageEntry);
});

// Endpoint to get all data usage entries
router.get('/get-usage', (req, res) => {
    const usageData = readJsonFile('usage.json');
    if (!usageData) {
        return res.status(500).send('Error retrieving data usage information.');
    }
    res.json(usageData);
});

// Endpoint to get stats
router.get('/get-stats', (req, res) => {
    const usageData = readJsonFile('statistics.json');
    if (!usageData) {
        return res.status(500).send('Error retrieving statistics.');
    }
    res.json(usageData);
});

module.exports = router;
