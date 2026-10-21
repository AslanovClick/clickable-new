/* «Готовые» положения скролла: после перезагрузки, по якорю и по Tab страница встаёт на целую секцию,
   а не на середину перехода (между панелями hero, внутри пина «Процесс»).
   Зоны (глава/пин) дают свои точки; в обычном потоке точки — верх секций с [data-rest] и конец страницы. */
(function () {
    var APP = window.APP = window.APP || {};
    var KEY = 'clickable-scroll:' + location.pathname;
    var providers = [];

    function maxScroll() {
        return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    }

    function zones() {
        var out = [];
        providers.forEach(function (fn) {
            var z = fn();
            if (z) out.push(z);
        });
        return out;
    }

    function nearest(arr, y) {
        var best = arr[0];
        var d = Infinity;
        arr.forEach(function (p) {
            var dd = Math.abs(p - y);
            if (dd < d) {
                d = dd;
                best = p;
            }
        });
        return best;
    }

    // все готовые точки страницы
    function points() {
        var max = maxScroll();
        var pts = [0, max];
        zones().forEach(function (z) { pts = pts.concat(z.points); });
        APP.utils.$$('[data-rest]').forEach(function (el) { pts.push(el.getBoundingClientRect().top + window.scrollY); });
        return pts.map(function (y) { return APP.utils.clamp(y, 0, max); });
    }

    // ближайшая готовая точка: внутри главы/пина — только её точки, в обычном потоке — любая
    function snap(y) {
        var zs = zones();
        for (var i = 0; i < zs.length; i++) {
            if (y >= zs[i].start - 1 && y <= zs[i].end + 1) return nearest(zs[i].points, y);
        }
        return nearest(points(), y);
    }

    function go(y) {
        if (APP.lenis) APP.lenis.scrollTo(y, { immediate: true, force: true });
        else window.scrollTo(0, y);
        ScrollTrigger.update();
    }

    function save() {
        try { sessionStorage.setItem(KEY, String(Math.round(window.scrollY))); } catch (e) {}
    }

    function navType() {
        var nav = performance.getEntriesByType ? performance.getEntriesByType('navigation')[0] : null;
        if (nav) return nav.type;
        return performance.navigation && performance.navigation.type === 1 ? 'reload' : 'navigate';
    }

    APP.rest = {
        // зона от модуля секции: () => { el, start, end, points: [y…], anchor?: y }
        zone: function (fn) { providers.push(fn); },

        go: go,
        snap: snap,

        // цель якорной ссылки: у главы/пина — её первая готовая точка (у тарифов — уже собранные карточки)
        target: function (el) {
            var zs = zones();
            for (var i = 0; i < zs.length; i++) {
                if (zs[i].el === el) return zs[i].anchor != null ? zs[i].anchor : zs[i].points[0];
            }
            return el;
        },

        init: function () {
            window.addEventListener('pagehide', save);
            window.addEventListener('beforeunload', save);
        },

        // после перезагрузки (и «назад/вперёд») — на запомненное место, притянутое к готовой точке
        restore: function () {
            var type = navType();
            if (type !== 'reload' && type !== 'back_forward') return;
            if (location.hash.length > 1) return;
            var y = NaN;
            try { y = parseFloat(sessionStorage.getItem(KEY)); } catch (e) {}
            if (y > 0) go(snap(Math.min(y, maxScroll())));
        },

        // перед показом страницы: если кто-то (например, dev-сервер) сдвинул скролл — снова на готовую точку
        settle: function () {
            var y = window.scrollY;
            var s = snap(y);
            if (Math.abs(s - y) > 2) go(s);
        }
    };
})();
