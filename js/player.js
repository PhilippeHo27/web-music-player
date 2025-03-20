document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const audioPlayer = document.getElementById('audio-player');
    const playButton = document.getElementById('play-button');
    const prevButton = document.getElementById('prev-button');
    const nextButton = document.getElementById('next-button');
    const muteButton = document.getElementById('mute-button');
    const volumeSlider = document.getElementById('volume-slider');
    const progressContainer = document.getElementById('progress-container');
    const progressBar = document.getElementById('progress-bar');
    const currentTimeDisplay = document.getElementById('current-time');
    const trackDurationDisplay = document.getElementById('track-duration');
    const playIcon = document.getElementById('play-icon');
    const pauseIcon = document.getElementById('pause-icon');

    let currentTrackIndex = 0;
    let previousVolume = 1.0;
    let audioContext = null;
    let analyser = null;
    let dataArray = null;
    let tracks = []

    // Load tracks from JSON file
    fetch('tracks.json')
    .then(response => response.json())
    .then(data => {
        tracks = data;
        if (tracks.length > 0) {
            // Initially load the first track after tracks are loaded
            loadTrack(currentTrackIndex);
        } else {
            console.log('No tracks found in tracks.json');
        }
    })
    .catch(error => {
        console.error('Error loading tracks:', error);
        // Fallback tracks if JSON fails to load
        tracks = [
            {
                title: "No tracks available",
                artist: "Please add MP3s to the audio folder",
                src: ""
            }
        ];
        document.querySelector('.track-title').textContent = tracks[0].title;
        document.querySelector('.track-artist').textContent = tracks[0].artist;
    });
    
    // Initialize audio context and visualizer
    function initAudio() {
        if (audioContext === null) {
            // Create audio context
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            const bufferLength = analyser.frequencyBinCount;
            dataArray = new Uint8Array(bufferLength);
            
            // Connect audio source to analyser
            const source = audioContext.createMediaElementSource(audioPlayer);
            source.connect(analyser);
            analyser.connect(audioContext.destination);
            
            // Start visualizer
            drawVisualizer();
        } else if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
    }
    
    // Functions
    function loadTrack(trackIndex) {
        if (tracks.length === 0) return; // Guard against empty tracks array
        
        const track = tracks[trackIndex];
        audioPlayer.src = track.src;
        document.querySelector('.track-title').textContent = track.title;
        document.querySelector('.track-artist').textContent = track.artist;
        
        // Reset progress and time displays
        progressBar.style.width = '0%';
        currentTimeDisplay.textContent = formatTime(0);
        
        // Set up the track duration once it's loaded
        audioPlayer.addEventListener('loadedmetadata', () => {
            trackDurationDisplay.textContent = formatTime(audioPlayer.duration);
        });
    }
    
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    }
    
    function togglePlay() {
        if (audioPlayer.paused) {
            audioPlayer.play();
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'block';
            initAudio(); // Initialize audio context on play
        } else {
            audioPlayer.pause();
            playIcon.style.display = 'block';
            pauseIcon.style.display = 'none';
        }
    }
    
    function playNextTrack() {
        currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
        loadTrack(currentTrackIndex);
        audioPlayer.play();
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'block';
    }
    
    function playPrevTrack() {
        currentTrackIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
        loadTrack(currentTrackIndex);
        audioPlayer.play();
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'block';
    }
    
    function toggleMute() {
        if (audioPlayer.volume === 0) {
            audioPlayer.volume = previousVolume;
            volumeSlider.value = previousVolume;
        } else {
            previousVolume = audioPlayer.volume;
            audioPlayer.volume = 0;
            volumeSlider.value = 0;
        }
    }
    
    function updateProgress() {
        const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
        progressBar.style.width = `${progress}%`;
        currentTimeDisplay.textContent = formatTime(audioPlayer.currentTime);
    }
    
    function setProgress(e) {
        const width = this.clientWidth;
        const clickX = e.offsetX;
        const duration = audioPlayer.duration;
        audioPlayer.currentTime = (clickX / width) * duration;
    }
    
    // ===== VISUALIZER CODE =====
    function drawVisualizer() {
        if (!analyser) return;
        
        requestAnimationFrame(drawVisualizer);
        
        // Get canvas and context
        const canvas = document.getElementById('visualizer-canvas');
        const canvasCtx = canvas.getContext('2d');
        
        // Make sure canvas dimensions match its display size
        const rect = canvas.getBoundingClientRect();
        if (canvas.width !== rect.width || canvas.height !== rect.height) {
            canvas.width = rect.width;
            canvas.height = rect.height;
        }
        
        // Get frequency data
        analyser.getByteFrequencyData(dataArray);
        
        // Clear canvas
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Set up for circular visualization
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 10;
        
        // Draw base circle
        canvasCtx.beginPath();
        canvasCtx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        canvasCtx.fillStyle = '#333';
        canvasCtx.fill();
        
        // Draw frequency bins around circle
        const binCount = dataArray.length / 2; // Use half the bins for better visual
        const angleIncrement = (2 * Math.PI) / binCount;
        
        for (let i = 0; i < binCount; i++) {
            const frequency = dataArray[i];
            const amplitude = frequency / 255; // Normalize to 0-1
            
            // Calculate start and end points for lines
            const angle = i * angleIncrement;
            const lineLength = amplitude * (radius / 2); // Scale by radius
            
            const startX = centerX + (radius * Math.cos(angle));
            const startY = centerY + (radius * Math.sin(angle));
            
            const endX = centerX + ((radius + lineLength) * Math.cos(angle));
            const endY = centerY + ((radius + lineLength) * Math.sin(angle));
            
            // Draw line for this frequency bin
            canvasCtx.beginPath();
            canvasCtx.moveTo(startX, startY);
            canvasCtx.lineTo(endX, endY);
            canvasCtx.lineWidth = 2;
            
            // Color based on frequency
            const hue = (i / binCount) * 360;
            canvasCtx.strokeStyle = `hsl(${hue}, 100%, ${50 + amplitude * 50}%)`;
            canvasCtx.stroke();
        }
    }
    // ===== END VISUALIZER CODE =====
    
    // Event Listeners
    playButton.addEventListener('click', togglePlay);
    prevButton.addEventListener('click', playPrevTrack);
    nextButton.addEventListener('click', playNextTrack);
    muteButton.addEventListener('click', toggleMute);
    
    volumeSlider.addEventListener('input', () => {
        audioPlayer.volume = volumeSlider.value;
    });
    
    audioPlayer.addEventListener('timeupdate', updateProgress);
    progressContainer.addEventListener('click', setProgress);
    
    audioPlayer.addEventListener('ended', playNextTrack);
});
