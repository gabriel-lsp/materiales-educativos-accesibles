(() => {
  'use strict';

  const ejercicios = [
    { letra: 'A', puntos: [1] },
    { letra: 'B', puntos: [1, 2] },
    { letra: 'C', puntos: [1, 4] },
    { letra: 'D', puntos: [1, 4, 5] },
    { letra: 'E', puntos: [1, 5] },
    { letra: 'F', puntos: [1, 2, 4] },
    { letra: 'G', puntos: [1, 2, 4, 5] },
    { letra: 'H', puntos: [1, 2, 5] },
    { letra: 'I', puntos: [2, 4] },
    { letra: 'J', puntos: [2, 4, 5] }
  ];

  const puntos = [...document.querySelectorAll('.punto')];
  const letraObjetivo = document.getElementById('letra-objetivo');
  const numeroEjercicio = document.getElementById('numero-ejercicio');
  const totalEjercicios = document.getElementById('total-ejercicios');
  const aciertosElemento = document.getElementById('aciertos');
  const resultado = document.getElementById('resultado');
  const botonLimpiar = document.getElementById('boton-limpiar');
  const botonComprobar = document.getElementById('boton-comprobar');
  const botonSiguiente = document.getElementById('boton-siguiente');
  const botonPista = document.getElementById('boton-pista');
  const interruptorAyuda = document.getElementById('interruptor-ayuda');
  const estadoAyuda = document.getElementById('estado-ayuda');
  const contenedorPista = document.getElementById('contenedor-pista');

  let indice = 0;
  let aciertos = 0;
  let respuestaCorrecta = false;
  let ayudaActiva = true;

  totalEjercicios.textContent = String(ejercicios.length);

  function seleccionados() {
    return puntos
      .filter((punto) => punto.getAttribute('aria-pressed') === 'true')
      .map((punto) => Number(punto.dataset.punto))
      .sort((a, b) => a - b);
  }

  function limpiarCelda() {
    puntos.forEach((punto) => {
      punto.setAttribute('aria-pressed', 'false');
      punto.setAttribute('aria-label', `Punto ${punto.dataset.punto} desactivado`);
    });
  }

  function actualizarAyuda() {
    interruptorAyuda.setAttribute('aria-checked', String(ayudaActiva));
    interruptorAyuda.setAttribute('aria-label', ayudaActiva ? 'Ayuda activada' : 'Ayuda desactivada');
    estadoAyuda.textContent = ayudaActiva ? 'Ayuda activada' : 'Ayuda desactivada';
    contenedorPista.hidden = !ayudaActiva;

    if (!ayudaActiva && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    resultado.className = 'resultado';
    resultado.textContent = ayudaActiva
      ? 'La ayuda está activada. Puedes solicitar una pista cuando la necesites.'
      : 'La ayuda está desactivada. Resuelve el ejercicio sin pistas.';
  }

  function mostrarEjercicio() {
    const ejercicio = ejercicios[indice];
    letraObjetivo.textContent = ejercicio.letra;
    numeroEjercicio.textContent = String(indice + 1);
    limpiarCelda();
    respuestaCorrecta = false;
    botonSiguiente.disabled = true;
    botonComprobar.disabled = false;
    resultado.className = 'resultado';
    resultado.textContent = ayudaActiva
      ? 'Selecciona los puntos y comprueba tu respuesta. Puedes usar una pista.'
      : 'Selecciona los puntos y comprueba tu respuesta sin ayuda.';
  }

  function sonIguales(a, b) {
    return a.length === b.length && a.every((valor, posicion) => valor === b[posicion]);
  }

  puntos.forEach((punto) => {
    punto.addEventListener('click', () => {
      const activo = punto.getAttribute('aria-pressed') === 'true';
      punto.setAttribute('aria-pressed', String(!activo));
      punto.setAttribute('aria-label', `Punto ${punto.dataset.punto} ${activo ? 'desactivado' : 'seleccionado'}`);
    });
  });

  interruptorAyuda.addEventListener('click', () => {
    ayudaActiva = !ayudaActiva;
    actualizarAyuda();
  });

  botonLimpiar.addEventListener('click', () => {
    limpiarCelda();
    resultado.className = 'resultado';
    resultado.textContent = 'La celda quedó limpia. Selecciona una nueva combinación.';
  });

  botonComprobar.addEventListener('click', () => {
    const ejercicio = ejercicios[indice];
    const respuesta = seleccionados();
    const correcta = sonIguales(respuesta, ejercicio.puntos);

    if (correcta) {
      if (!respuestaCorrecta) aciertos += 1;
      respuestaCorrecta = true;
      aciertosElemento.textContent = String(aciertos);
      resultado.className = 'resultado correcto';
      resultado.textContent = `Respuesta correcta. La letra ${ejercicio.letra} se forma con ${ejercicio.puntos.length === 1 ? 'el punto' : 'los puntos'} ${ejercicio.puntos.join(', ')}.`;
      botonSiguiente.disabled = false;
      botonComprobar.disabled = true;
    } else {
      resultado.className = 'resultado incorrecto';
      resultado.textContent = ayudaActiva
        ? 'La combinación todavía no es correcta. Revisa la posición de los puntos o solicita una pista.'
        : 'La combinación todavía no es correcta. Revisa la posición de los puntos e inténtalo nuevamente.';
    }
  });

  botonSiguiente.addEventListener('click', () => {
    if (indice < ejercicios.length - 1) {
      indice += 1;
      mostrarEjercicio();
      return;
    }

    resultado.className = 'resultado correcto';
    resultado.textContent = `Actividad completada. Obtuviste ${aciertos} aciertos de ${ejercicios.length}. Puedes volver a practicar limpiando la actividad.`;
    botonSiguiente.disabled = true;
    botonComprobar.disabled = true;
    botonLimpiar.textContent = 'Reiniciar actividad';
    botonLimpiar.onclick = () => {
      indice = 0;
      aciertos = 0;
      aciertosElemento.textContent = '0';
      botonLimpiar.textContent = 'Limpiar celda';
      botonLimpiar.onclick = null;
      mostrarEjercicio();
    };
  });

  botonPista.addEventListener('click', () => {
    if (!ayudaActiva) return;

    const ejercicio = ejercicios[indice];
    const mensaje = `La letra ${ejercicio.letra} utiliza ${ejercicio.puntos.length === 1 ? 'el punto' : 'los puntos'} ${ejercicio.puntos.join(', ')}.`;
    resultado.className = 'resultado';
    resultado.textContent = mensaje;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const voz = new SpeechSynthesisUtterance(mensaje);
      voz.lang = 'es-PE';
      window.speechSynthesis.speak(voz);
    }
  });

  actualizarAyuda();
  mostrarEjercicio();
})();