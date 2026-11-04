import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

async function createProjectZip() {
  const zip = new JSZip();

  const filesToInclude = [
    'index.html',
    'style.css',
    'main.js',
    'world.js',
    'floor.js',
    'player.js',
    'camera.js',
    'controls.js',
    'ui.js',
    'utils.js',
    'README.md',
  ];

  for (const fileName of filesToInclude) {
    const filePath = path.resolve(process.cwd(), fileName);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      zip.file(fileName, content);
      console.log(`Added: ${fileName}`);
    } else {
      console.warn(`File not found: ${fileName}`);
    }
  }

  const zipBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  const outputPath = path.resolve(process.cwd(), 'RPG-3D-Mobile-Prototype.zip');
  fs.writeFileSync(outputPath, zipBuffer);
  console.log(`Successfully generated: RPG-3D-Mobile-Prototype.zip (${zipBuffer.length} bytes)`);
}

createProjectZip().catch((err) => {
  console.error('Error creating zip:', err);
  process.exit(1);
});
