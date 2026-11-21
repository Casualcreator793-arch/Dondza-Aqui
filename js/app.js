/* Dondza Aqui — arranque, rotas e ecrãs de início (onboarding, planos, início). */
window.DZ = window.DZ || {};
DZ.rotas = DZ.rotas || {};

// ---------- Textos principais (fáceis de editar) ----------
const TXT = {
  slogan: "Prepare-se para os exames de admissão ao ensino superior.",
  disciplinasEmBreve: ["Matemática", "Biologia", "Química", "Física", "Inglês", "Geografia"],
  niveis: {
    basico: ["Básico", "Estou a começar ou quero rever o essencial."],
    intermedio: ["Intermédio", "Já domino o essencial e quero praticar mais."],
    avancado: ["Avançado", "Quero afinar detalhes e treinar para o exame."]
  }
};
const ICONE_CADEADO = '<svg class="cadeado" viewBox="0 0 24 24" fill="currentColor" aria-label="Bloqueado"><path d="M12 1a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-1V6a5 5 0 0 0-5-5zm-3 8V6a3 3 0 0 1 6 0v3H9z"/></svg>';

// ---------- Utilitários ----------
DZ.esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
DZ.app = () => document.getElementById("app");
DZ.ir = r => { location.hash = "#/" + r; };
DZ.voltar = (alt = "inicio") => { if (history.length > 1) history.back(); else DZ.ir(alt); };
DZ.toast = m => { const t = document.getElementById("toast"); t.textContent = m; t.classList.add("on"); clearTimeout(DZ._tt); DZ._tt = setTimeout(() => t.classList.remove("on"), 2600); };
DZ.modal = html => {
  const f = document.createElement("div"); f.className = "fundo-modal";
  f.innerHTML = '<div class="modal" role="dialog" aria-modal="true">' + html + "</div>";
  document.body.appendChild(f);
  const fechar = () => f.remove();
  f.addEventListener("click", e => { if (e.target === f) fechar(); });
  return { el: f, fechar };
};
DZ.copiar = async t => { try { await navigator.clipboard.writeText(t); DZ.toast("Copiado"); } catch (e) { prompt("Copie o texto:", t); } };
DZ.som = tipo => {
  if (!DZ.S.definicoes.sons) return;
  try {
    const A = window.AudioContext || window.webkitAudioContext; DZ._ac = DZ._ac || new A();
    const o = DZ._ac.createOscillator(), g = DZ._ac.createGain();
    o.frequency.value = tipo === "certo" ? 880 : 200; o.type = tipo === "certo" ? "sine" : "triangle";
    g.gain.value = .08; o.connect(g); g.connect(DZ._ac.destination); o.start(); o.stop(DZ._ac.currentTime + (tipo === "certo" ? .12 : .25));
  } catch (e) { /* sem som */ }
};
DZ.aplicarTema = () => {
  const d = DZ.S.definicoes; document.documentElement.dataset.tema = d.tema; document.documentElement.dataset.fonte = d.fonte;
  const escuro = d.tema === "escuro" || (d.tema === "auto" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.querySelector('meta[name="theme-color"]').content = escuro ? "#0E1626" : "#1F3A6E";
};
DZ.topo = (titulo, extra = "", voltar = true) =>
  `<header class="topo">${voltar ? '<button class="icone-btn" data-voltar aria-label="Voltar">←</button>' : ""}<h2>${DZ.esc(titulo)}</h2>${extra}</header>`;

// Cliques genéricos: data-ir="rota" e data-voltar
document.addEventListener("click", e => {
  const b = e.target.closest("[data-ir]"); if (b) { DZ.ir(b.dataset.ir); return; }
  if (e.target.closest("[data-voltar]")) DZ.voltar();
});

// ---------- Rotas ----------
const ONB = ["boas-vindas", "nome", "disciplina", "nivel", "planos"];
DZ.render = async () => {
  if (DZ.aoSair) { DZ.aoSair(); DZ.aoSair = null; }
  const p = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean).map(decodeURIComponent);
  let nome = p[0] || (DZ.S.perfil.onboarding ? "inicio" : "boas-vindas");
  if (!DZ.S.perfil.onboarding && !ONB.includes(nome)) nome = "boas-vindas";
  const f = DZ.rotas[nome] || DZ.rotas.inicio;
  window.scrollTo(0, 0);
  try { await f(p.slice(1), DZ.app()); }
  catch (e) { console.error(e); DZ.app().innerHTML = DZ.topo("Ocorreu um erro") + '<p>Não foi possível abrir este ecrã. Volte atrás e tente de novo.</p>'; }
};
window.addEventListener("hashchange", DZ.render);

// ---------- Onboarding ----------
DZ.rotas["boas-vindas"] = (a, app) => {
  app.innerHTML = `<div class="centro"><img class="logo" src="icons/icon-192.png" alt="Logótipo Dondza Aqui">
    <h1>Dondza Aqui</h1><p class="suave">${TXT.slogan}</p>
    <button class="btn" data-ir="nome">Começar</button></div>`;
};
DZ.rotas.nome = (a, app) => {
  app.innerHTML = DZ.topo("Como se chama?") + `<label for="nm">O seu nome</label>
    <input type="text" id="nm" value="${DZ.esc(DZ.S.perfil.nome)}" autocomplete="given-name" maxlength="40">
    <div class="erro" id="er" hidden>Escreva o seu nome para continuar.</div>
    <button class="btn" id="ok" style="margin-top:16px">Continuar</button>`;
  app.querySelector("#ok").onclick = () => {
    const v = app.querySelector("#nm").value.trim();
    if (!v) { app.querySelector("#er").hidden = false; return; }
    DZ.S.perfil.nome = v; DZ.guardar(); DZ.ir("disciplina");
  };
};
DZ.rotas.disciplina = (a, app) => {
  app.innerHTML = DZ.topo("Escolha a disciplina") +
    '<button class="opcao ativa">Língua Portuguesa</button>' +
    TXT.disciplinasEmBreve.map(d => `<button class="opcao" disabled>${d}<span class="tag">Em breve</span></button>`).join("") +
    '<button class="btn" data-ir="nivel" style="margin-top:8px">Continuar</button>';
};
DZ.rotas.nivel = async (a, app) => {
  const L = await DZ.lessons.carregar();
  const sel = DZ.S.perfil.nivel;
  const msg = n => {
    const t = DZ.lessons.achar(L.inicio_por_nivel[n]).t.titulo;
    return (n === "basico" ? "" : "Ainda não há conteúdo específico para este nível. O conteúdo disponível agora é o do plano Básico (Módulos 1 e 2). ") + `Sugerimos começar por «${t}».`;
  };
  app.innerHTML = DZ.topo("Qual é o seu nível?") +
    Object.entries(TXT.niveis).map(([k, v]) => `<button class="opcao ${sel === k ? "ativa" : ""}" data-n="${k}"><b>${v[0]}</b><br><span class="suave peq">${v[1]}</span></button>`).join("") +
    `<div id="rec" class="cartao fundo-claro" ${sel ? "" : "hidden"}>${sel ? msg(sel) : ""}</div>
     <button class="btn" id="ok" ${sel ? "" : "disabled"}>Continuar</button>`;
  app.querySelectorAll("[data-n]").forEach(b => b.onclick = () => {
    DZ.S.perfil.nivel = b.dataset.n; DZ.guardar();
    app.querySelectorAll("[data-n]").forEach(x => x.classList.toggle("ativa", x === b));
    const r = app.querySelector("#rec"); r.hidden = false; r.textContent = msg(b.dataset.n); app.querySelector("#ok").disabled = false;
  });
  app.querySelector("#ok").onclick = () => DZ.ir("planos");
};
DZ.rotas.planos = (a, app) => {
  const mazaOk = DZ.unlock.estaDesbloqueado("maza");
  app.innerHTML = (DZ.S.perfil.onboarding ? DZ.topo("Planos") : DZ.topo("Escolha o plano", "", true)) + `
    <div class="planos">
      <div class="plano" role="button" tabindex="0" id="pb"><h2>Básico</h2><div class="preco">Grátis</div><p class="suave peq">Aulas e exercícios dos Módulos 1 e 2</p></div>
      <div class="plano maza" role="button" tabindex="0" id="pm">${mazaOk ? "" : ICONE_CADEADO}<h2>Maza</h2><div class="preco">${PLANOS.maza.preco}</div><p class="suave peq">Básico + Exames Interativos${mazaOk ? " (desbloqueado)" : ""}</p></div>
    </div><p class="suave peq centro">Pode mudar de plano mais tarde nas Configurações.</p>`;
  const entrar = pl => { DZ.S.perfil.plano = pl; DZ.S.perfil.onboarding = true; DZ.guardar(); DZ.ir("inicio"); };
  const ativa = (el, fn) => { el.onclick = fn; el.onkeydown = e => { if (e.key === "Enter" || e.key === " ") fn(); }; };
  ativa(app.querySelector("#pb"), () => entrar("basico"));
  ativa(app.querySelector("#pm"), () => mazaOk ? entrar("maza") : DZ.unlock.abrir("maza", () => entrar("maza")));
};

// ---------- Início ----------
DZ.rotas.inicio = async (a, app) => {
  const L = await DZ.lessons.carregar();
  if (DZ.S.perfil.plano === "maza" && !DZ.unlock.estaDesbloqueado("maza")) { DZ.S.perfil.plano = "basico"; DZ.guardar(); }
  const maza = DZ.S.perfil.plano === "maza";
  const aba = maza && a[0] === "exames" ? "exames" : "aulas";
  const meta = DZ.S.definicoes.metaDiaria, feitos = DZ.S.progresso.diario[DZ.hoje()] || 0;
  let html = `<header class="topo"><h2>Olá, ${DZ.esc(DZ.S.perfil.nome)}</h2><button class="icone-btn" data-ir="config" aria-label="Configurações">⚙️</button></header>
    <div class="cartao"><div class="peq suave">Meta de hoje: ${Math.min(feitos, meta)} de ${meta} exercícios</div><div class="barra"><i style="width:${Math.min(100, feitos / meta * 100)}%"></i></div></div>`;
  if (maza) html += `<div class="abas"><button class="aba aulas ${aba === "aulas" ? "on" : ""}" data-ir="inicio/aulas">📖 Aulas</button><button class="aba exames ${aba === "exames" ? "on" : ""}" data-ir="inicio/exames">📝 Exames Interativos</button></div>`;
  if (aba === "aulas") {
    const nenhum = !Object.keys(DZ.S.progresso.topicos).length;
    if (nenhum) { const id = L.inicio_por_nivel[DZ.S.perfil.nivel || "basico"]; html += `<div class="cartao fundo-claro"><b>Ponto de partida recomendado</b><p class="peq" style="margin:4px 0 10px">${DZ.esc(DZ.lessons.achar(id).t.titulo)}</p><button class="btn" data-ir="topico/${id}">Começar agora</button></div>`; }
    html += DZ.lessons.lista();
    if (!maza) html += `<div class="plano maza" role="button" tabindex="0" id="bm" style="min-height:0;text-align:left;padding-right:34px">${ICONE_CADEADO}<h3 style="margin:0">Plano Maza · ${PLANOS.maza.preco}</h3><p class="peq suave" style="margin:4px 0 0">Desbloqueie os Exames Interativos com correção e revisão guiada.</p></div>`;
    app.innerHTML = html;
    const bm = app.querySelector("#bm");
    if (bm) bm.onclick = () => DZ.unlock.abrir("maza", () => { DZ.S.perfil.plano = "maza"; DZ.guardar(); DZ.ir("inicio/exames"); });
  } else { app.innerHTML = html; await DZ.exams.listaPara(app); }
};

// ---------- Lembrete simples (aparece ao abrir a app) ----------
DZ.lembrete = () => {
  const d = DZ.S.definicoes; if (!d.lembrete || !DZ.S.perfil.onboarding) return;
  const agora = new Date(), [h, m] = d.lembreteHora.split(":").map(Number);
  if ((agora.getHours() * 60 + agora.getMinutes()) >= h * 60 + m && (DZ.S.progresso.diario[DZ.hoje()] || 0) < d.metaDiaria) setTimeout(() => DZ.toast("Lembrete: ainda não cumpriu a meta de hoje."), 800);
};

// ---------- Arranque ----------
(async () => {
  DZ.aplicarTema();
  await DZ.unlock.verificarTodos();
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("service-worker.js").catch(() => {});
  DZ.lembrete(); DZ.render();
})();
