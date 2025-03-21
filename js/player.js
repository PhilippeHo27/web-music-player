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
    const volumeHighIcon = document.getElementById('volume-high-icon');
    const volumeMuteIcon = document.getElementById('volume-mute-icon');
    //const albumArt = document.getElementById('album-art');

    let currentTrackIndex = 0;
    let previousVolume = 1.0;
    let audioContext = null;
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
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Initialize the visualizer with the audio player and context
            Visualizer.init(audioPlayer, audioContext);
        } else if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
    }

    // Functions
    function loadTrack(trackIndex) {
        if (tracks.length === 0) return;
        
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
            volumeHighIcon.style.display = 'block';
            volumeMuteIcon.style.display = 'none';
        } else {
            previousVolume = audioPlayer.volume;
            audioPlayer.volume = 0;
            volumeSlider.value = 0;
            volumeHighIcon.style.display = 'none';
            volumeMuteIcon.style.display = 'block';
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

    playButton.addEventListener('click', togglePlay);
    prevButton.addEventListener('click', playPrevTrack);
    nextButton.addEventListener('click', playNextTrack);
    muteButton.addEventListener('click', toggleMute);
    
    volumeSlider.addEventListener('input', () => {
        audioPlayer.volume = volumeSlider.value;
        
        // Update volume icons based on current volume
        const volumeHighIcon = document.getElementById('volume-high-icon');
        const volumeMuteIcon = document.getElementById('volume-mute-icon');
        
        if (audioPlayer.volume === 0) {
            volumeHighIcon.style.display = 'none';
            volumeMuteIcon.style.display = 'block';
        } else {
            volumeHighIcon.style.display = 'block';
            volumeMuteIcon.style.display = 'none';
        }
    });
    
    audioPlayer.addEventListener('timeupdate', updateProgress);
    progressContainer.addEventListener('click', setProgress);
    
    audioPlayer.addEventListener('ended', playNextTrack);
    initAudio();
});