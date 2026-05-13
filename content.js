/**
 * content.js — Content Script for LinkedIn AI Detector
 *
 * Responsibilities:
 * - Observes the LinkedIn feed for new posts using MutationObserver.
 * - Injects an "Analyze AI" button into each detected post.
 * - On click: extracts post text, sends it to background.js, displays the result badge.
 * - Does NOT auto-analyze — user must click the button.
 */

(() => {
  "use strict";

  // Prevent multiple injections
  if (window.__linkedinAIDetectorLoaded) return;
  window.__linkedinAIDetectorLoaded = true;

  console.log("[LinkedIn AI Detector] Content script initialized.");

  // ── Selectors ──────────────────────────────────────────────────
  // LinkedIn DOM selectors (may need updates if LinkedIn changes their markup)
  const SELECTORS = {
    // Each feed post container
    feedPost: "div[componentkey], .feed-shared-update-v2, .occludable-update",
    // The text content area within a post
    postText: '[data-testid="expandable-text-box"], .update-components-text, .feed-shared-update-v2__description, .feed-shared-text, .break-words',
    // Social actions bar (like, comment, share) — we inject our button nearby
    socialActions:
      ".feed-shared-social-actions, .social-details-social-actions, [class*='social-actions']",
  };

  // Data attribute to mark processed posts
  const PROCESSED_ATTR = "data-laid-processed";

  // ── Helpers ────────────────────────────────────────────────────

  /**
   * Extracts the visible text content from a post element.
   * @param {HTMLElement} postEl - The feed post container.
   * @returns {string} - The extracted text, trimmed.
   */
  function extractPostText(postEl) {
    // Try multiple selectors to find the text content
    const textSelectors = [
      '[data-testid="expandable-text-box"]',
      ".feed-shared-update-v2__description .break-words",
      ".feed-shared-update-v2__description",
      ".feed-shared-text .break-words",
      ".feed-shared-text",
      ".update-components-text .break-words",
      ".update-components-text",
      "span.break-words[dir='ltr']",
    ];

    for (const selector of textSelectors) {
      const el = postEl.querySelector(selector);
      if (el && el.innerText.trim().length > 0) {
        return el.innerText.trim();
      }
    }

    return "";
  }

  /**
   * Determines the badge tier CSS class based on the score.
   * @param {number} score - AI probability 0-100.
   * @returns {string} - CSS class suffix.
   */
  function getScoreTier(score) {
    if (score >= 70) return "high";
    if (score <= 30) return "low";
    return "medium";
  }

  /**
   * Returns the appropriate emoji for the score tier.
   * @param {number} score
   * @returns {string}
   */
  function getScoreEmoji(score) {
    if (score >= 70) return "🤖";
    if (score <= 30) return "✅";
    return "🤔";
  }

  // ── UI Creation ────────────────────────────────────────────────

  /**
   * Creates the "Analyze AI" button element.
   * @returns {HTMLButtonElement}
   */
  function createAnalyzeButton() {
    const btn = document.createElement("button");
    btn.className = "laid-btn";
    btn.innerHTML = `🕵️ Analizuj AI`;
    btn.title = "Sprawdź szansę, że ten post został wygenerowany przez AI";
    return btn;
  }

  /**
   * Sets the button to loading state.
   * @param {HTMLButtonElement} btn
   */
  function setButtonLoading(btn) {
    btn.disabled = true;
    btn.classList.add("laid-btn--loading");
    btn.innerHTML = `<span class="laid-spinner"></span> Analizowanie…`;
  }

  /**
   * Replaces the button with a result badge.
   * @param {HTMLElement} container - The .laid-container wrapping the button.
   * @param {number} score - AI probability 0-100.
   */
  function showResultBadge(container, score) {
    const tier = getScoreTier(score);
    const emoji = getScoreEmoji(score);

    const badge = document.createElement("span");
    badge.className = `laid-badge laid-badge--${tier}`;
    badge.innerHTML = `${emoji} AI Probability: <strong>${score}%</strong>`;
    badge.title = `Szacowane prawdopodobieństwo wygenerowania przez AI: ${score}%`;

    container.innerHTML = "";
    container.appendChild(badge);
  }

  /**
   * Replaces the button with an error badge.
   * @param {HTMLElement} container
   * @param {string} errorMessage
   */
  function showErrorBadge(container, errorMessage) {
    const badge = document.createElement("span");
    badge.className = "laid-badge laid-badge--error";
    badge.innerHTML = `⚠️ ${errorMessage}`;

    container.innerHTML = "";
    container.appendChild(badge);

    // Add a retry button
    const retryBtn = createAnalyzeButton();
    retryBtn.style.marginLeft = "8px";
    retryBtn.innerHTML = "🔄 Ponów";
    container.appendChild(retryBtn);

    return retryBtn;
  }

  // ── Core Logic ─────────────────────────────────────────────────

  /**
   * Handles the click on the "Analyze AI" button.
   * @param {HTMLElement} postEl - The parent post element.
   * @param {HTMLButtonElement} btn - The clicked button.
   * @param {HTMLElement} container - The .laid-container element.
   */
  async function handleAnalyzeClick(postEl, btn, container) {
    // 1. Extract text
    const text = extractPostText(postEl);

    if (!text || text.length < 20) {
      showErrorBadge(container, "Za mało tekstu do analizy (min. 20 znaków).");
      return;
    }

    // 2. Set loading state
    setButtonLoading(btn);

    try {
      // 3. Send to background script via chrome.runtime.sendMessage
      const response = await chrome.runtime.sendMessage({
        type: "ANALYZE_POST",
        postText: text,
      });

      if (response?.success) {
        // 4a. Show result badge
        showResultBadge(container, response.score);
      } else {
        // 4b. Show error and allow retry
        const retryBtn = showErrorBadge(
          container,
          response?.error || "Nieznany błąd."
        );
        retryBtn.addEventListener("click", () => {
          handleAnalyzeClick(postEl, retryBtn, container);
        });
      }
    } catch (err) {
      console.error("[LinkedIn AI Detector] Communication error:", err);
      const retryBtn = showErrorBadge(
        container,
        "Błąd komunikacji z rozszerzeniem. Spróbuj odświeżyć stronę."
      );
      retryBtn.addEventListener("click", () => {
        handleAnalyzeClick(postEl, retryBtn, container);
      });
    }
  }

  function processPost(postEl) {
    // Find the social actions bar to inject our button near it
    let actionsBar = postEl.querySelector(SELECTORS.socialActions);
    
    // Fallback: Identify the action bar dynamically
    if (!actionsBar) {
      // Find a button containing a typical action icon (Like or Comment)
      const actionIcon = postEl.querySelector('button svg[id*="thumbs-up"], button svg[id*="comment"]');
      if (actionIcon) {
        const btn = actionIcon.closest('button');
        if (btn) {
          let btnContainer = btn.parentElement;
          // Go up the DOM tree until we find a container that holds at least 3 buttons (Like, Comment, Repost/Share)
          while (btnContainer && btnContainer.querySelectorAll('button').length < 3 && btnContainer !== postEl) {
            btnContainer = btnContainer.parentElement;
          }
          if (btnContainer && btnContainer !== postEl) {
            actionsBar = btnContainer;
          }
        }
      }
    }

    if (!actionsBar) {
      // Second fallback: find the <hr> which usually precedes the action bar
      const hr = postEl.querySelector('hr');
      if (hr && hr.nextElementSibling) {
        actionsBar = hr.nextElementSibling;
      }
    }

    if (!actionsBar) {
      return; // Silently skip elements where we can't find an action bar
    }

    // Skip if this specific actionsBar has already been processed
    if (actionsBar.hasAttribute(PROCESSED_ATTR)) return;
    actionsBar.setAttribute(PROCESSED_ATTR, "true");

    // Create the container and button
    const container = document.createElement("div");
    container.className = "laid-container";

    const btn = createAnalyzeButton();
    container.appendChild(btn);

    // Insert the container into the social actions bar
    actionsBar.appendChild(container);

    // Attach click handler
    btn.addEventListener("click", () => {
      handleAnalyzeClick(postEl, btn, container);
    });
  }

  /**
   * Scans the page for all feed posts and processes them.
   */
  function scanForPosts() {
    const posts = document.querySelectorAll(SELECTORS.feedPost);
    posts.forEach(processPost);
  }

  // ── MutationObserver ───────────────────────────────────────────

  /**
   * Observes the DOM for dynamically loaded posts (infinite scroll, etc.)
   */
  const observer = new MutationObserver((mutations) => {
    let shouldScan = false;

    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        shouldScan = true;
        break;
      }
    }

    if (shouldScan) {
      // Debounce: wait a short time for LinkedIn to finish rendering
      clearTimeout(observer._debounceTimer);
      observer._debounceTimer = setTimeout(scanForPosts, 500);
    }
  });

  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Initial scan
  scanForPosts();

  console.log("[LinkedIn AI Detector] Observer started, initial scan complete.");
})();
