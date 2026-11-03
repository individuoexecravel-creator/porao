/* O Porão: menu, busca, leitura (tema e tamanho), sumário, progresso, casos lidos, ouvir e compartilhar.
   Adaptado do script do Portal. Tema, tamanho e voz são as mesmas preferências do Portal. */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var norm = function (t) { return (t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
  var esc = function (t) { return String(t || '').replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var semMovimento = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ultimoPonteiro = 'mouse';
  addEventListener('pointerdown', function (e) { ultimoPonteiro = e.pointerType; }, true);

  /* ---------- Menu do celular ---------- */
  var botaoMenu = $('[data-menu]'), menu = $('#menu-movel');
  function fecharMenu() {
    if (!menu || menu.hidden) return;
    menu.hidden = true; botaoMenu.setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('menu-aberto');
  }
  if (botaoMenu && menu) {
    botaoMenu.addEventListener('click', function () {
      var abrir = menu.hidden;
      menu.hidden = !abrir; botaoMenu.setAttribute('aria-expanded', String(abrir));
      document.documentElement.classList.toggle('menu-aberto', abrir);
      if (abrir) { var a = $('a', menu); if (a) a.focus(); }
    });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', fecharMenu); });
    addEventListener('resize', function () { if (innerWidth > 960) fecharMenu(); });
  }

  /* ---------- Busca (dossiês) ---------- */
  var dlg = $('#busca'), q = $('#busca-q'), lista = $('#busca-res'), dica = $('#busca-dica'), indice = null;
  function carregar() {
    if (indice) return Promise.resolve(indice);
    return fetch(dlg.dataset.indice).then(function (r) { return r.json(); }).then(function (d) {
      indice = d.map(function (x) { x.n = norm([x.t, x.d, x.loc, x.per, x.sit, x.sec, x.f].join(' ')); x.nt = norm(x.t); return x; });
      return indice;
    }).catch(function () { indice = []; return indice; });
  }
  function buscar() {
    var termos = norm(q.value).trim().split(/\s+/).filter(Boolean);
    if (!termos.length) { lista.innerHTML = ''; dica.hidden = false; return; }
    carregar().then(function (d) {
      var r = d.map(function (x) {
        var p = 0;
        for (var i = 0; i < termos.length; i++) {
          if (x.n.indexOf(termos[i]) < 0) return null;
          p += x.nt.indexOf(termos[i]) >= 0 ? 4 : 1;
        }
        return { x: x, p: p };
      }).filter(Boolean).sort(function (a, b) { return b.p - a.p; }).slice(0, 10);
      dica.hidden = true;
      lista.innerHTML = r.length ? r.map(function (o) {
        var x = o.x;
        return '<li><a href="' + esc(x.u) + '">' +
          (x.img ? '<img src="' + esc(x.img) + '" alt="" loading="lazy">' : '<span class="res-sem" aria-hidden="true"></span>') +
          '<span class="res-txt"><span class="res-sec">' + esc(x.sec) + (x.per ? ' · ' + esc(x.per) : '') + '</span>' +
          '<span class="res-t">' + esc(x.t) + '</span>' +
          ((x.loc || x.sit) ? '<span class="res-s">' + esc([x.loc, x.sit].filter(Boolean).join(' · ')) + '</span>' : '') + '</span></a></li>';
      }).join('') : (d.length ? '<li class="res-nada">Nada encontrado para “' + esc(q.value) + '”. Confira a grafia ou procure pelo nome da cidade.</li>' : '<li class="res-nada">O arquivo ainda não tem dossiês publicados.</li>');
    });
  }
  function abrirBusca() {
    if (!dlg) return;
    fecharMenu();
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    document.documentElement.classList.add('busca-aberta');
    carregar(); q.focus(); q.select();
  }
  if (dlg) {
    $$('[data-abrir-busca]').forEach(function (b) { b.addEventListener('click', abrirBusca); });
    $$('[data-sugestao]', dlg).forEach(function (b) { b.addEventListener('click', function () { q.value = b.dataset.sugestao; buscar(); q.focus(); }); });
    q.addEventListener('input', buscar);
    q.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { var a = $('a', lista); if (a) { e.preventDefault(); location.href = a.href; } }
      if (e.key === 'ArrowDown') { var b = $('a', lista); if (b) { e.preventDefault(); b.focus(); } }
    });
    lista.addEventListener('keydown', function (e) {
      var links = $$('a', lista), i = links.indexOf(document.activeElement);
      if (e.key === 'ArrowDown' && i < links.length - 1) { e.preventDefault(); links[i + 1].focus(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); (i > 0 ? links[i - 1] : q).focus(); }
    });
    lista.addEventListener('click', function (e) { if (e.target.closest('a')) dlg.close(); });
    dlg.addEventListener('close', function () { document.documentElement.classList.remove('busca-aberta'); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  }
  document.addEventListener('keydown', function (e) {
    var t = e.target, digitando = t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
    if (e.key === '/' && !digitando && !e.ctrlKey && !e.metaKey) { e.preventDefault(); abrirBusca(); }
    if (e.key === 'Escape') fecharMenu();
  });

  /* ---------- Matéria ---------- */
  var texto = $('[data-texto]');
  if (texto) {
    var sum = $('[data-sumario]'), hs = $$(':scope > h2, :scope > .fontes > h2', texto);
    if (sum && hs.length >= 3) {
      var ol = $('ol', sum);
      hs.forEach(function (h, i) {
        if (!h.id) h.id = 'parte-' + (i + 1);
        var li = document.createElement('li'), a = document.createElement('a');
        a.href = '#' + h.id; a.textContent = h.textContent; li.appendChild(a); ol.appendChild(li);
      });
      sum.hidden = false;
      if ('IntersectionObserver' in window) {
        var links = $$('a', ol), atualH = null;
        var io = new IntersectionObserver(function (es) {
          es.forEach(function (e) { if (e.isIntersecting) atualH = e.target.id; });
          links.forEach(function (a) { a.classList.toggle('atual', a.hash === '#' + atualH); });
        }, { rootMargin: '-15% 0px -75% 0px' });
        hs.forEach(function (h) { io.observe(h); });
      }
    }

    var barra = $('.progresso span'), irTopo = $('.ir-topo'), pedido = false;
    function rolar() {
      pedido = false;
      var r = texto.getBoundingClientRect(), total = r.height - innerHeight * 0.6;
      var p = Math.min(1, Math.max(0, -r.top / (total > 0 ? total : 1)));
      if (barra) barra.style.transform = 'scaleX(' + p + ')';
      if (irTopo) irTopo.hidden = scrollY < innerHeight * 1.2;
    }
    addEventListener('scroll', function () { if (!pedido) { pedido = true; requestAnimationFrame(rolar); } }, { passive: true });
    rolar();
    if (irTopo) irTopo.addEventListener('click', function () {
      scrollTo({ top: 0, behavior: semMovimento ? 'auto' : 'smooth' });
      var m = $('#conteudo'); if (m) m.focus({ preventScroll: true });
    });
  }

  /* ---------- Compartilhar ---------- */
  $$('[data-compartilhar]').forEach(function (b) {
    var rot = $('span', b), orig = rot.textContent;
    b.addEventListener('click', function () {
      var dados = { title: b.dataset.titulo || document.title, url: location.href.split('#')[0] };
      if (navigator.share) { navigator.share(dados).catch(function () {}); return; }
      var ok = function () { rot.textContent = 'Link copiado'; setTimeout(function () { rot.textContent = orig; }, 2200); };
      if (navigator.clipboard) navigator.clipboard.writeText(dados.url).then(ok, function () { rot.textContent = 'Copie o link na barra do navegador'; });
      else rot.textContent = 'Copie o link na barra do navegador';
    });
  });

  /* ---------- Armazenamento local (pode falhar em aba anônima) ---------- */
  var guarda = {
    ler: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    por: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  var raiz = document.documentElement;

  /* ---------- Ajustes de leitura: tema e tamanho do texto ---------- */
  var botaoLeitura = $('[data-leitura]'), painelLeitura = $('#leitura');
  if (botaoLeitura && painelLeitura) {
    var escalas = [0.9, 1, 1.1, 1.2, 1.35];
    var temaFixo = raiz.hasAttribute('data-tema-fixo');
    var temaAtual = function () { if (temaFixo) return guarda.ler('portal-tema') === 'claro' ? 'claro' : 'escuro'; return raiz.getAttribute('data-tema') === 'claro' ? 'claro' : 'escuro'; };
    var escalaAtual = function () { var e = parseFloat(getComputedStyle(raiz).getPropertyValue('--escala')) || 1; return escalas.reduce(function (a, b) { return Math.abs(b - e) < Math.abs(a - e) ? b : a; }); };
    var corTopo = $('meta[name="theme-color"]'), esquema = $('meta[name="color-scheme"]');
    var mostrarLeitura = function () {
      var t = temaAtual(), e = escalaAtual();
      $$('[data-tema-op]', painelLeitura).forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.temaOp === t)); });
      $('[data-tam-valor]', painelLeitura).textContent = Math.round(e * 100) + '%';
      $('[data-tam="-1"]', painelLeitura).disabled = e <= escalas[0];
      $('[data-tam="1"]', painelLeitura).disabled = e >= escalas[escalas.length - 1];
      if (!temaFixo && corTopo) corTopo.content = t === 'claro' ? '#ece8e0' : '#0b0b0b';
      if (!temaFixo && esquema) esquema.content = t === 'claro' ? 'light' : 'dark';
    };
    var fecharLeitura = function (foco) { painelLeitura.hidden = true; botaoLeitura.setAttribute('aria-expanded', 'false'); if (foco) botaoLeitura.focus(); };
    botaoLeitura.addEventListener('click', function () {
      var abrir = painelLeitura.hidden;
      painelLeitura.hidden = !abrir; botaoLeitura.setAttribute('aria-expanded', String(abrir));
      if (abrir) { mostrarLeitura(); $('[aria-pressed="true"]', painelLeitura).focus(); }
    });
    $$('[data-tema-op]', painelLeitura).forEach(function (b) {
      b.addEventListener('click', function () {
        if (!temaFixo) { if (b.dataset.temaOp === 'claro') raiz.setAttribute('data-tema', 'claro'); else raiz.removeAttribute('data-tema'); }
        guarda.por('portal-tema', b.dataset.temaOp); mostrarLeitura();
      });
    });
    $$('[data-tam]', painelLeitura).forEach(function (b) {
      b.addEventListener('click', function () {
        var i = escalas.indexOf(escalaAtual()) + +b.dataset.tam;
        var e = escalas[Math.max(0, Math.min(escalas.length - 1, i))];
        raiz.style.setProperty('--escala', e); guarda.por('portal-escala', String(e)); mostrarLeitura();
        if (b.disabled) $('[data-tam]:not([disabled])', painelLeitura).focus();
      });
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !painelLeitura.hidden) fecharLeitura(true); });
    document.addEventListener('click', function (e) { if (!painelLeitura.hidden && !painelLeitura.contains(e.target) && !botaoLeitura.contains(e.target)) fecharLeitura(false); });
    if (temaFixo) { var nota = $('.lp-nota', painelLeitura); if (nota) nota.textContent = ''; }
    mostrarLeitura();
  }

  /* ---------- Casos já lidos ---------- */
  var lidos = {};
  try { lidos = JSON.parse(guarda.ler('porao-lidos') || '{}') || {}; } catch (e) { lidos = {}; }
  function marcarLidos() {
    $$('[data-lido]').forEach(function (el) {
      var l = !!lidos[el.dataset.lido];
      el.classList.toggle('lido', l);
      if (l && !$('.selo-lido', el)) {
        var s = document.createElement('span'); s.className = 'selo-lido'; s.textContent = 'Lido';
        var alvo = $('.ficha-card-texto', el) || el; alvo.appendChild(s);
      }
    });
  }
  marcarLidos();
  var texto = $('[data-texto]');
  if (texto && texto.dataset.slug) {
    var slug = texto.dataset.slug, selo = $('[data-lido-selo]');
    if (lidos[slug] && selo) selo.hidden = false;
    var fimTexto = $('.fontes', texto) || texto.lastElementChild;
    if ('IntersectionObserver' in window && fimTexto && !lidos[slug]) {
      var ob = new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { lidos[slug] = Date.now(); guarda.por('porao-lidos', JSON.stringify(lidos)); ob.disconnect(); }
      });
      ob.observe(fimTexto);
    }
  }

  /* ---------- Ouvir a matéria ----------
     Usa a voz do próprio navegador. Para soar menos robótico:
     1) escolhe a melhor voz em português disponível (as "Natural", "Online", "Google" ou "Aprimorada");
     2) reescreve o que a voz lê mal (R$ 3 mil vira "3 mil reais", 1992–2005 vira "1992 a 2005");
     3) lê frase por frase, com pausas depois de títulos e parágrafos, como uma pessoa lendo. */
  var ouvir = $('[data-ouvir]'), painelOuvir = $('[data-ouvir-painel]');
  if (ouvir && painelOuvir && texto && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window) {
    ouvir.hidden = false;
    var sint = window.speechSynthesis, play = $('[data-ouvir-play]', ouvir), parar = $('[data-ouvir-parar]', ouvir), rot = $('[data-ouvir-rot]', ouvir);
    var vozSel = $('[data-ouvir-voz]', painelOuvir), vel = $('[data-ouvir-vel]', painelOuvir), dicaVoz = $('[data-ouvir-dica]', painelOuvir);
    var frases = [], pos = 0, estado = 'parado', voz = null, vozes = [], espera = null;

    var notaVoz = function (v) {
      var n = v.name, s = 0;
      if (/natural|neural/i.test(n)) s += 60;
      if (/online/i.test(n)) s += 15;
      if (/premium|enhanced|aprimorad|melhorad/i.test(n)) s += 45;
      if (/google/i.test(n)) s += 30;
      if (/pt[-_]BR/i.test(v.lang)) s += 10;
      if (/compact|espeak|eloquence|robot/i.test(n)) s -= 40;
      return s;
    };
    var nomeVoz = function (v) {
      var n = v.name.replace(/^Microsoft\s+/i, '').replace(/\s*[-–]\s*Portugu[eê]s.*$/i, '').replace(/\s*Online\s*\(Natural\)/i, ' (natural)').replace(/^Google\s+portugu[eê]s do Brasil$/i, 'Google');
      return n + (/pt[-_]PT/i.test(v.lang) ? ' · Portugal' : '');
    };
    var carregarVozes = function () {
      vozes = sint.getVoices().filter(function (v) { return /^pt/i.test(v.lang); }).sort(function (a, b) { return notaVoz(b) - notaVoz(a); });
      if (!vozes.length) { vozSel.innerHTML = '<option>Voz padrão do navegador</option>'; vozSel.disabled = true; voz = null; }
      else {
        vozSel.disabled = false;
        vozSel.innerHTML = vozes.map(function (v, i) { return '<option value="' + i + '">' + esc(nomeVoz(v)) + '</option>'; }).join('');
        var salva = guarda.ler('portal-voz'), i = 0;
        vozes.forEach(function (v, k) { if (v.name === salva) i = k; });
        vozSel.value = String(i); voz = vozes[i];
      }
      var boa = vozes.length && notaVoz(vozes[0]) >= 40;
      dicaVoz.hidden = boa;
      dicaVoz.textContent = 'As vozes deste navegador soam mais robóticas. Para uma leitura mais natural, abra o site no Microsoft Edge, que tem vozes "Natural", ou no Chrome. No iPhone, baixe uma voz "Aprimorada" em Ajustes, Acessibilidade, Conteúdo Falado, Vozes.';
    };
    carregarVozes(); if (sint.addEventListener) sint.addEventListener('voiceschanged', carregarVozes);

    /* O que a voz lê mal, escrito como se fala */
    var unid = { mil: 'mil', mi: 'milhões', 'milhão': 'milhão', 'milhões': 'milhões', bi: 'bilhões', 'bilhão': 'bilhão', 'bilhões': 'bilhões' };
    var falado = function (t) {
      return t
        .replace(/(R\$|US\$|€)\s?(\d[\d.,]*)(?:\s?(mil|milhões|milhão|mi|bilhões|bilhão|bi)(?![a-zà-ú]))?/g, function (_, m, n, u) {
          var moeda = m === 'R$' ? 'reais' : m === 'US$' ? 'dólares' : 'euros';
          if (u) { u = unid[u]; return n + ' ' + u + (u === 'mil' ? ' ' : ' de ') + moeda; }
          return n + ' ' + moeda;
        })
        .replace(/\bentre (\d{4})\s?[–-]\s?(\d{4})\b/g, 'entre $1 e $2')
        .replace(/\b(\d{4})\s?[–-]\s?(\d{4})\b/g, '$1 a $2')
        .replace(/\b(\d{1,2})\s?[–-]\s?(\d{1,2})\b/g, '$1 a $2')
        .replace(/\bn[ºo°]\s?(?=\d)/gi, 'número ')
        .replace(/\s[—–]\s/g, ', ').replace(/—/g, ', ')
        .replace(/\s?·\s?/g, ', ')
        .replace(/\s\/\s/g, ', ')
        .replace(/[“”"«»]/g, '')
        .replace(/:\s/g, ': ')
        .replace(/\s+/g, ' ').trim();
    };
    /* Divide em frases sem quebrar números como 1.600.000 */
    var emFrases = function (t) {
      var partes = t.replace(/([.!?…][)\]]?)\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ(¿¡])/g, '$1\u0001').split('\u0001'), out = [];
      partes.forEach(function (p) {
        p = p.trim(); if (!p) return;
        if (out.length && out[out.length - 1].length < 40) { out[out.length - 1] += ' ' + p; return; }
        while (p.length > 240) { var c = p.lastIndexOf(', ', 200); if (c < 80) break; out.push(p.slice(0, c + 1)); p = p.slice(c + 2); }
        out.push(p);
      });
      return out;
    };
    var juntar = function () {
      var lista = [], h1 = $('h1');
      var poe = function (el, txt, pausa) { var fs = emFrases(falado(txt)); fs.forEach(function (f, i) { lista.push({ el: el, txt: f, pausa: i === fs.length - 1 ? pausa : 60 }); }); };
      if (h1) { var hc = $('.h1-caso', h1), hs = $('.h1-sub', h1); poe(null, (hc ? hc.textContent + (hs ? '. ' + hs.textContent : '') : h1.textContent.replace(/:\s*/, '. ')).replace(/\s+/g, ' ').trim() + '.', 500); }
      if ($('.linha-fina')) poe(null, $('.linha-fina').textContent, 700);
      $$(':scope > h2, :scope > h3, :scope > p, :scope > ul > li, :scope > ol > li, :scope > blockquote', texto).forEach(function (el) {
        if (el.closest('.fontes, .autor')) return;
        var t = el.textContent.replace(/\s+/g, ' ').trim(); if (!t) return;
        var titulo = /^H[23]$/.test(el.tagName);
        if (titulo && !/[.!?]$/.test(t)) t += '.';
        poe(el, t, titulo ? 550 : el.tagName === 'LI' ? 250 : 380);
      });
      return lista;
    };
    var marcar = function (el) { $$('.lendo', texto).forEach(function (x) { if (x !== el) x.classList.remove('lendo'); }); if (el) el.classList.add('lendo'); };
    var falar = function () {
      clearTimeout(espera);
      if (pos >= frases.length) { pararTudo(); return; }
      var f = frases[pos], u = new SpeechSynthesisUtterance(f.txt);
      u.lang = voz ? voz.lang : 'pt-BR'; if (voz) { try { u.voice = voz; } catch (e) {} }
      u.rate = parseFloat(vel.value) || 1; u.pitch = 1;
      u.onend = function () { if (estado === 'tocando') { pos++; espera = setTimeout(falar, f.pausa); } };
      u.onerror = function (e) { if (e.error !== 'interrupted' && e.error !== 'canceled') pararTudo(); };
      if (f.el && !f.el.classList.contains('lendo')) {
        marcar(f.el);
        var r = f.el.getBoundingClientRect();
        if (r.top < 90 || r.bottom > innerHeight) f.el.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      }
      sint.speak(u);
    };
    var mostrar = function () {
      ouvir.dataset.estado = estado;
      play.setAttribute('aria-pressed', String(estado === 'tocando'));
      rot.textContent = estado === 'tocando' ? 'Pausar' : estado === 'pausado' ? 'Continuar' : 'Ouvir';
      parar.hidden = painelOuvir.hidden = estado === 'parado';
    };
    var pararTudo = function () { estado = 'parado'; clearTimeout(espera); sint.cancel(); pos = 0; marcar(null); mostrar(); };
    var recomecarFrase = function () { if (estado === 'tocando') { sint.cancel(); setTimeout(falar, 60); } };
    play.addEventListener('click', function () {
      if (estado === 'tocando') { estado = 'pausado'; clearTimeout(espera); sint.cancel(); }
      else { if (estado === 'parado') { frases = juntar(); pos = 0; } estado = 'tocando'; sint.cancel(); setTimeout(falar, 60); }
      mostrar();
    });
    parar.addEventListener('click', function () { pararTudo(); play.focus(); });
    vel.addEventListener('change', function () { guarda.por('portal-voz-vel', vel.value); recomecarFrase(); });
    vozSel.addEventListener('change', function () { voz = vozes[+vozSel.value] || null; if (voz) guarda.por('portal-voz', voz.name); recomecarFrase(); });
    var velSalva = guarda.ler('portal-voz-vel'); if (velSalva && $('option[value="' + velSalva + '"]', vel)) vel.value = velSalva;
    addEventListener('pagehide', function () { sint.cancel(); });
    mostrar();
  }

})();
