import https from "https";
['sabah', 'masa', 'nowm', 'esteqath'].forEach(name => {
  https.get(`https://server8.mp3quran.net/misc/adkar/adkar_${name}.mp3`, (res) => {
    console.log(name, res.statusCode);
  });
});
