const cache = new Map();

async function translateWithGoogle(text) {
  const url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=ja&tl=ko&dt=t&q=" + encodeURIComponent(text);
  const res = await fetch(url);
  if (!res.ok) throw new Error("Google translation request failed: " + res.status);
  const data = await res.json();
  const translated = data?.[0]?.map(part => part?.[0]).filter(Boolean).join("");
  if (!translated) throw new Error("Google returned empty translation");
  return translated;
}

async function translateWithMyMemory(text) {
  const url = "https://api.mymemory.translated.net/get?q=" + encodeURIComponent(text) + "&langpair=ja|ko";
  const res = await fetch(url);
  if (!res.ok) throw new Error("MyMemory translation request failed: " + res.status);
  const data = await res.json();
  const translated = data?.responseData?.translatedText;
  if (!translated) throw new Error("MyMemory returned empty translation");
  return translated;
}

async function translate(text) {
  if (cache.has(text)) return cache.get(text);
  let translated;
  try {
    translated = await translateWithGoogle(text);
  } catch (googleError) {
    translated = await translateWithMyMemory(text);
  }
  cache.set(text, translated);
  return translated;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.type !== "JP_STUDY_TRANSLATE") return false;

  translate(message.text)
    .then(translated => sendResponse({ ok: true, translated }))
    .catch(error => sendResponse({ ok: false, error: error.message || String(error) }));

  return true;
});
