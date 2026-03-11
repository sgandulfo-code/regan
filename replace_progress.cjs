const fs = require('fs');
const path = require('path');

const files = [
  path.join(__dirname, 'components/ClientProgressBar.tsx')
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace font-black with font-bold
  content = content.replace(/font-black/g, 'font-bold');
  
  // Replace tracking-widest with tracking-wider
  content = content.replace(/tracking-widest/g, 'tracking-wider');

  // Replace text-[8px] with text-[10px] for better readability
  content = content.replace(/text-\[8px\]/g, 'text-[10px]');
  
  // Replace text-[9px] with text-xs for better readability
  content = content.replace(/text-\[9px\]/g, 'text-xs');

  fs.writeFileSync(file, content);
  console.log(`Updated ${file}`);
});
