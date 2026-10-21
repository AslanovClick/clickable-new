/* 3D-буква A: фиксированная WebGL-сцена под контентом.
   В hero буква стоит в слове CLICKABLE (плоская, фирменный красный), по скроллу отделяется, набирает объём
   и вращается в центре; дальше — фон нечётных (прозрачных) секций: у каждой своя поза.
   Чётные секции непрозрачные — они просто закрывают сцену (в это время она не рисуется). */
(function () {
    var APP = window.APP = window.APP || {};
    var U, S;
    var TAU = Math.PI * 2;

    // контур A из шрифта CLICKABLE (единицы шрифта, y вверх): внешний + треугольный вырез
    var OUTER = [[293, 706], [563, 706], [722, 0], [490, 0], [466, 124], [226, 124], [168, 0], [-63, 0]];
    var HOLE = [[431, 307], [397, 484], [313, 307]];
    var CX = 329.5;
    var CY = 353;
    var CAP = 706;
    var DEPTH = 0.3;
    var BEVEL_T = 0.04;
    var FOV = 22;
    var CAM_Z = 12;

    // позы: x/y — центр буквы (доли экрана), s — высота (доля высоты экрана), r* — поворот,
    // spin — скорость вращения, flat — «плоская» заливка, depth — объём, solid/wire — тело/каркас,
    // glow — свечение, ring — кольцо, dust — пылинки вокруг
    var BASE = { x: 0.5, y: 0.5, s: 0.4, rx: 0, ry: 0, rz: 0, spin: 0, flat: 0, depth: 1, solid: 1, wire: 0, glow: 0, ring: 0, dust: 0 };
    var POSES = {
        center: { x: 0.5, y: 0.48, s: 0.44, rx: -0.1, spin: 0.5, glow: 0.6, ring: 1, dust: 0.7 },
        manifesto: { x: 0.5, y: 0.5, s: 0.66, rx: -0.16, spin: 0.32, solid: 0.32, wire: 0.45, glow: 0.3, ring: 0.45, dust: 0.8 },
        work: { x: 0.8, y: 0.54, s: 0.98, rx: 0.22, ry: 0.5, rz: -0.24, spin: 0.12, solid: 0.3, wire: 0.6, glow: 0.22, dust: 0.5 },
        process: { x: 0.5, y: 0.5, s: 0.82, rx: -0.18, rz: 0.08, spin: 0.08, solid: 0.26, wire: 0.75, glow: 0.3, dust: 0.75 },
        clients: { x: 0.16, y: 0.56, s: 0.86, rx: 0.26, ry: -0.6, rz: 0.2, spin: 0.1, solid: 0.3, wire: 0.6, glow: 0.2, dust: 0.5 },
        contact: { x: 0.77, y: 0.46, s: 0.36, rx: -0.08, spin: 0.42, solid: 1, glow: 0.65, ring: 1, dust: 0.65 }
    };
    // на узких экранах — по центру и тише
    var POSES_M = {
        center: { s: 0.26 },
        manifesto: { s: 0.42, solid: 0.12, wire: 0.35, glow: 0.12, ring: 0.3 },
        work: { x: 0.5, s: 0.6, solid: 0.2 },
        process: { s: 0.5 },
        clients: { x: 0.5, s: 0.55 },
        contact: { x: 0.5, y: 0.5, s: 0.5, solid: 0.16, wire: 0.5, glow: 0.15, ring: 0.25 }
    };
    var KEYS = ['x', 'y', 's', 'rx', 'ry', 'rz', 'spin', 'flat', 'depth', 'solid', 'wire', 'glow', 'ring', 'dust'];

    var VERT = [
        'varying vec3 vN;',
        'varying vec3 vV;',
        'varying vec3 vP;',
        'void main(){',
        '  vP = position;',
        '  vec4 mv = modelViewMatrix * vec4(position, 1.0);',
        '  vN = normalize(normalMatrix * normal);',
        '  vV = -mv.xyz;',
        '  gl_Position = projectionMatrix * mv;',
        '}'
    ].join('\n');

    var FRAG = [
        'uniform vec3 uColor;',
        'uniform float uFlat;',
        'uniform float uAlpha;',
        'uniform float uTime;',
        'uniform float uSweep;',
        'varying vec3 vN;',
        'varying vec3 vV;',
        'varying vec3 vP;',
        // студия: верхний софтбокс, ключевой слева, контровой справа (в координатах камеры)
        'vec3 env(vec3 r){',
        '  float top = smoothstep(0.55, 0.95, r.y);',
        '  float key = smoothstep(0.8, 0.97, dot(r, normalize(vec3(-0.75, 0.35, 0.55))));',
        '  float rim = smoothstep(0.86, 0.985, dot(r, normalize(vec3(0.9, -0.15, 0.4))));',
        '  vec3 c = vec3(0.035) + vec3(0.1, 0.08, 0.08) * max(r.y, 0.0);',
        '  c += vec3(1.0, 0.97, 0.95) * (top * 0.9 + key * 1.15) + vec3(1.0, 0.72, 0.72) * rim * 0.95;',
        '  return c;',
        '}',
        'void main(){',
        '  vec3 n = normalize(vN);',
        '  if (!gl_FrontFacing) n = -n;',
        '  vec3 v = normalize(vV);',
        '  float ndv = clamp(dot(n, v), 0.0, 1.0);',
        '  float fres = pow(1.0 - ndv, 3.0);',
        // два точечных источника в координатах камеры: ключевой слева сверху и контровой справа
        '  vec3 vp = -vV;',
        '  vec3 L1 = normalize(vec3(-5.0, 5.0, -3.0) - vp);',
        '  vec3 L2 = normalize(vec3(6.0, -1.5, -7.0) - vp);',
        '  float dif = clamp(dot(n, L1), 0.0, 1.0);',
        '  vec3 base = uColor * (0.18 + 0.95 * dif);',
        '  base = mix(base, uColor * 0.32, fres * 0.6);',
        '  vec3 col = base + env(reflect(-v, n)) * mix(0.16, 0.8, fres);',
        '  col += vec3(1.0, 0.95, 0.92) * pow(max(dot(n, normalize(L1 + v)), 0.0), 80.0) * 0.9;',
        '  col += vec3(1.0, 0.7, 0.7) * pow(max(dot(n, normalize(L2 + v)), 0.0), 36.0) * 0.45;',
        // радужная кайма — «дисперсия», как у стеклянной призмы
        '  vec3 irid = 0.5 + 0.5 * cos(6.2831 * (fres * 1.4 + vec3(0.0, 0.33, 0.67)) + uTime * 0.3);',
        '  col += irid * pow(fres, 1.6) * 0.34;',
        // блик, пробегающий по лицевой грани
        '  float band = vP.x * 0.8 + vP.y * 0.6;',
        '  float sw = fract(uTime * 0.15) * 3.4 - 1.7;',
        '  float shine = smoothstep(0.08, 0.0, abs(band - sw)) * uSweep;',
        '  col += vec3(1.0) * shine * step(0.5, n.z) * 0.8;',
        '  col = mix(col, uColor + vec3(0.55) * shine, uFlat);',
        '  gl_FragColor = vec4(col, uAlpha);',
        '}'
    ].join('\n');

    var RING_VERT = 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}';
    var RING_FRAG = [
        'uniform float uTime;',
        'uniform float uAlpha;',
        'varying vec2 vUv;',
        'void main(){',
        // по кольцу бежит яркая дуга
        '  float a = vUv.x * 6.2831;',
        '  float arc = pow(0.5 + 0.5 * cos(a - uTime * 0.7), 6.0);',
        '  vec3 c = mix(vec3(1.0, 0.85, 0.85), vec3(1.0), arc);',
        '  gl_FragColor = vec4(c, (0.28 + 0.72 * arc) * uAlpha);',
        '}'
    ].join('\n');

    var DUST_VERT = [
        'attribute float aSeed;',
        'uniform float uTime;',
        'uniform float uSize;',
        'varying float vA;',
        'void main(){',
        '  vec3 p = position;',
        '  p.y += sin(uTime * 0.21 + aSeed * 6.28) * 0.12;',
        '  p.x += cos(uTime * 0.17 + aSeed * 3.1) * 0.09;',
        '  vec4 mv = modelViewMatrix * vec4(p, 1.0);',
        '  gl_Position = projectionMatrix * mv;',
        '  gl_PointSize = uSize * (0.45 + aSeed) * (12.0 / -mv.z);',
        '  vA = 0.35 + 0.65 * (0.5 + 0.5 * sin(uTime * (0.5 + aSeed) + aSeed * 20.0));',
        '}'
    ].join('\n');
    var DUST_FRAG = [
        'uniform float uAlpha;',
        'varying float vA;',
        'void main(){',
        '  float d = length(gl_PointCoord - 0.5);',
        '  float a = smoothstep(0.5, 0.0, d) * vA * uAlpha;',
        '  gl_FragColor = vec4(mix(vec3(1.0, 0.25, 0.28), vec3(1.0), vA), a);',
        '}'
    ].join('\n');

    var cv, renderer, scene, camera, root, spinner, solid, wire, glow, ring, ringGlow, dust;
    // реальный размер канваса в css px: на телефонах он 100lvh — выше, чем innerHeight при видимой адресной строке
    var cw = 1;
    var ch = 1;
    var uSolid, uRing, uDust;
    var ok = false;
    var visible = true;
    var odd = [];
    var holds = [];
    var heroEnd = 0;
    var showK = 0;
    var spinAcc = 0;
    var cur = {};
    var tilt = { x: 0, y: 0 };

    function shape() {
        var sh = new THREE.Shape();
        OUTER.forEach(function (p, i) {
            var x = (p[0] - CX) / CAP;
            var y = (p[1] - CY) / CAP;
            if (i) sh.lineTo(x, y);
            else sh.moveTo(x, y);
        });
        var hole = new THREE.Path();
        HOLE.forEach(function (p, i) {
            var x = (p[0] - CX) / CAP;
            var y = (p[1] - CY) / CAP;
            if (i) hole.lineTo(x, y);
            else hole.moveTo(x, y);
        });
        sh.holes.push(hole);
        return sh;
    }

    function key3(pos, i) {
        return Math.round(pos.getX(i) * 1e4) + '_' + Math.round(pos.getY(i) * 1e4) + '_' + Math.round(pos.getZ(i) * 1e4);
    }

    // мягкие нормали на фаске и боках (лицевые грани остаются плоскими), острые углы буквы — острыми
    function creaseSides(geo, deg) {
        var g = geo.groups[1];
        if (!g) return;
        var pos = geo.attributes.position;
        var nor = geo.attributes.normal;
        var lim = Math.cos(deg * Math.PI / 180);
        var faceN = [];
        var map = {};
        var a = new THREE.Vector3();
        var b = new THREE.Vector3();
        var c = new THREE.Vector3();
        var i, k, f;
        for (i = g.start; i < g.start + g.count; i += 3) {
            a.fromBufferAttribute(pos, i);
            b.fromBufferAttribute(pos, i + 1);
            c.fromBufferAttribute(pos, i + 2);
            f = (i - g.start) / 3;
            faceN[f] = new THREE.Vector3().subVectors(c, b).cross(new THREE.Vector3().subVectors(a, b));
            for (k = 0; k < 3; k++) {
                var key = key3(pos, i + k);
                (map[key] = map[key] || []).push(f);
            }
        }
        var acc = new THREE.Vector3();
        var own = new THREE.Vector3();
        var tmp = new THREE.Vector3();
        for (i = g.start; i < g.start + g.count; i++) {
            f = Math.floor((i - g.start) / 3);
            own.copy(faceN[f]);
            if (own.lengthSq() === 0) continue;
            own.normalize();
            acc.set(0, 0, 0);
            map[key3(pos, i)].forEach(function (j) {
                tmp.copy(faceN[j]);
                var l = tmp.length();
                if (l > 0 && tmp.dot(own) / l >= lim) acc.add(tmp);
            });
            if (acc.lengthSq() === 0) acc.copy(own);
            acc.normalize();
            nor.setXYZ(i, acc.x, acc.y, acc.z);
        }
        nor.needsUpdate = true;
    }

    function radialTexture(stops) {
        var c = document.createElement('canvas');
        c.width = c.height = 256;
        var g = c.getContext('2d');
        var grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
        stops.forEach(function (s) { grd.addColorStop(s[0], s[1]); });
        g.fillStyle = grd;
        g.fillRect(0, 0, 256, 256);
        return new THREE.CanvasTexture(c);
    }

    function build() {
        var sh = shape();

        var geo = new THREE.ExtrudeGeometry(sh, {
            depth: DEPTH,
            bevelEnabled: true,
            bevelThickness: BEVEL_T,
            bevelSize: 0.022,
            bevelOffset: -0.022,
            bevelSegments: 5,
            curveSegments: 1,
            steps: 1
        });
        geo.translate(0, 0, -DEPTH / 2);
        creaseSides(geo, 50);

        uSolid = {
            uColor: { value: new THREE.Color(1, 0.098, 0.137) },
            uFlat: { value: 1 },
            uAlpha: { value: 0 },
            uTime: { value: 0 },
            uSweep: { value: 1 }
        };
        solid = new THREE.Mesh(geo, new THREE.ShaderMaterial({
            uniforms: uSolid,
            vertexShader: VERT,
            fragmentShader: FRAG,
            transparent: true
        }));

        // каркас: рёбра той же буквы без фаски
        var wgeo = new THREE.ExtrudeGeometry(sh, { depth: DEPTH + BEVEL_T * 2, bevelEnabled: false, curveSegments: 1 });
        wgeo.translate(0, 0, -(DEPTH + BEVEL_T * 2) / 2);
        wire = new THREE.LineSegments(new THREE.EdgesGeometry(wgeo, 20), new THREE.LineBasicMaterial({
            color: 0xf2efea,
            transparent: true,
            opacity: 0,
            depthWrite: false
        }));

        spinner = new THREE.Group();
        spinner.add(solid);
        spinner.add(wire);

        // мягкое красное свечение за буквой
        glow = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.4), new THREE.MeshBasicMaterial({
            map: radialTexture([[0, 'rgba(255,40,50,0.85)'], [0.28, 'rgba(255,25,35,0.32)'], [0.6, 'rgba(255,25,35,0.08)'], [1, 'rgba(255,25,35,0)']]),
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            opacity: 0
        }));
        glow.position.z = -0.6;

        // тонкое светящееся кольцо (как вокруг призмы в референсе)
        var R = 0.86;
        uRing = { uTime: { value: 0 }, uAlpha: { value: 0 } };
        ring = new THREE.Mesh(new THREE.TorusGeometry(R, 0.0042, 6, 256), new THREE.ShaderMaterial({
            uniforms: uRing,
            vertexShader: RING_VERT,
            fragmentShader: RING_FRAG,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        }));
        var gs = (2 * R) / 0.9;
        ringGlow = new THREE.Mesh(new THREE.PlaneGeometry(gs, gs), new THREE.MeshBasicMaterial({
            map: radialTexture([[0, 'rgba(255,255,255,0)'], [0.8, 'rgba(255,255,255,0)'], [0.9, 'rgba(255,235,235,0.55)'], [0.95, 'rgba(255,90,90,0.12)'], [1, 'rgba(255,60,60,0)']]),
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            opacity: 0
        }));
        var ringBox = new THREE.Group();
        ringBox.add(ring);
        ringBox.add(ringGlow);
        ringBox.rotation.x = 0.22;
        ringBox.position.z = -0.25;

        root = new THREE.Group();
        root.add(glow);
        root.add(ringBox);
        root.add(spinner);
        scene.add(root);

        // пылинки по всей сцене
        var N = S.isMobile ? 140 : 320;
        var pos = new Float32Array(N * 3);
        var seed = new Float32Array(N);
        for (var i = 0; i < N; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 9;
            pos[i * 3 + 1] = (Math.random() - 0.5) * 5.4;
            pos[i * 3 + 2] = -3 + Math.random() * 5;
            seed[i] = Math.random();
        }
        var dgeo = new THREE.BufferGeometry();
        dgeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        dgeo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
        uDust = { uTime: { value: 0 }, uSize: { value: 3 }, uAlpha: { value: 0 } };
        dust = new THREE.Points(dgeo, new THREE.ShaderMaterial({
            uniforms: uDust,
            vertexShader: DUST_VERT,
            fragmentShader: DUST_FRAG,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        }));
        scene.add(dust);
    }

    function resize() {
        if (!ok) return;
        cw = cv.clientWidth || S.vw;
        ch = cv.clientHeight || S.vh;
        var dpr = Math.min(window.devicePixelRatio || 1, S.isMobile ? 1.5 : 1.75);
        renderer.setPixelRatio(dpr);
        renderer.setSize(cw, ch, false);
        camera.aspect = cw / ch;
        camera.updateProjectionMatrix();
        uDust.uSize.value = 2.6 * dpr;
    }

    function pose(name) {
        var p = {};
        var m = S.isMobile ? (POSES_M[name] || {}) : {};
        KEYS.forEach(function (k) {
            var src = POSES[name] || {};
            p[k] = m[k] != null ? m[k] : src[k] != null ? src[k] : BASE[k];
        });
        return p;
    }

    function mix(a, b, t, out) {
        KEYS.forEach(function (k) { out[k] = a[k] + (b[k] - a[k]) * t; });
        return out;
    }

    // «удержания» поз по секциям: в пределах нечётной секции поза постоянна, между ними — плавный перелёт
    function measure() {
        var y = window.scrollY;
        var hero = APP.hero && APP.hero.range ? APP.hero.range() : null;
        heroEnd = hero ? hero.end : 0;
        holds = [{ a: heroEnd, b: heroEnd, pose: pose('manifesto') }];
        [['#work', 'work'], ['#process', 'process'], ['#clients', 'clients'], ['#contact', 'contact']].forEach(function (d) {
            var el = U.$(d[0]);
            if (!el) return;
            var st = ScrollTrigger.getAll().filter(function (t) { return t.pin === el; })[0];
            var r = el.getBoundingClientRect();
            var top = r.top + y;
            // у прилипшей секции (процесс) длина = длина пина
            var bottom = st ? st.end + S.vh : r.bottom + y;
            holds.push({ a: top - S.vh * 0.75, b: Math.max(top - S.vh * 0.75, bottom - S.vh * 0.25), pose: pose(d[1]) });
        });
    }

    var tmpPose = {};
    var tmpPose2 = {};

    function heroPose(p, g) {
        var rest = {
            x: g.x / cw, y: g.y / ch, s: g.h / ch,
            rx: 0, ry: 0, rz: 0, spin: 0, flat: 1, depth: 0.04, solid: 1, wire: 0, glow: 0, ring: 0, dust: 0
        };
        var c = pose('center');
        var m = pose('manifesto');
        var t = U.smooth(U.range(p, 0.02, 0.34));
        mix(rest, c, t, tmpPose);
        // отрыв: буква чуть «выдыхает» вперёд и разворачивается
        var arc = Math.sin(t * Math.PI);
        tmpPose.rx += arc * 0.55;
        tmpPose.ry += arc * -0.9;
        tmpPose.depth = U.lerp(0.04, 1, U.smooth(U.range(p, 0.03, 0.22)));
        tmpPose.flat = 1 - U.smooth(U.range(p, 0.04, 0.2));
        tmpPose.spin = c.spin * U.smooth(U.range(p, 0.14, 0.4));
        tmpPose.glow = c.glow * U.smooth(U.range(p, 0.08, 0.36));
        tmpPose.ring = c.ring * U.smooth(U.range(p, 0.22, 0.42));
        tmpPose.dust = c.dust * U.smooth(U.range(p, 0.1, 0.4));
        var t2 = U.smooth(U.range(p, 0.36, 0.52));
        if (t2 > 0) mix(tmpPose, m, t2, tmpPose2);
        return t2 > 0 ? tmpPose2 : tmpPose;
    }

    function scrollPose(y) {
        if (y <= holds[0].b) return holds[0].pose;
        for (var i = 0; i < holds.length; i++) {
            var h = holds[i];
            if (y <= h.b) {
                if (y >= h.a) return h.pose;
                var prev = holds[i - 1];
                var t = U.smooth(U.range(y, prev.b, h.a));
                return mix(prev.pose, h.pose, t, tmpPose);
            }
        }
        return holds[holds.length - 1].pose;
    }

    // видна ли сцена: хоть одна прозрачная секция в кадре
    function read() {
        visible = false;
        for (var i = 0; i < odd.length; i++) {
            var r = odd[i].getBoundingClientRect();
            if (r.bottom > 0 && r.top < S.vh) {
                visible = true;
                break;
            }
        }
        // канвас поменял размер (поворот экрана, адресная строка) — подстраиваем буфер и камеру
        if (Math.abs(cv.clientHeight - ch) > 1 || Math.abs(cv.clientWidth - cw) > 1) resize();
    }

    function tick(time, dt) {
        if (!visible || document.hidden) return;
        var y = S.scroll;
        var h = APP.hero ? APP.hero.state() : null;
        var P = (h && y < heroEnd) ? heroPose(h.p, h.glyph) : scrollPose(y);
        var rest = h ? 1 - U.range(h.p, 0, 0.12) : 0;
        if (y >= heroEnd) rest = 0;

        KEYS.forEach(function (k) { cur[k] = P[k]; });

        // вращение: собственное (по времени) + от скролла; у слова — возвращаемся ровно лицом к зрителю
        spinAcc += dt * cur.spin * (S.reduced ? 0 : 1);
        if (rest > 0) spinAcc = U.damp(spinAcc, Math.round(spinAcc / TAU) * TAU, 7 * rest, dt);
        var scrollRot = y * 0.0007 * (1 - rest);
        tilt.x = U.damp(tilt.x, S.mouse.sx, 4, dt);
        tilt.y = U.damp(tilt.y, S.mouse.sy, 4, dt);
        var tiltK = U.lerp(0.28, 0.06, rest);

        // канвас прибит к верху экрана: координаты экрана = координаты канваса
        var wpp = (2 * Math.tan(FOV * Math.PI / 360) * CAM_Z) / ch;
        root.position.set((cur.x * cw - cw / 2) * wpp + tilt.x * 0.05 * (1 - rest), -(cur.y * ch - ch / 2) * wpp, 0);
        var sc = cur.s * ch * wpp;
        root.scale.set(sc, sc, sc);
        spinner.scale.set(1, 1, Math.max(0.02, cur.depth));
        spinner.rotation.set(
            cur.rx + tilt.y * tiltK + Math.sin(time * 0.6) * 0.04 * (1 - rest),
            cur.ry + spinAcc + scrollRot + tilt.x * tiltK,
            cur.rz
        );

        var a = showK;
        uSolid.uAlpha.value = cur.solid * a;
        uSolid.uFlat.value = cur.flat;
        uSolid.uTime.value = time;
        uSolid.uSweep.value = U.lerp(0.35, 1, rest);
        solid.material.depthWrite = cur.solid > 0.98;
        solid.visible = cur.solid * a > 0.003;
        wire.material.opacity = cur.wire * a * 0.55;
        wire.visible = wire.material.opacity > 0.003;
        glow.material.opacity = cur.glow * a;
        uRing.uAlpha.value = cur.ring * a;
        uRing.uTime.value = time;
        ringGlow.material.opacity = cur.ring * a * 0.8;
        ring.parent.rotation.z = time * 0.05;
        uDust.uAlpha.value = cur.dust * a * 0.7;
        uDust.uTime.value = time;
        dust.position.set(-tilt.x * 0.25, tilt.y * 0.15, 0);

        renderer.render(scene, camera);
    }

    APP.stage = {
        init: function () {
            U = APP.utils;
            S = APP.state;
            cv = U.$('[data-stage]');
            if (!cv || !window.THREE) return false;
            try {
                renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, powerPreference: 'high-performance' });
            } catch (e) {
                renderer = null;
            }
            if (!renderer) {
                document.documentElement.classList.add('no-webgl');
                cv.style.display = 'none';
                return false;
            }
            renderer.setClearColor(0x000000, 0);
            scene = new THREE.Scene();
            camera = new THREE.PerspectiveCamera(FOV, S.vw / S.vh, 0.1, 60);
            camera.position.z = CAM_Z;
            ok = true;
            build();
            resize();
            odd = U.$$('[data-odd]');
            APP.onResize(resize);
            APP.onRead(read);
            APP.onTick(tick);
            ScrollTrigger.addEventListener('refresh', measure);
            return true;
        },

        get ok() { return ok; },

        measure: function () { if (ok) measure(); },

        // буква появляется (передача от прелоадера)
        show: function (instant) {
            if (!ok) return;
            if (instant) showK = 1;
            else gsap.to({ v: showK }, { v: 1, duration: 0.8, ease: 'power2.out', onUpdate: function () { showK = this.targets()[0].v; } });
        }
    };
})();
