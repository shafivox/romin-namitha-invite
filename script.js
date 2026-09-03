(function () {
  "use strict";

  function init() {
  // Mark page as JS-enabled so reveal animations activate. Without JS,
  // content stays visible via the default (non-.js-enabled) styles.
  document.documentElement.classList.add("js-enabled");

  // ===== Countdown =====
  // Isolated in its own try/catch: a failure here must never stop the
  // scroll reveal, petals, or music code below from running, and vice versa.
  try {
    // ISO 8601 with an explicit numeric UTC offset (+05:30) is part of the
    // ECMA-262 Date Time String Format and is parsed identically by every
    // modern JS engine (V8/Chrome, SpiderMonkey/Firefox, JavaScriptCore/Safari),
    // so the target instant does not depend on the browser or visitor's
    // local timezone.
    var target = new Date("2026-09-19T16:00:00+05:30").getTime();

    if (isNaN(target)) {
      throw new Error("Countdown target date failed to parse");
    }

    var grid = document.getElementById("countdown");
    var done = document.getElementById("countdown-done");
    var els = {
      days: document.querySelector("[data-days]"),
      hours: document.querySelector("[data-hours]"),
      minutes: document.querySelector("[data-minutes]"),
      seconds: document.querySelector("[data-seconds]"),
    };

    var pad = function (n) {
      return n < 10 ? "0" + n : "" + n;
    };

    var timer;

    var tick = function () {
      try {
        var diff = target - Date.now();

        if (diff <= 0) {
          if (grid) grid.hidden = true;
          if (done) done.hidden = false;
          if (timer) clearInterval(timer);
          return;
        }

        var s = Math.floor(diff / 1000);
        var days = Math.floor(s / 86400);
        var hours = Math.floor((s % 86400) / 3600);
        var minutes = Math.floor((s % 3600) / 60);
        var seconds = s % 60;

        if (els.days) els.days.textContent = days;
        if (els.hours) els.hours.textContent = pad(hours);
        if (els.minutes) els.minutes.textContent = pad(minutes);
        if (els.seconds) els.seconds.textContent = pad(seconds);
      } catch (tickError) {
        if (timer) clearInterval(timer);
      }
    };

    tick();
    timer = setInterval(tick, 1000);
  } catch (countdownError) {
    // Graceful fallback: never leave "--" stuck on screen. If the countdown
    // cannot run for any reason, hide the numeric grid and reveal the
    // "done" message area repurposed as a static fallback line instead.
    var fallbackGrid = document.getElementById("countdown");
    var fallbackDone = document.getElementById("countdown-done");
    if (fallbackGrid) fallbackGrid.hidden = true;
    if (fallbackDone) {
      fallbackDone.hidden = false;
      fallbackDone.textContent = "19 September 2026 · 4:00 PM IST";
    }
  }

  // ===== Scroll reveal =====
  var revealables = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    revealables.forEach(function (el) {
      observer.observe(el);
    });

    // Safety net: ensure nothing stays hidden if the observer never fires.
    setTimeout(function () {
      revealables.forEach(function (el) {
        el.classList.add("is-visible");
      });
    }, 2500);
  } else {
    revealables.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  // ===== Venue card highlight on scroll =====
  // Isolated in its own try/catch: progressive enhancement only, must never
  // affect the countdown, reveal, gallery, or music code. Uses a dedicated
  // IntersectionObserver (rather than the one-shot reveal observer above)
  // because the highlight must toggle on and off every time the card enters
  // or leaves the viewport, not just once.
  try {
    var venueCard = document.querySelector(".venue__card");
    if (venueCard && "IntersectionObserver" in window) {
      var venueObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            venueCard.classList.toggle("is-highlighted", entry.isIntersecting);
          });
        },
        { threshold: 0.5 }
      );
      venueObserver.observe(venueCard);
    }
  } catch (venueHighlightError) {
    // Venue highlight is progressive enhancement only; ignore failures.
  }

  // ===== Floating petals =====
  var petalsWrap = document.querySelector(".petals");
  var reduceMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (petalsWrap && !reduceMotion) {
    var COUNT = 18;
    var tints = [
      "var(--stone-soft)",
      "var(--gold-soft)",
      "var(--gold)",
      "var(--stone-soft)",
    ];
    for (var i = 0; i < COUNT; i++) {
      var petal = document.createElement("span");
      // Mix of sizes: ~40% larger petals, the rest around the original size.
      var size = Math.random() < 0.4
        ? 18 + Math.random() * 14 // larger: 18-32px
        : 8 + Math.random() * 10; // current-ish: 8-18px
      petal.style.left = Math.random() * 100 + "vw";
      petal.style.width = size + "px";
      petal.style.height = size + "px";
      petal.style.background = tints[i % tints.length];
      petal.style.animationDuration = 9 + Math.random() * 9 + "s";
      petal.style.animationDelay = Math.random() * 10 + "s";
      petal.style.opacity = 0.35 + Math.random() * 0.4;
      petalsWrap.appendChild(petal);
    }
  }

  // ===== Gallery lightbox =====
  // Isolated in its own try/catch: a failure here is progressive enhancement
  // only and must never affect the countdown, reveal, or music code.
  try {
    var galleryItems = Array.prototype.slice.call(
      document.querySelectorAll(".gallery__item")
    );
    var lightbox = document.getElementById("lightbox");

    if (galleryItems.length && lightbox) {
      var lbImg = document.getElementById("lightbox-img");
      var lbCounter = document.getElementById("lightbox-counter");
      var lbClose = document.getElementById("lightbox-close");
      var lbPrev = document.getElementById("lightbox-prev");
      var lbNext = document.getElementById("lightbox-next");
      var currentIndex = 0;
      var lastFocused = null;

      var photos = galleryItems.map(function (item) {
        var img = item.querySelector("img");
        return { src: img.getAttribute("src"), alt: img.getAttribute("alt") };
      });

      var show = function (index) {
        currentIndex = (index + photos.length) % photos.length;
        var photo = photos[currentIndex];
        lbImg.src = photo.src;
        lbImg.alt = photo.alt;
        if (lbCounter) {
          lbCounter.textContent = currentIndex + 1 + " / " + photos.length;
        }
      };

      var onKeydown = function (e) {
        if (e.key === "Escape") close();
        else if (e.key === "ArrowLeft") show(currentIndex - 1);
        else if (e.key === "ArrowRight") show(currentIndex + 1);
      };

      var open = function (index) {
        lastFocused = document.activeElement;
        show(index);
        lightbox.hidden = false;
        requestAnimationFrame(function () {
          lightbox.classList.add("is-open");
        });
        document.body.style.overflow = "hidden";
        if (lbClose) lbClose.focus();
        document.addEventListener("keydown", onKeydown);
      };

      var close = function () {
        lightbox.classList.remove("is-open");
        document.body.style.overflow = "";
        document.removeEventListener("keydown", onKeydown);
        setTimeout(function () {
          lightbox.hidden = true;
        }, 250);
        if (lastFocused && typeof lastFocused.focus === "function") {
          lastFocused.focus();
        }
      };

      galleryItems.forEach(function (item, i) {
        item.addEventListener("click", function () {
          open(i);
        });
      });

      if (lbClose) lbClose.addEventListener("click", close);
      if (lbPrev) lbPrev.addEventListener("click", function () { show(currentIndex - 1); });
      if (lbNext) lbNext.addEventListener("click", function () { show(currentIndex + 1); });

      lightbox.addEventListener("click", function (e) {
        if (e.target === lightbox) close();
      });

      // Touch swipe support
      var touchStartX = null;
      lightbox.addEventListener(
        "touchstart",
        function (e) {
          touchStartX = e.changedTouches[0].clientX;
        },
        { passive: true }
      );
      lightbox.addEventListener(
        "touchend",
        function (e) {
          if (touchStartX === null) return;
          var dx = e.changedTouches[0].clientX - touchStartX;
          if (Math.abs(dx) > 40) {
            if (dx > 0) show(currentIndex - 1);
            else show(currentIndex + 1);
          }
          touchStartX = null;
        },
        { passive: true }
      );
    }
  } catch (galleryError) {
    // Gallery lightbox is progressive enhancement only; ignore failures.
  }

  // ===== Background music =====
  var audio = document.getElementById("bg-music");
  var toggle = document.getElementById("music-toggle");

  if (audio && toggle) {
    audio.volume = 0.55;
    var wantMusic = true;

    function reflect() {
      toggle.classList.toggle("is-playing", !audio.paused);
      toggle.setAttribute("aria-pressed", audio.paused ? "false" : "true");
    }

    function tryPlay() {
      if (!wantMusic) return;
      var p = audio.play();
      if (p && typeof p.then === "function") {
        p.then(reflect).catch(function () {
          // Autoplay blocked; wait for the first user gesture.
        });
      } else {
        reflect();
      }
    }

    // Attempt autoplay immediately.
    tryPlay();

    // Fallback: many browsers block autoplay until the user interacts.
    var gestures = ["pointerdown", "touchstart", "keydown", "scroll"];
    function onFirstGesture() {
      tryPlay();
      gestures.forEach(function (ev) {
        window.removeEventListener(ev, onFirstGesture);
      });
    }
    gestures.forEach(function (ev) {
      window.addEventListener(ev, onFirstGesture, { passive: true });
    });

    toggle.addEventListener("click", function () {
      if (audio.paused) {
        wantMusic = true;
        tryPlay();
      } else {
        wantMusic = false;
        audio.pause();
        reflect();
      }
    });

    audio.addEventListener("play", reflect);
    audio.addEventListener("pause", reflect);
    reflect();
  }
  }

  // Run once the DOM is ready, regardless of where/when this script is loaded.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
