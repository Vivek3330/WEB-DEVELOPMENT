const express = require('express');
const cors = require('cors');
const path = require('path');
const fetch = require('node-fetch'); // You might need to install: npm install node-fetch@2

const app = express();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Serve static files (HTML, CSS, JS)
app.use(express.static(__dirname));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Search API endpoint using iTunes Search API
app.get('/api/search', async (req, res) => {
    try {
        const query = req.query.q;
        
        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }

        // iTunes Search API endpoint
        const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=50`;
        
        console.log('Searching iTunes API for:', query);
        
        const response = await fetch(itunesUrl);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(`iTunes API responded with status: ${response.status}`);
        }
        
        // Filter and format results
        const filteredResults = data.results
            .filter(item => item.previewUrl) // Only include songs with preview
            .map(item => ({
                trackName: item.trackName,
                artistName: item.artistName,
                collectionName: item.collectionName,
                previewUrl: item.previewUrl,
                artworkUrl60: item.artworkUrl60,
                artworkUrl100: item.artworkUrl100,
                trackTimeMillis: item.trackTimeMillis,
                releaseDate: item.releaseDate,
                genre: item.primaryGenreName
            }));

        res.json({
            resultCount: filteredResults.length,
            results: filteredResults
        });
        
    } catch (error) {
        console.error('Search API error:', error.message);
        res.status(500).json({ 
            error: 'Failed to search for songs',
            message: error.message 
        });
    }
});


// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'Music Search API'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Something went wrong!',
        message: err.message 
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`serving static files from: ${__dirname}`);
    console.log(`Search API available at: http://localhost:${PORT}/api/search?q=your-search-term`);
    console.log(`Health check available at: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nReceived SIGINT. Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\nReceived SIGTERM. Shutting down gracefully...');
    process.exit(0);
});
