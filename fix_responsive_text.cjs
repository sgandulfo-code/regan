const fs = require('fs');
const path = require('path');

const files = [
  path.join(__dirname, 'components/SharedItineraryView.tsx'),
  path.join(__dirname, 'components/SharedPropertyRow.tsx'),
  path.join(__dirname, 'components/ComparisonTool.tsx'),
  path.join(__dirname, 'components/ClientProgressBar.tsx'),
  path.join(__dirname, 'components/PropertyMapView.tsx')
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Fix inverted responsive text sizes
  content = content.replace(/text-xs md:text-\[10px\]/g, 'text-[10px] md:text-xs');

  fs.writeFileSync(file, content);
  console.log(`Updated ${file}`);
});
