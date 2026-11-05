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
    'package.json',
    'vite.config.ts',
    'tsconfig.json',
    '.nojekyll',
    '.github/workflows/deploy.yml',
    'README.md',
  ];

  for (const relativePath of filesToInclude) {
    const fullPath = path.resolve(process.cwd(), relativePath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      zip.file(relativePath, content);
      console.log(`Added: ${relativePath}`);
    } else {
      console.warn(`File not found: ${relativePath}`);
    }
  }

  const zipBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  const outputName = 'RPG-3D-Mobile-Prototype-Fixed.zip';
  const outputPath = path.resolve(process.cwd(), outputName);
  fs.writeFileSync(outputPath, zipBuffer);
  console.log(`Successfully generated: ${outputName} (${zipBuffer.length} bytes)`);
}

createProjectZip().catch((err) => {
  console.error('Error creating zip:', err);
  process.exit(1);
});
