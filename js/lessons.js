/* Dondza Aqui — aulas e exercícios (dados em data/lessons.json). */
window.DZ = window.DZ || {}; DZ.rotas = DZ.rotas || {};
DZ.lessons = {
  dados: null,
  async carregar() { if (!this.dados) this.dados = await (await fetch("data/lessons.json")).json(); return this.dados; },
  achar(id) { for (const m of this.dados.modulos) for (const t of m.topicos) if (t.id === id) return { m, t }; return null; },
  // Lista de módulos e tópicos (com destaque nos recomendados após os exames)
  lista() {
    return this.dados.modulos.map(m => {
      if (!m.disponivel) return `<div class="cartao bloqueado"><h3>${DZ.esc(m.titulo)}</h3><span class="tag">Em breve · Fase ${m.fase}</span></div>`;
      return `<h3 style="margin-top:18px">${DZ.esc(m.titulo)}</h3>` + m.topicos.map(t => {
        const p = DZ.S.progresso.topicos[t.id], rec = DZ.S.recomendados.includes(t.id);
        const tag = rec ? '<span class="tag rec">Recomendado</span>' : p ? `<span class="tag ok">${p.melhor}/${p.total}</span>` : '<span class="tag">Novo</span>';
        return `<button class="topico ${rec ? "destaque" : ""}" data-ir="topico/${t.id}"><span class="t">${DZ.esc(t.titulo)}<br><span class="peq suave">${t.minutos} min · ${t.exercicios.length} exercícios</span></span>${tag}</button>`;
      }).join("");
    }).join("");
  },
  // Converte o texto simples da aula em HTML (## título, > exemplo, - lista, **negrito**)
  md(linhas) {
    const inl = s => DZ.esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
    let h = "", lista = null;
    const fecha = () => { if (lista) { h += `</${lista}>`; lista = null; } };
    for (const l of linhas) {
      if (l.startsWith("## ")) { fecha(); h += `<h2>${inl(l.slice(3))}</h2>`; }
      else if (l.startsWith("> ")) { fecha(); h += `<div class="ex">${inl(l.slice(2))}</div>`; }
      else if (l.startsWith("- ")) { if (lista !== "ul") { fecha(); h += "<ul>"; lista = "ul"; } h += `<li>${inl(l.slice(2))}</li>`; }
      else if (/^\d+\. /.test(l)) { if (lista !== "ol") { fecha(); h += "<ol>"; lista = "ol"; } h += `<li>${inl(l.replace(/^\d+\. /, ""))}</li>`; }
      else { fecha(); h += `<p>${inl(l)}</p>`; }
    }
    fecha(); return h;
  }
};

// Aula
DZ.rotas.topico = async ([id], app) => {
  await DZ.lessons.carregar(); const r = DZ.lessons.achar(id);
  if (!r) return DZ.ir("inicio");
  app.innerHTML = DZ.topo(r.t.titulo) + `<p class="suave peq">${DZ.esc(r.m.titulo)} · cerca de ${r.t.minutos} min de leitura</p><div class="aula">${DZ.lessons.md(r.t.aula)}</div>
    <button class="btn" data-ir="exercicios/${id}" style="margin-top:16px">Fazer exercícios (${r.t.exercicios.length})</button>`;
};

// Exercícios: correção imediata, verde/vermelho e explicação
DZ.rotas.exercicios = async ([id], app) => {
  await DZ.lessons.carregar(); const r = DZ.lessons.achar(id); if (!r) return DZ.ir("inicio");
  const ex = r.t.exercicios; let i = 0, certas = 0;
  const pergunta = () => {
    const q = ex[i]; let respondeu = false;
    app.innerHTML = DZ.topo(r.t.titulo) + `<div class="peq suave">Exercício ${i + 1} de ${ex.length}</div><div class="barra" style="margin:6px 0 14px"><i style="width:${i / ex.length * 100}%"></i></div>
      <p class="enunciado"><b>${DZ.esc(q.enunciado)}</b></p><div id="ops">${q.opcoes.map((o, k) => `<button class="opcao" data-k="${k}">${DZ.esc(o)}</button>`).join("")}</div><div id="fb"></div>`;
    app.querySelectorAll("#ops .opcao").forEach(b => b.onclick = () => {
      if (respondeu) return; respondeu = true;
      const k = +b.dataset.k, ok = k === q.correta; if (ok) certas++;
      const bs = app.querySelectorAll("#ops .opcao"); bs[q.correta].classList.add("certo"); if (!ok) b.classList.add("errado");
      bs.forEach(x => x.disabled = true); DZ.som(ok ? "certo" : "errado"); DZ.contarHoje(); DZ.guardar();
      app.querySelector("#fb").innerHTML = `<div class="expl"><b>${ok ? "Certo!" : "Errado."}</b> ${DZ.esc(q.explicacao)}</div><button class="btn" id="prox" style="margin-top:12px">${i + 1 < ex.length ? "Seguinte" : "Ver resultado"}</button>`;
      app.querySelector("#prox").onclick = () => { i++; i < ex.length ? pergunta() : fim(); window.scrollTo(0, 0); };
    });
  };
  const fim = () => {
    const p = DZ.S.progresso.topicos[id] || { melhor: 0, total: ex.length, tentativas: 0 };
    p.melhor = Math.max(p.melhor, certas); p.total = ex.length; p.tentativas++; DZ.S.progresso.topicos[id] = p;
    DZ.S.recomendados = DZ.S.recomendados.filter(x => x !== id); DZ.guardar();
    app.innerHTML = DZ.topo("Resultado") + `<div class="centro"><div class="nota-grande">${certas}/${ex.length}</div><p>${certas / ex.length >= .7 ? "Muito bem!" : "Continue a praticar, está no bom caminho."}</p></div>
      <button class="btn" id="re">Refazer exercícios</button><button class="btn sec" data-ir="topico/${id}">Rever a aula</button><button class="btn sec" data-ir="inicio">Voltar ao início</button>`;
    app.querySelector("#re").onclick = () => DZ.render();
  };
  pergunta();
};
