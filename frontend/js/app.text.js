/* Текст: разбивка на буквы, печать по буквам с кареткой, «дешифровка», градиент на разбитых буквах */
(function () {
    var APP = window.APP = window.APP || {};
    var GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+<>/';
    var splitted = [];

    function split(el) {
        if (el._chars) return el._chars;
        var chars = [];
        var label = el.textContent.replace(/\s+/g, ' ').trim();

        function splitText(node) {
            var text = node.nodeValue.replace(/\s+/g, ' ');
            if (!text.trim()) return;
            var frag = document.createDocumentFragment();
            text.split(/( )/).forEach(function (part) {
                if (!part) return;
                if (part === ' ') {
                    frag.appendChild(document.createTextNode(' '));
                    return;
                }
                var word = document.createElement('span');
                word.className = 'word';
                for (var i = 0; i < part.length; i++) {
                    var c = document.createElement('span');
                    c.className = 'char';
                    c.textContent = part[i];
                    word.appendChild(c);
                    chars.push(c);
                }
                frag.appendChild(word);
            });
            node.parentNode.replaceChild(frag, node);
        }

        function walk(node) {
            Array.prototype.slice.call(node.childNodes).forEach(function (child) {
                if (child.nodeType === 3) splitText(child);
                else if (child.nodeType === 1) walk(child);
            });
        }

        walk(el);
        // для скринридеров — цельная строка, буквы скрыты
        Array.prototype.slice.call(el.querySelectorAll('.word')).forEach(function (w) { w.setAttribute('aria-hidden', 'true'); });
        var sr = document.createElement('span');
        sr.className = 'sr-only';
        sr.textContent = label;
        el.appendChild(sr);

        el.setAttribute('data-typed', '');
        el._chars = chars;
        splitted.push(el);
        paintGradient(el);
        return chars;
    }

    // каждой букве внутри .grad — свой кусок общего градиента, чтобы он не «рвался» по буквам
    function paintGradient(el) {
        var grads = el.classList.contains('grad') ? [el] : Array.prototype.slice.call(el.querySelectorAll('.grad'));
        grads.forEach(function (g) {
            g.classList.add('is-split');
            var gr = g.getBoundingClientRect();
            Array.prototype.slice.call(g.querySelectorAll('.char')).forEach(function (c) {
                var r = c.getBoundingClientRect();
                // градиент горизонтальный — важен только сдвиг по X (Y-анимация букв на него не влияет)
                c.style.backgroundSize = gr.width + 'px 100%';
                c.style.backgroundPosition = (gr.left - r.left) + 'px 0';
            });
        });
    }

    function measureCaret(el, chars) {
        var er = el.getBoundingClientRect();
        return chars.map(function (c) {
            var r = c.getBoundingClientRect();
            return { x: r.right - er.left, y: r.top - er.top + r.height * 0.06, h: r.height * 0.86 };
        });
    }

    // печать по буквам: буква проявляется из размытия и чуть снизу, каретка бежит следом
    function type(el, o) {
        o = o || {};
        var chars = split(el);
        var n = chars.length;
        var stagger = o.stagger || Math.min(0.045, 1.4 / n);
        var duration = o.duration || 0.5;
        var caret = null;
        var spots = null;
        var hideCall = null;

        if (o.caret) {
            caret = document.createElement('span');
            caret.className = 'caret';
            caret.setAttribute('aria-hidden', 'true');
            el.appendChild(caret);
            spots = measureCaret(el, chars);
            el._remeasure = function () { spots = measureCaret(el, chars); };
        }

        function placeCaret(i) {
            var p = spots[Math.max(0, Math.min(n - 1, i))];
            caret.style.transform = 'translate3d(' + p.x + 'px,' + p.y + 'px,0)';
            caret.style.height = p.h + 'px';
        }

        function showCaret() {
            if (hideCall) hideCall.kill();
            gsap.killTweensOf(caret);
            caret.classList.remove('is-blink');
            caret.style.opacity = 1;
        }

        var tl = gsap.timeline({ paused: true });
        var tween = gsap.fromTo(chars,
            { opacity: 0, y: '0.32em', filter: 'blur(8px)' },
            {
                opacity: 1,
                y: 0,
                filter: 'blur(0px)',
                duration: duration,
                ease: 'power3.out',
                stagger: stagger,
                onStart: caret ? showCaret : null,
                onUpdate: caret ? function () {
                    if (caret.style.opacity !== '1') showCaret();
                    placeCaret(Math.floor(this.time() / stagger));
                } : null,
                onComplete: function () {
                    gsap.set(chars, { clearProps: 'filter' });
                    if (!caret) return;
                    placeCaret(n - 1);
                    caret.classList.add('is-blink');
                    hideCall = gsap.delayedCall(o.caretHold || 2.6, function () {
                        caret.classList.remove('is-blink');
                        gsap.to(caret, { opacity: 0, duration: 0.6 });
                    });
                },
                onReverseComplete: caret ? function () {
                    if (hideCall) hideCall.kill();
                    caret.classList.remove('is-blink');
                    caret.style.opacity = 0;
                } : null
            });
        tl.add(tween, 0);
        return tl;
    }

    // «дешифровка»: буквы перебирают случайные символы и встают на место
    function scramble(el, o) {
        o = o || {};
        var chars = split(el);
        var finals = chars.map(function (c) { return c.textContent; });
        var n = chars.length;
        var per = o.per || 0.028;
        var dur = o.dur || 0.42;
        var total = per * (n - 1) + dur;
        var st = { t: 0 };
        var lastSwap = 0;

        gsap.set(chars, { opacity: 0 });

        function lock() {
            chars.forEach(function (c) {
                c.style.width = c.getBoundingClientRect().width + 'px';
                c.classList.add('is-locked');
            });
        }

        function unlock() {
            chars.forEach(function (c, i) {
                c.textContent = finals[i];
                c.style.width = '';
                c.style.opacity = 1;
                c.classList.remove('is-locked');
            });
        }

        return gsap.timeline({ paused: true }).to(st, {
            t: total,
            duration: total,
            ease: 'none',
            onStart: lock,
            onUpdate: function () {
                var now = performance.now();
                var swap = now - lastSwap > 45;
                if (swap) lastSwap = now;
                for (var i = 0; i < n; i++) {
                    var local = (st.t - i * per) / dur;
                    var c = chars[i];
                    if (local <= 0) {
                        c.style.opacity = 0;
                    } else if (local < 1) {
                        c.style.opacity = Math.min(1, local * 2.5);
                        if (swap && finals[i] !== ' ') c.textContent = GLYPHS[(Math.random() * GLYPHS.length) | 0];
                    } else {
                        c.style.opacity = 1;
                        c.textContent = finals[i];
                    }
                }
            },
            onComplete: unlock
        });
    }

    APP.text = {
        split: split,
        type: type,
        scramble: scramble,
        // размеры шрифта «тянутся» от ширины экрана — после ресайза пересчитываем градиенты и каретки
        refresh: function () {
            splitted.forEach(function (el) {
                paintGradient(el);
                if (el._remeasure) el._remeasure();
            });
        }
    };
})();
