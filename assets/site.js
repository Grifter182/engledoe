/* ==========================================================================
   WS Engledoe & Sons — shared site behaviour
   Loaded on every page. Handles the theme, the shared header, the language
   selector, the policy enquiry dialog and soft navigation (which keeps the
   header and footer DOM alive between page changes).
   ========================================================================== */
(function () {
    'use strict';

    var LANGS = ['af', 'xh', 'zu'];

    /* --- helpers ---------------------------------------------------------- */
    function langOf(pathname) {
        for (var i = 0; i < LANGS.length; i++) {
            if (pathname === '/' + LANGS[i] || pathname.indexOf('/' + LANGS[i] + '/') === 0) return LANGS[i];
        }
        return 'en';
    }

    function drawIcons() {
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            try { window.lucide.createIcons(); } catch (e) { /* icons are decorative */ }
        }
    }

    /* --- theme ----------------------------------------------------------- */
    function isDark() {
        return document.documentElement.classList.contains('dark-mode');
    }

    function paintThemeIcons() {
        var name = isDark() ? 'sun' : 'moon';
        var icons = document.querySelectorAll('[data-theme-icon]');
        for (var i = 0; i < icons.length; i++) {
            icons[i].setAttribute('data-lucide', name);
            icons[i].removeAttribute('class');
            icons[i].className = 'w-5 h-5';
        }
        var buttons = document.querySelectorAll('[data-theme-toggle]');
        for (var j = 0; j < buttons.length; j++) {
            buttons[j].setAttribute('aria-pressed', isDark() ? 'true' : 'false');
        }
        drawIcons();
    }

    function toggleTheme() {
        var dark = !isDark();
        document.documentElement.classList.toggle('dark-mode', dark);
        document.body.classList.toggle('dark-mode', dark);
        try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch (e) { /* private mode */ }
        paintThemeIcons();
    }

    /* --- language -------------------------------------------------------- */
    /* Only the home page is translated, so a language change always lands on
       that language's home page rather than a path that does not exist. */
    function changeLanguage(lang) {
        var target = lang === 'en' ? '/' : '/' + lang + '/';
        if (target !== window.location.pathname) window.location.href = target;
    }

    /* --- header ---------------------------------------------------------- */
    var header, mobilePanel, mobileToggle;

    function cacheHeader() {
        header = document.querySelector('.site-header');
        mobilePanel = document.getElementById('mobile-menu');
        mobileToggle = document.getElementById('mobile-menu-button');
    }

    function setMobileMenu(open) {
        if (!mobilePanel || !mobileToggle) return;
        mobilePanel.classList.toggle('is-open', open);
        mobileToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        var icon = mobileToggle.querySelector('i');
        if (icon) {
            icon.setAttribute('data-lucide', open ? 'x' : 'menu');
            icon.removeAttribute('class');
            drawIcons();
        }
    }

    function onScroll() {
        if (header) header.classList.toggle('is-scrolled', window.scrollY > 8);
    }

    /* Marks the nav item matching the current URL. Runs again after every
       soft navigation so the shared header stays in step with the content. */
    function markActiveNav() {
        var path = window.location.pathname.replace(/index\.html$/, '');
        var links = document.querySelectorAll('.nav-link, .mobile-link, .related-link');
        for (var i = 0; i < links.length; i++) {
            var link = links[i];
            var href = link.getAttribute('href') || '';
            link.removeAttribute('aria-current');
            if (!href || href.indexOf('#') !== -1 || href.indexOf('tel:') === 0 || href.indexOf('mailto:') === 0) continue;
            var linkPath;
            try { linkPath = new URL(href, window.location.href).pathname.replace(/index\.html$/, ''); } catch (e) { continue; }
            if (linkPath === path) link.setAttribute('aria-current', 'page');
        }
    }

    /* --- policy enquiry dialog ------------------------------------------- */
    function initEnquiryDialog() {
        var dialog = document.getElementById('enquiry-dialog');
        if (!dialog || dialog.dataset.ready === 'true') return;
        dialog.dataset.ready = 'true';

        var openers = document.querySelectorAll('[data-open-enquiry]');
        for (var i = 0; i < openers.length; i++) {
            openers[i].addEventListener('click', function () {
                if (typeof dialog.showModal === 'function') {
                    dialog.showModal();
                    document.body.classList.add('dialog-open');
                } else {
                    dialog.setAttribute('open', '');
                }
            });
        }
        var closer = dialog.querySelector('[data-close-enquiry]');
        if (closer) closer.addEventListener('click', function () { dialog.close(); });
        dialog.addEventListener('close', function () { document.body.classList.remove('dialog-open'); });
        dialog.addEventListener('click', function (event) {
            if (event.target === dialog) dialog.close();
        });
    }

    /* --- soft navigation ------------------------------------------------- */
    /* Fetches the next page and swaps only <main>, so the header, footer and
       floating call button are never re-created. Any failure falls straight
       back to a normal browser navigation. */
    var softNavEnabled = !!(window.fetch && window.DOMParser && window.history && window.history.pushState);
    var progress;

    function metaContent(doc, selector) {
        var el = doc.querySelector(selector);
        return el ? el.getAttribute('content') : null;
    }

    function syncHead(doc) {
        if (doc.title) document.title = doc.title;

        var pairs = [
            ['meta[name="description"]', 'content'],
            ['meta[property="og:title"]', 'content'],
            ['meta[property="og:description"]', 'content'],
            ['meta[property="og:url"]', 'content'],
            ['meta[property="og:type"]', 'content']
        ];
        for (var i = 0; i < pairs.length; i++) {
            var value = metaContent(doc, pairs[i][0]);
            var current = document.querySelector(pairs[i][0]);
            if (value === null || !current) continue;
            current.setAttribute('content', value);
        }

        var newCanonical = doc.querySelector('link[rel="canonical"]');
        var canonical = document.querySelector('link[rel="canonical"]');
        if (newCanonical && canonical) canonical.setAttribute('href', newCanonical.getAttribute('href'));
    }

    function applyScroll(hash) {
        if (hash) {
            var target = document.getElementById(hash.slice(1));
            if (target) {
                target.scrollIntoView();
                return;
            }
        }
        window.scrollTo(0, 0);
    }

    function afterSwap() {
        cacheHeader();
        setMobileMenu(false);
        markActiveNav();
        paintThemeIcons();
        initEnquiryDialog();
        drawIcons();
        onScroll();
    }

    function swapMain(doc, hash) {
        var incoming = doc.querySelector('main');
        var current = document.querySelector('main');
        if (!incoming || !current || !current.parentNode) throw new Error('no main element');

        current.parentNode.replaceChild(document.importNode(incoming, true), current);
        syncHead(doc);
        afterSwap();
        applyScroll(hash);
    }

    function navigate(url, push, hash) {
        document.body.classList.add('is-navigating');

        fetch(url.href, { credentials: 'same-origin', headers: { 'X-Soft-Nav': '1' } })
            .then(function (response) {
                if (!response.ok) throw new Error('bad status ' + response.status);
                var type = response.headers.get('content-type') || '';
                if (type.indexOf('text/html') === -1) throw new Error('not html');
                return response.text();
            })
            .then(function (html) {
                var doc = new DOMParser().parseFromString(html, 'text/html');
                if (push) window.history.pushState({ softNav: true }, '', url.href);

                if (typeof document.startViewTransition === 'function' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                    document.startViewTransition(function () { swapMain(doc, hash); });
                } else {
                    swapMain(doc, hash);
                }
                document.body.classList.remove('is-navigating');
            })
            .catch(function () {
                window.location.href = url.href;
            });
    }

    function shouldIntercept(anchor, event) {
        if (!softNavEnabled) return false;
        if (event.defaultPrevented || event.button !== 0) return false;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
        if (!anchor || anchor.hasAttribute('download') || anchor.hasAttribute('data-no-swap')) return false;

        var target = anchor.getAttribute('target');
        if (target && target !== '_self') return false;

        var url;
        try { url = new URL(anchor.href, window.location.href); } catch (e) { return false; }
        if (url.origin !== window.location.origin) return false;
        if (url.protocol !== window.location.protocol) return false;
        if (!/(\.html|\/)$/.test(url.pathname)) return false;
        if (langOf(url.pathname) !== langOf(window.location.pathname)) return false;
        if (url.pathname === window.location.pathname) return false;

        return url;
    }

    function initSoftNav() {
        if (!softNavEnabled) return;

        progress = document.createElement('div');
        progress.className = 'nav-progress';
        document.body.appendChild(progress);

        document.addEventListener('click', function (event) {
            var anchor = event.target && event.target.closest ? event.target.closest('a[href]') : null;
            if (!anchor) return;
            var url = shouldIntercept(anchor, event);
            if (!url) return;
            event.preventDefault();
            navigate(url, true, url.hash);
        });

        window.addEventListener('popstate', function () {
            var url = new URL(window.location.href);
            if (langOf(url.pathname) !== langOf(document.documentElement.getAttribute('data-lang-path') || '/')) {
                window.location.reload();
                return;
            }
            navigate(url, false, url.hash);
        });
    }

    /* --- boot ------------------------------------------------------------ */
    function init() {
        document.documentElement.setAttribute('data-lang-path', window.location.pathname);
        if (isDark()) document.body.classList.add('dark-mode');
        cacheHeader();

        if (mobileToggle) {
            mobileToggle.addEventListener('click', function () {
                setMobileMenu(!mobilePanel.classList.contains('is-open'));
            });
        }

        document.addEventListener('click', function (event) {
            var toggle = event.target && event.target.closest ? event.target.closest('[data-theme-toggle]') : null;
            if (toggle) {
                event.preventDefault();
                toggleTheme();
            }

            /* Printable guides: the print stylesheet strips the site chrome. */
            var print = event.target && event.target.closest ? event.target.closest('[data-print-page]') : null;
            if (print) {
                event.preventDefault();
                window.print();
            }
        });

        document.addEventListener('change', function (event) {
            var select = event.target;
            if (select && select.matches && select.matches('[data-lang-select]')) changeLanguage(select.value);
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && mobilePanel && mobilePanel.classList.contains('is-open')) setMobileMenu(false);
        });

        window.addEventListener('scroll', onScroll, { passive: true });

        markActiveNav();
        paintThemeIcons();
        initEnquiryDialog();
        drawIcons();
        onScroll();
        initSoftNav();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    /* Kept on window for the inline handlers that older pages may still use. */
    window.toggleTheme = toggleTheme;
    window.changeLanguage = changeLanguage;
})();
