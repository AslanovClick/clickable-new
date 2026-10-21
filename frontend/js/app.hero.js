/* Hero-«глава»: липкая сцена, прогресс скролла → разлёт букв CLICKABLE, отрыв буквы A (её рисует app.stage.js),
   манифест — слова загораются по скроллу. Здесь же меряется, где в слове стоит A, — по этим цифрам 3D-буква
   встаёт ровно на место глифа */
(function () {
    var APP = window.APP = window.APP || {};
    var U, S;
    var FADE = 0.035; // доля главы на въезд/выезд панели
    var GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+<>/';
    // метрики A в шрифте CLICKABLE (доли кегля): левый/правый край, высота прописной
    var A_LEFT = -0.063;
    var A_RIGHT = 0.722;
    var A_CAP = 0.706;

    var el, stage, mark, letters, aEl, baseEl;
    var panels = [];
    var st = null;
    var p = 0;
    var stageTop = 0;
    var stageLeft = 0;
    var glyph = { ox: 0, oy: 0, h: 0, w: 0 };
    var hooks = [];
    var out = { p: 0, glyph: { x: 0, y: 0, h: 0 } };

    // смещение элемента относительно предка — без учёта transform (буквы в это время анимируются)
    function offsetTo(node, anc) {
        var x = 0;
        var y = 0;
        while (node && node !== anc) {
            x += node.offsetLeft;
            y += node.offsetTop;
            node = node.offsetParent;
        }
        return { x: x, y: y };
    }

    function measureGlyph() {
        var F = parseFloat(getComputedStyle(mark).fontSize);
        var a = offsetTo(aEl, stage);
        var b = offsetTo(baseEl, stage);
        glyph.h = A_CAP * F;
        glyph.w = (A_RIGHT - A_LEFT) * F;
        glyph.ox = a.x + ((A_LEFT + A_RIGHT) / 2) * F;
        glyph.oy = b.y - glyph.h / 2;
    }

    function read() {
        var r = stage.getBoundingClientRect();
        stageTop = r.top;
        stageLeft = r.left;
    }

    // ---------- разлёт букв (кроме A) ----------
    function scatter(tl) {
        var ai = letters.indexOf(aEl);
        var desk = !S.isMobile;
        letters.forEach(function (ch, i) {
            if (ch === aEl) return;
            var d = i - ai;
            var dir = d < 0 ? -1 : 1;
            var dist = Math.abs(d);
            var start = 0.03 + (dist - 1) * 0.018;
            var to = {
                xPercent: dir * (150 + dist * 95),
                yPercent: Math.sin(i * 2.3) * 70,
                rotation: dir * (10 + dist * 5),
                rotationY: dir * (40 + dist * 7),
                opacity: 0,
                duration: 0.2,
                ease: 'power2.in',
                immediateRender: false
            };
            if (desk) to.filter = 'blur(10px)';
            tl.fromTo(ch, { xPercent: 0, yPercent: 0, rotation: 0, rotationY: 0, opacity: 1, filter: 'blur(0px)', transformPerspective: 900 }, to, start);
        });
        var tag = U.$('[data-hero-tag]', el);
        var foot = U.$('[data-hero-foot]', el);
        tl.fromTo([tag, foot], { opacity: 1, y: 0 }, { opacity: 0, y: -24, duration: 0.08, ease: 'power1.in', immediateRender: false }, 0.012);
    }

    // ---------- манифест: слова загораются по скроллу ----------
    function manifesto(P) {
        var box = U.$('[data-words]', P.el);
        var words = box.textContent.trim().split(/\s+/);
        // слова-акценты (фирменным шрифтом) — из data-acc, на каждом языке свои
        var acc = {};
        (box.getAttribute('data-acc') || '').split('|').forEach(function (w) { if (w) acc[w.toLowerCase()] = 1; });
        box.innerHTML = '<span class="sr-only">' + words.join(' ') + '</span><span aria-hidden="true">' +
            words.map(function (w) { return '<span class="w' + (acc[w.toLowerCase()] ? ' w--acc' : '') + '">' + w + '</span>'; }).join(' ') + '</span>';
        var spans = U.$$('.w', box);
        var last = -1;
        hooks.push(function () {
            var local = U.range(p, P.a + 0.01, P.b - 0.07);
            if (Math.abs(local - last) < 0.0005) return;
            last = local;
            var x = local * (spans.length + 1.5) - 0.5;
            for (var i = 0; i < spans.length; i++) {
                spans[i].style.opacity = (0.14 + 0.86 * U.clamp(x - i, 0, 1)).toFixed(3);
            }
        });
    }

    // «with desire» — слово меняется с эффектом дешифровки
    function loves() {
        var w = U.$('[data-hero-love]', el);
        var list = APP.t('loves');
        if (!w || !list || !list.length || S.reduced) return;
        var i = 0;
        setInterval(function () {
            if (document.hidden || p > 0.1) return;
            i = (i + 1) % list.length;
            var target = list[i].toLowerCase();
            var o = { t: 0 };
            gsap.to(o, {
                t: 1,
                duration: 0.6,
                ease: 'none',
                onUpdate: function () {
                    var n = Math.round(target.length * o.t);
                    var s = target.slice(0, n);
                    for (var k = n; k < target.length; k++) s += GLYPHS[(Math.random() * GLYPHS.length) | 0];
                    w.textContent = s;
                },
                onComplete: function () { w.textContent = target; }
            });
        }, 2800);
    }

    function build() {
        var tl = gsap.timeline({ paused: true });
        var shift = S.reduced ? 0 : 1;
        panels.forEach(function (P) {
            if (P.a > 0) {
                tl.fromTo(P.el, { opacity: 0, y: 90 * shift }, { opacity: 1, y: 0, duration: FADE, ease: 'power2.out' }, P.a);
            } else {
                gsap.set(P.el, { opacity: 1 });
            }
            if (P.b < 1) {
                tl.fromTo(P.el, { opacity: 1 }, { opacity: 0, duration: FADE, ease: 'power2.in', immediateRender: false }, P.b - FADE);
            }
        });
        scatter(tl);
        tl.to({}, { duration: 0.001 }, 1);
        tl.progress(0);

        var man = panels[1];
        var mg = APP.reveal.group(man.el);
        if (S.reduced) mg.progress(1);

        function sync() {
            panels.forEach(function (P) {
                var o = parseFloat(P.el.style.opacity);
                var on = (isNaN(o) ? 1 : o) > 0.5;
                if (on !== P.on) {
                    P.on = on;
                    P.el.style.pointerEvents = on ? '' : 'none';
                }
            });
        }

        st = ScrollTrigger.create({
            trigger: el,
            start: 'top top',
            end: 'bottom bottom',
            onUpdate: function (s) {
                p = s.progress;
                tl.progress(p);
                sync();
                if (!man.entered && p >= man.a) {
                    man.entered = true;
                    mg.play();
                }
            }
        });

        // Tab в манифест посреди перехода — встаём на его «готовую» точку
        man.el.addEventListener('focusin', function () {
            if (p < man.a + FADE) APP.rest.go(restY(man));
        });
    }

    function restY(P) {
        var a = P.a > 0 ? P.a + FADE : 0;
        var b = P.b < 1 ? P.b - FADE : 1;
        var k = P.a === 0 ? 0 : a + (b - a) * P.rest;
        return st.start + k * (st.end - st.start);
    }

    APP.hero = {
        init: function () {
            U = APP.utils;
            S = APP.state;
            el = U.$('[data-hero]');
            if (!el) return;
            stage = U.$('.hero__stage', el);
            mark = U.$('[data-hero-mark]', el);
            letters = U.$$('.hero__ch', mark);
            aEl = U.$('[data-hero-a]', el);
            baseEl = U.$('[data-hero-base]', el);
            panels = U.$$('[data-panel]', el).map(function (n) {
                return { el: n, a: parseFloat(n.getAttribute('data-in')), b: parseFloat(n.getAttribute('data-out')), rest: parseFloat(n.getAttribute('data-rest-at') || 0.3) };
            });
            // до прелоадера буквы спрятаны под нижним краем строки
            gsap.set(letters, { y: '1.05em' });
            gsap.set(mark, { clipPath: 'inset(-30% -30% 0% -30%)' });
            APP.onRead(read);
            APP.onTick(function () {
                for (var i = 0; i < hooks.length; i++) hooks[i]();
            });
        },

        // после загрузки шрифтов: меряем глиф и строим скролл-сцену
        build: function () {
            if (!el) return;
            measureGlyph();
            APP.onResize(measureGlyph);
            manifesto(panels[1]);
            build();
            loves();
            APP.rest.zone(function () {
                if (!st) return null;
                return { el: el, start: st.start, end: st.end, points: panels.map(restY) };
            });
        },

        // где сейчас стоит A (в px экрана) и прогресс главы — для 3D-сцены
        state: function () {
            out.p = p;
            out.glyph.x = stageLeft + glyph.ox;
            out.glyph.y = stageTop + glyph.oy;
            out.glyph.h = glyph.h;
            return out;
        },

        // прямоугольник глифа A (для перелёта буквы из прелоадера)
        glyphRect: function () {
            read();
            return { x: stageLeft + glyph.ox - glyph.w / 2, y: stageTop + glyph.oy - glyph.h / 2, w: glyph.w, h: glyph.h };
        },

        range: function () {
            return st ? { start: st.start, end: st.end } : null;
        },

        // буквы поднимаются вокруг уже стоящей A, подпись дешифруется
        intro: function () {
            if (!el) return;
            var others = letters.filter(function (l) { return l !== aEl; });
            var tag = U.$('[data-hero-tag-text]', el);
            var foot = U.$('[data-hero-foot]', el);
            gsap.set(aEl, { y: 0 });
            if (S.reduced) {
                gsap.set(others, { y: 0 });
                gsap.set(mark, { clipPath: 'none' });
                return;
            }
            gsap.set(foot, { opacity: 0, y: 16 });
            gsap.timeline()
                .to(others, { y: 0, duration: 1.35, ease: 'expo.out', stagger: { each: 0.055, from: 'center' } }, 0)
                .set(mark, { clipPath: 'none' })
                .add(function () { APP.text.scramble(tag, { per: 0.03, dur: 0.5 }).play(); }, 0.45)
                .to(foot, { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out' }, 0.8);
        }
    };
})();
