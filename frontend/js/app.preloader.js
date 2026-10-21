/* Прелоадер: контур буквы A рисуется по прогрессу загрузки, заливается фирменным красным
   и перелетает на своё место в слове CLICKABLE — там его без шва подменяет 3D-буква */
(function () {
    var APP = window.APP = window.APP || {};
    var U, S;
    var RATIO = 706 / 785; // высота/ширина глифа A
    var LOG_AT = [0, 0.2, 0.45, 0.7, 0.95];

    APP.preloader = function (fontsReady, onDone) {
        U = APP.utils;
        S = APP.state;
        var el = U.$('[data-preloader]');
        if (!el) {
            onDone();
            return;
        }
        var ui = U.$('[data-pre-ui]', el);
        var svg = U.$('[data-pre-a]', el);
        var line = U.$('[data-pre-line]', el);
        var fill = U.$('[data-pre-fill]', el);
        var countEl = U.$('[data-pre-count]', el);
        var barEl = U.$('[data-pre-bar]', el);
        var logEl = U.$('[data-pre-log]', el);
        var LOG = APP.t('log');

        var st = { shown: 0 };
        var fontsOk = false;
        var finished = false;
        var running = true;
        var started = performance.now();
        var logIdx = 0;
        var lastCount = '';
        var box = { x: 0, y: 0, w: 0 };
        fontsReady.then(function () { fontsOk = true; });

        line.setAttribute('pathLength', '1');
        line.style.strokeDasharray = '1';
        line.style.strokeDashoffset = '1';

        function layout() {
            box.w = Math.min(S.vh * 0.26, S.vw * 0.36, 230);
            box.x = (S.vw - box.w) / 2;
            box.y = (S.vh - box.w * RATIO) / 2;
            gsap.set(svg, { x: box.x, y: box.y, width: box.w, height: box.w * RATIO });
        }
        layout();
        window.addEventListener('resize', layout);

        function addLog(text) {
            var row = document.createElement('div');
            row.textContent = '> ' + text;
            logEl.appendChild(row);
            while (logEl.children.length > 4) logEl.removeChild(logEl.firstChild);
            APP.text.scramble(row, { per: 0.012, dur: 0.25 }).play();
        }

        function target() {
            var t = Math.min(1, (performance.now() - started) / 1800);
            return (fontsOk ? 0.6 : 0) + 0.4 * t;
        }

        function update() {
            var c = ('00' + Math.round(st.shown * 100)).slice(-3);
            if (c !== lastCount) {
                lastCount = c;
                countEl.textContent = c;
            }
            barEl.style.transform = 'scaleX(' + st.shown.toFixed(4) + ')';
            line.style.strokeDashoffset = (1 - st.shown).toFixed(4);
            while (logIdx < LOG_AT.length && st.shown >= LOG_AT[logIdx]) addLog(LOG[logIdx++]);
        }

        function done() {
            running = false;
            el.style.display = 'none';
            window.removeEventListener('resize', layout);
        }

        function exit() {
            if (finished) return;
            finished = true;
            st.shown = 1;
            update();
            if (S.reduced) {
                gsap.to(el, { opacity: 0, duration: 0.5, onComplete: done });
                if (APP.stage) APP.stage.show(true);
                onDone();
                return;
            }
            var to = APP.hero ? APP.hero.glyphRect() : null;
            var tl = gsap.timeline({ onComplete: done });
            tl.to(fill, { opacity: 1, duration: 0.45, ease: 'power2.out' }, 0)
                .to(line, { opacity: 0, duration: 0.4 }, 0.15)
                .to(ui, { opacity: 0, y: -12, duration: 0.6, ease: 'power2.in' }, 0.1);
            if (to && to.w > 0) {
                // буква летит в слово, фон растворяется
                tl.to(svg, { x: to.x, y: to.y, width: to.w, height: to.h, duration: 1.15, ease: 'expo.inOut' }, 0.4)
                    .to(el, { backgroundColor: 'rgba(7,7,7,0)', duration: 0.9, ease: 'power2.inOut' }, 0.75)
                    .add(function () {
                        if (APP.stage) APP.stage.show(true);
                        onDone();
                    }, 1.55)
                    .to(svg, { opacity: 0, duration: 0.25 }, 1.6);
            } else {
                tl.to(el, { opacity: 0, duration: 0.7 }, 0.5).add(function () {
                    if (APP.stage) APP.stage.show();
                    onDone();
                }, 0.7);
            }
        }

        APP.onTick(function (time, dt) {
            if (!running) return;
            if (!finished) {
                st.shown = U.damp(st.shown, target(), 3.4, dt);
                if (target() >= 0.999 && st.shown > 0.985 && fontsOk) exit();
                update();
            }
        });

        // страховка: не держим посетителя дольше 9 секунд
        setTimeout(exit, 9000);
    };
})();
