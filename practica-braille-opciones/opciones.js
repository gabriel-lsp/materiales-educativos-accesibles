document.addEventListener("DOMContentLoaded", () => {
  const acordeon = document.querySelector("[data-acordeon-unico]");

  if (!acordeon) {
    return;
  }

  const secciones = Array.from(acordeon.querySelectorAll("details"));

  secciones.forEach((seccion) => {
    seccion.addEventListener("toggle", () => {
      if (!seccion.open) {
        return;
      }

      secciones.forEach((otraSeccion) => {
        if (otraSeccion !== seccion) {
          otraSeccion.open = false;
        }
      });
    });
  });
});
