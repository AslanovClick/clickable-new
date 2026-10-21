/* Интерфейс: шапка, меню, якоря, магнитные кнопки, наклон карточек, навигация, пин процесса, шоурил, появления секций */
(function () {
    var APP = window.APP = window.APP || {};
    var U, S;
    var menuOpen = false;
    var menuApi = null;

    function header() {
        var el = U.$('[data-header]');
        var lastY = 0;
        var hidden = false;
        var scrolled = false;
        var light = false;
        var lights = [];
        // где на странице светлые секции — шапка над ними перекрашивается
        ScrollTrigger.addEventListener('refresh', function () {
            lights = U.$$('.sec--light').map(function (s) {
                var r = s.getBoundingClientRect();
                return [r.top + window.scrollY, r.bottom + window.scrollY];
            });
        });
        // клавиатурный фокус внутри шапки — шапку не прячем
        el.addEventListener('focusin', function () {
            hidden = false;
            el.classList.remove('is-hidden');
        });
        APP.onTick(function () {
            var y = S.scroll;
            var sc = y > 40;
            if (sc !== scrolled) {
                scrolled = sc;
                el.classList.toggle('is-scrolled', sc);
            }
            var mid = y + 40;
            var l = lights.some(function (r) { return mid >= r[0] && mid < r[1]; }) && !menuOpen;
            if (l !== light) {
                light = l;
                el.classList.toggle('is-light', l);
            }
            var dy = y - lastY;
            if (Math.abs(dy) > 6) {
                var h = dy > 0 && y > S.vh * 0.6 && !menuOpen && !el.contains(document.activeElement);
                if (h !== hidden) {
                    hidden = h;
                    el.classList.toggle('is-hidden', h);
                }
                lastY = y;
            }
        });
    }

    function menu() {
        var btn = U.$('[data-burger]');
        var m = U.$('[data-menu]');
        if (!btn || !m) return;
        var links = U.$$('.menu__link, .menu__lang, .menu__bottom a', m);
        var outside = U.$$('main, footer');
        var tl = gsap.timeline({ paused: true })
            .set(m, { visibility: 'visible' })
            .fromTo(m, { clipPath: 'circle(0% at 100% 0%)' }, { clipPath: 'circle(150% at 100% 0%)', duration: 0.9, ease: 'expo.inOut' })
            .fromTo(links, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', stagger: 0.05 }, '-=0.45');

        function set(open) {
            menuOpen = open;
            btn.classList.toggle('is-open', open);
            btn.setAttribute('aria-expanded', open ? 'true' : 'false');
            btn.setAttribute('aria-label', APP.t(open ? 'menuClose' : 'menuOpen'));
            // остальная страница недоступна, пока открыто меню (диалог)
            outside.forEach(function (el) { el.inert = open; });
            if (open) {
                tl.timeScale(1).play();
                if (APP.lenis) APP.lenis.stop();
                setTimeout(function () { links[0].focus(); }, 60);
            } else {
                tl.timeScale(1.6).reverse();
                if (APP.lenis) APP.lenis.start();
                if (m.contains(document.activeElement)) btn.focus();
            }
        }
        btn.addEventListener('click', function () { set(!menuOpen); });
        document.addEventListener('keydown', function (e) {
            if (!menuOpen) return;
            if (e.key === 'Escape') {
                set(false);
                btn.focus();
                return;
            }
            // ловушка фокуса: бургер ↔ пункты меню
            if (e.key === 'Tab') {
                var items = [btn].concat(links);
                var i = items.indexOf(document.activeElement);
                if (e.shiftKey && i <= 0) {
                    e.preventDefault();
                    items[items.length - 1].focus();
                } else if (!e.shiftKey && i === items.length - 1) {
                    e.preventDefault();
                    items[0].focus();
                }
            }
        });
        menuApi = { close: function () { if (menuOpen) set(false); } };
    }

    // выбор языка: выпадающий список в шапке; выбор запоминается (корень потом сам ведёт на эту версию)
    function langSwitch() {
        U.$$('[data-lang-link]').forEach(function (a) {
            a.addEventListener('click', function () {
                try { localStorage.setItem('clickable-lang', a.getAttribute('data-lang-link')); } catch (e) {}
            });
        });
        var root = U.$('[data-lang]');
        if (!root) return;
        var btn = U.$('[data-lang-btn]', root);
        var list = U.$('[data-lang-list]', root);
        var items = U.$$('a', list);
        var open = false;

        function set(v, focusBtn) {
            open = v;
            root.classList.toggle('is-open', v);
            btn.setAttribute('aria-expanded', v ? 'true' : 'false');
            if (v) items[0].focus({ preventScroll: true });
            else if (focusBtn) btn.focus({ preventScroll: true });
        }

        btn.addEventListener('click', function () { set(!open); });
        document.addEventListener('click', function (e) { if (open && !root.contains(e.target)) set(false); });
        root.addEventListener('keydown', function (e) {
            if (!open) return;
            var i = items.indexOf(document.activeElement);
            if (e.key === 'Escape') {
                e.preventDefault();
                set(false, true);
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                items[(i + 1) % items.length].focus();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                items[(i - 1 + items.length) % items.length].focus();
            }
        });
        root.addEventListener('focusout', function (e) { if (open && !root.contains(e.relatedTarget)) set(false); });
        // шапка уехала при скролле — список закрываем
        window.addEventListener('scroll', function () { if (open) set(false); }, { passive: true });
    }

    // дальний переход: шторка закрывает экран → страница мгновенно встаёт на цель → шторка уходит вверх.
    // Близкие цели (до ~1.6 экрана) — обычный плавный скролл
    function jump() {
        var el = U.$('[data-jump]');
        var red = U.$('[data-jump-red]', el);
        var ink = U.$('[data-jump-ink]', el);
        var a = U.$('.jump__a', el);
        var label = U.$('[data-jump-label]', el);
        var labels = APP.t('sections') || {};
        var busy = false;

        APP.jumpTo = function (target, id, done) {
            var y = typeof target === 'number' ? target : target.getBoundingClientRect().top + window.scrollY;
            var far = Math.abs(y - window.scrollY) > S.vh * 1.6;
            if (!el || S.reduced || !far) {
                APP.scrollTo(target, done);
                return;
            }
            if (busy) return;
            busy = true;
            var l = labels[id] || ['', ''];
            label.innerHTML = '';
            if (l[0]) {
                var num = document.createElement('b');
                num.textContent = '[' + l[0] + ']';
                label.appendChild(num);
            }
            var txt = document.createElement('span');
            txt.textContent = l[1];
            label.appendChild(txt);

            gsap.timeline({
                onComplete: function () {
                    busy = false;
                    if (done) done();
                }
            })
                .set(el, { visibility: 'visible', pointerEvents: 'auto' })
                .fromTo(red, { y: 0, yPercent: 100 }, { yPercent: 0, duration: 0.55, ease: 'power3.inOut' }, 0)
                .fromTo(ink, { y: 0, yPercent: 100 }, { yPercent: 0, duration: 0.55, ease: 'power3.inOut' }, 0.08)
                .fromTo(a, { scale: 0.6, rotation: -12, opacity: 0 }, { scale: 1, rotation: 0, opacity: 1, duration: 0.7, ease: 'expo.out' }, 0.32)
                .add(function () { APP.text.scramble(txt, { per: 0.03, dur: 0.35 }).play(); }, 0.36)
                // экран закрыт — прыгаем (пины и сцены пересчитываются, пока шторка стоит)
                .add(function () { APP.rest.go(y); }, 0.66)
                .to(a, { scale: 1.12, opacity: 0, duration: 0.35, ease: 'power2.in' }, 1.02)
                .to(label, { opacity: 0, y: -10, duration: 0.3, ease: 'power2.in' }, 1.02)
                .to(ink, { yPercent: -100, duration: 0.6, ease: 'power3.inOut' }, 1.1)
                .to(red, { yPercent: -100, duration: 0.6, ease: 'power3.inOut' }, 1.18)
                .set(label, { opacity: 1, y: 0 })
                .set(el, { visibility: 'hidden', pointerEvents: 'none' });
        };
    }

    function anchors() {
        document.addEventListener('click', function (e) {
            var a = e.target.closest('a[href^="#"]');
            if (!a) return;
            var id = a.getAttribute('href');
            if (id === '#') {
                e.preventDefault();
                return;
            }
            var t = U.$(id);
            if (!t) return;
            e.preventDefault();
            if (menuApi) menuApi.close();
            // глава/пин — сразу в «готовое» состояние
            APP.jumpTo(id === '#home' ? 0 : APP.rest.target(t), id);
            // фокус — на цель якоря, чтобы клавиатура и скринридер продолжили оттуда
            if (!t.hasAttribute('tabindex')) t.setAttribute('tabindex', '-1');
            t.focus({ preventScroll: true });
        });
    }

    function magnetic() {
        if (S.isTouch || S.reduced) return;
        U.$$('[data-magnetic]').forEach(function (el) {
            var xTo = gsap.quickTo(el, 'x', { duration: 0.7, ease: 'power3.out' });
            var yTo = gsap.quickTo(el, 'y', { duration: 0.7, ease: 'power3.out' });
            el.addEventListener('mousemove', function (e) {
                var r = el.getBoundingClientRect();
                xTo((e.clientX - r.left - r.width / 2) * 0.25);
                yTo((e.clientY - r.top - r.height / 2) * 0.35);
            });
            el.addEventListener('mouseleave', function () {
                xTo(0);
                yTo(0);
            });
        });
    }

    // наклон к курсору + подсветка, бегущая за курсором
    function tilt() {
        if (S.isTouch || S.reduced) return;
        function spot(card, e) {
            var r = card.getBoundingClientRect();
            var px = (e.clientX - r.left) / r.width;
            var py = (e.clientY - r.top) / r.height;
            card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
            card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
            return [px, py];
        }
        U.$$('[data-tilt]').forEach(function (card) {
            gsap.set(card, { transformPerspective: 1000 });
            var rx = gsap.quickTo(card, 'rotationX', { duration: 0.9, ease: 'power3.out' });
            var ry = gsap.quickTo(card, 'rotationY', { duration: 0.9, ease: 'power3.out' });
            card.addEventListener('mousemove', function (e) {
                var p = spot(card, e);
                rx((0.5 - p[1]) * 6);
                ry((p[0] - 0.5) * 8);
            });
            card.addEventListener('mouseleave', function () {
                rx(0);
                ry(0);
            });
        });
        U.$$('[data-step], .brief').forEach(function (card) {
            card.addEventListener('mousemove', function (e) { spot(card, e); });
        });
    }

    function nav() {
        var navEl = U.$('[data-nav]');
        if (!navEl) return;
        var links = U.$$('.nav__link', navEl);
        var ind = U.$('[data-nav-indicator]', navEl);
        var current = null;

        function move(link, instant) {
            if (!link) {
                gsap.to(ind, { scaleX: 0, duration: instant ? 0 : 0.6, ease: 'expo.out' });
                return;
            }
            gsap.to(ind, { x: link.offsetLeft, scaleX: link.offsetWidth / 100, duration: instant ? 0 : 0.8, ease: 'expo.out' });
        }

        function setActive(link) {
            if (link === current) return;
            if (current) {
                current.classList.remove('is-active');
                current.removeAttribute('aria-current');
            }
            if (link) {
                link.classList.add('is-active');
                link.setAttribute('aria-current', 'true');
            }
            current = link;
            move(link);
        }

        links.forEach(function (l, i) {
            l.addEventListener('mouseenter', function () { move(l); });
            var target = U.$(l.getAttribute('href'));
            if (!target) return;
            var last = i === links.length - 1;
            ScrollTrigger.create({
                trigger: target,
                start: last ? 'top 85%' : 'top 55%',
                end: last ? 'bottom bottom' : 'bottom 55%',
                onToggle: function (st) {
                    if (st.isActive) setActive(l);
                    else if (current === l && !st.isActive && i === 0 && st.direction < 0) setActive(null);
                }
            });
        });
        navEl.addEventListener('mouseleave', function () { move(current); });
        move(null, true);
        APP.onResize(function () { move(current, true); });
    }

    // пин: секция прилипает, шаги едут горизонтально, буквы-осколки собираются
    function process() {
        var sec = U.$('[data-process]');
        if (!sec) return;
        var track = U.$('[data-process-track]', sec);
        var bar = U.$('[data-process-bar]', sec);
        var idx = U.$('[data-process-index]', sec);
        var steps = U.$$('[data-step]', sec);
        var last = 0;

        APP.reveal.onEnter(U.$('.process__head', sec), 'top 75%');
        gsap.fromTo(track, { opacity: 0, y: 90 }, {
            opacity: 1,
            y: 0,
            duration: 1.4,
            ease: 'power3.out',
            scrollTrigger: { trigger: sec, start: 'top 70%', once: true }
        });

        function dist() { return Math.max(0, track.scrollWidth - S.vw); }

        var tween = gsap.to(track, {
            x: function () { return -dist(); },
            ease: 'none',
            scrollTrigger: {
                trigger: sec,
                start: 'top top',
                end: function () { return '+=' + dist(); },
                pin: true,
                scrub: true,
                invalidateOnRefresh: true,
                // пин сдвигает всё ниже — пересчитывается раньше остальных триггеров
                refreshPriority: 1,
                onUpdate: function (st) {
                    bar.style.transform = 'scaleX(' + st.progress.toFixed(4) + ')';
                    var n = 1 + Math.round(st.progress * (steps.length - 1));
                    if (n !== last) {
                        last = n;
                        idx.textContent = '0' + n;
                    }
                }
            }
        });

        steps.forEach(function (step) {
            gsap.fromTo(step, { opacity: 0.35, scale: 0.94 }, {
                opacity: 1,
                scale: 1,
                ease: 'power2.out',
                scrollTrigger: { trigger: step, containerAnimation: tween, start: 'left 100%', end: 'left 60%', scrub: true }
            });
        });

        // «готовые» точки пина: целые шаги счётчика 01…05
        APP.rest.zone(function () {
            var st = tween.scrollTrigger;
            if (!st || st.end <= st.start) return null;
            return {
                el: sec,
                start: st.start,
                end: st.end,
                points: steps.map(function (s, i) { return st.start + (i / (steps.length - 1)) * (st.end - st.start); })
            };
        });
    }

    // шоурил: рамка раскрывается до полного экрана, видео играет только в кадре
    function reel() {
        var sec = U.$('[data-reel]');
        if (!sec) return;
        var box = U.$('[data-reel-box]', sec);
        var video = U.$('[data-reel-video]', sec);
        APP.reveal.onEnter(U.$('.reel__content', sec), 'top 60%');
        if (!S.reduced) {
            gsap.fromTo(box, { clipPath: 'inset(12% 9% 12% 9% round 18px)' }, {
                clipPath: 'inset(0% 0% 0% 0% round 0px)',
                ease: 'none',
                scrollTrigger: { trigger: box, start: 'top 92%', end: 'top 8%', scrub: true }
            });
            gsap.fromTo(video, { scale: 1.18 }, {
                scale: 1,
                ease: 'none',
                scrollTrigger: { trigger: box, start: 'top bottom', end: 'bottom top', scrub: true }
            });
        }
        ScrollTrigger.create({
            trigger: box,
            start: 'top bottom',
            end: 'bottom top',
            onToggle: function (st) {
                if (st.isActive) {
                    if (!video.src) video.src = video.getAttribute('data-src');
                    if (!S.reduced) video.play().catch(function () {});
                } else {
                    video.pause();
                }
            }
        });
        U.$('[data-reel-play]', sec).addEventListener('click', function () { APP.widgets.reel(); });
    }

    // фото команды — параллакс внутри рамки
    function aboutPhoto() {
        var img = U.$('[data-about-img]');
        if (!img || S.reduced) return;
        gsap.fromTo(img, { yPercent: -7 }, {
            yPercent: 7,
            ease: 'none',
            scrollTrigger: { trigger: img.parentNode, start: 'top bottom', end: 'bottom top', scrub: true }
        });
    }

    // огромный логотип в подвале: буквы поднимаются волной
    function footerMark() {
        var mark = U.$('[data-footer-mark]');
        if (!mark) return;
        var chars = U.$$('span', mark);
        if (S.reduced) return;
        gsap.set(chars, { yPercent: 100, opacity: 0 });
        ScrollTrigger.create({
            trigger: mark,
            start: 'top 95%',
            once: true,
            onEnter: function () {
                gsap.to(chars, { yPercent: 0, opacity: 1, duration: 1.2, ease: 'expo.out', stagger: 0.06 });
                chars.forEach(function (c, i) {
                    gsap.delayedCall(0.5 + i * 0.08, function () {
                        c.classList.add('is-lit');
                        gsap.delayedCall(0.45, function () { c.classList.remove('is-lit'); });
                    });
                });
            }
        });
    }

    // появления: заголовки секций — «сценой», карточки — пачками по мере появления
    function reveals() {
        U.$$('.sec__head, .about__top, .about__stats, .about__proof, .about__faq-head, .geo__info, .contact__main, .slider__head, .work__foot').forEach(function (scope) {
            APP.reveal.onEnter(scope, 'top 80%');
        });
        var items = U.$$('.acc__item[data-card], .case[data-card]');
        if (!items.length) return;
        if (S.reduced) return;
        gsap.set(items, { opacity: 0, y: 50 });
        ScrollTrigger.batch(items, {
            start: 'top 92%',
            once: true,
            // при прыжке по якорю в пачку попадает всё, что выше, — анимируем только видимое, остальное показываем сразу
            onEnter: function (batch) {
                var vis = batch.filter(function (el) {
                    var r = el.getBoundingClientRect();
                    return r.bottom > 0 && r.top < S.vh;
                });
                gsap.set(batch.filter(function (el) { return vis.indexOf(el) < 0; }), { opacity: 1, y: 0, overwrite: true });
                gsap.to(vis, { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', stagger: 0.08, overwrite: true });
            }
        });
    }

    APP.ui = {
        init: function () {
            U = APP.utils;
            S = APP.state;
            header();
            menu();
            langSwitch();
            jump();
            anchors();
            magnetic();
            tilt();
            U.$$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
        },
        nav: nav,
        process: process,
        reel: reel,
        aboutPhoto: aboutPhoto,
        footerMark: footerMark,
        reveals: reveals,
        footer: function () { APP.reveal.fades(U.$('.footer')); }
    };
})();
