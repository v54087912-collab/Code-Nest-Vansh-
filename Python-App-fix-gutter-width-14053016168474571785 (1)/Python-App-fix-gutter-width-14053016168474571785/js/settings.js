// Settings Manager

const themes = [
    { id: 'dark', name: 'Dark Mode', type: 'dark' },
    { id: 'light', name: 'Light Mode', type: 'light' },
    { id: 'amoled', name: 'AMOLED Black', type: 'dark' },
    { id: 'minimal-white', name: 'Minimal White', type: 'light' },
    { id: 'neon-cyber', name: 'Neon Cyber', type: 'dark' },
    { id: 'material-you', name: 'Material You', type: 'dark' },
    { id: 'glassmorphism', name: 'Glassmorphism', type: 'dark' },
    { id: 'flat', name: 'Flat Design', type: 'light' },
    { id: 'gradient', name: 'Gradient Flow', type: 'dark' },
    { id: 'pastel', name: 'Pastel Soft', type: 'light' },
    { id: 'hacker', name: 'Hacker Terminal', type: 'dark' },
    { id: 'retro', name: 'Retro Pixel', type: 'dark' },
    { id: 'futuristic', name: 'Futuristic AI', type: 'dark' },
    { id: 'nature', name: 'Nature Green', type: 'dark' },
    { id: 'ocean', name: 'Ocean Blue', type: 'dark' },
    { id: 'sunset', name: 'Sunset Orange', type: 'dark' },
    { id: 'monochrome', name: 'Monochrome', type: 'dark' },
    { id: 'high-contrast', name: 'High Contrast', type: 'dark' },
    { id: 'frosted', name: 'Frosted Blur', type: 'light' },
    { id: 'classic', name: 'Classic Professional', type: 'light' }
];

const fontSizes = [
    { id: '12px', name: '12px' },
    { id: '14px', name: '14px' },
    { id: '16px', name: '16px' },
    { id: '18px', name: '18px' },
    { id: '20px', name: '20px' },
    { id: '24px', name: '24px' }
];

const gutterWidths = [
    { id: 'compact', name: 'Compact (Min)', desc: 'Absolute minimum width' },
    { id: 'normal', name: 'Normal', desc: 'Standard padding' },
    { id: 'wide', name: 'Wide', desc: 'Extra space for readability' }
];

let currentTheme = 'dark';
let currentFontSize = '14px';
let currentGutterWidth = 'compact';

export function initSettings() {
    loadSettings();
    // Apply immediately on load
    applyTheme(currentTheme, false); // false = don't dispatch yet if editor not ready, but script.js handles init
    applyFontSize(currentFontSize);
    applyGutterWidth(currentGutterWidth);
    bindEvents();
}

function loadSettings() {
    const savedTheme = localStorage.getItem('pyide_theme');
    if (savedTheme) currentTheme = savedTheme;

    const savedSize = localStorage.getItem('pyide_fontsize');
    if (savedSize) currentFontSize = savedSize;

    const savedGutter = localStorage.getItem('pyide_gutterwidth');
    if (savedGutter) currentGutterWidth = savedGutter;
}

function applyTheme(themeId, dispatch = true) {
    // robustly remove all theme classes
    document.body.className = document.body.className.split(' ').filter(c => !c.startsWith('theme-')).join(' ');

    // Add new theme class (except default 'dark' which is base, but we can add explicit class too for clarity)
    if (themeId !== 'dark') {
        document.body.classList.add(`theme-${themeId}`);
    }

    currentTheme = themeId;
    localStorage.setItem('pyide_theme', themeId);

    // Update UI text
    const themeNameEl = document.getElementById('current-theme-name');
    const themeObj = themes.find(t => t.id === themeId);
    if (themeNameEl && themeObj) themeNameEl.textContent = themeObj.name;

    // Update Meta Theme Color for Safe Area Status Bar
    updateMetaThemeColor();

    // Dispatch event for script.js to handle editor theme switch (light/dark syntax)
    if (dispatch) {
        const event = new CustomEvent('theme-changed', { detail: { themeId, type: themeObj ? themeObj.type : 'dark' } });
        window.dispatchEvent(event);
    }
}

function updateMetaThemeColor() {
    // We use a small timeout to ensure the CSS variables have updated in the DOM
    setTimeout(() => {
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            // Get the computed value of --color-dark
            const computedColor = getComputedStyle(document.body).getPropertyValue('--color-dark').trim();
            // If it's a valid color (not empty), set it
            if (computedColor) {
                metaThemeColor.setAttribute('content', computedColor);
            }
        }
    }, 50);
}

function applyFontSize(size) {
    document.documentElement.style.setProperty('--editor-font-size', size);
    currentFontSize = size;
    localStorage.setItem('pyide_fontsize', size);

    // Update UI text
    const sizeEl = document.getElementById('current-font-size');
    if (sizeEl) sizeEl.textContent = size;
}

function applyGutterWidth(widthId) {
    // Remove old classes
    document.body.classList.remove('gutter-compact', 'gutter-normal', 'gutter-wide');
    document.body.classList.add(`gutter-${widthId}`);

    currentGutterWidth = widthId;
    localStorage.setItem('pyide_gutterwidth', widthId);

    // Update UI text
    const gutterEl = document.getElementById('current-gutter-width');
    const gutterObj = gutterWidths.find(g => g.id === widthId);
    if (gutterEl && gutterObj) gutterEl.textContent = gutterObj.name;
}

function bindEvents() {
    const themeBtn = document.getElementById('setting-theme');
    if (themeBtn) {
        themeBtn.onclick = () => openModal('Select Theme', themes, (item) => applyTheme(item.id));
    }

    const fontBtn = document.getElementById('setting-font-size');
    if (fontBtn) {
        fontBtn.onclick = () => openModal('Select Font Size', fontSizes, (item) => applyFontSize(item.id));
    }

    const gutterBtn = document.getElementById('setting-gutter-width');
    if (gutterBtn) {
        gutterBtn.onclick = () => openModal('Select Gutter Width', gutterWidths, (item) => applyGutterWidth(item.id));
    }

    const closeBtn = document.getElementById('btn-close-selection');
    if (closeBtn) {
        closeBtn.onclick = closeModal;
    }
}

function openModal(title, items, onSelect) {
    const modal = document.getElementById('modal-selection');
    const titleEl = document.getElementById('modal-selection-title');
    const listEl = document.getElementById('modal-selection-list');

    if (!modal || !listEl) return;

    titleEl.textContent = title;
    listEl.innerHTML = '';

    items.forEach(item => {
        const div = document.createElement('div');
        div.className = "flex items-center justify-between px-4 py-3 bg-surface rounded-xl hover:bg-hoverBg cursor-pointer border-b border-border last:border-0 transition-colors";
        div.innerHTML = `<span class="text-text text-sm">${item.name}</span>`;

        // Check if selected
        if ((title.includes('Theme') && item.id === currentTheme) ||
            (title.includes('Font') && item.id === currentFontSize) ||
            (title.includes('Gutter') && item.id === currentGutterWidth)) {
            div.classList.add('bg-green-900/20');
            div.innerHTML += `<i class="fa-solid fa-check text-accent text-xs"></i>`;
        }

        div.onclick = () => {
            // Apply immediately (Real Time)
            onSelect(item);

            // Visual feedback
            Array.from(listEl.children).forEach(c => {
                c.classList.remove('bg-green-900/20');
                const icon = c.querySelector('.fa-check');
                if(icon) icon.remove();
            });
            div.classList.add('bg-green-900/20');
            div.innerHTML += `<i class="fa-solid fa-check text-accent text-xs"></i>`;

            // Optional: Close after a short delay to let user see selection?
            // Or close immediately. User asked for "Real Time Working", usually implies preview.
            // But if we close immediately, they see the result on the main UI.
            setTimeout(closeModal, 150);
        };
        listEl.appendChild(div);
    });

    modal.classList.remove('hidden');
}

function closeModal() {
    const modal = document.getElementById('modal-selection');
    if (modal) modal.classList.add('hidden');
}
