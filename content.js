(() => {
  const POPUP_ID = "jp-study-popup-translator";
  const NAVER_BASE = "https://ja.dict.naver.com/#/search?query=";
  const ADS = [
    {
      title: "추천 JLPT 단어장",
      description: "매일 10분씩 일본어 단어를 복습해 보세요.",
      url: "https://example.com/jlpt-vocab"
    },
    {
      title: "광고 일본어 노트",
      description: "드래그한 표현을 정리할 학습 노트를 준비해 보세요.",
      url: "https://example.com/japanese-note"
    },
    {
      title: "추천 일본어 문법책",
      description: "헷갈리는 문법을 예문과 함께 다시 확인하세요.",
      url: "https://example.com/japanese-grammar"
    }
  ];
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

  function getRandomAd() {
    return ADS[Math.floor(Math.random() * ADS.length)];
  }

  function hideAd(popup) {
    const adLink = popup.querySelector(".jp-study-ad");
    if (adLink) adLink.hidden = true;
  }

  function setupAd(popup) {
    try {
      const ad = getRandomAd();
      const adLink = popup.querySelector(".jp-study-ad");
      const adTitle = popup.querySelector(".jp-study-ad-title");
      const adDescription = popup.querySelector(".jp-study-ad-description");

      if (!ad || !ad.url || !adLink || !adTitle || !adDescription) {
        throw new Error("Ad area is unavailable");
      }

      adLink.href = ad.url;
      adTitle.textContent = ad.title;
      adDescription.textContent = ad.description;
      adLink.hidden = false;
    } catch (err) {
      console.warn("[JP Study Popup] 광고 영역을 표시하지 못했습니다.", err);
      hideAd(popup);
    }
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
      <a class="jp-study-ad" target="_blank" rel="noopener noreferrer" aria-label="광고" hidden>
        <span class="jp-study-ad-label">광고</span>
        <span class="jp-study-ad-body">
          <span class="jp-study-ad-title"></span>
          <span class="jp-study-ad-description"></span>
        </span>
      </a>
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
    const translation = requestTranslation(text);

    setupAd(popup);

    try {
      const translated = await translation;
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
