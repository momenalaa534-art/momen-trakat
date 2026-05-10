export const CACHE_NAME = 'quran-offline-v1';

export async function fetchWithCache(url: string, forceNetwork = false) {
  const cache = await caches.open(CACHE_NAME);
  
  if (!forceNetwork) {
    const cachedResponse = await cache.match(url);
    if (cachedResponse) {
      return cachedResponse;
    }
  }

  try {
    const response = await fetch(url);
    if (response.ok) {
      cache.put(url, response.clone());
    }
    return response;
  } catch (error) {
    const cachedResponse = await cache.match(url);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

export async function downloadSurahAudio(surahNumber: number, reciter: string, ayahs: { audio: string }[], onProgress?: (progress: number) => void) {
  const cache = await caches.open(CACHE_NAME);
  let downloaded = 0;
  
  // Also cache the API response for this surah/reciter
  const url1 = `https://api.alquran.cloud/v1/surah/${surahNumber}/${reciter}`;
  const url2 = `https://api.alquran.cloud/v1/surah/${surahNumber}/quran-tajweed`;
  
  await fetchWithCache(url1, true);
  await fetchWithCache(url2, true);

  const CONCURRENCY = 5;
  for (let i = 0; i < ayahs.length; i += CONCURRENCY) {
    const chunk = ayahs.slice(i, i + CONCURRENCY);
    await Promise.all(
      chunk.map(async (ayah) => {
        if (ayah.audio) {
          const isCached = await cache.match(ayah.audio);
          if (!isCached) {
            try {
              const res = await fetch(ayah.audio, { mode: 'no-cors' });
              await cache.put(ayah.audio, res.clone());
            } catch (e) {
              console.error("Failed to download ayah audio", e);
            }
          }
        }
        downloaded++;
        if (onProgress) {
          onProgress(Math.round((downloaded / ayahs.length) * 100));
        }
      })
    );
  }
}

export async function checkSurahDownloaded(surahNumber: number, reciter: string, totalAyahs: number) {
  const cache = await caches.open(CACHE_NAME);
  // Just check if the JSON is cached and maybe first ayah audio to be quick
  const url1 = `https://api.alquran.cloud/v1/surah/${surahNumber}/${reciter}`;
  const cachedJson = await cache.match(url1);
  if (!cachedJson) return false;
  
  return true; // We assume if the json is there, the user clicked download previously. Complete verification is too slow.
}
