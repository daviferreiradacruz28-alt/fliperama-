(function () {
  const CHAVE = "perfil-fliperama";
  const topo = document.querySelector(".topo");
  if (!topo) return;

  function lerPerfil() {
    try { return JSON.parse(localStorage.getItem(CHAVE)); } catch (e) { return null; }
  }
  function salvarPerfil(p) {
    try { localStorage.setItem(CHAVE, JSON.stringify(p)); return true; } catch (e) { return false; }
  }
  function apagarPerfil() {
    try { localStorage.removeItem(CHAVE); } catch (e) {}
  }

  function reduzirFoto(arquivo) {
    return new Promise((ok, erro) => {
      const leitor = new FileReader();
      leitor.onerror = erro;
      leitor.onload = () => {
        const img = new Image();
        img.onerror = erro;
        img.onload = () => {
          const t = 200;
          const c = document.createElement("canvas");
          c.width = t;
          c.height = t;
          const lado = Math.min(img.width, img.height);
          const x = (img.width - lado) / 2;
          const y = (img.height - lado) / 2;
          c.getContext("2d").drawImage(img, x, y, lado, lado, 0, 0, t, t);
          ok(c.toDataURL("image/jpeg", 0.8));
        };
        img.src = leitor.result;
      };
      leitor.readAsDataURL(arquivo);
    });
  }

  function criarAvatar(foto, classe) {
    const av = document.createElement("span");
    av.className = classe;
    if (foto) {
      const img = document.createElement("img");
      img.src = foto;
      img.alt = "";
      av.appendChild(img);
    } else {
      av.textContent = "👤";
    }
    return av;
  }

  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = "btn-perfil";
  botao.title = "Perfil";
  botao.setAttribute("aria-label", "Perfil");

  const acoes = document.createElement("div");
  acoes.className = "topo-acoes";
  Array.from(topo.children).forEach((el) => {
    if (el.tagName !== "H1") acoes.appendChild(el);
  });
  acoes.prepend(botao);
  topo.appendChild(acoes);

  function atualizarBotao() {
    const p = lerPerfil();
    botao.innerHTML = "";
    const nome = document.createElement("span");
    nome.className = "perfil-nome";
    nome.textContent = p ? p.nome : "Entrar";
    botao.append(criarAvatar(p && p.foto, "avatar"), nome);
  }

  function fechar() {
    const m = document.getElementById("modal-perfil");
    if (m) m.remove();
  }

  function abrirModal(conteudo) {
    fechar();
    const fundo = document.createElement("div");
    fundo.id = "modal-perfil";
    fundo.className = "modal-fundo";
    const caixa = document.createElement("div");
    caixa.className = "modal-caixa";
    caixa.appendChild(conteudo);
    fundo.appendChild(caixa);
    fundo.addEventListener("click", (e) => { if (e.target === fundo) fechar(); });
    document.body.appendChild(fundo);
  }

  function criarBotao(texto, classe, aoClicar) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "botao " + classe;
    b.textContent = texto;
    b.addEventListener("click", aoClicar);
    return b;
  }

  function telaVer() {
    const p = lerPerfil();
    const div = document.createElement("div");
    div.className = "perfil-ver";
    const nome = document.createElement("h2");
    nome.textContent = p.nome;
    const acoesModal = document.createElement("div");
    acoesModal.className = "modal-acoes";
    acoesModal.append(
      criarBotao("Editar", "", () => abrirModal(telaCadastro())),
      criarBotao("Sair", "neutro", () => { apagarPerfil(); atualizarBotao(); fechar(); }),
      criarBotao("Fechar", "neutro", fechar)
    );
    div.append(criarAvatar(p.foto, "perfil-foto"), nome, acoesModal);
    return div;
  }

  function telaCadastro() {
    const p = lerPerfil();
    const form = document.createElement("form");

    const titulo = document.createElement("h2");
    titulo.textContent = p ? "Editar perfil" : "Criar perfil";

    const l1 = document.createElement("label");
    l1.textContent = "Seu nome";
    const campoNome = document.createElement("input");
    campoNome.type = "text";
    campoNome.maxLength = 30;
    campoNome.required = true;
    campoNome.value = p ? p.nome : "";
    l1.appendChild(campoNome);

    const l2 = document.createElement("label");
    l2.textContent = "Foto de perfil";
    const campoFoto = document.createElement("input");
    campoFoto.type = "file";
    campoFoto.accept = "image/*";
    l2.appendChild(campoFoto);

    const status = document.createElement("p");
    status.id = "status";

    const acoesModal = document.createElement("div");
    acoesModal.className = "modal-acoes";
    const salvar = document.createElement("button");
    salvar.type = "submit";
    salvar.className = "botao";
    salvar.textContent = "Salvar";
    acoesModal.append(
      salvar,
      criarBotao(p ? "Cancelar" : "Agora não", "neutro", () => {
        try { sessionStorage.setItem("perfil-pulou", "1"); } catch (e) {}
        if (p) abrirModal(telaVer()); else fechar();
      })
    );

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const nome = campoNome.value.trim();
      if (!nome) return;
      let foto = p && p.foto ? p.foto : null;
      const arq = campoFoto.files[0];
      if (arq) {
        try {
          foto = await reduzirFoto(arq);
        } catch (err) {
          status.textContent = "Não foi possível ler essa imagem.";
          return;
        }
      }
      if (!salvarPerfil({ nome: nome, foto: foto })) {
        status.textContent = "Não foi possível salvar neste navegador.";
        return;
      }
      atualizarBotao();
      abrirModal(telaVer());
    });

    form.append(titulo, l1, l2, status, acoesModal);
    return form;
  }

  botao.addEventListener("click", () => {
    abrirModal(lerPerfil() ? telaVer() : telaCadastro());
  });

  atualizarBotao();

  // Na primeira visita, pede o cadastro (só na página inicial, uma vez por sessão)
  let pulou = null;
  try { pulou = sessionStorage.getItem("perfil-pulou"); } catch (e) {}
  if (!lerPerfil() && !pulou && document.getElementById("catalogo")) {
    abrirModal(telaCadastro());
  }
})();
