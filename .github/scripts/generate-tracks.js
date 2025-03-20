const fs = require('fs');
const path = require('path');

// Function to scan audio directory
function scanAudioDirectory(dir) {
  const tracks = [];
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Recursively scan subdirectories
      const subDirTracks = scanAudioDirectory(filePath);
      tracks.push(...subDirTracks);
    } else if (path.extname(file).toLowerCase() === '.mp3') {
      // Add MP3 files to the tracks list
      const relativePath = path.relative('', filePath).replace(/\\/g, '/');
      
      // Extract title and artist from filename
      let title = path.basename(file, '.mp3');
      let artist = "Unknown Artist";
      
      // If filename has format "Artist - Title.mp3"
      if (title.includes(' - ')) {
        const parts = title.split(' - ');
        artist = parts[0].trim();
        title = parts[1].trim();
      }
      
      tracks.push({
        title: title,
        artist: artist,
        src: relativePath
      });
    }
  });
  
  return tracks;
}

// Main function
function generateTracksJSON() {
  const audioDir = 'audio';
  
  // Check if audio directory exists
  if (!fs.existsSync(audioDir)) {
    console.log('Audio directory not found. Creating empty tracks.json');
    fs.writeFileSync('tracks.json', JSON.stringify([], null, 2));
    return;
  }
  
  const tracks = scanAudioDirectory(audioDir);
  
  // Write to tracks.json
  fs.writeFileSync('tracks.json', JSON.stringify(tracks, null, 2));
  console.log(`Generated tracks.json with ${tracks.length} tracks`);
}

generateTracksJSON();
