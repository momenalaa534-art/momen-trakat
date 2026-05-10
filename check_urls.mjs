const urls = [
  "https://archive.org/download/soso_487/%D8%A3%D8%B0%D9%83%D8%A7%D8%B1%20%D8%A7%D9%84%D9%86%D9%88%D9%85.mp3"
];
async function checkUrls() {
  for (const url of urls) {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      console.log(url, res.status, res.headers.get('content-type'));
    } catch (e) {
      console.error(url, e.message);
    }
  }
}
checkUrls();
