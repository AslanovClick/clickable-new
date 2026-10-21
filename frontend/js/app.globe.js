/* 3D-глобус «География»: страны, где у нас клиенты (РФ и Беларусь в список не входят), — красные точки,
   дуги из Киева с бегущими «кометами», пульсирующие метки городов, местное время.
   Контуры стран — public/js/world.js (Natural Earth 1:110m, Крым — в составе Украины), грузится, когда секция рядом.
   По контурам на лету рисуются две текстуры: карта id стран (для точек, подсветки и клика) и земля с границами. */
(function () {
    var APP = window.APP = window.APP || {};
    var U, S;
    var PI = Math.PI;
    var TEX_W = 2048;
    var TEX_H = 1024;
    var ID_W = 1024;
    var ID_H = 512;
    var REGION_CODE = { eu: 1, asia: 2, af: 3, am: 4 };
    var CAM_Z = 4.8;

    var SPHERE_VERT = [
        'varying vec3 vObj;',
        'varying vec3 vN;',
        'varying vec3 vV;',
        'void main(){',
        '  vObj = position;',
        '  vec4 mv = modelViewMatrix * vec4(position, 1.0);',
        '  vN = normalize(normalMatrix * normal);',
        '  vV = -mv.xyz;',
        '  gl_Position = projectionMatrix * mv;',
        '}'
    ].join('\n');

    var SPHERE_FRAG = [
        'uniform sampler2D tLand;',
        'uniform sampler2D tId;',
        'uniform float uSel;',
        'uniform float uHover;',
        'uniform float uRegion;',
        'uniform float uTime;',
        'varying vec3 vObj;',
        'varying vec3 vN;',
        'varying vec3 vV;',
        'const float PI = 3.14159265;',
        'void main(){',
        '  vec3 p = normalize(vObj);',
        '  float lat = asin(clamp(p.y, -1.0, 1.0));',
        '  float lon = atan(-p.z, p.x);',
        // сетка точек: ряды по широте, в ряду точек ~ cos(широты) — точки одинаковые по всему шару
        '  float rows = 150.0;',
        '  float rowF = (lat + PI * 0.5) / PI * rows;',
        '  float row = floor(rowF);',
        '  float latC = (row + 0.5) / rows * PI - PI * 0.5;',
        '  float cols = max(1.0, floor(rows * 2.0 * cos(latC)));',
        '  float colF = (lon + PI) / (2.0 * PI) * cols;',
        '  float col = floor(colF);',
        '  float lonC = (col + 0.5) / cols * 2.0 * PI - PI;',
        '  vec2 dd = vec2((colF - col - 0.5) * (2.0 * PI / cols) * cos(latC), (rowF - row - 0.5) * (PI / rows));',
        '  float dist = length(dd) / (PI / rows);',
        '  vec4 id = texture2D(tId, vec2((lonC + PI) / (2.0 * PI), (latC + PI * 0.5) / PI));',
        '  float cid = floor(id.r * 255.0 + 0.5);',
        '  float land = step(0.5, cid);',
        '  float region = floor(id.g * 255.0 / 60.0 + 0.5);',
        '  float partner = step(0.5, region);',
        '  float sel = 1.0 - step(0.5, abs(cid - uSel));',
        '  float hov = 1.0 - step(0.5, abs(cid - uHover));',
        '  float inR = uRegion < 0.5 ? 1.0 : 1.0 - step(0.5, abs(region - uRegion));',
        '  float r = mix(0.3, 0.4, partner) + sel * 0.05;',
        '  float aa = max(fwidth(dist), 0.04);',
        '  float dotA = (1.0 - smoothstep(r - aa, r + aa, dist)) * land;',
        '  vec3 cLand = vec3(0.4, 0.38, 0.37);',
        '  vec3 cPartner = mix(vec3(0.42, 0.07, 0.09), vec3(1.0, 0.1, 0.14), inR);',
        '  vec3 c = mix(cLand, cPartner, partner);',
        '  c = mix(c, vec3(1.0, 0.6, 0.6), hov * partner * 0.7);',
        '  c = mix(c, vec3(1.0), sel * (0.35 + 0.35 * sin(uTime * 3.5)));',
        // океан, лёгкая заливка суши, границы, сетка широт/долгот
        '  vec3 n = normalize(vN);',
        '  vec3 v = normalize(vV);',
        '  float ndv = clamp(dot(n, v), 0.0, 1.0);',
        '  vec4 L = texture2D(tLand, vec2((lon + PI) / (2.0 * PI), (lat + PI * 0.5) / PI));',
        '  vec3 base = vec3(0.03, 0.028, 0.028);',
        '  base = mix(base, vec3(0.075, 0.07, 0.07), L.r * 0.7);',
        '  base += vec3(0.55, 0.06, 0.09) * L.b * 0.16 * mix(0.4, 1.0, inR);',
        '  base += vec3(0.42, 0.4, 0.39) * L.g * 0.2 * (1.0 - L.b) + vec3(1.0, 0.2, 0.25) * L.g * L.b * 0.45 * mix(0.4, 1.0, inR);',
        '  float step15 = PI / 12.0;',
        '  float gl = abs(fract(lat / step15 + 0.5) - 0.5) / fwidth(lat / step15);',
        '  float gn = abs(fract(lon / step15 + 0.5) - 0.5) / fwidth(lon / step15);',
        '  base += vec3(0.5, 0.45, 0.45) * (1.0 - min(min(gl, gn), 1.0)) * 0.05;',
        '  vec3 colr = mix(base, c, dotA);',
        '  colr *= 0.5 + 0.5 * smoothstep(-0.1, 0.85, ndv);',
        '  colr += vec3(1.0, 0.2, 0.25) * pow(1.0 - ndv, 4.0) * 0.5;',
        '  gl_FragColor = vec4(colr, 1.0);',
        '}'
    ].join('\n');

    var ATMO_VERT = 'varying vec3 vN;void main(){vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}';
    var ATMO_FRAG = 'varying vec3 vN;void main(){float i=pow(max(0.0,0.64-dot(vN,vec3(0.0,0.0,1.0))),3.0);gl_FragColor=vec4(vec3(1.0,0.16,0.2)*i*1.1,i);}';

    var ARC_VERT = [
        'attribute float aT;',
        'attribute float aIdx;',
        'attribute float aPhase;',
        'attribute float aRegion;',
        'varying float vT;',
        'varying float vIdx;',
        'varying float vPhase;',
        'varying float vRegion;',
        'void main(){',
        '  vT = aT; vIdx = aIdx; vPhase = aPhase; vRegion = aRegion;',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
        '}'
    ].join('\n');
    var ARC_FRAG = [
        'uniform float uTime;',
        'uniform float uSel;',
        'uniform float uRegion;',
        'varying float vT;',
        'varying float vIdx;',
        'varying float vPhase;',
        'varying float vRegion;',
        'void main(){',
        '  float head = fract(uTime * 0.22 + vPhase) * 1.4;',
        '  float comet = smoothstep(head - 0.3, head, vT) * step(vT, head);',
        '  float sel = 1.0 - step(0.5, abs(vIdx - uSel));',
        '  float inR = uRegion < 0.5 ? 1.0 : 1.0 - step(0.5, abs(vRegion - uRegion));',
        '  float a = (0.14 + comet * 0.85) * mix(0.15, 1.0, inR) * (1.0 + sel * 1.2);',
        '  vec3 c = mix(vec3(1.0, 0.1, 0.15), vec3(1.0, 0.85, 0.85), comet * 0.6 + sel * 0.3);',
        '  gl_FragColor = vec4(c, clamp(a, 0.0, 1.0));',
        '}'
    ].join('\n');

    var PIN_VERT = [
        'attribute float aIdx;',
        'attribute float aRegion;',
        'attribute float aHq;',
        'attribute float aPhase;',
        'uniform float uSel;',
        'uniform float uHover;',
        'uniform float uRegion;',
        'uniform float uPR;',
        'varying float vSel;',
        'varying float vIn;',
        'varying float vFace;',
        'varying float vPhase;',
        'varying float vHq;',
        'void main(){',
        '  vec4 wp = modelMatrix * vec4(position, 1.0);',
        '  vec4 mv = viewMatrix * wp;',
        '  gl_Position = projectionMatrix * mv;',
        '  float sel = 1.0 - step(0.5, abs(aIdx - uSel));',
        '  float hov = 1.0 - step(0.5, abs(aIdx - uHover));',
        '  vIn = uRegion < 0.5 ? 1.0 : 1.0 - step(0.5, abs(aRegion - uRegion));',
        '  vSel = sel; vPhase = aPhase; vHq = aHq;',
        '  vFace = dot(normalize(wp.xyz), normalize(cameraPosition - wp.xyz));',
        '  gl_PointSize = (13.0 + sel * 16.0 + hov * 7.0 + aHq * 5.0) * uPR * (4.8 / -mv.z);',
        '}'
    ].join('\n');
    var PIN_FRAG = [
        'uniform float uTime;',
        'varying float vSel;',
        'varying float vIn;',
        'varying float vFace;',
        'varying float vPhase;',
        'varying float vHq;',
        'void main(){',
        '  float d = length(gl_PointCoord - 0.5) * 2.0;',
        '  float core = 1.0 - smoothstep(0.2, 0.32, d);',
        '  float k = fract(uTime * 0.7 + vPhase);',
        '  float ring = (1.0 - smoothstep(0.0, 0.08, abs(d - (0.35 + 0.6 * k)))) * (1.0 - k);',
        '  float a = (core + ring * 0.85) * smoothstep(0.05, 0.3, vFace) * mix(0.3, 1.0, vIn);',
        '  vec3 c = mix(vec3(1.0, 0.1, 0.14), vec3(1.0), core * (0.25 + vSel * 0.75 + vHq * 0.3));',
        '  gl_FragColor = vec4(c, a);',
        '}'
    ].join('\n');

    var root, sec, canvas, tip, card;
    var renderer, scene, camera, globe, sphere, arcs, pins;
    var uSphere, uArc, uPin;
    var world = [];
    var idMap = null;
    var partners = [];
    var byIso = {};
    var countryPartner = {};
    var active = false;
    var started = false;
    var rot = { x: 0.6, y: 0, vx: 0, vy: 0 };
    var target = null;
    var lastInteract = 0;
    var drag = null;
    var hoverIdx = -1;
    var selIdx = -1;
    var regionId = 'all';
    var listApi = null;
    var raycaster = null;
    var pointer = null;
    var timeFmt = {};

    function vec(lat, lon, r) {
        var la = lat * PI / 180;
        var lo = lon * PI / 180;
        return new THREE.Vector3(Math.cos(la) * Math.cos(lo) * r, Math.sin(la) * r, -Math.cos(la) * Math.sin(lo) * r);
    }

    function decode(ring) {
        var out = [];
        var x = 0;
        var y = 0;
        for (var i = 0; i < ring.length; i += 2) {
            x += ring[i];
            y += ring[i + 1];
            out.push([x / 10, y / 10]);
        }
        // долготы — непрерывно (кольца, пересекающие 180°)
        var off = 0;
        for (var k = 1; k < out.length; k++) {
            var dx = out[k][0] + off - out[k - 1][0];
            if (dx > 180) off -= 360;
            else if (dx < -180) off += 360;
            out[k][0] += off;
        }
        return out;
    }

    // кольцо в равнопромежуточной проекции; трижды со сдвигом на 360° — для колец через линию перемены дат
    function trace(ctx, pts, W, H) {
        var polar = Math.abs(pts[pts.length - 1][0] - pts[0][0]) > 180;
        [-360, 0, 360].forEach(function (shift) {
            pts.forEach(function (p, i) {
                var x = (p[0] + 180 + shift) / 360 * W;
                var y = (90 - p[1]) / 180 * H;
                if (i) ctx.lineTo(x, y);
                else ctx.moveTo(x, y);
            });
            // кольцо вокруг полюса (Антарктида) замыкаем через полюс
            if (polar) {
                var pole = pts[0][1] < 0 ? H : 0;
                ctx.lineTo((pts[pts.length - 1][0] + 180 + shift) / 360 * W, pole);
                ctx.lineTo((pts[0][0] + 180 + shift) / 360 * W, pole);
            }
            ctx.closePath();
        });
    }

    function hash(i) { return ((i * 97 + 31) % 251) + 2; }

    function textures() {
        // 1) земля (R), границы (G), страны-клиенты (B) — со сглаживанием
        var c1 = document.createElement('canvas');
        c1.width = TEX_W;
        c1.height = TEX_H;
        var g1 = c1.getContext('2d');
        g1.fillStyle = '#000';
        g1.fillRect(0, 0, TEX_W, TEX_H);
        world.forEach(function (c) {
            g1.beginPath();
            c.rings.forEach(function (r) { trace(g1, r, TEX_W, TEX_H); });
            g1.fillStyle = '#ff0000';
            g1.fill();
        });
        g1.globalCompositeOperation = 'lighter';
        world.forEach(function (c) {
            if (!c.partner) return;
            g1.beginPath();
            c.rings.forEach(function (r) { trace(g1, r, TEX_W, TEX_H); });
            g1.fillStyle = '#0000ff';
            g1.fill();
        });
        g1.lineWidth = 1.3;
        g1.strokeStyle = '#00ff00';
        world.forEach(function (c) {
            g1.beginPath();
            c.rings.forEach(function (r) { trace(g1, r, TEX_W, TEX_H); });
            g1.stroke();
        });
        var tLand = new THREE.CanvasTexture(c1);
        tLand.anisotropy = 4;

        // 2) id страны (R) и регион клиента (G) — без сглаживания: краевые пиксели с «чужим» хешем отбрасываем
        var c2 = document.createElement('canvas');
        c2.width = ID_W;
        c2.height = ID_H;
        var g2 = c2.getContext('2d');
        g2.fillStyle = '#000';
        g2.fillRect(0, 0, ID_W, ID_H);
        world.forEach(function (c, i) {
            g2.beginPath();
            c.rings.forEach(function (r) { trace(g2, r, ID_W, ID_H); });
            g2.fillStyle = 'rgb(' + (i + 1) + ',' + hash(i + 1) + ',0)';
            g2.fill();
        });
        var src = g2.getImageData(0, 0, ID_W, ID_H).data;
        var data = new Uint8Array(ID_W * ID_H * 4);
        idMap = new Uint8Array(ID_W * ID_H);
        for (var y = 0; y < ID_H; y++) {
            for (var x = 0; x < ID_W; x++) {
                var s = (y * ID_W + x) * 4;
                var id = src[s];
                if (!id || src[s + 1] !== hash(id)) id = 0;
                idMap[y * ID_W + x] = id;
                // в текстуре ряд 0 — юг (как v=0 у шейдера)
                var d = ((ID_H - 1 - y) * ID_W + x) * 4;
                var c = id ? world[id - 1] : null;
                data[d] = id;
                data[d + 1] = c && c.partner ? REGION_CODE[c.partner.region] * 60 : 0;
                data[d + 3] = 255;
            }
        }
        var tId = new THREE.DataTexture(data, ID_W, ID_H, THREE.RGBAFormat);
        tId.magFilter = THREE.NearestFilter;
        tId.minFilter = THREE.NearestFilter;
        tId.generateMipmaps = false;
        tId.needsUpdate = true;
        return { land: tLand, id: tId };
    }

    function buildArcs() {
        var hq = partners.filter(function (p) { return p.hq; })[0] || partners[0];
        var a = vec(hq.lat, hq.lon, 1).normalize();
        var pos = [];
        var aT = [];
        var aIdx = [];
        var aPhase = [];
        var aRegion = [];
        var SEG = 64;
        partners.forEach(function (p, pi) {
            if (p === hq) return;
            var b = vec(p.lat, p.lon, 1).normalize();
            var ang = a.angleTo(b);
            var h = 0.04 + ang * 0.1;
            var sin = Math.sin(ang);
            var phase = Math.random();
            var prev = null;
            for (var i = 0; i <= SEG; i++) {
                var t = i / SEG;
                var v = a.clone().multiplyScalar(Math.sin((1 - t) * ang) / sin).add(b.clone().multiplyScalar(Math.sin(t * ang) / sin));
                v.multiplyScalar(1.003 + h * Math.sin(PI * t));
                if (prev) {
                    pos.push(prev.v.x, prev.v.y, prev.v.z, v.x, v.y, v.z);
                    aT.push(prev.t, t);
                    aIdx.push(pi, pi);
                    aPhase.push(phase, phase);
                    aRegion.push(REGION_CODE[p.region], REGION_CODE[p.region]);
                }
                prev = { v: v, t: t };
            }
        });
        var geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        geo.setAttribute('aT', new THREE.Float32BufferAttribute(aT, 1));
        geo.setAttribute('aIdx', new THREE.Float32BufferAttribute(aIdx, 1));
        geo.setAttribute('aPhase', new THREE.Float32BufferAttribute(aPhase, 1));
        geo.setAttribute('aRegion', new THREE.Float32BufferAttribute(aRegion, 1));
        uArc = { uTime: { value: 0 }, uSel: { value: -1 }, uRegion: { value: 0 } };
        arcs = new THREE.LineSegments(geo, new THREE.ShaderMaterial({
            uniforms: uArc,
            vertexShader: ARC_VERT,
            fragmentShader: ARC_FRAG,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        }));
        globe.add(arcs);
    }

    function buildPins() {
        var pos = [];
        var aIdx = [];
        var aRegion = [];
        var aHq = [];
        var aPhase = [];
        partners.forEach(function (p, i) {
            var v = vec(p.lat, p.lon, 1.006);
            pos.push(v.x, v.y, v.z);
            aIdx.push(i);
            aRegion.push(REGION_CODE[p.region]);
            aHq.push(p.hq ? 1 : 0);
            aPhase.push(Math.random());
        });
        var geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        geo.setAttribute('aIdx', new THREE.Float32BufferAttribute(aIdx, 1));
        geo.setAttribute('aRegion', new THREE.Float32BufferAttribute(aRegion, 1));
        geo.setAttribute('aHq', new THREE.Float32BufferAttribute(aHq, 1));
        geo.setAttribute('aPhase', new THREE.Float32BufferAttribute(aPhase, 1));
        uPin = { uTime: { value: 0 }, uSel: { value: -1 }, uHover: { value: -1 }, uRegion: { value: 0 }, uPR: { value: 1 } };
        pins = new THREE.Points(geo, new THREE.ShaderMaterial({
            uniforms: uPin,
            vertexShader: PIN_VERT,
            fragmentShader: PIN_FRAG,
            transparent: true,
            depthWrite: false
        }));
        globe.add(pins);
    }

    function build() {
        world = (window.WORLD || []).map(function (c) {
            var partner = byIso[c.id] || null;
            return { id: c.id, name: c.n, partner: partner, rings: c.r.map(decode) };
        });
        world.forEach(function (c, i) { if (c.partner) countryPartner[i + 1] = c.partner; });

        renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
        renderer.setClearColor(0x000000, 0);
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
        camera.position.z = CAM_Z;
        globe = new THREE.Group();
        scene.add(globe);

        var tex = textures();
        uSphere = {
            tLand: { value: tex.land },
            tId: { value: tex.id },
            uSel: { value: -1 },
            uHover: { value: -1 },
            uRegion: { value: 0 },
            uTime: { value: 0 }
        };
        sphere = new THREE.Mesh(new THREE.SphereGeometry(1, 128, 96), new THREE.ShaderMaterial({
            uniforms: uSphere,
            vertexShader: SPHERE_VERT,
            fragmentShader: SPHERE_FRAG,
            extensions: { derivatives: true }
        }));
        globe.add(sphere);

        var atmo = new THREE.Mesh(new THREE.SphereGeometry(1.14, 64, 48), new THREE.ShaderMaterial({
            vertexShader: ATMO_VERT,
            fragmentShader: ATMO_FRAG,
            side: THREE.BackSide,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        }));
        scene.add(atmo);

        buildArcs();
        buildPins();
        raycaster = new THREE.Raycaster();
        pointer = new THREE.Vector2();
        resize();
        APP.onResize(resize);
        bindPointer();

        // старт — Европа, Киев выбран
        var hq = partners.filter(function (p) { return p.hq; })[0];
        rot.x = 40 * PI / 180;
        rot.y = -PI / 2 - 22 * PI / 180;
        if (hq) select(hq.i, false);
        started = true;
        gsap.fromTo(globe.scale, { x: 0.82, y: 0.82, z: 0.82 }, { x: 1, y: 1, z: 1, duration: 1.8, ease: 'expo.out' });
        gsap.fromTo(canvas, { opacity: 0 }, { opacity: 1, duration: 1.2 });
    }

    function resize() {
        if (!renderer) return;
        var w = canvas.clientWidth;
        var h = canvas.clientHeight;
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        renderer.setPixelRatio(dpr);
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        uPin.uPR.value = dpr * (h / 700);
    }

    // ---------- выбор страны, регион, карточка ----------
    function wrap(a) {
        while (a > PI) a -= 2 * PI;
        while (a < -PI) a += 2 * PI;
        return a;
    }

    function lookAt(lat, lon) {
        var tx = U.clamp(lat * PI / 180, -0.9, 0.9);
        var ty = rot.y + wrap(-PI / 2 - lon * PI / 180 - rot.y);
        target = { x: tx, y: ty };
        rot.vx = rot.vy = 0;
    }

    function fmtTime(tz) {
        try {
            if (!timeFmt[tz]) {
                timeFmt[tz] = {
                    t: new Intl.DateTimeFormat(APP.t('intl'), { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
                    o: new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' })
                };
            }
            var off = timeFmt[tz].o.formatToParts(new Date()).filter(function (x) { return x.type === 'timeZoneName'; })[0];
            return { time: timeFmt[tz].t.format(new Date()), off: off ? off.value.replace('GMT', 'UTC') : '' };
        } catch (e) {
            return { time: '--:--', off: '' };
        }
    }

    function updateCard() {
        var p = partners[selIdx];
        if (!p || !card.name) return;
        var t = fmtTime(p.tz);
        card.time.textContent = t.time;
        card.tz.textContent = t.off;
    }

    function select(i, focusGlobe) {
        var p = partners[i];
        if (!p) return;
        selIdx = i;
        if (uSphere) {
            uSphere.uSel.value = countryIndexOf(p);
            uArc.uSel.value = i;
            uPin.uSel.value = i;
            if (focusGlobe !== false) {
                lookAt(p.lat, p.lon);
                lastInteract = performance.now();
            }
        }
        U.$$('[data-country]', sec).forEach(function (b) {
            b.setAttribute('aria-pressed', b.getAttribute('data-country') === p.id ? 'true' : 'false');
        });
        card.k.textContent = p.hq ? APP.t('hq') : APP.t('partner');
        card.name.textContent = p.name;
        card.city.textContent = p.city;
        updateCard();
        if (!S.reduced) gsap.fromTo(card.box, { x: -10, opacity: 0.4 }, { x: 0, opacity: 1, duration: 0.6, ease: 'power3.out' });
    }

    function countryIndexOf(p) {
        for (var i = 0; i < world.length; i++) if (world[i].partner === p) return i + 1;
        return -1;
    }

    function setRegion(id, rotate) {
        regionId = id;
        var code = REGION_CODE[id] || 0;
        if (uSphere) {
            uSphere.uRegion.value = code;
            uArc.uRegion.value = code;
            uPin.uRegion.value = code;
        }
        var lis = U.$$('[data-geo-list] li');
        lis.forEach(function (li) {
            var on = id === 'all' || li.getAttribute('data-region') === id;
            li.hidden = !on;
        });
        if (!S.reduced) gsap.fromTo(lis.filter(function (li) { return !li.hidden; }), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.02, ease: 'power3.out' });
        if (rotate && id !== 'all' && started) {
            var r = (APP.t('regions') || []).filter(function (x) { return x.id === id; })[0];
            if (r) {
                lookAt(r.lat, r.lon);
                lastInteract = performance.now();
            }
        }
        APP.refresh(600);
    }

    // ---------- указатель: вращение, наведение, клик ----------
    function pick(e) {
        var r = canvas.getBoundingClientRect();
        pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
        pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        var hit = raycaster.intersectObject(sphere)[0];
        if (!hit) return 0;
        var p = globe.worldToLocal(hit.point.clone()).normalize();
        var lat = Math.asin(U.clamp(p.y, -1, 1)) * 180 / PI;
        var lon = Math.atan2(-p.z, p.x) * 180 / PI;
        var x = Math.floor((lon + 180) / 360 * ID_W) % ID_W;
        var y = U.clamp(Math.floor((90 - lat) / 180 * ID_H), 0, ID_H - 1);
        return idMap[y * ID_W + x];
    }

    function showTip(p, x, y) {
        if (!p) {
            tip.classList.remove('is-on');
            return;
        }
        var t = fmtTime(p.tz);
        tip.innerHTML = '';
        tip.appendChild(document.createTextNode(p.name + ' · ' + p.city));
        var sm = document.createElement('small');
        sm.textContent = APP.t('localTime') + ' ' + t.time.slice(0, 5) + ' ' + t.off;
        tip.appendChild(sm);
        tip.style.transform = 'translate(' + (x + 16).toFixed(0) + 'px,' + (y + 16).toFixed(0) + 'px)';
        tip.classList.add('is-on');
    }

    function bindPointer() {
        canvas.addEventListener('pointerdown', function (e) {
            drag = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now(), lock: e.pointerType === 'mouse' ? 'xy' : null, id: e.pointerId, moved: false };
            target = null;
        });
        window.addEventListener('pointermove', function (e) {
            if (drag) {
                var dx = e.clientX - drag.x;
                var dy = e.clientY - drag.y;
                if (!drag.lock) {
                    if (Math.abs(e.clientX - drag.sx) + Math.abs(e.clientY - drag.sy) < 6) return;
                    drag.lock = Math.abs(e.clientX - drag.sx) > Math.abs(e.clientY - drag.sy) ? 'x' : 'none';
                    if (drag.lock === 'x') canvas.setPointerCapture(drag.id);
                }
                if (drag.lock === 'none') return;
                drag.moved = drag.moved || Math.abs(e.clientX - drag.sx) + Math.abs(e.clientY - drag.sy) > 4;
                var k = 0.0055;
                rot.y += dx * k;
                rot.vy = dx * k / Math.max(0.008, (performance.now() - drag.t) / 1000);
                if (drag.lock === 'xy') {
                    rot.x = U.clamp(rot.x + dy * k, -0.9, 0.9);
                    rot.vx = dy * k / Math.max(0.008, (performance.now() - drag.t) / 1000);
                }
                drag.x = e.clientX;
                drag.y = e.clientY;
                drag.t = performance.now();
                lastInteract = drag.t;
                showTip(null);
                return;
            }
            if (!active || e.pointerType !== 'mouse' || !raycaster) return;
            if (e.target !== canvas) {
                if (hoverIdx !== -1) {
                    hoverIdx = -1;
                    uSphere.uHover.value = -1;
                    uPin.uHover.value = -1;
                    showTip(null);
                }
                return;
            }
            var id = pick(e);
            var p = countryPartner[id] || null;
            hoverIdx = p ? p.i : -1;
            uSphere.uHover.value = p ? id : -1;
            uPin.uHover.value = hoverIdx;
            var r = root.getBoundingClientRect();
            showTip(p, e.clientX - r.left, e.clientY - r.top);
        });
        function up(e) {
            if (!drag) return;
            var wasClick = !drag.moved;
            drag = null;
            if (!wasClick || !raycaster) return;
            var p = countryPartner[pick(e)];
            if (!p) return;
            // страна из другого региона — переключаем таб
            if (regionId !== 'all' && regionId !== p.region && listApi) listApi.select(p.region, 'data-region');
            select(p.i);
        }
        window.addEventListener('pointerup', up);
        window.addEventListener('pointercancel', function () { drag = null; });
    }

    function tick(time, dt) {
        if (!active || !started) return;
        var now = performance.now();
        if (target) {
            rot.x = U.damp(rot.x, target.x, 3.2, dt);
            rot.y = U.damp(rot.y, target.y, 3.2, dt);
            if (Math.abs(rot.x - target.x) + Math.abs(rot.y - target.y) < 0.002) target = null;
        } else if (!drag) {
            // инерция после броска, потом — медленное вращение, если давно не трогали
            rot.y += rot.vy * dt;
            rot.x = U.clamp(rot.x + rot.vx * dt, -0.9, 0.9);
            rot.vy *= Math.exp(-3 * dt);
            rot.vx *= Math.exp(-3 * dt);
            if (now - lastInteract > 7000 && !S.reduced) rot.y += dt * 0.07;
        }
        globe.rotation.set(rot.x, rot.y, 0);
        uSphere.uTime.value = time;
        uArc.uTime.value = time;
        uPin.uTime.value = time;
        renderer.render(scene, camera);
    }

    function load(src, done) {
        if (window.WORLD) return done();
        var s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.onload = done;
        document.head.appendChild(s);
    }

    APP.globe = {
        init: function () {
            U = APP.utils;
            S = APP.state;
            root = U.$('[data-globe]');
            if (!root) return;
            canvas = U.$('[data-globe-canvas]', root);
            tip = U.$('[data-geo-tip]', root);
            sec = root.closest('[data-geo]');
            card = {
                box: U.$('[data-geo-card]', sec),
                k: U.$('[data-geo-card-k]', sec),
                name: U.$('[data-geo-card-name]', sec),
                city: U.$('[data-geo-card-city]', sec),
                time: U.$('[data-geo-card-time]', sec),
                tz: U.$('[data-geo-card-tz]', sec)
            };
            partners = (APP.t('geo') || []).map(function (p) { return Object.assign({}, p); });
            partners.forEach(function (p, i) {
                p.i = i;
                byIso[p.id] = p;
            });

            // табы регионов, чипы стран и карточка работают и до загрузки глобуса
            listApi = APP.widgets.tabs(U.$('[data-geo-tabs]', sec), function (btn) { setRegion(btn.getAttribute('data-region'), true); });
            sec.addEventListener('click', function (e) {
                var b = e.target.closest('[data-country]');
                if (!b) return;
                var p = byIso[b.getAttribute('data-country')];
                if (p) select(p.i);
            });
            var hq = partners.filter(function (p) { return p.hq; })[0];
            if (hq) select(hq.i, false);
            setInterval(function () { if (active) updateCard(); }, 1000);

            // без WebGL (его проверяет 3D-сцена) — остаются табы, список и карточка
            if (!window.THREE || document.documentElement.classList.contains('no-webgl')) return;
            ScrollTrigger.create({
                trigger: sec,
                start: 'top 160%',
                once: true,
                onEnter: function () {
                    load(root.getAttribute('data-world'), function () {
                        try {
                            build();
                        } catch (err) {
                            console.error(err);
                        }
                    });
                }
            });
            ScrollTrigger.create({
                trigger: sec,
                start: 'top bottom',
                end: 'bottom top',
                onToggle: function (st) { active = st.isActive; }
            });
            APP.onTick(tick);
        }
    };
})();
