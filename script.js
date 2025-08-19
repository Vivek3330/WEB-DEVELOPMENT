let songs = [];
let songIndex = 0;
let audioElement = document.getElementById('audioElement');
let masterPlay = document.getElementById('masterPlay');
let myProgressBar = document.getElementById('myProgressBar');
let gif = document.getElementById('gif');
let masterSongName = document.getElementById('masterSongName');
let songItems = [];

const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const loading = document.getElementById('loading');
const songItemContainer = document.getElementById('songItemContainer');
const listTitle = document.getElementById('listTitle');
const nowPlayingBanner = document.getElementById('nowPlayingBanner');
const bannerImg = document.getElementById('bannerImg');
const bannerSongName = document.getElementById('bannerSongName');
const bannerArtist = document.getElementById('bannerArtist');

document.addEventListener('DOMContentLoaded', function() {
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    masterPlay.addEventListener('click', () => {
        if (audioElement.paused || audioElement.currentTime <= 0) {
            if (audioElement.src) {
                audioElement.play();
                masterPlay.classList.remove('fa-play-circle');
                masterPlay.classList.add('fa-pause-circle');
                gif.style.display = 'inline';
            }
        } else {
            audioElement.pause();
            masterPlay.classList.remove('fa-pause-circle');
            masterPlay.classList.add('fa-play-circle');
            gif.style.display = 'none';
        }
    });

    audioElement.addEventListener('timeupdate', () => {
        const progress = parseInt((audioElement.currentTime / audioElement.duration) * 100);
        myProgressBar.value = progress;
    });

    myProgressBar.addEventListener('change', () => {
        audioElement.currentTime = (myProgressBar.value * audioElement.duration) / 100;
    });

    document.getElementById('previous').addEventListener('click', () => {
        if (songIndex <= 0) {
            songIndex = songs.length - 1;
        } else {
            songIndex -= 1;
        }
        playSong(songIndex);
    });

    document.getElementById('next').addEventListener('click', () => {
        if (songIndex >= songs.length - 1) {
            songIndex = 0;
        } else {
            songIndex += 1;
        }
        playSong(songIndex);
    });

    // Auto play next song when current song ends
    audioElement.addEventListener('ended', () => {
        if (songIndex >= songs.length - 1) {
            songIndex = 0;
        } else {
            songIndex += 1;
        }
        playSong(songIndex);
    });
});

async function performSearch() {
    const query = searchInput.value.trim();
    if (!query) {
        alert('Please enter a search term');
        return;
    }

    showLoading(true);
    
    try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
            displaySearchResults(data.results);
            listTitle.textContent = `Search Results for "${query}"`;
        } else {
            displayNoResults();
        }
    } catch (error) {
        console.error('Search error:', error);
        displayError('Failed to search. Please try again.');
    } finally {
        showLoading(false);
    }
}

// Display search results
function displaySearchResults(results) {
    songs = results.map((song, index) => ({
        id: index,
        songName: song.trackName || song.collectionName,
        artist: song.artistName,
        filePath: song.previewUrl,
        coverPath: song.artworkUrl100 || song.artworkUrl60,
        duration: song.trackTimeMillis ? Math.floor(song.trackTimeMillis / 1000) : 30
    }));

    songItemContainer.innerHTML = '';
    
    songs.forEach((song, index) => {
        const songItem = createSongItem(song, index);
        songItemContainer.appendChild(songItem);
    });

    // Add click listeners to play buttons
    document.querySelectorAll('.songItemPlay').forEach((element, index) => {
        element.addEventListener('click', (e) => {
            e.stopPropagation();
            playSong(index);
        });
    });

    // Add click listeners to song items
    document.querySelectorAll('.songItem').forEach((element, index) => {
        element.addEventListener('click', () => {
            playSong(index);
        });
    });
}

// Create song item HTML
function createSongItem(song, index) {
    const songItem = document.createElement('div');
    songItem.className = 'songItem';
    
    const duration = formatTime(song.duration);
    
    songItem.innerHTML = `
        <img src="${song.coverPath}" alt="Album Art" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjMzMzIi8+CjxwYXRoIGQ9Ik0zMCAyMEM0NC4zIDIwIDU2IDMxLjcgNTYgNDZTNDQuMyA3MiAzMCA3MlM0IDYwLjMgNCA0NlMxNS43IDIwIDMwIDIwWk0zMCA2NEMzOS45IDY0IDQ4IDU1LjkgNDggNDZTMzkuOSAyOCAzMCAyOFMyMCAzNi4xIDIwIDQ2UzI4LjEgNjQgMzAgNjRaIiBmaWxsPSIjNjY2Ii8+CjxwYXRoIGQ9Ik0yNiAzOEwyNiA1NEwzOCA0NkwyNiAzOFoiIGZpbGw9IiM2NjYiLz4KPC9zdmc+'">
        <div class="song-details">
            <div class="songName">${song.songName}</div>
            <div class="artistName">${song.artist}</div>
        </div>
        <span class="songlistplay">
            <span class="timestamp">${duration}</span>
            <i class="far songItemPlay fa-play-circle" data-index="${index}"></i>
        </span>
    `;
    
    return songItem;
}

// Play song function
function playSong(index) {
    if (index < 0 || index >= songs.length) return;
    
    songIndex = index;
    const song = songs[index];
    
    // Update audio source
    audioElement.src = song.filePath;
    audioElement.load();
    
    // Update UI
    masterSongName.textContent = `${song.songName} - ${song.artist}`;
    
    // Update all play buttons
    document.querySelectorAll('.songItemPlay').forEach((element, i) => {
        element.classList.remove('fa-pause-circle');
        element.classList.add('fa-play-circle');
    });
    
    // Update current song play button
    const currentButton = document.querySelector(`[data-index="${index}"]`);
    if (currentButton) {
        currentButton.classList.remove('fa-play-circle');
        currentButton.classList.add('fa-pause-circle');
    }
    
    // Update master play button
    masterPlay.classList.remove('fa-play-circle');
    masterPlay.classList.add('fa-pause-circle');
    
    // Update banner
    updateNowPlayingBanner(song);
    
    // Play the song
    audioElement.play().catch(error => {
        console.error('Error playing audio:', error);
        alert('Failed to play this song. It might not be available.');
    });
    
    gif.style.display = 'inline';
    
    // Reset progress bar
    myProgressBar.value = 0;
}

// Update now playing banner
function updateNowPlayingBanner(song) {
    bannerImg.src = song.coverPath;
    bannerSongName.textContent = song.songName;
    bannerArtist.textContent = song.artist;
    nowPlayingBanner.style.display = 'flex';
}

// Display no results
function displayNoResults() {
    songItemContainer.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #b3b3b3;">
            <i class="fas fa-music" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.3;"></i>
            <p style="font-size: 1.1rem;">No songs found. Try a different search term.</p>
        </div>
    `;
    listTitle.textContent = 'No Results';
}

// Display error
function displayError(message) {
    songItemContainer.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #ff4444;">
            <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 20px;"></i>
            <p style="font-size: 1.1rem;">${message}</p>
        </div>
    `;
    listTitle.textContent = 'Error';
}

// Show/hide loading
function showLoading(show) {
    loading.style.display = show ? 'block' : 'none';
    if (show) {
        songItemContainer.innerHTML = '';
    }
}

// Format time helper
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Audio event listeners for UI updates
audioElement.addEventListener('play', () => {
    masterPlay.classList.remove('fa-play-circle');
    masterPlay.classList.add('fa-pause-circle');
    gif.style.display = 'inline';
});

audioElement.addEventListener('pause', () => {
    masterPlay.classList.remove('fa-pause-circle');
    masterPlay.classList.add('fa-play-circle');
    gif.style.display = 'none';
    
    // Update current song button
    const currentButton = document.querySelector(`[data-index="${songIndex}"]`);
    if (currentButton) {
        currentButton.classList.remove('fa-pause-circle');
        currentButton.classList.add('fa-play-circle');
    }
});

// Error handling for audio
audioElement.addEventListener('error', (e) => {
    console.error('Audio error:', e);
    alert('Failed to load audio. The preview might not be available.');
    
    // Reset play button
    masterPlay.classList.remove('fa-pause-circle');
    masterPlay.classList.add('fa-play-circle');
    gif.style.display = 'none';
});
