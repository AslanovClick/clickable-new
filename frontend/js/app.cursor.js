/* Курсор: точка + рамка из уголков с инерцией, красный шлейф, координаты.
   Ссылки/кнопки — «захват цели» (рамка обхватывает элемент), [data-cursor] — подпись («Смотреть»),
   [data-cursor-drag] — «Тяните», поля — мигающая каретка, клик — ударная волна. На светлых секциях уголки тёмные.
   Только для мыши; при prefers-reduced-motion остаётся системный курсор. */
(function () {
    var APP = window.APP = window.APP || {};
    var U, S;
    var LOCK = 'a, button, [role="button"], label, select, summary';
    var FIELD = 'input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="submit"]):not([type="button"]), textarea';
    var CARD = '[data-tilt], [data-step], [data-brand]';
    var TRAIL_LENGTH = 9; // точек в хвосте (кадров)
    var TRAIL_ALPHA = 0.32; // непрозрачность у головы хвоста

    var el, dot, frame, label, trail, ctx;
    var pos = { x: -200, y: -200 };
    var dp = { x: -200, y: -200 };
    var fr = { x: -200, y: -200, w: 28, h: 28 };
    var st = { down: 1 };
    var mode = 'default';
    var target = null;
    var text = '';
    var visible = false;
    var light = false;
    var pts = [];
    var idle = 0;
    var lastLabel = '';

    function pad(n) { return ('000' + Math.max(0, Math.round(n))).slice(-4); }

    function setMode(m, t, txt) {
        target = t || null;
        text = txt || '';
        if (m === mode) return;
        el.classList.remove('is-' + mode);
        mode = m;
        el.classList.add('is-' + mode);
    }

    // что под курсором
    function resolve(t) {
        if (!t || !t.closest) return setMode('default');
        var l = !!t.closest('.sec--light');
        if (l !== light) {
            light = l;
            el.classList.toggle('is-on-light', l);
        }
        if (t.closest(FIELD)) return setMode('text');
        var lab = t.closest('[data-cursor]');
        if (lab) return setMode('label', lab, lab.getAttribute('data-cursor'));
        var hit = t.closest(LOCK);
        if (hit) return setMode('lock', hit);
        if (t.closest('[data-cursor-drag]')) return setMode('drag', null, APP.t('drag'));
        if (t.closest(CARD)) return setMode('card', t.closest(CARD));
        setMode('default');
    }

    function show(v) {
        if (v === visible) return;
        visible = v;
        el.classList.toggle('is-visible', v);
    }

    function ripple() {
        var r = document.createElement('span');
        r.className = 'cursor__ripple';
        el.appendChild(r);
        gsap.set(r, { x: pos.x, y: pos.y });
        gsap.fromTo(r, { scale: 0.2, opacity: 1 }, {
            scale: 1.7,
            opacity: 0,
            duration: 0.7,
            ease: 'power2.out',
            onComplete: function () { r.remove(); }
        });
    }

    function resize() {
        trail.width = Math.round(S.vw * S.dpr);
        trail.height = Math.round(S.vh * S.dpr);
        ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
    }

    function drawTrail() {
        pts.unshift({ x: dp.x, y: dp.y });
        if (pts.length > TRAIL_LENGTH) pts.pop();
        var a = pts[0];
        var b = pts[pts.length - 1];
        var moving = Math.abs(a.x - b.x) + Math.abs(a.y - b.y) > 0.6;
        if (!moving && idle > 1) return;
        idle = moving ? 0 : idle + 1;
        ctx.clearRect(0, 0, S.vw, S.vh);
        if (!moving || mode === 'text') return;
        ctx.lineCap = 'round';
        for (var i = 1; i < pts.length; i++) {
            var k = 1 - i / pts.length;
            ctx.strokeStyle = 'rgba(255,25,35,' + (k * TRAIL_ALPHA).toFixed(3) + ')';
            ctx.lineWidth = 0.4 + 1.8 * k;
            ctx.beginPath();
            ctx.moveTo(pts[i - 1].x, pts[i - 1].y);
            ctx.lineTo(pts[i].x, pts[i].y);
            ctx.stroke();
        }
    }

    function tick(time, dt) {
        if (!visible) return;
        // точка — почти без задержки, рамка — с мягкой инерцией
        dp.x = U.damp(dp.x, pos.x, 38, dt);
        dp.y = U.damp(dp.y, pos.y, 38, dt);

        var tx, ty, tw, th;
        if (mode === 'lock' && target && target.isConnected) {
            var r = target.getBoundingClientRect();
            tx = r.left - 6;
            ty = r.top - 6;
            tw = r.width + 12;
            th = r.height + 12;
        } else {
            var size = mode === 'label' || mode === 'drag' ? 54 : mode === 'card' ? 44 : 28;
            tx = pos.x - size / 2;
            ty = pos.y - size / 2;
            tw = size;
            th = size;
        }
        var k = mode === 'lock' ? 16 : 13;
        fr.x = U.damp(fr.x, tx, k, dt);
        fr.y = U.damp(fr.y, ty, k, dt);
        fr.w = U.damp(fr.w, tw, k, dt);
        fr.h = U.damp(fr.h, th, k, dt);

        dot.style.transform = 'translate3d(' + dp.x.toFixed(1) + 'px,' + dp.y.toFixed(1) + 'px,0)';
        frame.style.width = fr.w.toFixed(1) + 'px';
        frame.style.height = fr.h.toFixed(1) + 'px';
        frame.style.transform = 'translate3d(' + fr.x.toFixed(1) + 'px,' + fr.y.toFixed(1) + 'px,0) scale(' + st.down.toFixed(3) + ')';

        // подпись под рамкой: координаты или текст режима
        var txt = text || ('X ' + pad(pos.x) + ' · Y ' + pad(pos.y));
        if (txt !== lastLabel) {
            lastLabel = txt;
            label.textContent = txt;
        }
        label.style.transform = 'translate3d(' + (fr.x + fr.w + 8).toFixed(1) + 'px,' + (fr.y + fr.h + 4).toFixed(1) + 'px,0)';

        drawTrail();
    }

    APP.cursor = {
        init: function () {
            U = APP.utils;
            S = APP.state;
            if (S.reduced || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

            el = document.createElement('div');
            el.className = 'cursor is-default';
            el.setAttribute('aria-hidden', 'true');
            el.innerHTML =
                '<canvas class="cursor__trail"></canvas>' +
                '<div class="cursor__frame">' +
                '<span class="cursor__c cursor__c--tl"></span><span class="cursor__c cursor__c--tr"></span>' +
                '<span class="cursor__c cursor__c--bl"></span><span class="cursor__c cursor__c--br"></span>' +
                '</div>' +
                '<span class="cursor__dot"></span>' +
                '<span class="cursor__label"></span>';
            document.body.appendChild(el);
            trail = el.querySelector('.cursor__trail');
            ctx = trail.getContext('2d');
            frame = el.querySelector('.cursor__frame');
            dot = el.querySelector('.cursor__dot');
            label = el.querySelector('.cursor__label');
            document.documentElement.classList.add('has-cursor');

            window.addEventListener('mousemove', function (e) {
                pos.x = e.clientX;
                pos.y = e.clientY;
                if (!visible) {
                    // первое появление — без «прилёта» из угла
                    dp.x = fr.x = pos.x;
                    dp.y = fr.y = pos.y;
                    pts.length = 0;
                    show(true);
                }
            }, { passive: true });
            document.addEventListener('mouseover', function (e) { resolve(e.target); });
            document.documentElement.addEventListener('mouseleave', function () { show(false); });
            window.addEventListener('blur', function () { show(false); });
            window.addEventListener('mousedown', function () {
                gsap.to(st, { down: 0.8, duration: 0.18, ease: 'power2.out' });
                ripple();
            });
            window.addEventListener('mouseup', function () {
                gsap.to(st, { down: 1, duration: 0.7, ease: 'elastic.out(1, 0.45)' });
            });
            // элемент под курсором мог уехать при скролле — пересчитываем режим
            window.addEventListener('scroll', function () {
                if (visible) resolve(document.elementFromPoint(pos.x, pos.y));
            }, { passive: true });

            resize();
            APP.onResize(resize);
            APP.onTick(tick);
        }
    };
})();
