/* Dondza Aqui — motor dos exames interativos (dados em data/exams/*.json).
   Regras: o exame é mostrado tal como no original. Enquanto "gabarito_status" for "pendente",
   o app não marca verde/vermelho nem calcula nota. */
window.DZ = window.DZ || {}; DZ.rotas = DZ.rotas || {};
DZ.exams = {
  cache: {}, _ind: null,
  async indice() { if (!this._ind) this._ind = await (await fetch("data/exams/index.json")).json(); return this._ind; },
  async carregar(id) {
    if (!this.cache[id]) { const i = (await this.indice()).find(x => x.id === id); this.cache[id] = await (await fetch("data/exams/" + i.ficheiro)).json(); }
    return this.cache[id];
  },
  // Cartões lado a lado, ordenados por ano (mais recente primeiro)
  async listaPara(app) {
    const ind = (await this.indice()).slice().sort((a, b) => b.ano - a.ano);
    app.insertAdjacentHTML("beforeend", '<div class="grade">' + ind.map(x => {
      const e = DZ.S.exames[x.id];
      const est = !e ? "Não iniciado" : e.estado === "concluido" ? "Concluído" : "Em andamento";
      const nota = e && e.melhor ? `${e.melhor.acertos}/${e.melhor.total} (${e.melhor.pct}%)` : e && e.estado === "concluido" ? "Gabarito pendente" : "—";
      return `<button class="ex-cartao" data-ir="exame/${x.id}"><div class="ano">${x.ano}</div><div>${DZ.esc(x.titulo || x.disciplina)}</div><div class="peq suave">${DZ.esc(x.instituicao || "")}</div><div class="peq suave">${x.total_questoes} questões</div>
        <div style="margin-top:6px"><span class="tag ok">${est}</span></div><div class="peq" style="margin-top:6px">Melhor nota: ${nota}</div></button>`;
    }).join("") + "</div>");
  }
};
const fmtEnun = t => DZ.esc(t).replace(/\[\[(.+?)\]\]/g, "<u>$1</u>");   // [[texto]] = sublinhado do original
const fmtTempo = ms => { const s = Math.ceil(ms / 1000), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return (h ? h + ":" : "") + String(m).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0"); };

DZ.rotas.exame = async ([id], app) => {
  await DZ.lessons.carregar();
  const ex = await DZ.exams.carregar(id), total = ex.questoes.length, dur = ex.duracao_minutos * 60000;
  const temGab = ex.gabarito_status === "confirmado";
  let es = DZ.S.exames[id];
  const q = n => ex.questoes[n - 1];
  const certa = (qq, r) => temGab && !!qq.resposta_correta && r === qq.resposta_correta;
  const nResp = () => Object.keys(es.respostas).length;
  const barra = (t, extra = "") => `<header class="topo"><button class="icone-btn" id="sair" aria-label="Sair">←</button><h2>${t}</h2>${extra}</header>`;
  const ligaSair = () => { const s = app.querySelector("#sair"); if (s) s.onclick = () => DZ.ir("inicio/exames"); };
  DZ.aoSair = () => { clearInterval(DZ.tm); if (es && es.estado === "andamento") DZ.guardar(); };

  // ---- Menu inicial ----
  function menu() {
    clearInterval(DZ.tm);
    const aviso = temGab ? "" : '<div class="aviso"><b>Gabarito oficial pendente.</b> Pode resolver o exame, mas as respostas ainda não são corrigidas e não há nota.</div>';
    const instr = `<div class="cartao"><b>${DZ.esc(ex.cabecalho.entidade)}</b><br>${DZ.esc(ex.cabecalho.titulo)}<ol style="padding-left:20px;margin:8px 0 0">${ex.cabecalho.instrucoes.map(i => `<li>${DZ.esc(i)}</li>`).join("")}</ol>${ex.cabecalho.fecho ? `<p class="centro"><b>${DZ.esc(ex.cabecalho.fecho)}</b></p>` : ""}</div>`;
    let corpo;
    if (es && es.estado === "andamento") corpo = `<button class="btn" id="cont">Continuar (questão ${es.atual} de ${total} · modo ${es.modo === "simulado" ? "Simulado" : "Estudo"})</button><button class="btn sec" id="rec">Recomeçar</button>`;
    else corpo = (es && es.estado === "concluido" ? '<button class="btn sec" id="vres" style="margin-bottom:12px">Ver último resultado</button>' : "") +
      '<button class="opcao" id="mest"><b>Modo Estudo</b><br><span class="suave peq">Correção imediata em cada questão (quando há gabarito).</span></button>' +
      `<button class="opcao" id="msim"><b>Modo Simulado</b><br><span class="suave peq">Cronómetro de ${ex.duracao_minutos} minutos e correção no fim.</span></button>`;
    app.innerHTML = barra(`${DZ.esc(ex.titulo)} ${ex.ano}`) + aviso + instr + corpo;
    ligaSair();
    const on = (s, f) => { const e = app.querySelector(s); if (e) e.onclick = f; };
    on("#cont", () => questao());
    on("#rec", () => { if (confirm("Recomeçar apaga as respostas deste exame em andamento. Continuar?")) { es = null; menu(); } });
    on("#vres", () => fim());
    on("#mest", () => iniciar("estudo")); on("#msim", () => iniciar("simulado"));
  }
  function iniciar(modo) {
    const ant = es;
    es = DZ.S.exames[id] = { modo, respostas: {}, atual: 1, estado: "andamento", restanteMs: modo === "simulado" ? dur : null, melhor: ant ? ant.melhor : null, resultado: null };
    DZ.guardar(); questao();
  }

  // ---- Questão ----
  function questao() {
    const n = es.atual, qq = q(n), r = es.respostas[n], sim = es.modo === "simulado";
    let ac = 0, er = 0; if (temGab && !sim) for (const k in es.respostas) certa(q(+k), es.respostas[k]) ? ac++ : er++;
    const travada = !sim && temGab && !!r;
    const parte = ex.partes.find(p => n >= p.de && n <= p.ate);
    let fb = "";
    if (!sim && r) fb = temGab ? `<div class="expl"><b>${certa(qq, r) ? "Certo!" : "Errado. Resposta correta: " + DZ.esc(qq.resposta_correta) + "."}</b> ${DZ.esc(qq.explicacao || "Explicação em breve.")}</div>`
      : '<div class="aviso"><b>Gabarito oficial pendente.</b> A sua resposta foi guardada, mas ainda não é corrigida.</div>';
    app.innerHTML = barra(`Questão ${n} de ${total}`, (sim ? `<b id="tm">${fmtTempo(es.restanteMs)}</b>` : "") + '<button class="icone-btn" id="mp" aria-label="Mapa de questões">▦</button>') +
      `<div class="barra"><i style="width:${n / total * 100}%"></i></div>
      <div class="contadores" style="margin:8px 0">${temGab && !sim ? `<span class="c">✔ ${ac}</span><span class="e">✘ ${er}</span>` : ""}<span class="suave">Respondidas: ${nResp()}/${total}</span></div>
      <span class="tag">${DZ.esc(parte.rotulo || parte.nome)}</span>${parte.instrucao ? `<p class="peq" style="margin:10px 0 0"><b>${DZ.esc(parte.instrucao)}</b></p>` : ""}
      ${qq.texto_id ? '<button class="btn sec" id="vt" style="margin:10px 0">📄 Ver texto</button>' : ""}
      <p class="enunciado" style="margin-top:12px"><b>${n}.</b> ${fmtEnun(qq.enunciado)}</p>
      <div id="ops">${Object.entries(qq.alternativas).map(([l, t]) => {
        let c = "opcao"; if (travada) { if (l === qq.resposta_correta) c += " certo"; else if (l === r) c += " errado"; } else if (l === r) c += " ativa";
        return `<button class="${c}" data-l="${l}"><b>${l}.</b> ${DZ.esc(t)}</button>`; }).join("")}</div>${fb}
      <div class="linha" style="margin-top:14px"><button class="btn sec" id="ant" ${n === 1 ? "disabled" : ""}>Anterior</button>
      ${n < total ? '<button class="btn" id="seg">Seguinte</button>' : '<button class="btn" id="fin">Finalizar</button>'}</div>`;
    ligaSair();
    app.querySelectorAll("#ops .opcao").forEach(b => b.onclick = () => {
      if (travada) return;
      const nova = !es.respostas[n]; es.respostas[n] = b.dataset.l; DZ.guardar();
      if (nova) DZ.contarHoje();
      if (!sim && temGab) DZ.som(certa(qq, b.dataset.l) ? "certo" : "errado");
      const y = window.scrollY; questao(); window.scrollTo(0, y);
    });
    const ir = k => { es.atual = k; DZ.guardar(); questao(); window.scrollTo(0, 0); };
    app.querySelector("#ant").onclick = () => ir(n - 1);
    const sg = app.querySelector("#seg"); if (sg) sg.onclick = () => ir(n + 1);
    const fi = app.querySelector("#fin"); if (fi) fi.onclick = () => finalizar();
    const vt = app.querySelector("#vt"); if (vt) vt.onclick = () => verTexto(qq.texto_id);
    app.querySelector("#mp").onclick = mapa;
    if (sim) timer();
  }
  function timer() {
    clearInterval(DZ.tm); let ult = Date.now(), k = 0;
    DZ.tm = setInterval(() => {
      const a = Date.now(); es.restanteMs = Math.max(0, es.restanteMs - Math.min(a - ult, 2000)); ult = a;   // tempo com a app em segundo plano não conta
      const t = app.querySelector("#tm"); if (t) t.textContent = fmtTempo(es.restanteMs);
      if (++k % 5 === 0) DZ.guardar();
      if (es.restanteMs <= 0) { clearInterval(DZ.tm); DZ.toast("O tempo acabou."); finalizar(true); }
    }, 1000);
  }
  function verTexto(tid) {
    const t = ex.textos.find(x => x.id === tid);
    const m = DZ.modal(`<div class="texto-exame"><h3>${DZ.esc(t.titulo)}</h3>${t.subtitulo ? `<h3>${DZ.esc(t.subtitulo)}</h3>` : ""}${t.paragrafos.map(p => `<p>${DZ.esc(p)}</p>`).join("")}${t.fonte ? `<p class="peq suave">${DZ.esc(t.fonte)}</p>` : ""}</div><button class="btn" id="fx">Fechar</button>`);
    m.el.querySelector("#fx").onclick = m.fechar;
  }
  function mapa() {
    const sim = es.modo === "simulado";
    const m = DZ.modal(`<h3>Mapa de questões</h3><p class="peq suave">Toque num número para saltar. Azul = respondida.</p><div class="mapa">${ex.questoes.map(x => {
      const r = es.respostas[x.numero]; let c = r ? "resp" : ""; if (x.numero === es.atual) c += " atual";
      if (r && !sim && temGab) c = certa(x, r) ? "certo" : "errado";
      return `<button class="${c}" data-n="${x.numero}">${x.numero}</button>`; }).join("")}</div>
      <button class="btn" id="fe">Finalizar exame</button><button class="btn sec" id="fx">Fechar</button>`);
    m.el.querySelectorAll("[data-n]").forEach(b => b.onclick = () => { m.fechar(); es.atual = +b.dataset.n; DZ.guardar(); questao(); window.scrollTo(0, 0); });
    m.el.querySelector("#fx").onclick = m.fechar;
    m.el.querySelector("#fe").onclick = () => { m.fechar(); finalizar(); };
  }

  // ---- Fim, nota e revisão ----
  function finalizar(auto) {
    const falta = total - nResp();
    if (!auto && falta && !confirm(`Faltam ${falta} questões sem resposta. Finalizar mesmo assim?`)) return;
    clearInterval(DZ.tm);
    const partes = ex.partes.map(p => {
      const qs = ex.questoes.filter(x => x.numero >= p.de && x.numero <= p.ate); let c = 0, r = 0;
      qs.forEach(x => { const rr = es.respostas[x.numero]; if (rr) r++; if (certa(x, rr)) c++; });
      return { id: p.id, nome: p.rotulo || p.nome, total: qs.length, certas: c, respondidas: r };
    });
    const acertos = partes.reduce((s, p) => s + p.certas, 0), pct = Math.round(acertos / total * 100);
    const erradas = temGab ? ex.questoes.filter(x => !certa(x, es.respostas[x.numero])).map(x => x.numero) : [];
    es.resultado = { data: Date.now(), acertos, total, pct, partes, erradas, pendente: !temGab };
    es.estado = "concluido"; es.restanteMs = null;
    if (temGab && (!es.melhor || acertos > es.melhor.acertos)) es.melhor = { acertos, total, pct };
    DZ.S.progresso.historico.unshift({ exame: id, titulo: `${ex.titulo} ${ex.ano}`, data: Date.now(), modo: es.modo, acertos, total, pendente: !temGab });
    if (temGab) { const ts = new Set(DZ.S.recomendados); erradas.forEach(n => { const t = q(n).topico_id; if (t) ts.add(t); }); DZ.S.recomendados = [...ts]; }
    DZ.guardar(); fim();
  }
  function fim() {
    const R = es.resultado; if (!R) return menu();
    let h = barra("Resultado");
    if (R.pendente) {
      h += `<div class="aviso"><b>Gabarito oficial pendente.</b> As suas respostas foram guardadas, mas ainda não há correção nem nota. Assim que o gabarito for confirmado, volte a abrir este exame.</div>
        <div class="cartao"><b>Respondidas: ${Object.keys(es.respostas).length} de ${R.total}</b><table>${R.partes.map(p => `<tr><td>${DZ.esc(p.nome)}</td><td>${p.respondidas}/${p.total}</td></tr>`).join("")}</table></div>`;
    } else {
      const fortes = R.partes.filter(p => p.certas / p.total >= .7), fracos = R.partes.filter(p => p.certas / p.total < .6);
      h += `<div class="centro"><div class="nota-grande">${R.acertos}/${R.total}</div><p><b>${R.pct}%</b></p></div>
        <div class="cartao"><h3>Desempenho por parte</h3>${R.partes.map(p => `<div class="peq" style="margin-top:8px">${DZ.esc(p.nome)}: ${p.certas}/${p.total}</div><div class="barra"><i style="width:${p.certas / p.total * 100}%"></i></div>`).join("")}</div>
        <div class="cartao"><h3>Pontos fortes</h3><p class="peq">${fortes.length ? fortes.map(p => DZ.esc(p.nome)).join("; ") : "Ainda não há partes com 70% ou mais."}</p>
        <h3>Pontos a melhorar</h3><p class="peq">${fracos.length ? fracos.map(p => DZ.esc(p.nome)).join("; ") : "Nenhum. Bom trabalho!"}</p></div>`;
      const por = {}; let lit = 0;
      R.erradas.forEach(n => { const t = q(n).topico_id; if (t) (por[t] = por[t] || []).push(n); else lit++; });
      h += '<div class="cartao"><h3>Revisar na aba Aulas</h3>' + (Object.keys(por).length ? Object.entries(por).map(([t, ns]) => `<button class="topico destaque" data-ir="topico/${t}"><span class="t">${DZ.esc(DZ.lessons.achar(t).t.titulo)}<br><span class="peq suave">Questões ${ns.join(", ")}</span></span><span class="tag rec">Abrir aula</span></button>`).join("") : '<p class="peq">Sem tópicos para rever.</p>') +
        (lit ? `<div class="topico bloqueado"><span class="t">Sem aula ainda (${lit} questões erradas)<br><span class="peq suave">Aula em breve</span></span></div>` : "") + "</div>";
    }
    h += (!R.pendente && R.erradas.length ? '<button class="btn" id="rv">Rever questões erradas</button>' : "") +
      '<button class="btn sec" data-ir="inicio/aulas">Ir para a aba Aulas</button><button class="btn sec" id="nv">Fazer novamente</button><button class="btn sec" data-ir="inicio/exames">Voltar aos exames</button>';
    app.innerHTML = h; ligaSair();
    const rv = app.querySelector("#rv"); if (rv) rv.onclick = revisao;
    app.querySelector("#nv").onclick = () => { es = Object.assign({}, es, { estado: "novo" }); menu(); };
  }
  function revisao() {
    app.innerHTML = barra("Questões erradas") + es.resultado.erradas.map(n => {
      const qq = q(n), r = es.respostas[n];
      return `<div class="cartao"><p class="enunciado"><b>${n}.</b> ${fmtEnun(qq.enunciado)}</p>
        <p class="peq">A sua resposta: <b style="color:var(--errado)">${r ? DZ.esc(r + ". " + qq.alternativas[r]) : "sem resposta"}</b></p>
        <p class="peq">Resposta correta: <b style="color:var(--certo)">${DZ.esc(qq.resposta_correta)}. ${DZ.esc(qq.alternativas[qq.resposta_correta])}</b></p>
        <div class="expl">${DZ.esc(qq.explicacao || "Explicação em breve.")}</div>
        ${qq.topico_id ? `<button class="btn sec" data-ir="topico/${qq.topico_id}" style="margin-top:8px">Rever a aula</button>` : '<p class="peq suave">Aula em breve</p>'}</div>`;
    }).join("");
    app.querySelector("#sair").onclick = () => fim();
  }

  menu();
};
