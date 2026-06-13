const API_BUSQUEDA = "https://api.arasaac.org/api/pictograms/es/search/";
const URL_IMAGEN = "https://static.arasaac.org/pictograms/";

const tituloRutina = document.getElementById("titulo-rutina");
const cantidadPasos = document.getElementById("cantidad-pasos");
const botonCrearPasos = document.getElementById("crear-pasos");
const pasosLibres = document.getElementById("pasos-libres");
const estadoPasoActivo = document.getElementById("estado-paso-activo");

const formularioArasaac = document.getElementById("formulario-arasaac");
const buscadorArasaac = document.getElementById("buscador-arasaac");
const resultadosArasaac = document.getElementById("resultados-arasaac");
const estadoBusqueda = document.getElementById("estado-busqueda");

const rutinaLienzo = document.getElementById("rutina-lienzo");
const rutinaTituloPreview = document.getElementById("rutina-titulo-preview");
const rutinaSecuencia = document.getElementById("rutina-secuencia");

const botonDescargarJpg = document.getElementById("descargar-jpg");
const botonDescargarPdf = document.getElementById("descargar-pdf");

let pasos = [];
let pasoActivo = 0;

botonCrearPasos.addEventListener("click", crearEspacios);
tituloRutina.addEventListener("input", renderizarPreview);
formularioArasaac.addEventListener("submit", buscarPictogramas);
botonDescargarJpg.addEventListener("click", descargarJpg);
botonDescargarPdf.addEventListener("click", descargarPdf);

crearEspacios();

function crearEspacios(){
  const total = Number(cantidadPasos.value);

  pasos = Array.from({ length: total }, (_, index) => {
    const anterior = pasos[index];

    return anterior || {
      texto: "",
      pictograma: null
    };
  });

  pasoActivo = 0;
  renderizarPasos();
  renderizarPreview();
  actualizarEstadoPasoActivo();
}

function renderizarPasos(){
  pasosLibres.innerHTML = "";

  pasos.forEach((paso, index) => {
    const tarjeta = document.createElement("article");
    tarjeta.className = `paso-libre ${index === pasoActivo ? "activo" : ""}`;
    tarjeta.dataset.index = index;

    const imagenHtml = paso.pictograma
      ? `<img src="${paso.pictograma.imagen}" alt="Pictograma de ${escaparTexto(paso.pictograma.palabra)}" crossorigin="anonymous">`
      : `<p class="placeholder-paso">Haz clic aquí y selecciona un pictograma</p>`;

    tarjeta.innerHTML = `
      <div class="paso-superior">
        <span class="numero-paso">Paso ${index + 1}</span>
        <button class="quitar-paso" type="button" data-accion="quitar" data-index="${index}">
          Quitar
        </button>
      </div>

      <div class="marco-paso">
        ${imagenHtml}
      </div>

      <input
        class="texto-paso"
        type="text"
        value="${escaparTexto(paso.texto)}"
        placeholder="Texto del paso"
        data-accion="texto"
        data-index="${index}"
      >
    `;

    tarjeta.addEventListener("click", (evento) => {
      if(evento.target.dataset.accion === "quitar"){
        quitarPictograma(index);
        return;
      }

      if(evento.target.dataset.accion === "texto"){
        pasoActivo = index;
        renderizarPasos();
        actualizarEstadoPasoActivo();
        return;
      }

      pasoActivo = index;
      renderizarPasos();
      actualizarEstadoPasoActivo();
    });

    const inputTexto = tarjeta.querySelector(".texto-paso");
    inputTexto.addEventListener("input", (evento) => {
      pasos[index].texto = evento.target.value;
      renderizarPreview();
    });

    pasosLibres.appendChild(tarjeta);
  });
}

async function buscarPictogramas(evento){
  evento.preventDefault();

  const termino = buscadorArasaac.value.trim();

  if(!termino){
    estadoBusqueda.textContent = "Escribe una palabra para buscar pictogramas.";
    resultadosArasaac.innerHTML = "";
    return;
  }

  estadoBusqueda.textContent = "Buscando pictogramas en ARASAAC...";
  resultadosArasaac.innerHTML = "";

  try{
    const respuesta = await fetch(API_BUSQUEDA + encodeURIComponent(termino));

    if(!respuesta.ok){
      throw new Error("No se pudo consultar ARASAAC.");
    }

    const datos = await respuesta.json();
    const pictogramas = Array.isArray(datos) ? datos.slice(0, 18) : [];

    if(pictogramas.length === 0){
      estadoBusqueda.textContent = "No se encontraron pictogramas. Prueba con otra palabra.";
      return;
    }

    estadoBusqueda.textContent = `Selecciona un pictograma para colocarlo en el paso ${pasoActivo + 1}.`;
    renderizarResultados(pictogramas);
  }catch(error){
    console.error(error);
    estadoBusqueda.textContent = "No se pudo completar la búsqueda. Revisa la conexión e intenta nuevamente.";
  }
}

function renderizarResultados(pictogramas){
  resultadosArasaac.innerHTML = "";

  pictogramas.forEach((picto) => {
    const id = picto._id || picto.id;

    if(!id){
      return;
    }

    const palabra = obtenerPalabra(picto);
    const imagen = `${URL_IMAGEN}${id}/${id}_500.png`;

    const boton = document.createElement("button");
    boton.className = "opcion-picto";
    boton.type = "button";

    boton.innerHTML = `
      <img
        src="${imagen}"
        alt="Pictograma de ${escaparTexto(palabra)}"
        crossorigin="anonymous"
        loading="lazy"
      >
      <span>${escaparTexto(palabra)}</span>
    `;

    boton.addEventListener("click", () => {
      asignarPictograma({
        id,
        palabra,
        imagen
      });
    });

    resultadosArasaac.appendChild(boton);
  });
}

function asignarPictograma(pictograma){
  pasos[pasoActivo].pictograma = pictograma;

  if(!pasos[pasoActivo].texto.trim()){
    pasos[pasoActivo].texto = pictograma.palabra;
  }

  if(pasoActivo < pasos.length - 1){
    pasoActivo++;
  }

  renderizarPasos();
  renderizarPreview();
  actualizarEstadoPasoActivo();

  estadoBusqueda.textContent = `Pictograma agregado. Ahora está seleccionado el paso ${pasoActivo + 1}.`;
}

function quitarPictograma(index){
  pasos[index].pictograma = null;
  pasos[index].texto = "";
  pasoActivo = index;

  renderizarPasos();
  renderizarPreview();
  actualizarEstadoPasoActivo();
}

function actualizarEstadoPasoActivo(){
  estadoPasoActivo.textContent = `Paso ${pasoActivo + 1} seleccionado. Busca un pictograma y haz clic sobre el resultado que deseas colocar.`;
}

function renderizarPreview(){
  rutinaTituloPreview.textContent = tituloRutina.value.trim() || "Mi rutina visual";
  rutinaSecuencia.innerHTML = "";

  pasos.forEach((paso, index) => {
    const item = document.createElement("div");
    item.className = "rutina-item";

    if(paso.pictograma){
      item.innerHTML = `
        <img
          src="${paso.pictograma.imagen}"
          alt="Pictograma de ${escaparTexto(paso.pictograma.palabra)}"
          crossorigin="anonymous"
        >
        <p>${index + 1}. ${escaparTexto(paso.texto || paso.pictograma.palabra)}</p>
      `;
    }else{
      item.innerHTML = `
        <div style="height:120px;display:flex;align-items:center;justify-content:center;color:#627d98;font-weight:900;">
          Paso ${index + 1}
        </div>
        <p>${index + 1}. Pendiente</p>
      `;
    }

    rutinaSecuencia.appendChild(item);
  });
}

async function descargarJpg(){
  try{
    await esperarImagenes(rutinaLienzo);

    const canvas = await html2canvas(rutinaLienzo, {
      backgroundColor:"#ffffff",
      scale:2,
      useCORS:true,
      allowTaint:false
    });

    const enlace = document.createElement("a");
    enlace.download = crearNombreArchivo("rutina-visual", "jpg");
    enlace.href = canvas.toDataURL("image/jpeg", 0.95);
    enlace.click();
  }catch(error){
    console.error(error);
    alert("No se pudo generar el JPG. Intenta recargar la página y vuelve a descargar.");
  }
}

async function descargarPdf(){
  try{
    await esperarImagenes(rutinaLienzo);

    const canvas = await html2canvas(rutinaLienzo, {
      backgroundColor:"#ffffff",
      scale:2,
      useCORS:true,
      allowTaint:false
    });

    const imagen = canvas.toDataURL("image/jpeg", 0.95);
    const { jsPDF } = window.jspdf;

    const pdf = new jsPDF({
      orientation:"landscape",
      unit:"mm",
      format:"a4"
    });

    const anchoPagina = pdf.internal.pageSize.getWidth();
    const altoPagina = pdf.internal.pageSize.getHeight();

    const margen = 10;
    const anchoDisponible = anchoPagina - margen * 2;
    const altoDisponible = altoPagina - margen * 2;

    const ratioCanvas = canvas.width / canvas.height;
    const ratioDisponible = anchoDisponible / altoDisponible;

    let anchoImagen = anchoDisponible;
    let altoImagen = anchoDisponible / ratioCanvas;

    if(ratioCanvas < ratioDisponible){
      altoImagen = altoDisponible;
      anchoImagen = altoDisponible * ratioCanvas;
    }

    const x = (anchoPagina - anchoImagen) / 2;
    const y = (altoPagina - altoImagen) / 2;

    pdf.addImage(imagen, "JPEG", x, y, anchoImagen, altoImagen);
    pdf.save(crearNombreArchivo("rutina-visual", "pdf"));
  }catch(error){
    console.error(error);
    alert("No se pudo generar el PDF. Intenta recargar la página y vuelve a descargar.");
  }
}

function esperarImagenes(contenedor){
  const imagenes = Array.from(contenedor.querySelectorAll("img"));

  return Promise.all(
    imagenes.map((img) => {
      if(img.complete){
        return Promise.resolve();
      }

      return new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    })
  );
}

function obtenerPalabra(picto){
  if(Array.isArray(picto.keywords) && picto.keywords.length > 0){
    const primera = picto.keywords[0];

    if(typeof primera === "string"){
      return primera;
    }

    if(primera.keyword){
      return primera.keyword;
    }
  }

  if(picto.keyword){
    return picto.keyword;
  }

  if(picto.name){
    return picto.name;
  }

  return "Pictograma";
}

function crearNombreArchivo(base, extension){
  const titulo = tituloRutina.value.trim() || base;

  const nombre = normalizarTexto(titulo)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return `${nombre || base}.${extension}`;
}

function normalizarTexto(texto){
  return String(texto)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function escaparTexto(texto){
  return String(texto)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
