// ==UserScript==
// @name         YouTube Optimized: No Ads, No Shorts, No Popups
// @description  Instantly skips ads, removes shorts, and bypasses ad-block detection on YouTube.
// @namespace    CowanTUBE
// @version      2.0
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
        shortsSelectors: [
            'ytd-reel-shelf-renderer',
            'ytd-rich-shelf-renderer[is-shorts]',
            'ytd-mini-guide-entry-renderer[aria-label="Shorts"]',
            'ytd-guide-entry-renderer:has(a[title="Shorts"])',
            'ytd-reel-video-renderer'
        ],
        popupSelectors: [
            'ytd-enforcement-message-view-model',
            'yt-playability-error-supported-renderers:has(ytd-enforcement-message-view-model)',
            'tp-yt-iron-overlay-backdrop',
            'ytd-popup-container:has(a[href="/premium"])'
        ]
    };

    // Inject CSS to hide unwanted elements immediately
    const injectCSS = () => {
        const css = [
            ...CONFIG.adSelectors,
            ...CONFIG.shortsSelectors,
            ...CONFIG.popupSelectors
        ].map(s => `${s} { display: none !important; }`).join('\n');

        const style = document.createElement('style');
        style.id = 'yt-optimized-styles';
        style.textContent = css;
        (document.head || document.documentElement).appendChild(style);
    };

    // Fast-skip ads
    const handleVideoAds = () => {
        const player = document.querySelector('.html5-video-player');
        const video = document.querySelector('video');
        if (!video || !player) return;

        if (player.classList.contains('ad-showing') || player.classList.contains('ad-interrupting')) {
            // Mute ad
            video.muted = true;
            
            // Speed up ad (some ads are not skippable but can be fast-forwarded)
            video.playbackRate = 16; 

            // Click skip buttons
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

            // Fast forward to end
            if (isFinite(video.duration) && video.duration > 0) {
                video.currentTime = video.duration - 0.1;
            }
        }
    };

    // Handle "Ad blocker detected" and other popups
    const handlePopups = () => {
        const enforcement = document.querySelector('ytd-enforcement-message-view-model');
        if (enforcement) {
            // Instead of replacing with iframe (which breaks things), 
            // we try to remove the message and resume the video.
            // If YouTube has completely disabled the player, this might need more logic.
            const player = document.querySelector('.html5-main-video');
            enforcement.remove();
            
            // Remove backdrops that dim the screen
            document.querySelectorAll('tp-yt-iron-overlay-backdrop').forEach(el => el.remove());
            
            if (player && player.paused) {
                player.play().catch(() => {
                    // If play fails, we might be in a hard-blocked state.
                    // Fallback to the iframe replacement only if necessary.
                    // But for now, let's try to just refresh the player state.
                });
            }
        }

        // Auto-close "Try Premium" popups
        const premiumPop = document.querySelector('ytd-popup-container:has(a[href="/premium"])');
        if (premiumPop) premiumPop.remove();
    };

    // Remove shorts from various places
    const handleShorts = () => {
        // Remove shelf renderers
        document.querySelectorAll('ytd-reel-shelf-renderer, ytd-rich-shelf-renderer').forEach(shelf => {
            if (shelf.querySelector('[overlay-style="SHORTS"]') || shelf.hasAttribute('is-shorts')) {
                shelf.remove();
            }
        });

        // Remove Shorts from sidebar
        const sidebarShorts = document.querySelector('ytd-guide-entry-renderer:has(a[title="Shorts"]), ytd-mini-guide-entry-renderer[aria-label="Shorts"]');
        if (sidebarShorts) sidebarShorts.remove();
    };

    // Optimized Observer
    let timeout = null;
    const observer = new MutationObserver(() => {
        if (timeout) return;
        
        timeout = setTimeout(() => {
            handleVideoAds();
            handlePopups();
            handleShorts();
            timeout = null;
        }, 100); // Throttled to 100ms for performance
    });

    const init = () => {
        injectCSS();
        
        // Start observing
        observer.observe(document.body || document.documentElement, {
            childList: true,
            subtree: true
        });

        // Initial run
        handleVideoAds();
        handlePopups();
        handleShorts();

        // Listen for navigation (YouTube is a SPA)
        window.addEventListener('yt-navigate-finish', () => {
            handleVideoAds();
            handlePopups();
            handleShorts();
        });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Secondary check for video ads specifically on timeupdate
    // This ensures ads are skipped even if mutations aren't firing fast enough
    document.addEventListener('timeupdate', (e) => {
        if (e.target.tagName === 'VIDEO') {
            handleVideoAds();
        }
    }, true);

})();
