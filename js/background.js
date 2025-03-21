class Pixel {
    constructor(canvas, context, x, y, color, speed, delay) {
      this.width = canvas.width;
      this.height = canvas.height;
      this.ctx = context;
      this.x = x;
      this.y = y;
      this.color = color;
      this.speed = this.getRandomValue(0.1, 0.9) * speed;
      this.size = 0;
      this.sizeStep = Math.random() * 0.4;
      this.minSize = 0.3;
      this.maxSizeInteger = 2;
      this.maxSize = this.getRandomValue(this.minSize, this.maxSizeInteger);
      this.delay = delay;
      this.counter = 0;
      this.counterStep = Math.random() * 4 + (this.width + this.height) * 0.01;
      this.isIdle = false;
      this.isReverse = false;
      this.isShimmer = true; // Always shimmer
    }
  
    getRandomValue(min, max) {
      return Math.random() * (max - min) + min;
    }
  
    draw() {
      const centerOffset = this.maxSizeInteger * 0.5 - this.size * 0.5;
  
      this.ctx.fillStyle = this.color;
      this.ctx.fillRect(
        this.x + centerOffset,
        this.y + centerOffset,
        this.size,
        this.size
      );
    }
  
    update() {
      if (this.counter <= this.delay) {
        this.counter += this.counterStep;
        return;
      }
  
      if (this.size <= this.minSize) {
        this.size = this.minSize;
      }
  
      if (this.size >= this.maxSize) {
        this.isReverse = true;
      } else if (this.size <= this.minSize) {
        this.isReverse = false;
      }
  
      if (this.isReverse) {
        this.size -= this.speed;
      } else {
        this.size += this.speed;
      }
  
      this.draw();
    }
  }
  
  class BackgroundAnimation {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      if (!this.canvas) {
        console.error('Canvas element not found');
        return;
      }
      
      this.ctx = this.canvas.getContext('2d');
      this.pixels = [];
      this.colors = [
        '#191A1A',  // Dark bg
        '#222324',  // Slightly lighter bg
        '#1DB954',  // Spotify green
        '#1ed760',  // Lighter green
        '#121212',  // Very dark
        '#333333',  // Medium dark
        '#535353',  // Light gray
        '#2EE36F',  // Brighter variant of Spotify green
        '#1AA34A',  // Darker variant of Spotify green
      ];
      
      this.gap = 10; // Space between pixels
      this.speed = 0.05; // Animation speed
      this.timeInterval = 1000 / 30; // 30fps
      this.timePrevious = performance.now();
      this.animation = null;
      
      this.init();
      this.animate();
      
      // Handle resize
      window.addEventListener('resize', () => this.init());
    }
    
    init() {
      // Set canvas to fill the window
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      
      this.pixels = [];
      this.createPixels();
    }
    
    getDistanceToCanvasCenter(x, y) {
      const dx = x - this.canvas.width / 2;
      const dy = y - this.canvas.height / 2;
      return Math.sqrt(dx * dx + dy * dy);
    }
    
    createPixels() {
      for (let x = 0; x < this.canvas.width; x += this.gap) {
        for (let y = 0; y < this.canvas.height; y += this.gap) {
          const color = this.colors[Math.floor(Math.random() * this.colors.length)];
          const delay = this.getDistanceToCanvasCenter(x, y);
          
          this.pixels.push(new Pixel(this.canvas, this.ctx, x, y, color, this.speed, delay));
        }
      }
    }
    
    animate() {
      this.animation = requestAnimationFrame(() => this.animate());
      
      const timeNow = performance.now();
      const timePassed = timeNow - this.timePrevious;
      
      if (timePassed < this.timeInterval) return;
      
      this.timePrevious = timeNow - (timePassed % this.timeInterval);
      
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      for (let i = 0; i < this.pixels.length; i++) {
        this.pixels[i].update();
      }
    }
  }
  
  // Initialize the background animation when the document is loaded
  document.addEventListener('DOMContentLoaded', () => {
    // Create canvas for background if it doesn't exist
    if (!document.getElementById('background-canvas')) {
      const canvas = document.createElement('canvas');
      canvas.id = 'background-canvas';
      canvas.style.position = 'fixed';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.zIndex = '0'; // Behind everything
      canvas.style.opacity = '0.7'; // Slightly transparent
      document.body.insertBefore(canvas, document.body.firstChild);
    }
    
    // Initialize the animation
    new BackgroundAnimation('background-canvas');
  });
  