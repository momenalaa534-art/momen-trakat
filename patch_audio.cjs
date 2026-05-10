const fs = require('fs');
const https = require('https');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data.trim().replace(/^\uFEFF/, ''))));
    }).on('error', reject);
  });
}

function normalize(text) {
  return text.replace(/[\u0617-\u061A\u064B-\u0652\W]/g, ""); // Remove tashkeel and non-word
}

async function run() {
  const categories = await fetchJson('https://hisnmuslim.com/api/ar/husn_ar.json');
  let allApiAthkar = [];
  
  const langs = categories['العربية'];
  for (const cat of langs) {
     const url = cat.TEXT.replace('http:', 'https:');
     try {
       const res = await fetchJson(url);
       const key = Object.keys(res)[0];
       for (const item of res[key]) {
          allApiAthkar.push(item);
       }
     } catch (e) {
       console.log("Error fetching", url);
     }
  }

  console.log("Loaded API items:", allApiAthkar.length);

  let content = fs.readFileSync('src/data/athkar.ts', 'utf8');

  // We find elements that don't already have a valid audio or even those that do
  content = content.replace(/\{([^}]+ar:\s*['"`](.*?)['"`][^}]+)\}/gs, (match, body, arText) => {
      let normAr = normalize(arText);
      // Take only first 30 chars for matching to bypass minor inconsistencies
      normAr = normAr.substring(0, 30);
      let bestItem = null;
      
      for (const apiItem of allApiAthkar) {
         const apiText = normalize(apiItem.ARABIC_TEXT);
         if (apiText.includes(normAr) || normAr.includes(apiText)) {
            bestItem = apiItem;
            break;
         }
      }
      
      if (bestItem && bestItem.AUDIO) {
         const secureAudio = bestItem.AUDIO.replace('http:', 'https:');
         // Remove existing audio property if present
         let cleanedBody = body.replace(/,\s*audio:\s*['"`].*?['"`]/g, '');
         return `{${cleanedBody}, audio: '${secureAudio}'}`;
      } else {
         return match; 
      }
  });

  fs.writeFileSync('src/data/athkar.ts', content);
  console.log("Patched athkar.ts");
}
run();
