// ==UserScript==
// @name Dark Mode
// @match *
// @run-at document-start
// ==/UserScript==

(function () {
	let isDark = JSON.parse(localStorage.getItem('darkMode')) || false; // Ambil status dark mode dari localStorage
	let darkStyle;

	function enableDarkMode() {
		if (!darkStyle) {
			darkStyle = document.createElement('style');
			darkStyle.id = 'dark-mode-style';
			darkStyle.textContent = `
			html {
			  color-scheme: dark !important;
			  background: #121826 !important;
			  filter: invert(0.89) hue-rotate(180deg) brightness(1) contrast(1.12) saturate(1.08) !important;
			}
			body {
			  background: #121826 !important;
			}
			img, video, picture, canvas, svg {
			  filter: invert(1) hue-rotate(180deg) brightness(1.02) contrast(1.05) saturate(1.04) !important;
			}
			`;
			//   html {
			//     background-color: #ddd;
			//     filter: hue-rotate(180deg) invert(100%) !important;
			//   }
			//   body {
			//     margin: 0;
			//     background-color: #ddd;
			//     min-height: 100vh;
			//   }
			//   iframe, img, video, canvas {
			//     filter: hue-rotate(180deg) invert(100%) !important;
			//   }
			// `;
		}
		document.head.appendChild(darkStyle);
		isDark = true;
		localStorage.setItem('darkMode', JSON.stringify(true)); // Simpan status ke localStorage
		console.log('[Dark Mode] Aktif');
	}

	function disableDarkMode() {
		if (darkStyle && darkStyle.parentNode) {
			darkStyle.parentNode.removeChild(darkStyle);
		}
		isDark = false;
		localStorage.setItem('darkMode', JSON.stringify(false)); // Simpan status ke localStorage
		console.log('[Dark Mode] Nonaktif');
	}

	function toggleDarkMode() {
		if (isDark) {
			disableDarkMode();
		} else {
			enableDarkMode();
		}
	}

	// Set toggle dengan Alt + Shift + D
	window.addEventListener('keydown', function (e) {
		if (e.altKey && e.shiftKey && e.key.toLowerCase() === 'd') {
			toggleDarkMode();
		}
	});

	// Apply dark mode jika sudah disimpan di localStorage
	if (isDark) {
		enableDarkMode();
	}

	console.log('[Dark Mode] Tekan Alt + Shift + D untuk toggle.');
})();
