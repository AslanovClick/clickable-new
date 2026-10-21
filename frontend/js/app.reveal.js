/* Появления: подпись «дешифруется», заголовок печатается, текст и карточки всплывают, цифры считаются, иконки прорисовываются */
(function () {
    var APP = window.APP = window.APP || {};
    var U, S;

    function formatNum(v, dec, fmt) {
        return APP.num(v, dec, fmt === 'comma');
    }

    function counter(el) {
        var to = parseFloat(el.getAttribute('data-count'));
        var from = parseFloat(el.getAttribute('data-from') || 0);
        var dec = parseInt(el.getAttribute('data-decimals') || 0, 10);
        var fmt = el.getAttribute('data-format');
        var o = { v: from };
        // скринридеру — сразу итоговое значение, бегущие цифры от него скрыты
        if (!el._sr) {
            var sr = document.createElement('span');
            sr.className = 'sr-only';
            sr.textContent = formatNum(to, dec, fmt);
            el.parentNode.insertBefore(sr, el);
            el.setAttribute('aria-hidden', 'true');
            el._sr = sr;
        }
        el.textContent = formatNum(from, dec, fmt);
        return gsap.to(o, {
            v: to,
            duration: 2.2,
            ease: 'power3.out',
            paused: true,
            onUpdate: function () { el.textContent = formatNum(o.v, dec, fmt); }
        });
    }

    // линии иконок рисуются «пером»
    function prepIcons(scope) {
        var shapes = U.$$('.ico .icon path, .ico .icon circle, .ico .icon ellipse, .ico .icon rect', scope);
        if (!shapes.length) return shapes;
        shapes.forEach(function (s) { s.setAttribute('pathLength', '1'); });
        gsap.set(shapes, { strokeDasharray: 1, strokeDashoffset: 1, opacity: 0 });
        return shapes;
    }

    function drawIcons(shapes) {
        if (!shapes.length) return { play: function () {} };
        return gsap.to(shapes, {
            strokeDashoffset: 0,
            opacity: 1,
            duration: 1.4,
            ease: 'power2.inOut',
            stagger: 0.03,
            paused: true
        });
    }

    // собирает все анимации внутри scope в одну таймлайн-«сцену»
    function group(scope, o) {
        o = o || {};
        var T = APP.text;
        var tl = gsap.timeline({ paused: true });
        var labels = U.$$('[data-scramble]', scope);
        var titles = U.$$('[data-type]', scope);
        var fades = U.$$('[data-fade]', scope);
        var cards = o.cards === false ? [] : U.$$('[data-card]', scope);
        var counts = U.$$('[data-count]', scope).map(counter);
        var values = U.$$('[data-scramble-value]', scope);
        var shapes = prepIcons(scope);
        var at = 0;

        labels.forEach(function (el) { tl.add(T.scramble(el).paused(false), 0); });

        var typeEnd = 0.15;
        titles.forEach(function (el, i) {
            var t = T.type(el, { caret: true, stagger: 0.04, duration: 0.5 });
            tl.add(t.paused(false), 0.15 + i * 0.2);
            typeEnd = Math.max(typeEnd, 0.15 + i * 0.2 + t.duration() * 0.6);
        });
        at = titles.length ? typeEnd : 0.2;

        if (fades.length) {
            gsap.set(fades, { opacity: 0, y: 30 });
            tl.to(fades, { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', stagger: 0.08 }, at);
        }
        if (cards.length) {
            gsap.set(cards, { opacity: 0, y: 46 });
            tl.to(cards, { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', stagger: 0.09 }, at + 0.15);
        }
        if (shapes.length) {
            var draw = drawIcons(shapes);
            tl.add(function () { draw.play(); }, at + 0.25);
        }
        if (counts.length) {
            tl.add(function () { counts.forEach(function (c) { c.play(); }); }, at + 0.3);
        }
        values.forEach(function (el) {
            var sc = T.scramble(el, { per: 0.05, dur: 0.6 });
            tl.add(function () { sc.play(); }, at + 0.45);
        });
        return tl;
    }

    APP.reveal = {
        init: function () {
            U = APP.utils;
            S = APP.state;
        },

        group: group,
        counter: counter,
        prepIcons: prepIcons,
        drawIcons: drawIcons,

        // группа запускается, когда scope входит в экран
        onEnter: function (scope, start, o) {
            var tl = group(scope, o);
            if (S.reduced) {
                tl.progress(1);
                return tl;
            }
            ScrollTrigger.create({
                trigger: scope,
                start: start || 'top 78%',
                once: true,
                onEnter: function () { tl.play(); }
            });
            return tl;
        },

        // одиночные [data-fade] вне групп (подвал)
        fades: function (scope) {
            U.$$('[data-fade]', scope).forEach(function (el) {
                gsap.fromTo(el, { opacity: 0, y: 36 }, {
                    opacity: 1,
                    y: 0,
                    duration: 1.2,
                    ease: 'power3.out',
                    delay: parseFloat(el.getAttribute('data-delay') || 0),
                    scrollTrigger: { trigger: el, start: 'top 92%', once: true }
                });
            });
        }
    };
})();
