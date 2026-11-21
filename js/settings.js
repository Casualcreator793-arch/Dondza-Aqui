/* Dondza Aqui — ecrã de Configurações. */
window.DZ = window.DZ || {}; DZ.rotas = DZ.rotas || {};
const FAQ = [
  ["Preciso de internet?", "Só na primeira abertura, para a app descarregar os ficheiros. Depois funciona sem internet."],
  ["Como desbloqueio o plano Maza?", "Toque no cartão Maza, copie o ID do aparelho e envie-o por WhatsApp. Depois de pagar, receberá um código para escrever na app."],
  ["O código serve noutro telemóvel?", "Não. Cada código vale apenas para um aparelho e um plano. Em novo aparelho, use “Restaurar compra”."],
  ["Porque não aparece nota no exame?", "O gabarito oficial ainda está pendente. Quando for confirmado, as correções e notas aparecem."],
  ["Como funciona o Simulado?", "Tem cronómetro de 120 minutos. A correção só aparece no fim. O tempo pára quando sai da app e continua quando volta."],
  ["Posso guardar o meu progresso?", "Sim. Em Configurações › Dados, exporte um backup e importe-o quando precisar."]
];
DZ.rotas.config = async (a, app) => {
  await DZ.lessons.carregar();
  const S = DZ.S, d = S.definicoes, P = S.perfil, maza = DZ.unlock.estaDesbloqueado("maza");
  const hist = S.progresso.historico, topFeitos = Object.keys(S.progresso.topicos).length;
  const totalEx = Object.values(S.progresso.diario).reduce((x, y) => x + y, 0);
  const sel = (nome, v, ops) => `<select id="${nome}">${ops.map(([k, t]) => `<option value="${k}" ${String(v) === String(k) ? "selected" : ""}>${t}</option>`).join("")}</select>`;
  app.innerHTML = DZ.topo("Configurações") + `
  <section class="secao"><h2>Perfil</h2>
    <label for="c-nome">Nome</label><input type="text" id="c-nome" value="${DZ.esc(P.nome)}" maxlength="40">
    <label for="c-disc">Disciplina</label><select id="c-disc"><option>Língua Portuguesa</option></select>
    <label for="c-nivel">Nível</label>${sel("c-nivel", P.nivel, [["basico", "Básico"], ["intermedio", "Intermédio"], ["avancado", "Avançado"]])}</section>
  <section class="secao"><h2>Aparência</h2>
    <label for="c-tema">Tema</label>${sel("c-tema", d.tema, [["auto", "Automático"], ["claro", "Claro"], ["escuro", "Escuro"]])}
    <label for="c-fonte">Tamanho da letra</label>${sel("c-fonte", d.fonte, [[0, "Pequena"], [1, "Normal"], [2, "Grande"], [3, "Muito grande"]])}</section>
  <section class="secao"><h2>Estudo</h2>
    <label for="c-meta">Meta diária (exercícios)</label><input type="number" id="c-meta" min="1" max="100" value="${d.metaDiaria}">
    <div class="sw"><label for="c-lem" style="margin:0">Lembrete ao abrir a app</label><input type="checkbox" id="c-lem" ${d.lembrete ? "checked" : ""}></div>
    <label for="c-hora">Hora do lembrete</label><input type="time" id="c-hora" value="${d.lembreteHora}">
    <div class="sw"><label for="c-som" style="margin:0">Sons de acerto e erro</label><input type="checkbox" id="c-som" ${d.sons ? "checked" : ""}></div></section>
  <section class="secao"><h2>Meu plano</h2><div class="cartao">
    <p>Plano Maza: <b>${maza ? "Desbloqueado ✔" : "Bloqueado"}</b></p>
    <p class="peq suave" style="margin:0">ID do aparelho</p><div class="id-aparelho">${DZ.unlock.obterId()}</div>
    <div class="linha"><button class="btn sec" id="c-cid">Copiar ID</button><button class="btn sec" id="c-plano">Mudar de plano</button></div>
    ${maza ? "" : '<label for="c-cod">Código de desbloqueio</label><input type="text" id="c-cod" placeholder="XXXX-XXXX" autocapitalize="characters" maxlength="12"><div class="erro" id="c-err" hidden></div><button class="btn" id="c-desb" style="margin-top:10px">Desbloquear</button><button class="btn sec" id="c-abrir">Como pagar e obter o código</button>'}</div></section>
  <section class="secao"><h2>Progresso</h2><div class="cartao">
    <p>Tópicos praticados: <b>${topFeitos}</b><br>Exercícios feitos (total): <b>${totalEx}</b><br>Exames feitos: <b>${hist.length}</b></p>
    ${hist.length ? `<table>${hist.slice(0, 8).map(h => `<tr><td>${DZ.esc(h.titulo)}<br><span class="peq suave">${new Date(h.data).toLocaleDateString("pt-PT")} · ${h.modo}</span></td><td>${h.pendente ? "Sem nota" : h.acertos + "/" + h.total}</td></tr>`).join("")}</table>` : '<p class="peq suave">Ainda não fez nenhum exame.</p>'}
    <button class="btn perigo" id="c-zero" style="margin-top:12px">Zerar progresso</button></div></section>
  <section class="secao"><h2>Dados</h2>
    <button class="btn sec" id="c-exp">Exportar backup (JSON)</button><button class="btn sec" id="c-imp">Importar backup</button><input type="file" id="c-file" accept="application/json,.json" hidden>
    <button class="btn perigo" id="c-limpa">Limpar todos os dados</button></section>
  <section class="secao"><h2>Ajuda</h2>
    <details><summary>Como usar</summary><p>Escolha um tópico, leia a aula e faça os exercícios. No plano Maza, resolva exames na aba Exames Interativos e use a revisão para voltar às aulas certas.</p></details>
    ${FAQ.map(f => `<details><summary>${f[0]}</summary><p>${f[1]}</p></details>`).join("")}
    <a class="btn" id="c-wa" target="_blank" rel="noopener" href="${DZ.unlock.linkWhatsApp("Olá! Preciso de ajuda com o Dondza Aqui. O meu ID: " + DZ.unlock.obterId())}">Falar com o suporte no WhatsApp</a></section>
  <section class="secao centro"><h2>Sobre</h2><p>Dondza Aqui · versão ${DZ.VERSAO}</p><p class="suave">Idealizado por Assane Filipe</p></section>`;

  const $ = s => app.querySelector(s), guarda = () => { DZ.guardar(); DZ.aplicarTema(); };
  $("#c-nome").onchange = e => { if (e.target.value.trim()) { P.nome = e.target.value.trim(); guarda(); } };
  $("#c-nivel").onchange = e => { P.nivel = e.target.value; guarda(); };
  $("#c-tema").onchange = e => { d.tema = e.target.value; guarda(); };
  $("#c-fonte").onchange = e => { d.fonte = +e.target.value; guarda(); };
  $("#c-meta").onchange = e => { d.metaDiaria = Math.max(1, +e.target.value || 10); guarda(); };
  $("#c-lem").onchange = e => { d.lembrete = e.target.checked; guarda(); };
  $("#c-hora").onchange = e => { d.lembreteHora = e.target.value || "18:00"; guarda(); };
  $("#c-som").onchange = e => { d.sons = e.target.checked; guarda(); };
  $("#c-cid").onclick = () => DZ.copiar(DZ.unlock.obterId());
  $("#c-plano").onclick = () => DZ.ir("planos");
  if ($("#c-desb")) {
    $("#c-abrir").onclick = () => DZ.unlock.abrir("maza", () => DZ.render());
    $("#c-desb").onclick = async () => {
      if (await DZ.unlock.desbloquear("maza", $("#c-cod").value)) { DZ.toast("Plano Maza desbloqueado!"); DZ.render(); }
      else { const e = $("#c-err"); e.hidden = false; e.textContent = "Código incorreto para este ID. Verifique e tente de novo."; }
    };
  }
  $("#c-zero").onclick = () => { if (confirm("Zerar todo o progresso (aulas, exames e histórico)? O plano e o perfil mantêm-se.")) { DZ.zerarProgresso(); DZ.toast("Progresso zerado"); DZ.render(); } };
  $("#c-exp").onclick = () => DZ.exportar();
  $("#c-imp").onclick = () => $("#c-file").click();
  $("#c-file").onchange = async e => {
    try { DZ.importar(await e.target.files[0].text()); await DZ.unlock.verificarTodos(); DZ.aplicarTema(); DZ.toast("Backup importado"); DZ.render(); }
    catch (er) { DZ.toast("Ficheiro de backup inválido"); }
  };
  $("#c-limpa").onclick = async () => {
    if (confirm("Apagar TODOS os dados (perfil, progresso e desbloqueio)? Para voltar ao Maza será preciso um código.") && confirm("Tem a certeza? Esta ação não pode ser desfeita.")) {
      DZ.limparTudo(); await DZ.unlock.verificarTodos(); DZ.aplicarTema(); DZ.ir("boas-vindas"); DZ.render();
    }
  };
};
