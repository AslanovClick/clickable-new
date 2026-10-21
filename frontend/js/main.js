/* Please, don't do shit-code  */
Element.prototype.closest || (Element.prototype.closest = function (t) { for (var e = this; e;) { if (e.matches(t)) return e; e = e.parentElement } return null });

Element.prototype.matches || (Element.prototype.matches = Element.prototype.matchesSelector || Element.prototype.webkitMatchesSelector || Element.prototype.mozMatchesSelector || Element.prototype.msMatchesSelector);

Object.assign || Object.defineProperty(Object, "assign", { enumerable: !1, configurable: !0, writable: !0, value: function (e) { "use strict"; if (null == e) throw new TypeError("Cannot convert first argument to object"); for (var t = Object(e), n = 1; n < arguments.length; n++) { var o = arguments[n]; if (null != o) for (var a = Object.keys(Object(o)), c = 0, b = a.length; c < b; c++) { var i = a[c], l = Object.getOwnPropertyDescriptor(o, i); void 0 !== l && l.enumerable && (t[i] = o[i]) } } return t } });

window.NodeList && !NodeList.prototype.forEach && (NodeList.prototype.forEach = Array.prototype.forEach);

(function () {
    var APP = window.APP = window.APP || {};

    APP.boot = function () {
        if (APP.booted) return;
        var U;
        try {
            APP.initCore();
            U = APP.utils;
            APP.reveal.init();
            APP.stage.init();
            APP.hero.init();
            APP.ui.init();
            APP.widgets.init();
            APP.globe.init();
            APP.marquee.init(U.$('[data-marquee]'));
            APP.cursor.init();
            APP.rest.init();
        } catch (e) {
            console.error(e);
            document.documentElement.classList.add('is-loaded');
            return;
        }
        APP.booted = true;

        var fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
        var fontsSafe = Promise.race([fonts, new Promise(function (r) { setTimeout(r, 3000); })]);

        // всё, что меряет текст, — после шрифтов
        fontsSafe.then(function () {
            try {
                APP.hero.build();
                APP.ui.reel();
                APP.ui.process();
                APP.ui.reveals();
                APP.ui.aboutPhoto();
                APP.ui.footerMark();
                APP.ui.footer();
                APP.ui.nav();
                var mq = U.$('[data-marquee]');
                if (mq) {
                    ScrollTrigger.create({
                        trigger: mq,
                        start: 'top bottom',
                        end: 'bottom top',
                        onToggle: function (st) { APP.marquee.setActive(st.isActive); }
                    });
                }
                APP.onResize(APP.text.refresh);
                ScrollTrigger.sort();
                ScrollTrigger.refresh();
                // после перезагрузки — на запомненную секцию, но в её «готовом» состоянии
                APP.rest.restore();
            } catch (e) {
                console.error(e);
            }
            document.documentElement.classList.add('is-ready');
        });

        // пока идёт загрузка, страница для скринридеров «занята»
        var main = document.getElementById('main');
        if (main) main.setAttribute('aria-busy', 'true');

        APP.preloader(fontsSafe, function () {
            APP.rest.settle();
            if (APP.lenis) APP.lenis.start();
            if (main) main.removeAttribute('aria-busy');
            APP.hero.intro();
        });
    };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { APP.boot(); });
    else APP.boot();
})();
