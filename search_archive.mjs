async function searchArchive(query) {
  const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}&fl[]=identifier,title&output=json`;
  const res = await fetch(url);
  const data = await res.json();
  const docs = data.response.docs.slice(0, 5);
  
  for (const doc of docs) {
     const metaUrl = `https://archive.org/metadata/${doc.identifier}`;
     const metaRes = await fetch(metaUrl);
     const metaData = await metaRes.json();
     const files = metaData.files.filter(f => f.name.endsWith('.mp3'));
     if (files.length > 0) {
         console.log('---', doc.title, doc.identifier);
         for (const file of files.slice(0, 5)) {
             console.log(`https://archive.org/download/${doc.identifier}/${file.name}`);
         }
     }
  }
}

searchArchive('أذكار النوم العفاسي');
