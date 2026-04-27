// ==UserScript==
// @name         YouTube Optimized: No Ads, No Shorts, No Popups
// @description  Instantly skips ads, removes shorts, and bypasses ad-block detection on YouTube.
// @namespace    CowanTUBE
// @version      2.1
// @author       Cowanbas & Gemini
// @match        *://*.youtube.com/*
// @exclude      *://*.youtube.com/embed/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const CONFIG = {
        adSelectors: [
            '#masthead-ad',
            'ytd-rich-item-renderer:has(.ytd-display-ad-renderer)',
            '.video-ads.ytp-ad-module',
            'tp-yt-paper-dialog:has(yt-mealbar-promo-renderer)',
            'ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-ads"]',
            '#related #player-ads',
            '#related ytd-ad-slot-renderer',
            'ytd-ad-slot-renderer',
            'yt-mealbar-promo-renderer',
            'ad-slot-renderer',
            'ytm-companion-ad-renderer',
            'ytd-companion-slot-renderer',
            'ytd-ad-auction-container-renderer'
        ],
        popupSelectors: [
            'ytd-enforcement-message-view-model',
            'yt-playability-error-supported-renderers:has(ytd-enforcement-message-view-model)',
            'tp-yt-iron-overlay-backdrop',
            'ytd-popup-container:has(a[href="/premium"])'
        ]
    };

    const injectCSS = () => {
        const css = [
            ...CONFIG.adSelectors,
            ...CONFIG.popupSelectors
        ].map(s => `${s} { display: none !important; }`).join('\n');

        const style = document.createElement('style');
        style.id = 'yt-optimized-styles';
        style.textContent = css;
        (document.head || document.documentElement).appendChild(style);
    };

    const handleVideoAds = () => {
        const player = document.querySelector('.html5-video-player');
        const video = document.querySelector('video');
        if (!video || !player) return;

        if (player.classList.contains('ad-showing') || player.classList.contains('ad-interrupting')) {
            video.muted = true;
            video.playbackRate = 16; 

            const skipButtons = [
                '.ytp-ad-skip-button',
                '.ytp-skip-ad-button',
                '.ytp-ad-skip-button-modern',
                '.ytp-ad-overlay-close-button'
            ];
            
            skipButtons.forEach(selector => {
                const btn = document.querySelector(selector);
                if (btn) btn.click();
            });

            if (isFinite(video.duration) && video.duration > 0) {
                video.currentTime = video.duration - 0.1;
            }
        }
    };

    const handlePopups = () => {
        const enforcement = document.querySelector('ytd-enforcement-message-view-model');
        if (enforcement) {
            enforcement.remove();
            document.querySelectorAll('tp-yt-iron-overlay-backdrop').forEach(el => el.remove());
            const player = document.querySelector('.html5-main-video');
            if (player && player.paused) {
                player.play().catch(() => {});
            }
        }

        const premiumPop = document.querySelector('ytd-popup-container:has(a[href="/premium"])');
        if (premiumPop) premiumPop.remove();
    };

    let timeout = null;
    const observer = new MutationObserver(() => {
        if (timeout) return;
        timeout = setTimeout(() => {
            handleVideoAds();
            handlePopups();
            timeout = null;
        }, 100);
    });

    const init = () => {
        injectCSS();
        observer.observe(document.body || document.documentElement, {
            childList: true,
            subtree: true
        });
        handleVideoAds();
        handlePopups();
        window.addEventListener('yt-navigate-finish', () => {
            handleVideoAds();
            handlePopups();
        });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    document.addEventListener('timeupdate', (e) => {
        if (e.target.tagName === 'VIDEO') {
            handleVideoAds();
        }
    }, true);
})();

/**
 * FEATURE: NO SHORTS
 * Hapus/Comment seluruh blok di bawah ini untuk menonaktifkan fitur pemblokir YouTube Shorts.
 */
(function() {
    'use strict';
    const shortsSelectors = [
        'ytd-reel-shelf-renderer',
        'ytd-rich-shelf-renderer[is-shorts]',
        'ytd-mini-guide-entry-renderer[aria-label="Shorts"]',
        'ytd-guide-entry-renderer:has(a[title="Shorts"])',
        'ytd-reel-video-renderer',
        'ytd-rich-section-renderer:has(ytd-rich-shelf-renderer[is-shorts])'
    ];

    const removeShorts = () => {
        // CSS-based hide
        if (!document.getElementById('hide-shorts-style')) {
            const style = document.createElement('style');
            style.id = 'hide-shorts-style';
            style.textContent = shortsSelectors.map(s => `${s} { display: none !important; }`).join('\n');
            (document.head || document.documentElement).appendChild(style);
        }

        // DOM-based cleanup for stubborn elements
        document.querySelectorAll('ytd-reel-shelf-renderer, ytd-rich-shelf-renderer').forEach(shelf => {
            if (shelf.querySelector('[overlay-style="SHORTS"]') || shelf.hasAttribute('is-shorts')) {
                const parent = shelf.closest('ytd-rich-section-renderer') || shelf;
                parent.remove();
            }
        });

        const sidebar = document.querySelector('ytd-guide-entry-renderer:has(a[title="Shorts"]), ytd-mini-guide-entry-renderer[aria-label="Shorts"]');
        if (sidebar) sidebar.remove();
    };

    const obs = new MutationObserver(removeShorts);
    obs.observe(document.documentElement, { childList: true, subtree: true });
    window.addEventListener('yt-navigate-finish', removeShorts);
    removeShorts();
})();
