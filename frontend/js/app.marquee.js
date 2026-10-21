/* Лента логотипов: бесконечная, ускоряется от скорости скролла, замедляется под курсором; плашка наклоняется к курсору */
(function () {
    var APP = window.APP = window.APP || {};
    var U, S;
    var rows = [];
    var active = false;
    var BASE_SPEED = 38; // px/s

    function measure() {
        rows.forEach(function (R) {
            var kids = R.track.children;
            R.setW = kids[R.count].offsetLeft - kids[0].offsetLeft;
        });
    }

    function tick(time, dt) {
        if (!active) return;
        var v = APP.lenis ? Math.abs(APP.lenis.velocity || 0) : 0;
        rows.forEach(function (R) {
            var target = R.hover ? 0.08 : 1 + Math.min(v * 0.12, 5);
            R.speed = U.damp(R.speed, target, R.hover ? 6 : 3, dt);
            R.x += R.dir * BASE_SPEED * R.speed * dt;
            if (R.x <= -R.setW) R.x += R.setW;
            if (R.x > 0) R.x -= R.setW;
            R.track.style.transform = 'translate3d(' + R.x.toFixed(2) + 'px,0,0)';
        });
    }

    function tilt(brand) {
        if (S.isTouch || S.reduced) return;
        brand.addEventListener('mousemove', function (e) {
            var r = brand.getBoundingClientRect();
            var px = (e.clientX - r.left) / r.width;
            var py = (e.clientY - r.top) / r.height;
            brand.style.setProperty('--rx', ((0.5 - py) * 24).toFixed(2) + 'deg');
            brand.style.setProperty('--ry', ((px - 0.5) * 28).toFixed(2) + 'deg');
        });
        brand.addEventListener('mouseleave', function () {
            brand.style.setProperty('--rx', '0deg');
            brand.style.setProperty('--ry', '0deg');
        });
    }

    APP.marquee = {
        init: function (root) {
            U = APP.utils;
            S = APP.state;
            if (!root) return;
            U.$$('.marquee__row', root).forEach(function (row) {
                var track = row.querySelector('.marquee__track');
                var items = Array.prototype.slice.call(track.children);
                // копии набора, чтобы лента была бесшовной на любой ширине
                for (var k = 0; k < 3; k++) {
                    items.forEach(function (it) {
                        var c = it.cloneNode(true);
                        c.setAttribute('aria-hidden', 'true');
                        c.setAttribute('tabindex', '-1');
                        track.appendChild(c);
                    });
                }
                var R = { row: row, track: track, count: items.length, dir: parseFloat(row.getAttribute('data-dir') || -1), x: 0, speed: 1, setW: 0, hover: false };
                row.addEventListener('mouseenter', function () { R.hover = true; });
                row.addEventListener('mouseleave', function () { R.hover = false; });
                rows.push(R);
            });
            U.$$('[data-brand]', root).forEach(tilt);
            measure();
            rows.forEach(function (R) { if (R.dir > 0) R.x = -R.setW; });
            APP.onResize(measure);
            window.addEventListener('load', measure);
            APP.onTick(tick);
        },

        setActive: function (v) {
            active = v && !S.reduced;
        }
    };
})();
