// Catálogo ligado ao Supabase
const campoBusca = document.getElementById("busca");
const areaCategorias = document.getElementById("categorias");
const catalogo = document.getElementById("catalogo");
const aviso = document.getElementById("vazio");

let jogos = [];
let categoriaAtual = "Todas";

function urlCapa(caminho) {
  if (!caminho) return null;
  return db.storage.from("covers").getPublicUrl(caminho).data.publicUrl;
}

function criarCategorias() {
  const nomes = ["Todas", ...new Set(jogos.map((j) => j.categoria).filter(Boolean))];
  areaCategorias.innerHTML = "";
  nomes.forEach((nome) => {
    const botao = document.createElement("button");
    botao.className = "chip" + (nome === categoriaAtual ? " ativo" : "");
    botao.textContent = nome;
    botao.addEventListener("click", () => {
      categoriaAtual = nome;
      criarCategorias();
      mostrarJogos();
    });
    areaCategorias.appendChild(botao);
  });
}

function mostrarJogos() {
  const texto = campoBusca.value.trim().toLowerCase();
  const filtrados = jogos.filter((j) => {
    const nomeOk = j.nome.toLowerCase().includes(texto);
    const catOk = categoriaAtual === "Todas" || j.categoria === categoriaAtual;
    return nomeOk && catOk;
  });

  catalogo.innerHTML = "";
  aviso.textContent = "Nenhum jogo encontrado.";
  aviso.hidden = filtrados.length > 0;

  filtrados.forEach((j) => {
    const cartao = document.createElement("a");
    cartao.className = "cartao";
    cartao.href = "game.html?id=" + j.id;

    const capa = document.createElement("div");
    capa.className = "capa";
    const url = urlCapa(j.capa);
    if (url) {
      const img = document.createElement("img");
      img.src = url;
      img.alt = "";
      img.className = "capa-img";
      capa.appendChild(img);
    } else {
      capa.textContent = "🎮";
    }

    const info = document.createElement("div");
    info.className = "info";
    const titulo = document.createElement("h2");
    titulo.textContent = j.nome;
    const cat = document.createElement("div");
    cat.className = "cat";
    cat.textContent = j.categoria || "";
    const desc = document.createElement("p");
    desc.className = "desc";
    desc.textContent = j.descricao || "";

    info.append(titulo, cat, desc);
    cartao.append(capa, info);
    catalogo.appendChild(cartao);
  });
}

async function carregar() {
  const { data, error } = await db
    .from("games")
    .select("*")
    .order("criado_em", { ascending: false });

  if (error) {
    aviso.textContent = "Não foi possível carregar os jogos.";
    aviso.hidden = false;
    console.error(error);
    return;
  }
  jogos = data;
  criarCategorias();
  mostrarJogos();
}

campoBusca.addEventListener("input", mostrarJogos);
carregar();
