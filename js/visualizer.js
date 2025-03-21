// visualizer.js
(function() {
    // Enum for visualizer types (kept all for future extensibility)
    const VisualizerType = {
        CIRCLE: 'circle'
    };
    
    // State variables
    let audioContext = null;
    let analyser = null;
    let dataArray = null;
    let audioPlayer = null;
    let visualizerType = VisualizerType.CIRCLE;
    
    // Initialize the visualizer
    function initVisualizer(player, context) {
        audioPlayer = player;
        
        if (!audioContext) {
            audioContext = context || new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 1024;
            const bufferLength = analyser.frequencyBinCount;
            dataArray = new Uint8Array(bufferLength);
            
            // Connect audio source to analyser if not already connected
            const source = audioContext.createMediaElementSource(audioPlayer);
            source.connect(analyser);
            analyser.connect(audioContext.destination);
            
            // Create visualizer elements
            createVisualizerElements();
            
            // Start the visualizer
            drawVisualizer();
        }
    }
    
    // Create visualizer elements
    function createVisualizerElements() {
        // Keeping switch structure for extensibility
        switch (visualizerType) {
            case VisualizerType.CIRCLE:
                createCanvasVisualizer();
                break;
            // NOTE: To add more visualizer types, add additional cases here
            default:
                createCanvasVisualizer(); // Fallback to circle
        }
    }
    
    // Create canvas for visualizers that need it
    function createCanvasVisualizer() {
        if (!document.getElementById('visualizer-canvas')) {
            const visualizerContainer = document.querySelector('.visualizer-container');
            const canvas = document.createElement('canvas');
            canvas.id = 'visualizer-canvas';
            visualizerContainer.appendChild(canvas);
            
            // Make canvas responsive
            window.addEventListener('resize', () => {
                resizeCanvas();
            });
            
            resizeCanvas();
        }
    }
    
    // Resize canvas to match window size
    function resizeCanvas() {
        const canvas = document.getElementById('visualizer-canvas');
        if (canvas) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
    }
    
    // Main drawing function
    function drawVisualizer() {
        if (!analyser) return;
        
        requestAnimationFrame(drawVisualizer);
        
        // Get frequency data
        analyser.getByteFrequencyData(dataArray);
        
        // Keeping switch structure for extensibility
        switch (visualizerType) {
            case VisualizerType.CIRCLE:
                drawCircleVisualizer();
                break;
            default:
                drawCircleVisualizer();
        }
    }
    
    // Draw the circle visualizer
    function drawCircleVisualizer() {
        const canvas = document.getElementById('visualizer-canvas');
        if (!canvas) {
            createCanvasVisualizer();
            return;
        }
        
        const canvasCtx = canvas.getContext('2d');
        
        // Make sure canvas dimensions match its display size
        if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
            resizeCanvas();
        }
        
        // Clear canvas
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Set up for circular visualization
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // Calculate radius based on player size plus padding
        const playerSize = getPlayerSize();
        const padding = 50;
        const radius = (playerSize / 2) + padding;
        
        if (radius <= 0) return;
        
        // Add a subtle corona effect
        canvasCtx.beginPath();
        canvasCtx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        const gradient = canvasCtx.createRadialGradient(
            centerX, centerY, radius * 0.9,
            centerX, centerY, radius * 1.5
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        canvasCtx.fillStyle = gradient;
        canvasCtx.fill();
        
        // Draw frequency bins around circle
        const binCount = dataArray.length / 2;
        const angleIncrement = (2 * Math.PI) / binCount;
        
        // Get smoothed amplitude values
        const smoothedAmplitudes = smoothFrequencyAmplitudes(dataArray, binCount);
        
        // Draw the visualization using smoothed values
        for (let i = 0; i < binCount; i++) {
            const angle = (i * angleIncrement) - Math.PI/2;
            const amplitude = smoothedAmplitudes[i];
            
            const lineLength = amplitude * (radius / 10);
            
            const startX = centerX + (radius * Math.cos(angle));
            const startY = centerY + (radius * Math.sin(angle));
            
            const endX = centerX + ((radius + lineLength) * Math.cos(angle));
            const endY = centerY + ((radius + lineLength) * Math.sin(angle));
            
            canvasCtx.beginPath();
            canvasCtx.moveTo(startX, startY);
            canvasCtx.lineTo(endX, endY);
            canvasCtx.lineWidth = 3;
            
            canvasCtx.strokeStyle = `rgba(255, 255, 255, ${0.5 + amplitude * 0.5})`;
            canvasCtx.shadowBlur = 15;
            canvasCtx.shadowColor = 'rgba(255, 255, 255, 0.8)';
            
            canvasCtx.stroke();
        }
    }

    // Change the visualizer type
    function setVisualizerType(type) {
        // Validate type against enum
        const validTypes = Object.values(VisualizerType);
        if (!validTypes.includes(type)) {
            console.error(`Invalid visualizer type: ${type}. Valid types are: ${validTypes.join(', ')}`);
            return;
        }
        
        visualizerType = type;
        
        // Hide canvas visualizer
        const canvasVisualizer = document.getElementById('visualizer-canvas');
        if (canvasVisualizer) canvasVisualizer.style.display = 'none';
        
        // Keeping switch structure for extensibility
        switch (type) {
            case VisualizerType.CIRCLE:
                if (canvasVisualizer) {
                    canvasVisualizer.style.display = 'block';
                    resizeCanvas();
                } else {
                    createCanvasVisualizer();
                }
                break;
            // NOTE: To add more visualizer types, add additional cases here
            default:
                // Fallback to circle visualizer
                if (canvasVisualizer) {
                    canvasVisualizer.style.display = 'block';
                    resizeCanvas();
                } else {
                    createCanvasVisualizer();
                }
        }
    }
    
    // Get the size of the audio player element
    function getPlayerSize() {
        const player = document.querySelector('.player-container');
        if (!player) return 200; // Default fallback size
        
        const rect = player.getBoundingClientRect();
        return Math.max(rect.width, rect.height);
    }
    
    // Smooth out frequency amplitudes for visualization
    function smoothFrequencyAmplitudes(dataArray, binCount) {
        const smoothedAmplitudes = [];
        
        // First pass: collect raw amplitudes
        const rawAmplitudes = [];
        for (let i = 0; i < binCount; i++) {
            rawAmplitudes.push(dataArray[i] / 255);
        }
        
        // Find max amplitude for scaling
        const maxAmplitude = Math.max(...rawAmplitudes);
        
        // Second pass: apply frequency-based scaling and smoothing
        for (let i = 0; i < binCount; i++) {
            let amplitude = rawAmplitudes[i];
            
            // Apply frequency-dependent scaling (reduce bass, boost mids)
            const frequencyFactor = 1 - 0.5 * Math.exp(-i / (binCount * 0.1));
            amplitude = amplitude * frequencyFactor;
            
            // Normalize to ensure good visualization range
            amplitude = amplitude / (maxAmplitude * 0.7 || 1); // Avoid division by zero
            
            // Clamp to reasonable range
            amplitude = Math.min(amplitude, 1.0);
            
            // Add to result
            smoothedAmplitudes.push(amplitude);
        }
        
        return smoothedAmplitudes;
    }
    
    // Export public methods
    window.Visualizer = {
        init: initVisualizer,
        setType: setVisualizerType,
        types: VisualizerType // Expose enum for external use
    };
})();
