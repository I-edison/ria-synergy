const $ = (s, r = document) => r.querySelector(s),
  $$ = (s, r = document) => [...r.querySelectorAll(s)];
const menuBtn = $(".menu-btn"),
  navLinks = $(".nav-links");
if (menuBtn && navLinks) {
  menuBtn.addEventListener("click", () => {
    const open = navLinks.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", open);
  });
  $$(".nav-links a").forEach((a) =>
    a.addEventListener("click", () => {
      navLinks.classList.remove("open");
      menuBtn.setAttribute("aria-expanded", "false");
    }),
  );
}
const sections = $$("main section[id]"),
  navItems = $$(".nav-links a");
const updateActive = () => {
  let current = "home";
  sections.forEach((s) => {
    if (window.scrollY + 130 >= s.offsetTop) current = s.id;
  });
  navItems.forEach((a) =>
    a.classList.toggle("active", a.getAttribute("href") === "#" + current),
  );
};
window.addEventListener("scroll", updateActive, { passive: true });
updateActive();
const modal = $("#projectModal"),
  modalMain = $("#modalMain"),
  modalTitle = $("#modalTitle"),
  modalThumbs = $("#modalThumbs"),
  modalText = $("#modalText");
if (modal) {
  const projects = $$(".project-card").map((card, index) => {
    const imageElement = $("img", card);
    const imageList = (card.dataset.images || "")
      .split("|")
      .map((src) => src.trim())
      .filter(Boolean);

    return {
      title:
        card.dataset.title ||
        card.querySelector("h3")?.textContent ||
        `Project ${index + 1}`,
      images: imageList.length
        ? imageList
        : [imageElement?.src || "assets/project.jpg"],
      alt:
        imageElement?.alt || `${card.dataset.title || "Project"} construction`,
    };
  });
  let activeProject = 0;
  let activeImage = 0;

  const renderThumbs = () => {
    const project = projects[activeProject];
    if (!project) return;

    modalThumbs.innerHTML = "";
    project.images.forEach((image, imageIndex) => {
      const thumb = document.createElement("button");
      thumb.className = "modal-thumb";
      thumb.type = "button";
      thumb.setAttribute(
        "aria-label",
        `View ${project.title} image ${imageIndex + 1}`,
      );
      thumb.innerHTML = `<img src="${image}" alt="${project.alt || project.title}">`;
      thumb.classList.toggle("active", imageIndex === activeImage);
      thumb.addEventListener("click", () => {
        activeImage = imageIndex;
        updateModalView();
      });
      modalThumbs.appendChild(thumb);
    });
  };

  const updateModalView = () => {
    const project = projects[activeProject];
    if (!project) return;

    activeImage = Math.min(activeImage, project.images.length - 1);
    modalTitle.textContent = project.title;
    modalMain.src = project.images[activeImage];
    modalMain.alt = project.alt || project.title;
    modalText.textContent = `${project.title} • ${project.images.length} image${project.images.length > 1 ? "s" : ""}`;
    renderThumbs();
  };

  const showProject = (index) => {
    activeProject = (index + projects.length) % projects.length;
    activeImage = 0;
    updateModalView();
  };

  const showImage = (direction) => {
    const project = projects[activeProject];
    if (!project) return;

    if (project.images.length <= 1) {
      showProject(activeProject + direction);
      return;
    }

    activeImage =
      (activeImage + direction + project.images.length) % project.images.length;
    updateModalView();
  };

  $$(".project-card").forEach((card, index) =>
    card.addEventListener("click", () => {
      showProject(index);
      modal.classList.add("open");
      modal.setAttribute("aria-hidden", "false");
      document.body.classList.add("no-scroll");
    }),
  );
  $(".modal-gallery-prev", modal)?.addEventListener("click", () =>
    showImage(-1),
  );
  $(".modal-gallery-next", modal)?.addEventListener("click", () =>
    showImage(1),
  );
  const close = () => {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("no-scroll");
  };
  $(".close", modal)?.addEventListener("click", close);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
    if (modal.classList.contains("open") && e.key === "ArrowLeft") {
      showImage(-1);
    }
    if (modal.classList.contains("open") && e.key === "ArrowRight") {
      showImage(1);
    }
  });
}
const form = $("#contactForm");

if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const msg = $(".form-message");
    const formData = new FormData(form);
    const service = $("#service").value || "Not specified";
    const whatsappMessage = [
      "Hello Ria Synergy Limited, I would like to make an enquiry.",
      "",
      `Name: ${formData.get("fullname")}`,
      `Email: ${formData.get("email")}`,
      `Phone: ${formData.get("phoneNumber") || "Not provided"}`,
      `Service: ${service}`,
      `Project details: ${formData.get("message")}`,
    ].join("\n");

    window.open(
      `https://wa.me/2348146682105?text=${encodeURIComponent(whatsappMessage)}`,
      "_blank",
      "noopener,noreferrer",
    );
    msg.textContent = "Opening WhatsApp with your enquiry...";
    msg.classList.add("show");
  });
}
const news = $("#newsletterForm");

if (news) {
  news.addEventListener("submit", async (e) => {
    e.preventDefault();

    const input = news.querySelector('input[name="email"]');
    const button = news.querySelector('button[type="submit"]');
    const msg = $("#newsletterMessage");

    const email = input.value.trim();

    if (!email) return;

    button.disabled = true;
    button.textContent = "…";

    try {
      const response = await fetch(news.action, {
        method: "POST",
        body: new FormData(news),
        headers: {
          Accept: "application/json",
        },
      });

      if (response.ok) {
        msg.textContent = "You're subscribed! Thanks for joining Ria Synergy.";
        msg.classList.add("show");

        news.reset();
      } else {
        msg.textContent = "Something went wrong. Please try again.";
        msg.classList.add("show");
      }
    } catch (error) {
      msg.textContent =
        "Unable to subscribe right now. Please try again later.";
      msg.classList.add("show");
    }

    button.disabled = false;
    button.textContent = "→";
  });
}

// Live construction forum news -------------------------------------------------
// Uses several public feed gateways because browsers block direct cross-origin RSS requests.
const NEWS_FEED_URL = "https://www.reddit.com/r/Construction/.rss";
const NEWS_CACHE = "riaConstructionNewsCache";
const newsFeed = $("#newsFeed");
const feedStatus = $("#feedStatus");
const refreshNews = $("#refreshNews");

const escapeHtml = (value = "") =>
  String(value).replace(
    /[&<>'"]/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        c
      ],
  );
const stripHtml = (html = "") => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return (doc.body.textContent || "").replace(/\s+/g, " ").trim();
};
const formatNewsDate = (date) => {
  if (!date) return "Recently";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "Recently";
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
};
const DEFAULT_NEWS_IMAGE = "assets/News.png";
const normalizeImageUrl = (url) => {
  if (typeof url !== "string" || !url.trim()) return "";
  const trimmedUrl = url.trim();
  return trimmedUrl.startsWith("//") ? `https:${trimmedUrl}` : trimmedUrl;
};
const getNewsImage = (item) => {
  const candidates = [
    item.image,
    item.thumbnail,
    item.enclosure?.link,
    item.enclosure?.url,
    item.media?.content,
    item.media?.thumbnail,
  ];
  const contentImage = String(item.content || item.description || "").match(
    /<img[^>]+src=["']([^"']+)["']/i,
  )?.[1];
  candidates.push(contentImage);

  const image = candidates
    .map(normalizeImageUrl)
    .find(
      (url) =>
        /^https?:\/\//i.test(url) && !/\b(?:self|default|nsfw)\b/i.test(url),
    );
  return image || DEFAULT_NEWS_IMAGE;
};

function setFeedStatus(text, error = false) {
  if (!feedStatus) return;
  feedStatus.classList.toggle("error", error);
  feedStatus.innerHTML = `<span class="status-dot"></span>${escapeHtml(text)}`;
}

function normalizeItems(items) {
  return (items || []).filter((item) => item?.title && item?.link).slice(0, 6);
}

function parseRSS(xml) {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.querySelector("parsererror")) throw new Error("Invalid RSS feed");
  return [...doc.querySelectorAll("item, entry")].map((node) => {
    const get = (name) => node.querySelector(name)?.textContent?.trim() || "";
    const linkNode = node.querySelector("link");
    const link = linkNode?.getAttribute("href") || get("link");
    const media = node.querySelector(
      "media\\:content, content, enclosure, media\\:thumbnail",
    );
    const image =
      media?.getAttribute("url") || media?.getAttribute("href") || "";
    return {
      title: get("title"),
      link,
      description: get("description") || get("summary") || get("content"),
      pubDate: get("pubDate") || get("published") || get("updated"),
      author: get("dc\\:creator") || get("author"),
      thumbnail: image,
    };
  });
}

async function fetchText(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  const response = await fetch(url, {
    cache: "no-store",
    signal: controller.signal,
  }).finally(() => clearTimeout(timeout));
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return await response.text();
}

async function fetchJSON(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  const response = await fetch(url, {
    cache: "no-store",
    signal: controller.signal,
  }).finally(() => clearTimeout(timeout));
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return await response.json();
}

// JSONP avoids browser CORS restrictions on the public RSS-to-JSON service.
function fetchRSS2JSONP() {
  return new Promise((resolve, reject) => {
    const callback =
      "riaNewsCallback_" +
      Date.now() +
      "_" +
      Math.random().toString(36).slice(2);
    const script = document.createElement("script");
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("News service timed out"));
    }, 8000);
    function cleanup() {
      clearTimeout(timer);
      delete window[callback];
      script.remove();
    }
    window[callback] = (data) => {
      cleanup();
      if (data?.status === "ok" && Array.isArray(data.items))
        resolve(data.items);
      else reject(new Error(data?.message || "RSS conversion failed"));
    };
    script.onerror = () => {
      cleanup();
      reject(new Error("News service unavailable"));
    };
    script.src =
      "https://api.rss2json.com/v1/api.json?rss_url=" +
      encodeURIComponent(NEWS_FEED_URL) +
      "&callback=" +
      callback;
    document.head.appendChild(script);
  });
}

async function fetchNews() {
  // Gateway 1: RSS2JSON JSONP. This works even when fetch() is blocked by CORS.
  try {
    return normalizeItems(await fetchRSS2JSONP());
  } catch (_) {}

  // Gateway 2: RSS2JSON normal fetch.
  try {
    const api =
      "https://api.rss2json.com/v1/api.json?rss_url=" +
      encodeURIComponent(NEWS_FEED_URL);
    const data = await fetchJSON(api);
    if (data.status === "ok" && Array.isArray(data.items))
      return normalizeItems(data.items);
  } catch (_) {}

  // Gateway 3: AllOrigins raw proxy.
  try {
    const proxy =
      "https://api.allorigins.win/raw?url=" + encodeURIComponent(NEWS_FEED_URL);
    return normalizeItems(parseRSS(await fetchText(proxy)));
  } catch (_) {}

  // Gateway 4: CorsProxy fallback.
  try {
    const proxy =
      "https://corsproxy.io/?url=" + encodeURIComponent(NEWS_FEED_URL);
    return normalizeItems(parseRSS(await fetchText(proxy)));
  } catch (_) {}

  throw new Error("All news feed gateways failed");
}

function renderNews(items, fromCache = false) {
  if (!newsFeed) return;
  if (!items?.length) {
    newsFeed.innerHTML =
      '<div class="news-empty"><strong>No construction updates available right now.</strong><span>Try refreshing in a moment.</span></div>';
    return;
  }
  newsFeed.innerHTML = items
    .slice(0, 6)
    .map((item) => {
      const title = escapeHtml(item.title || "Construction discussion");
      const summary = escapeHtml(
        stripHtml(item.description || item.content || "").slice(0, 190),
      );
      const image = escapeHtml(getNewsImage(item));
      const link = escapeHtml(
        item.link || "https://www.reddit.com/r/Construction/",
      );
      const date = escapeHtml(formatNewsDate(item.pubDate));
      const author = item.author ? ` · ${escapeHtml(item.author)}` : "";
      return `<article class="blog-card news-card">
      <a class="blog-image" href="${link}" target="_blank" rel="noopener noreferrer" aria-label="Read ${title}"><img src="${image}" alt="" loading="lazy" onerror="this.onerror=null;this.src='${DEFAULT_NEWS_IMAGE}'"></a>
      <div class="blog-body">
        <div class="blog-meta">CONSTRUCTION FORUM</div>
        <div class="blog-date">${date}${author}</div>
        <h3>${title}</h3>
        <p>${summary || "Open the original forum discussion to read the latest construction community updates and comments."}</p>
        <a href="${link}" target="_blank" rel="noopener noreferrer">Read Discussion →</a>
        <div class="news-source">Source: Reddit · r/Construction</div>
      </div>
    </article>`;
    })
    .join("");
  setFeedStatus(fromCache ? "Showing cached updates" : "Live updates loaded");
}

async function loadConstructionNews(force = false) {
  if (!newsFeed) return;
  if (refreshNews) {
    refreshNews.disabled = true;
    refreshNews.textContent = "↻ Loading…";
  }

  if (!force) {
    try {
      const cached = JSON.parse(localStorage.getItem(NEWS_CACHE) || "null");
      if (cached?.items?.length && Date.now() - cached.time < 15 * 60 * 1000) {
        renderNews(cached.items, true);
        if (refreshNews) {
          refreshNews.disabled = false;
          refreshNews.textContent = "↻ Refresh";
        }
        return;
      }
    } catch (_) {}
  }

  setFeedStatus("Connecting to construction forum…");
  try {
    const items = await fetchNews();
    if (!items.length) throw new Error("No stories returned");
    localStorage.setItem(
      NEWS_CACHE,
      JSON.stringify({ time: Date.now(), items }),
    );
    renderNews(items);
  } catch (error) {
    try {
      const cached = JSON.parse(localStorage.getItem(NEWS_CACHE) || "null");
      if (cached?.items?.length) {
        renderNews(cached.items, true);
        setFeedStatus(
          "Live feed temporarily unavailable · cached updates shown",
          true,
        );
      } else {
        // Keep the page useful instead of displaying a broken-feed error.
        newsFeed.innerHTML =
          '<div class="news-empty"><strong>Construction news is temporarily unavailable.</strong><span>Use Refresh to reconnect to the forum.</span></div>';
        setFeedStatus("Feed temporarily unavailable", true);
      }
    } catch (_) {
      newsFeed.innerHTML =
        '<div class="news-empty"><strong>Construction news is temporarily unavailable.</strong><span>Use Refresh to reconnect to the forum.</span></div>';
      setFeedStatus("Feed temporarily unavailable", true);
    }
  } finally {
    if (refreshNews) {
      refreshNews.disabled = false;
      refreshNews.textContent = "↻ Refresh";
    }
  }
}

refreshNews?.addEventListener("click", () => loadConstructionNews(true));
loadConstructionNews();
setInterval(() => loadConstructionNews(true), 15 * 60 * 1000);

// About section responsive image carousel
(() => {
  const carousel = document.querySelector("[data-about-carousel]");
  if (!carousel) return;
  const slides = [...carousel.querySelectorAll(".about-slide")];
  const dotsWrap = carousel.querySelector(".about-dots");
  const prev = carousel.querySelector(".about-prev");
  const next = carousel.querySelector(".about-next");
  if (!slides.length) return;
  let index = 0;
  let timer;

  slides.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "about-dot" + (i === 0 ? " is-active" : "");
    dot.setAttribute("aria-label", `Show About image ${i + 1}`);
    dot.addEventListener("click", () => show(i, true));
    dotsWrap.appendChild(dot);
  });
  const dots = [...dotsWrap.children];

  function show(i, restart = false) {
    index = (i + slides.length) % slides.length;
    slides.forEach((slide, n) =>
      slide.classList.toggle("is-active", n === index),
    );
    dots.forEach((dot, n) => dot.classList.toggle("is-active", n === index));
    if (restart) restartTimer();
  }
  function restartTimer() {
    clearInterval(timer);
    timer = setInterval(() => show(index + 1), 5000);
  }

  prev.addEventListener("click", () => show(index - 1, true));
  next.addEventListener("click", () => show(index + 1, true));
  carousel.addEventListener("mouseenter", () => clearInterval(timer));
  carousel.addEventListener("mouseleave", restartTimer);

  let touchStartX = 0;
  carousel.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.changedTouches[0].clientX;
    },
    { passive: true },
  );
  carousel.addEventListener(
    "touchend",
    (e) => {
      const delta = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(delta) > 45) show(index + (delta < 0 ? 1 : -1), true);
    },
    { passive: true },
  );

  restartTimer();
})();
