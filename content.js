(() => {
  const POPUP_ID = "jp-study-popup-translator";
  const NAVER_BASE = "https://ja.dict.naver.com/#/search?query=";
  let timer = null;
  let lastText = "";

  function looksJapanese(text) {
    return /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9faf]/.test(text);
  }

  function cleanSelection(text) {
    return text.replace(/\s+/g, " ").trim().slice(0, 120);
  }

  function removePopup() {
    const old = document.getElementById(POPUP_ID);
    if (old) old.remove();
  }

  function getSelectionRect() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (!rect || (rect.width === 0 && rect.height === 0)) return null;
    return rect;
  }

  function positionPopup(popup, rect) {
    const margin = 8;
    const popupWidth = 320;
    const left = Math.min(
      window.scrollX + rect.left,
      window.scrollX + window.innerWidth - popupWidth - margin
    );
    const top = window.scrollY + rect.bottom + margin;
    popup.style.left = `${Math.max(window.scrollX + margin, left)}px`;
    popup.style.top = `${top}px`;
  }

  function createPopup(text, rect) {
    removePopup();

    const popup = document.createElement("div");
    popup.id = POPUP_ID;
    popup.innerHTML = `
      <div class="jp-study-header">
        <div class="jp-study-word"></div>
        <button class="jp-study-close" title="닫기">×</button>
      </div>
      <div class="jp-study-result">한국어 번역 중...</div>
      <div class="jp-study-actions">
        <a class="jp-study-naver" target="_blank" rel="noopener noreferrer">네이버 사전</a>
        <button class="jp-study-copy">복사</button>
      </div>
      <div class="jp-study-ad" role="note" aria-label="광고">
        <span class="jp-study-ad-label">AD</span>
        <span class="jp-study-ad-copy">JLPT 단어장으로 오늘의 일본어 복습을 이어가세요.</span>
      </div>
      <div class="jp-study-version">v0.3 한국어 번역</div>
    `;

    popup.querySelector(".jp-study-word").textContent = text;
    popup.querySelector(".jp-study-naver").href = NAVER_BASE + encodeURIComponent(text);
    popup.querySelector(".jp-study-close").addEventListener("click", removePopup);
    popup.querySelector(".jp-study-copy").addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(text);
        popup.querySelector(".jp-study-copy").textContent = "복사됨";
        setTimeout(() => {
          const btn = popup.querySelector(".jp-study-copy");
          if (btn) btn.textContent = "복사";
        }, 900);
      } catch (_) {}
    });

    document.body.appendChild(popup);
    positionPopup(popup, rect);
    return popup;
  }

  function requestTranslation(text) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { type: "JP_STUDY_TRANSLATE", text },
        response => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          if (!response || !response.ok) {
            reject(new Error(response?.error || "translation failed"));
            return;
          }
          resolve(response.translated);
        }
      );
    });
  }

  async function showForSelection() {
    const sel = window.getSelection();
    const text = cleanSelection(sel ? sel.toString() : "");
    if (!text || text === lastText || !looksJapanese(text)) return;

    const rect = getSelectionRect();
    if (!rect) return;
    lastText = text;

    const popup = createPopup(text, rect);
    const result = popup.querySelector(".jp-study-result");

    try {
      const translated = await requestTranslation(text);
      if (!document.body.contains(popup)) return;
      result.textContent = translated;
    } catch (err) {
      result.innerHTML = "자동 번역을 불러오지 못했어요.<br>아래 버튼으로 네이버 사전에서 확인해 주세요.";
      result.title = err.message || String(err);
    }
  }

  document.addEventListener("mouseup", () => {
    clearTimeout(timer);
    timer = setTimeout(showForSelection, 350);
  });

  document.addEventListener("keyup", (event) => {
    if (event.key === "Escape") removePopup();
    clearTimeout(timer);
    timer = setTimeout(showForSelection, 350);
  });

  document.addEventListener("mousedown", (event) => {
    const popup = document.getElementById(POPUP_ID);
    if (popup && !popup.contains(event.target)) {
      removePopup();
      lastText = "";
    }
  });
})();
