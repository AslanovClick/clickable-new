/* Виджеты: аккордеоны (+ превью за курсором), табы с бегущей плашкой, масонри-фильтр кейсов (FLIP),
   слайдер с перетаскиванием, интерактивный бриф, просмотрщик кейсов и шоурила */
(function () {
    var APP = window.APP = window.APP || {};
    var U, S;
    var filterApi = null;
    var briefApi = null;
    var lb = null;

    function playVideo(v) {
        if (!v) return;
        if (!v.getAttribute('src') && v.getAttribute('data-src')) v.src = v.getAttribute('data-src');
        if (!S.reduced) v.play().catch(function () {});
    }

    // ---------- аккордеон ----------
    function accordion(root) {
        var items = U.$$('[data-acc-item]', root).map(function (it) {
            return {
                el: it,
                btn: U.$('[data-acc-btn]', it),
                panel: U.$('[data-acc-panel]', it),
                inner: U.$('.acc__inner', it),
                video: U.$('video', it),
                open: it.classList.contains('is-open')
            };
        });
        var inView = false;

        function set(I, v) {
            if (I.open === v) return;
            I.open = v;
            I.el.classList.toggle('is-open', v);
            I.btn.setAttribute('aria-expanded', v ? 'true' : 'false');
            gsap.killTweensOf([I.panel, I.inner]);
            if (v) {
                I.panel.hidden = false;
                gsap.fromTo(I.panel, { height: 0 }, { height: 'auto', duration: S.reduced ? 0 : 0.9, ease: 'expo.out', onComplete: function () { APP.refresh(); } });
                gsap.fromTo(I.inner, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.9, delay: 0.08, ease: 'power3.out' });
                if (inView) playVideo(I.video);
            } else {
                gsap.to(I.panel, {
                    height: 0,
                    duration: S.reduced ? 0 : 0.6,
                    ease: 'expo.inOut',
                    onComplete: function () {
                        I.panel.hidden = true;
                        APP.refresh();
                    }
                });
                if (I.video) I.video.pause();
            }
        }

        items.forEach(function (I, i) {
            I.btn.addEventListener('click', function () {
                var v = !I.open;
                if (v) items.forEach(function (J) { if (J !== I) set(J, false); });
                set(I, v);
            });
            // стрелки, Home/End — между заголовками
            I.btn.addEventListener('keydown', function (e) {
                var k = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: items.length - 1 }[e.key];
                if (k == null) return;
                e.preventDefault();
                items[(k + items.length) % items.length].btn.focus();
            });
        });

        // видео в открытом пункте играет, только пока аккордеон в кадре
        ScrollTrigger.create({
            trigger: root,
            start: 'top bottom',
            end: 'bottom top',
            onToggle: function (st) {
                inView = st.isActive;
                items.forEach(function (I) {
                    if (!I.open || !I.video) return;
                    if (inView) playVideo(I.video);
                    else I.video.pause();
                });
            }
        });
        return items;
    }

    // превью услуги летит за курсором над закрытыми пунктами
    function accFloat(root, items) {
        var fl = U.$('[data-acc-float]');
        if (!fl || S.isTouch || S.reduced) return;
        var img = U.$('img', fl);
        var xTo = gsap.quickTo(fl, 'x', { duration: 0.55, ease: 'power3.out' });
        var yTo = gsap.quickTo(fl, 'y', { duration: 0.55, ease: 'power3.out' });
        var rTo = gsap.quickTo(fl, 'rotation', { duration: 0.8, ease: 'power3.out' });
        var lastX = 0;
        var shown = false;
        var cur = '';

        function show(v) {
            if (v === shown) return;
            shown = v;
            gsap.to(fl, { opacity: v ? 1 : 0, scale: v ? 1 : 0.6, duration: 0.5, ease: v ? 'back.out(1.6)' : 'power2.in', overwrite: 'auto' });
        }

        root.addEventListener('mousemove', function (e) {
            var I = null;
            items.forEach(function (x) { if (x.btn.contains(e.target)) I = x; });
            if (!I || I.open) {
                show(false);
                return;
            }
            var src = I.btn.getAttribute('data-preview');
            if (src && src !== cur) {
                cur = src;
                img.src = src;
            }
            if (!shown) gsap.set(fl, { x: e.clientX, y: e.clientY });
            xTo(e.clientX);
            yTo(e.clientY);
            rTo(U.clamp((e.clientX - lastX) * 0.6, -14, 14));
            lastX = e.clientX;
            show(true);
        });
        root.addEventListener('mouseleave', function () { show(false); });
        root.addEventListener('click', function () { show(false); });
        window.addEventListener('scroll', function () { if (shown) show(false); }, { passive: true });
    }

    // ---------- табы: бегущая плашка + клавиатура ----------
    function tabs(root, onSelect) {
        var ind = U.$('[data-tabs-ind]', root);
        var btns = U.$$('[role="tab"]', root);
        var current = btns.filter(function (b) { return b.getAttribute('aria-selected') === 'true'; })[0] || btns[0];

        function move(btn, instant) {
            gsap.to(ind, { x: btn.offsetLeft, y: btn.offsetTop, width: btn.offsetWidth, height: btn.offsetHeight, duration: instant ? 0 : 0.65, ease: 'expo.out' });
        }

        function select(btn, focus) {
            if (btn !== current) {
                current.setAttribute('aria-selected', 'false');
                current.setAttribute('tabindex', '-1');
                btn.setAttribute('aria-selected', 'true');
                btn.setAttribute('tabindex', '0');
                current = btn;
                onSelect(btn);
            }
            if (focus) btn.focus();
            move(btn);
        }

        btns.forEach(function (b, i) {
            b.addEventListener('click', function () { select(b); });
            b.addEventListener('keydown', function (e) {
                var k = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: btns.length - 1 }[e.key];
                if (k == null) return;
                e.preventDefault();
                select(btns[(k + btns.length) % btns.length], true);
            });
        });
        move(current, true);
        APP.onResize(function () { move(current, true); });
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { move(current, true); });
        return {
            select: function (id, attr) {
                var b = btns.filter(function (x) { return x.getAttribute(attr) === id; })[0];
                if (b) select(b);
            }
        };
    }

    // ---------- кейсы: масонри + фильтр с FLIP ----------
    function work() {
        var grid = U.$('[data-work-grid]');
        if (!grid) return;
        var cards = U.$$('.case', grid);
        var cols = [];
        var visible = cards.slice();
        var busy = false;

        function count() { return S.vw < 768 ? 2 : S.vw < 1100 ? 3 : 5; }

        // раскладка: первый ряд — по порядку слева направо, дальше каждая карточка — в самую короткую колонку
        function layout(list) {
            var n = count();
            if (cols.length !== n) {
                cards.forEach(function (c) { grid.appendChild(c); });
                cols.forEach(function (c) { c.remove(); });
                cols = [];
                for (var i = 0; i < n; i++) {
                    var col = document.createElement('div');
                    col.className = 'work__col';
                    grid.insertBefore(col, cards[0]);
                    cols.push(col);
                }
                grid.classList.add('is-masonry');
            }
            // стартовая высота колонки — её отступ сверху («гуляющие» колонки)
            var h = cols.map(function (c) { return parseFloat(getComputedStyle(c).paddingTop) || 0; });
            list.forEach(function (card, i) {
                var k = i < n ? i : h.indexOf(Math.min.apply(null, h));
                cols[k].appendChild(card);
                h[k] += card.offsetHeight + 16;
            });
            cards.forEach(function (c) { if (list.indexOf(c) < 0) cols[cols.length - 1].appendChild(c); });
        }

        function apply(cat) {
            if (busy) return;
            var next = cards.filter(function (c) { return cat === 'all' || c.getAttribute('data-cats').split(' ').indexOf(cat) > -1; });
            var leaving = visible.filter(function (c) { return next.indexOf(c) < 0; });
            var entering = next.filter(function (c) { return visible.indexOf(c) < 0; });
            var first = new Map();
            visible.forEach(function (c) { first.set(c, c.getBoundingClientRect()); });
            busy = true;
            gsap.killTweensOf(cards);

            function swap() {
                leaving.forEach(function (c) { c.hidden = true; });
                entering.forEach(function (c) { c.hidden = false; });
                gsap.set(next, { opacity: 1, scale: 1, x: 0, y: 0 });
                layout(next);
                next.forEach(function (c) {
                    var f = first.get(c);
                    if (!f || entering.indexOf(c) > -1) return;
                    var r = c.getBoundingClientRect();
                    gsap.fromTo(c, { x: f.left - r.left, y: f.top - r.top }, { x: 0, y: 0, duration: 0.95, ease: 'expo.out' });
                });
                gsap.fromTo(entering, { opacity: 0, scale: 0.9, y: 50 }, { opacity: 1, scale: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.06 });
                visible = next;
                busy = false;
                APP.refresh(1000);
            }

            if (leaving.length && !S.reduced) {
                gsap.to(leaving, { opacity: 0, scale: 0.92, duration: 0.3, ease: 'power2.in', onComplete: swap });
            } else {
                swap();
            }
        }

        layout(visible);
        APP.onResize(function () { layout(visible); });

        var t = tabs(U.$('[data-filter-tabs]'), function (btn) {
            var id = btn.getAttribute('data-filter');
            grid.setAttribute('aria-labelledby', btn.id);
            apply(id);
        });
        filterApi = function (cat) { t.select(cat, 'data-filter'); };

        // видео в карточке — по наведению
        if (!S.isTouch) {
            cards.forEach(function (c) {
                var v = U.$('video', c);
                if (!v) return;
                c.addEventListener('mouseenter', function () {
                    playVideo(v);
                    c.classList.add('is-playing');
                });
                c.addEventListener('mouseleave', function () {
                    v.pause();
                    c.classList.remove('is-playing');
                });
            });
        }

        grid.addEventListener('click', function (e) {
            var b = e.target.closest('[data-case-open]');
            if (!b) return;
            var order = visible.map(function (c) { return parseInt(c.getAttribute('data-case'), 10); });
            openCase(parseInt(b.getAttribute('data-case-open'), 10), order, b, e);
        });
    }

    // ---------- слайдер с перетаскиванием ----------
    function slider(root) {
        var vp = U.$('[data-slider-viewport]', root);
        var track = U.$('[data-slider-track]', root);
        var slides = U.$$('[data-slide]', root);
        var prev = U.$('[data-slider-prev]', root);
        var next = U.$('[data-slider-next]', root);
        var idxEl = U.$('[data-slider-index]', root);
        var bar = U.$('[data-slider-bar]', root);
        var index = 0;
        var x = 0;
        var drag = null;
        var moved = false;

        function maxX() { return Math.max(0, track.scrollWidth - vp.clientWidth + parseFloat(getComputedStyle(vp).paddingLeft) * 2); }
        function last() {
            var m = maxX();
            for (var i = 0; i < slides.length; i++) if (slides[i].offsetLeft - slides[0].offsetLeft >= m - 2) return i;
            return slides.length - 1;
        }
        function posOf(i) { return -Math.min(maxX(), slides[i].offsetLeft - slides[0].offsetLeft); }

        function go(i, instant) {
            index = U.clamp(i, 0, last());
            x = posOf(index);
            gsap.to(track, { x: x, duration: instant || S.reduced ? 0 : 1.1, ease: 'expo.out', overwrite: true });
            idxEl.textContent = (index < 9 ? '0' : '') + (index + 1);
            bar.style.transform = 'scaleX(' + ((index + 1) / (last() + 1)).toFixed(3) + ')';
            prev.disabled = index === 0;
            next.disabled = index >= last();
        }

        prev.addEventListener('click', function () { go(index - 1); });
        next.addEventListener('click', function () { go(index + 1); });
        root.addEventListener('keydown', function (e) {
            if (e.key === 'ArrowRight') go(index + 1);
            else if (e.key === 'ArrowLeft') go(index - 1);
        });

        vp.addEventListener('pointerdown', function (e) {
            if (e.button !== 0) return;
            drag = { x0: e.clientX, y0: e.clientY, start: x, t: performance.now(), lock: null, id: e.pointerId };
            moved = false;
        });
        vp.addEventListener('pointermove', function (e) {
            if (!drag) return;
            var dx = e.clientX - drag.x0;
            var dy = e.clientY - drag.y0;
            if (drag.lock == null && Math.abs(dx) + Math.abs(dy) > 6) {
                drag.lock = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
                if (drag.lock === 'x') vp.setPointerCapture(drag.id);
            }
            if (drag.lock !== 'x') return;
            moved = true;
            var m = maxX();
            var nx = drag.start + dx;
            // резинка на краях
            if (nx > 0) nx *= 0.35;
            if (nx < -m) nx = -m + (nx + m) * 0.35;
            gsap.set(track, { x: nx });
            x = nx;
        });
        function end(e) {
            if (!drag) return;
            var dx = e.clientX - drag.x0;
            var v = dx / Math.max(1, performance.now() - drag.t);
            if (drag.lock === 'x') {
                // ближайший слайд с учётом «броска»
                var target = x + v * 220;
                var best = 0;
                var bd = Infinity;
                for (var i = 0; i <= last(); i++) {
                    var d = Math.abs(posOf(i) - target);
                    if (d < bd) {
                        bd = d;
                        best = i;
                    }
                }
                go(best);
            }
            drag = null;
        }
        vp.addEventListener('pointerup', end);
        vp.addEventListener('pointercancel', end);
        // после перетаскивания клик по кнопке внутри слайда не срабатывает
        vp.addEventListener('click', function (e) {
            if (moved) {
                e.preventDefault();
                e.stopPropagation();
                moved = false;
            }
        }, true);

        go(0, true);
        APP.onResize(function () { go(index, true); });
    }

    // «Смотреть кейсы» в слайдере индустрий → к кейсам, сразу с нужным фильтром
    function filterLinks() {
        document.addEventListener('click', function (e) {
            var b = e.target.closest('[data-filter-go]');
            if (!b) return;
            // фильтр включается, когда переход закончился, — перестройку сетки видно
            APP.jumpTo(U.$('#work'), '#work', function () {
                if (filterApi) filterApi(b.getAttribute('data-filter-go'));
            });
        });
    }

    // ---------- бриф ----------
    function brief() {
        var form = U.$('[data-brief]');
        if (!form) return;
        var services = U.$$('[data-brief-service]', form);
        var seg = U.$('[data-seg]', form);
        var segInd = U.$('[data-seg-ind]', form);
        var radios = U.$$('input[type="radio"]', seg);
        var range = U.$('[data-brief-range]', form);
        var rangeOut = U.$('[data-brief-range-out]', form);
        var summary = U.$('[data-brief-summary]', form);
        var status = U.$('[data-brief-status]', form);
        var label = U.$('[data-brief-label]', form);
        var months = APP.t('briefMonths');

        function monthsText() { return (range.value === range.max ? range.value + '+' : range.value) + ' ' + months; }

        function update() {
            var picked = services.filter(function (s) { return s.checked; }).map(function (s) { return s.value; });
            var budget = radios.filter(function (r) { return r.checked; })[0];
            var bi = radios.indexOf(budget);
            segInd.style.transform = 'translateX(' + (bi * 100) + '%)';
            range.style.setProperty('--p', ((range.value - range.min) / (range.max - range.min) * 100).toFixed(1) + '%');
            rangeOut.textContent = monthsText();
            summary.textContent = '→ ' + (picked.length ? picked.join(' + ') : APP.t('briefEmpty')) + ' · ' + (budget ? budget.value : '') + ' · ' + monthsText();
        }

        form.addEventListener('input', update);
        form.addEventListener('change', update);

        U.$$('.field input', form).forEach(function (inp) {
            inp.addEventListener('input', function () { inp.parentNode.classList.remove('is-error'); });
        });

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var name = form.elements.name;
            var contact = form.elements.contact;
            var bad = [name, contact].filter(function (f) { return !f.value.trim(); });
            [name, contact].forEach(function (f) {
                var b = bad.indexOf(f) > -1;
                f.parentNode.classList.toggle('is-error', b);
                if (b) f.setAttribute('aria-invalid', 'true');
                else f.removeAttribute('aria-invalid');
            });
            if (bad.length) {
                status.classList.add('is-error');
                status.textContent = APP.t('briefErr');
                bad[0].focus();
                return;
            }
            // демо: настоящей отправки пока нет — подключить к CRM/почте
            status.classList.remove('is-error');
            status.textContent = APP.t('briefSending') + '…';
            setTimeout(function () {
                form.classList.add('is-sent');
                label.textContent = '✓';
                status.textContent = '';
                var res = document.createElement('span');
                res.textContent = APP.t('briefOk');
                status.appendChild(res);
                APP.text.scramble(res, { per: 0.015, dur: 0.3 }).play();
            }, 900);
        });

        update();
        briefApi = {
            pick: function (i) {
                var s = services[i];
                if (!s) return;
                s.checked = true;
                update();
                // импульс — когда переход к брифу закончился
                gsap.fromTo(s.nextElementSibling, { scale: 1.25 }, { scale: 1, duration: 0.8, ease: 'elastic.out(1, 0.4)', delay: 1.75 });
            }
        };

        // «Обсудить задачу» в услугах — услуга сразу отмечена в брифе
        document.addEventListener('click', function (e) {
            var a = e.target.closest('[data-brief-pick]');
            if (a) briefApi.pick(parseInt(a.getAttribute('data-brief-pick'), 10));
        });
    }

    // ---------- просмотрщик ----------
    function lightbox() {
        var el = U.$('[data-lightbox]');
        if (!el) return;
        lb = {
            el: el,
            frame: U.$('.lightbox__frame', el),
            media: U.$('[data-lb-media]', el),
            num: U.$('[data-lb-num]', el),
            of: U.$('[data-lb-of]', el),
            title: U.$('[data-lb-title]', el),
            kind: U.$('[data-lb-kind]', el),
            text: U.$('[data-lb-text]', el),
            order: [],
            pos: 0,
            opener: null,
            open: false
        };
        var outside = U.$$('main, header, footer');

        function focusables() { return U.$$('button, [href], video[controls]', el).filter(function (n) { return n.offsetParent !== null; }); }

        lb.close = function () {
            if (!lb.open) return;
            lb.open = false;
            gsap.to(el, {
                opacity: 0,
                duration: 0.45,
                ease: 'power2.in',
                onComplete: function () {
                    el.hidden = true;
                    lb.media.innerHTML = '';
                    el.classList.remove('is-reel');
                }
            });
            outside.forEach(function (n) { n.inert = false; });
            if (APP.lenis) APP.lenis.start();
            if (lb.opener) lb.opener.focus({ preventScroll: true });
        };

        U.$$('[data-lb-close]', el).forEach(function (b) { b.addEventListener('click', lb.close); });
        U.$('[data-lb-prev]', el).addEventListener('click', function () { showCase(lb.pos - 1); });
        U.$('[data-lb-next]', el).addEventListener('click', function () { showCase(lb.pos + 1); });
        document.addEventListener('keydown', function (e) {
            if (!lb.open) return;
            if (e.key === 'Escape') lb.close();
            else if (e.key === 'ArrowRight' && !el.classList.contains('is-reel')) showCase(lb.pos + 1);
            else if (e.key === 'ArrowLeft' && !el.classList.contains('is-reel')) showCase(lb.pos - 1);
            else if (e.key === 'Tab') {
                var f = focusables();
                var i = f.indexOf(document.activeElement);
                if (e.shiftKey && i <= 0) {
                    e.preventDefault();
                    f[f.length - 1].focus();
                } else if (!e.shiftKey && i === f.length - 1) {
                    e.preventDefault();
                    f[0].focus();
                }
            }
        });

        lb.show = function (opener, ev) {
            lb.opener = opener;
            if (lb.open) return;
            lb.open = true;
            el.hidden = false;
            outside.forEach(function (n) { n.inert = true; });
            if (APP.lenis) APP.lenis.stop();
            var cx = ev && ev.clientX ? ev.clientX : S.vw / 2;
            var cy = ev && ev.clientY ? ev.clientY : S.vh / 2;
            gsap.set(el, { opacity: 1 });
            if (!S.reduced) {
                gsap.fromTo(el, { clipPath: 'circle(0% at ' + cx + 'px ' + cy + 'px)' }, { clipPath: 'circle(150% at ' + cx + 'px ' + cy + 'px)', duration: 0.9, ease: 'expo.inOut', clearProps: 'clipPath' });
                gsap.fromTo(lb.frame, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, delay: 0.35, ease: 'power3.out' });
            }
            setTimeout(function () { U.$('.lightbox__close', el).focus({ preventScroll: true }); }, 80);
        };
    }

    function media(src, poster, isVideo) {
        if (isVideo) {
            var v = document.createElement('video');
            v.src = src;
            if (poster) v.poster = poster;
            v.controls = true;
            v.playsInline = true;
            v.autoplay = true;
            v.loop = true;
            return v;
        }
        var img = document.createElement('img');
        img.src = src;
        img.alt = '';
        return img;
    }

    function showCase(pos) {
        var cases = APP.t('cases');
        var n = lb.order.length;
        lb.pos = (pos + n) % n;
        var c = cases[lb.order[lb.pos]];
        lb.media.innerHTML = '';
        lb.media.appendChild(media(c.video || c.img, c.img, !!c.video));
        lb.num.textContent = c.num;
        lb.of.textContent = APP.t('caseOf') + ' ' + (n < 10 ? '0' : '') + n;
        lb.title.textContent = c.client;
        lb.kind.textContent = c.kind;
        lb.text.textContent = c.text;
        if (lb.open && !S.reduced) gsap.fromTo([lb.media, lb.title, lb.text], { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.05 });
    }

    function openCase(i, order, opener, ev) {
        if (!lb) return;
        lb.el.classList.remove('is-reel');
        lb.order = order;
        showCase(Math.max(0, order.indexOf(i)));
        lb.show(opener, ev);
    }

    APP.widgets = {
        tabs: function (root, onSelect) { return tabs(root, onSelect); },

        init: function () {
            U = APP.utils;
            S = APP.state;
            lightbox();
            U.$$('[data-acc]').forEach(function (root) {
                var items = accordion(root);
                if (root.classList.contains('acc--services')) accFloat(root, items);
            });
            work();
            U.$$('[data-slider]').forEach(slider);
            filterLinks();
            brief();
        },

        // полный шоурил в просмотрщике
        reel: function () {
            if (!lb) return;
            var b = U.$('[data-reel-play]');
            lb.el.classList.add('is-reel');
            lb.media.innerHTML = '';
            var v = media(b.getAttribute('data-reel-src'), b.getAttribute('data-reel-poster'), true);
            v.loop = false;
            lb.media.appendChild(v);
            lb.show(b, null);
        }
    };
})();
