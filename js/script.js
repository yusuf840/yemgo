/* =========================================================
   YEMGO Destek Merkezi — script.js
   Modüler yapı: YEMGO.config içine yeni modeller (YG-200, YG-300...)
   eklenerek site farklı cihazlar için tekrar kullanılabilir.
   ========================================================= */
(function () {
  "use strict";

  /* ---------- 1. MODEL CONFIG (gelecekte genişletilebilir) ---------- */
  const YEMGO = {
    config: {
      "YG-100": {
        name: "YEMGO YG-100",
        wifiSSID: "YEMGO",
        wifiPassword: "yemgo12345",
        ip: "192.168.4.1",
        setupMinutes: 2
      }
      // "YG-200": { name: "YEMGO YG-200", wifiSSID: "YEMGO-200", ... }
    },
    activeModel: "YG-100"
  };

  // URL üzerinden model seçimi desteklenir: ?model=YG-200
  const params = new URLSearchParams(window.location.search);
  const requestedModel = params.get("model");
  if (requestedModel && YEMGO.config[requestedModel]) {
    YEMGO.activeModel = requestedModel;
  }

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    setupScrollProgress();
    setupTrailAnimation();
    setupStepActiveState();
    setupAccordion();
    setupCopyButtons();
    setupSmoothScrollHint();
    setupVideoChapters();
  }

  /* ---------- 2. Üst kaydırma çubuğu (ilerleme göstergesi) ---------- */
  function setupScrollProgress() {
    const fill = document.getElementById("scrollFill");
    if (!fill) return;

    const update = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      fill.style.width = pct + "%";
    };

    window.addEventListener("scroll", throttle(update, 16), { passive: true });
    update();
  }

  /* ---------- 3. Kurulum patikası (trail) çizim animasyonu ---------- */
  function setupTrailAnimation() {
    const wrap = document.getElementById("stepsWrap");
    const trailFill = document.getElementById("trailPathFill");
    if (!wrap || !trailFill) return;

    const update = () => {
      const rect = wrap.getBoundingClientRect();
      const viewportH = window.innerHeight;
      const total = rect.height;
      // Ne kadarı görünüp geçildi?
      const passed = Math.min(Math.max(viewportH * 0.6 - rect.top, 0), total);
      const ratio = total > 0 ? passed / total : 0;
      const dashLength = 1200; // steps__trail viewBox yüksekliğiyle eşleşir (yaklaşık)
      const offset = dashLength - dashLength * ratio;
      trailFill.style.strokeDashoffset = Math.max(offset, 0);
    };

    window.addEventListener("scroll", throttle(update, 16), { passive: true });
    window.addEventListener("resize", throttle(update, 100));
    update();
  }

  /* ---------- 4. Aktif adım vurgusu (IntersectionObserver) ---------- */
  function setupStepActiveState() {
    const steps = document.querySelectorAll(".step");
    if (!steps.length || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-active");
          }
        });
      },
      { threshold: 0.35 }
    );

    steps.forEach((step) => observer.observe(step));
  }

  /* ---------- 5. SSS Akordeon ---------- */
  function setupAccordion() {
    const items = document.querySelectorAll(".accordion__item");
    items.forEach((item) => {
      const trigger = item.querySelector(".accordion__trigger");
      const panel = item.querySelector(".accordion__panel");
      if (!trigger || !panel) return;

      trigger.addEventListener("click", () => {
        const isOpen = trigger.getAttribute("aria-expanded") === "true";

        // Diğerlerini kapat (tek seferde bir soru açık kalsın — kafa karıştırmasın)
        items.forEach((other) => {
          if (other !== item) {
            const otherTrigger = other.querySelector(".accordion__trigger");
            const otherPanel = other.querySelector(".accordion__panel");
            otherTrigger.setAttribute("aria-expanded", "false");
            otherPanel.style.maxHeight = null;
          }
        });

        if (isOpen) {
          trigger.setAttribute("aria-expanded", "false");
          panel.style.maxHeight = null;
        } else {
          trigger.setAttribute("aria-expanded", "true");
          panel.style.maxHeight = panel.scrollHeight + "px";
        }
      });
    });
  }

  /* ---------- 6. Kopyala butonları (Wi-Fi şifresi / IP adresi) ---------- */
  function setupCopyButtons() {
    const buttons = document.querySelectorAll(".copy-btn");
    buttons.forEach((btn) => {
      btn.addEventListener("click", async () => {
        const value = btn.getAttribute("data-copy");
        if (!value) return;

        try {
          await copyToClipboard(value);
          showToast(`Kopyalandı: ${value}`);
          const icon = btn.querySelector("i");
          if (icon) {
            icon.classList.remove("fa-copy");
            icon.classList.add("fa-check");
            setTimeout(() => {
              icon.classList.remove("fa-check");
              icon.classList.add("fa-copy");
            }, 1500);
          }
        } catch (err) {
          showToast("Kopyalanamadı, lütfen elle yazın.");
        }
      });
    });
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    // Eski tarayıcılar için yedek yöntem
    return new Promise((resolve, reject) => {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try {
        document.execCommand("copy");
        resolve();
      } catch (err) {
        reject(err);
      } finally {
        document.body.removeChild(textarea);
      }
    });
  }

  /* ---------- 7. Toast bildirimi ---------- */
  let toastTimer = null;
  function showToast(message) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove("show");
    }, 2200);
  }

  /* ---------- 8. Aşağı kaydırma ipucu ---------- */
  function setupSmoothScrollHint() {
    const hint = document.getElementById("scrollHint");
    if (!hint) return;
    hint.addEventListener("click", () => {
      document.getElementById("kurulum")?.scrollIntoView({ behavior: "smooth" });
    });
  }

  /* ---------- 9. Video bölümleri (atlama butonları) ---------- */
  function setupVideoChapters() {
    const video = document.getElementById("setupVideo");
    const chapters = Array.from(document.querySelectorAll(".chapter"));
    if (!video || !chapters.length) return;

    chapters.forEach((btn) => {
      btn.addEventListener("click", () => {
        video.currentTime = Number(btn.dataset.time) || 0;
        video.play().catch(() => {});
      });
    });

    // Oynarken o an hangi bölümdeyse butonu vurgula
    const times = chapters.map((b) => Number(b.dataset.time));
    video.addEventListener("timeupdate", () => {
      let active = -1;
      times.forEach((t, i) => { if (video.currentTime >= t) active = i; });
      if (video.currentTime >= 28) active = -1; // kapanış ekranı
      chapters.forEach((b, i) => b.classList.toggle("is-current", i === active));
    });
  }

  /* ---------- Yardımcı: throttle ---------- */
  function throttle(fn, wait) {
    let last = 0;
    let timeout = null;
    return function (...args) {
      const now = Date.now();
      const remaining = wait - (now - last);
      if (remaining <= 0) {
        last = now;
        fn.apply(this, args);
      } else if (!timeout) {
        timeout = setTimeout(() => {
          last = Date.now();
          timeout = null;
          fn.apply(this, args);
        }, remaining);
      }
    };
  }

  // Global erişim (ileride başka modüller için)
  window.YEMGO = YEMGO;
})();
