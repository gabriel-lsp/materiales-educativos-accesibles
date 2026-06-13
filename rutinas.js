const API_BUSQUEDA = "https://api.arasaac.org/api/pictograms/es/search/";
const URL_IMAGEN = "https://static.arasaac.org/pictograms/";

const tituloRutina = document.getElementById("titulo-rutina");
const cantidadPasos = document.getElementById("cantidad-pasos");
const botonCrearPasos = document.getElementById("crear-pasos");
const contenedorPasos = document.getElementById("pasos-rutina");
const rutinaTituloPreview = document.getElementById("rutina-titulo-preview");
const rutinaSecuencia = document.getElementById("rutina-secuencia");
const rutinaLienzo = document.getElementById("rutina-lienzo");
const botonDescargarJpg = document.getElementById("descargar-jpg");
const botonDescargarPdf = document.getElementById("descargar-pdf");

let pasosSeleccionados = [];

botonCrearPasos.addEventListener("click", crearPasos);
tituloRutina.addEventListener("input", actualizarPreview);
botonDescargarJpg.addEventListener("click", descargarJpg);
botonDescargarPdf.addEventListener("click", descargarPdf);

crearPasos();

function crearPasos(){
  const total = Number(cantidadPasos.value);
  pasosSeleccionados = Array.from({ length: total }, (_, index) => {
    return pasosSeleccionados[index] || null;
  });

  contenedorPasos.innerHTML = "";

  for(let i = 0; i < total; i++){
    const paso = document.createElement("article");
    paso.className = "paso-rutina";

    paso.innerHTML = `
      <h3>Paso ${i + 1}</h3>

      <div class="busqueda-paso">
        <input
          id="busqueda-paso-${i}"
          type="search"
          placeholder="Ejemplo: lavarse, comer, jugar"
          autocomplete="off"
        >

        <button type="button" data-indice="${i}">
          Buscar
        </button>
      </div>

      <div
        id="resultados-paso-${i}"
        class="resultados-paso"
        aria-live="polite"
      ></div>
    `;

    const botonBuscar = paso.querySelector("button");
    botonBuscar.addEventListener("click", function(){
      buscarPictogramasParaPaso(i);
    });

    const input = paso.querySelector("input");
    input.addEventListener("keydown", function(evento){
      if(evento.key === "Enter"){
        evento.preventDefault();
        buscarPictogramasParaPaso(i);
      }
    });

    contenedorPasos.appendChild(paso);
  }

  actualizarPreview();
}

async function buscarPictogramasParaPaso(indice){
  const input = document.getElementById(`busqueda-paso-${indice}`);
  const resultados = document.getElementById(`resultados-paso-${indice}`);
  const termino = input.value.trim();

  if(!termino){
    resultados.innerHTML = `<p>Escribe una palabra para buscar.</p>`;
    return;
  }

  resultados.innerHTML = `<p>Buscando...</p>`;

  try{
    const respuesta = await fetch(API_BUSQUEDA + encodeURIComponent(termino));

    if(!respuesta.ok){
      throw new Error("Error al consultar ARASAAC.");
    }

    const datos = await respuesta.json();
    const pictogramas = Array.isArray(datos) ? datos.slice(0, 6) : [];

    if(pictogramas.length === 0){
      resultados.innerHTML = `<p>No se encontraron pictogramas.</p>`;
      return;
    }

    resultados.innerHTML = "";

    pictogramas.forEach(function(picto){
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
        >
        <span>${escaparTexto(palabra)}</span>
      `;

      boton.addEventListener("click", function(){
        seleccionarPicto(indice, {
          id,
          palabra,
          imagen
        });
      });

      resultados.appendChild(boton);
    });
  }catch(error){
    console.error(error);
    resultados.innerHTML = `<p>No se pudo completar la búsqueda.</p>`;
  }
}

function seleccionarPicto(indice, picto){
  pasosSeleccionados[indice] = picto;

  const resultados = document.getElementById(`resultados-paso-${indice}`);
  const botones = resultados.querySelectorAll(".opcion-picto");

  botones.forEach(function(boton){
    boton.classList.remove("seleccionado");

    const img = boton.querySelector("img");
    if(img && img.src === picto.imagen){
      boton.classList.add("seleccionado");
    }
  });

  actualizarPreview();
}

function actualizarPreview(){
  rutinaTituloPreview.textContent = tituloRutina.value.trim() || "Mi rutina visual";
  rutinaSecuencia.innerHTML = "";

  pasosSeleccionados.forEach(function(picto, index){
    const item = document.createElement("div");
    item.className = "rutina-item";

    if(picto){
      item.innerHTML = `
        <img
          src="${picto.imagen}"
          alt="Pictograma de ${escaparTexto(picto.palabra)}"
          crossorigin="anonymous"
        >
        <p>${index + 1}. ${escaparTexto(picto.palabra)}</p>
      `;
    }else{
      item.innerHTML = `
        <div style="height:120px;display:flex;align-items:center;justify-content:center;color:#627d98;font-weight:900;">
          Paso ${index + 1}
        </div>
        <p>Seleccionar pictograma</p>
      `;
    }

    rutinaSecuencia.appendChild(item);
  });
}

async function descargarJpg(){
  const canvas = await crearCanvasRutina();
  const enlace = document.createElement("a");
  enlace.download = crearNombreArchivo("rutina-visual", "jpg");
  enlace.href = canvas.toDataURL("image/jpeg", 0.95);
  enlace.click();
}

async function descargarPdf(){
  const canvas = await crearCanvasRutina();
  const imagen = canvas.toDataURL("image/jpeg", 0.95);

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4"
  });

  const anchoPagina = pdf.internal.pageSize.getWidth();
  const altoPagina = pdf.internal.pageSize.getHeight();

  const margen = 10;
  const anchoDisponible = anchoPagina - margen * 2;
  const altoDisponible = altoPagina - margen * 2;

  const ratioCanvas = canvas.width / canvas.height;
  const ratioPagina = anchoDisponible / altoDisponible;

  let anchoImagen = anchoDisponible;
  let altoImagen = anchoDisponible / ratioCanvas;

  if(ratioCanvas < ratioPagina){
    altoImagen = altoDisponible;
    anchoImagen = altoDisponible * ratioCanvas;
  }

  const x = (anchoPagina - anchoImagen) / 2;
  const y = (altoPagina - altoImagen) / 2;

  pdf.addImage(imagen, "JPEG", x, y, anchoImagen, altoImagen);
  pdf.save(crearNombreArchivo("rutina-visual", "pdf"));
}

async function crearCanvasRutina(){
  return await html2canvas(rutinaLienzo, {
    backgroundColor: "#ffffff",
    scale: 2,
    useCORS: true
  });
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
