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
  const radiosModo = [...document.querySelectorAll('input[name="modo"]')];
  const letraObjetivo = document.getElementById('letra-objetivo');
  const opcionesLectura = document.getElementById('opciones-lectura');
  const etiquetaReto = document.getElementById('etiqueta-reto');
  const tituloPractica = document.getElementById('titulo-practica');
  const instruccion = document.getElementById('instruccion');
  const numeroEjercicio = document.getElementById('numero-ejercicio');
  const totalEjercicios = document.getElementById('total-ejercicios');
  const aciertosElemento = document.getElementById('aciertos');
  const resultado = document.getElementById('resultado');
  const botonLimpiar = document.getElementById('boton-limpiar');
  const botonComprobar = document.getElementById('boton-comprobar');
  const botonSiguiente = document.getElementById('boton-siguiente');
  const botonPista = document.getElementById('boton-pista');
  const interruptorAyuda = document.getElementById('interruptor-ayuda');
  const interruptorNumeros = document.getElementById('interruptor-numeros');
  const estadoAyuda = document.getElementById('estado-ayuda');
  const estadoNumeros = document.getElementById('estado-numeros');
  const descripcionAyuda = document.getElementById('descripcion-ayuda');
  const descripcionNumeros = document.getElementById('descripcion-numeros');
  const controlAyuda = document.getElementById('control-ayuda');
  const controlNumeros = document.getElementById('control-numeros');
  const contenedorPista = document.getElementById('contenedor-pista');
  const mensajeSinAyuda = document.getElementById('mensaje-sin-ayuda');
  const ayudaReto = document.getElementById('titulo-reto');
  const ayudaCelda = document.getElementById('ayuda-celda');
  const celdaBraille = document.getElementById('celda-braille');
  const tituloCelda = document.getElementById('titulo-celda');
  const tituloOrientacion = document.getElementById('titulo-orientacion');
  const textoOrientacion = document.getElementById('texto-orientacion');
  const avisoOrientacion = document.getElementById('aviso-orientacion');

  let indice = 0;
  let aciertos = 0;
  let respuestaCorrecta = false;
  let ayudaActiva = true;
  let numerosVisibles = true;
  let modo = 'lectura';
  let letraSeleccionada = '';

  totalEjercicios.textContent = String(ejercicios.length);

  function seleccionados() {
    return puntos
      .filter((punto) => punto.getAttribute('aria-pressed') === 'true')
      .map((punto) => Number(punto.dataset.punto))
      .sort((a, b) => a - b);
  }

  function establecerPuntos(activos, interactivos) {
    puntos.forEach((punto) => {
      const numero = Number(punto.dataset.punto);
      const activo = activos.includes(numero);
      punto.setAttribute('aria-pressed', String(activo));
      punto.disabled = !interactivos;
      punto.setAttribute('aria-label', `Punto ${numero} ${activo ? 'seleccionado' : 'desactivado'}${interactivos ? '' : ', solo lectura'}`);
    });
    celdaBraille.classList.toggle('celda-solo-lectura', !interactivos);
  }

  function limpiarCelda() {
    establecerPuntos([], true);
  }

  function crearOpcionesLectura() {
    const ejercicio = ejercicios[indice];
    const candidatas = new Set([ejercicio.letra]);
    let desplazamiento = 1;
    while (candidatas.size < 4) {
      candidatas.add(ejercicios[(indice + desplazamiento * 3) % ejercicios.length].letra);
      desplazamiento += 1;
    }

    const ordenadas = [...candidatas].sort(() => Math.random() - 0.5);
    opcionesLectura.innerHTML = '';
    ordenadas.forEach((letra) => {
      const boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'opcion-letra';
      boton.textContent = letra;
      boton.setAttribute('aria-pressed', 'false');
      boton.addEventListener('click', () => {
        [...opcionesLectura.querySelectorAll('.opcion-letra')].forEach((opcion) => opcion.setAttribute('aria-pressed', 'false'));
        boton.setAttribute('aria-pressed', 'true');
        letraSeleccionada = letra;
      });
      opcionesLectura.appendChild(boton);
    });
  }

  function actualizarAyuda(anunciar = true) {
    ayudaActiva = interruptorAyuda.checked;
    estadoAyuda.textContent = ayudaActiva ? 'Activada' : 'Desactivada';
    descripcionAyuda.textContent = ayudaActiva ? 'Las pistas están disponibles.' : 'Las pistas y orientaciones están ocultas.';
    controlAyuda.classList.toggle('ayuda-encendida', ayudaActiva);
    controlAyuda.classList.toggle('ayuda-apagada', !ayudaActiva);
    contenedorPista.hidden = !ayudaActiva;
    mensajeSinAyuda.hidden = ayudaActiva;
    ayudaReto.hidden = !ayudaActiva;
    ayudaCelda.hidden = !ayudaActiva;

    if (!ayudaActiva && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    if (anunciar) {
      resultado.className = 'resultado';
      resultado.textContent = ayudaActiva ? 'Ayuda activada.' : 'Ayuda desactivada. Resuelve sin pistas.';
    }
  }

  function actualizarNumeros(anunciar = true) {
    numerosVisibles = interruptorNumeros.checked;
    estadoNumeros.textContent = numerosVisibles ? 'Visible' : 'Oculta';
    descripcionNumeros.textContent = numerosVisibles ? 'Los números están visibles.' : 'Los números están ocultos para aumentar la complejidad.';
    controlNumeros.classList.toggle('numeros-encendidos', numerosVisibles);
    controlNumeros.classList.toggle('numeros-apagados', !numerosVisibles);
    celdaBraille.classList.toggle('sin-numeros', !numerosVisibles);
    if (anunciar) {
      resultado.className = 'resultado';
      resultado.textContent = numerosVisibles ? 'Numeración visible.' : 'Numeración oculta. La dificultad aumentó.';
    }
  }

  function actualizarOrientacion() {
    const escritura = modo === 'escritura';
    celdaBraille.classList.toggle('modo-lectura', !escritura);
    celdaBraille.classList.toggle('modo-regleta', escritura);
    avisoOrientacion.classList.toggle('orientacion-regleta', escritura);

    if (escritura) {
      tituloOrientacion.textContent = 'Orientación de escritura en regleta';
      textoOrientacion.textContent = 'La disposición se invierte horizontalmente: puntos 4, 5 y 6 a la izquierda; puntos 1, 2 y 3 a la derecha. Se punza sobre el reverso del papel.';
      tituloCelda.textContent = 'Celda Braille vista desde la regleta';
      ayudaCelda.textContent = 'En la regleta, la celda se trabaja de derecha a izquierda. Al voltear el papel, recupera la orientación normal de lectura.';
      celdaBraille.setAttribute('aria-label', 'Celda Braille en orientación invertida para escritura con regleta');
    } else {
      tituloOrientacion.textContent = 'Orientación de lectura';
      textoOrientacion.textContent = 'La celda se observa de frente: puntos 1, 2 y 3 a la izquierda; puntos 4, 5 y 6 a la derecha.';
      tituloCelda.textContent = 'Celda Braille de seis puntos';
      ayudaCelda.textContent = 'Los puntos se numeran de arriba hacia abajo: 1, 2 y 3 a la izquierda; 4, 5 y 6 a la derecha.';
      celdaBraille.setAttribute('aria-label', 'Celda Braille en orientación de lectura');
    }
  }

  function mostrarEjercicio() {
    const ejercicio = ejercicios[indice];
    numeroEjercicio.textContent = String(indice + 1);
    respuestaCorrecta = false;
    botonSiguiente.disabled = true;
    botonComprobar.disabled = false;
    letraSeleccionada = '';
    actualizarOrientacion();

    if (modo === 'lectura') {
      tituloPractica.textContent = 'Modo lectura';
      instruccion.textContent = 'Observa el signo Braille en orientación de lectura y selecciona la letra que representa.';
      etiquetaReto.textContent = 'Selecciona la letra correcta';
      letraObjetivo.hidden = true;
      opcionesLectura.hidden = false;
      botonLimpiar.hidden = true;
      establecerPuntos(ejercicio.puntos, false);
      crearOpcionesLectura();
      ayudaReto.textContent = 'Lee la combinación de izquierda a derecha y elige una respuesta.';
      resultado.textContent = ayudaActiva ? 'Selecciona una letra. Puedes usar una pista.' : 'Selecciona una letra sin ayuda.';
    } else {
      tituloPractica.textContent = 'Modo escritura en regleta';
      instruccion.textContent = 'Observa la letra y punza los puntos en la orientación invertida de la regleta.';
      etiquetaReto.textContent = 'Letra a escribir en regleta';
      letraObjetivo.textContent = ejercicio.letra;
      letraObjetivo.hidden = false;
      opcionesLectura.hidden = true;
      botonLimpiar.hidden = false;
      limpiarCelda();
      ayudaReto.textContent = 'Selecciona los puntos como se punzarían sobre el reverso del papel.';
      resultado.textContent = ayudaActiva ? 'Selecciona los puntos en orientación de regleta. Puedes usar una pista.' : 'Selecciona los puntos en orientación de regleta sin ayuda.';
    }
    resultado.className = 'resultado';
  }

  function cambiarModo(nuevoModo) {
    modo = nuevoModo;
    indice = 0;
    aciertos = 0;
    aciertosElemento.textContent = '0';
    botonLimpiar.textContent = 'Limpiar celda';
    botonLimpiar.onclick = null;
    mostrarEjercicio();
  }

  puntos.forEach((punto) => {
    punto.addEventListener('click', () => {
      if (modo !== 'escritura') return;
      const activo = punto.getAttribute('aria-pressed') === 'true';
      punto.setAttribute('aria-pressed', String(!activo));
      punto.setAttribute('aria-label', `Punto ${punto.dataset.punto} ${activo ? 'desactivado' : 'seleccionado'} en orientación de regleta`);
    });
  });

  radiosModo.forEach((radio) => radio.addEventListener('change', () => {
    if (radio.checked) cambiarModo(radio.value);
  }));
  interruptorAyuda.addEventListener('change', () => actualizarAyuda(true));
  interruptorNumeros.addEventListener('change', () => actualizarNumeros(true));

  botonLimpiar.addEventListener('click', () => {
    if (modo !== 'escritura') return;
    limpiarCelda();
    resultado.className = 'resultado';
    resultado.textContent = 'La celda de regleta quedó limpia.';
  });

  botonComprobar.addEventListener('click', () => {
    const ejercicio = ejercicios[indice];
    const seleccion = seleccionados();
    const correcta = modo === 'lectura'
      ? letraSeleccionada === ejercicio.letra
      : seleccion.length === ejercicio.puntos.length && seleccion.every((valor, posicion) => valor === ejercicio.puntos[posicion]);

    if (correcta) {
      if (!respuestaCorrecta) aciertos += 1;
      respuestaCorrecta = true;
      aciertosElemento.textContent = String(aciertos);
      resultado.className = 'resultado correcto';
      resultado.textContent = ayudaActiva
        ? modo === 'lectura'
          ? `Respuesta correcta. La letra ${ejercicio.letra} utiliza ${ejercicio.puntos.length === 1 ? 'el punto' : 'los puntos'} ${ejercicio.puntos.join(', ')} en orientación de lectura.`
          : `Respuesta correcta. En la regleta, la letra ${ejercicio.letra} se punza con ${ejercicio.puntos.length === 1 ? 'el punto' : 'los puntos'} ${ejercicio.puntos.join(', ')} en la disposición invertida mostrada.`
        : `Respuesta correcta. Has completado el ejercicio en modo ${modo === 'lectura' ? 'lectura' : 'escritura en regleta'}.`;
      botonSiguiente.disabled = false;
      botonComprobar.disabled = true;
    } else {
      resultado.className = 'resultado incorrecto';
      resultado.textContent = ayudaActiva ? 'La respuesta todavía no es correcta. Revisa la orientación o solicita una pista.' : 'La respuesta todavía no es correcta. Inténtalo nuevamente.';
    }
  });

  botonSiguiente.addEventListener('click', () => {
    if (indice < ejercicios.length - 1) {
      indice += 1;
      mostrarEjercicio();
      return;
    }
    resultado.className = 'resultado correcto';
    resultado.textContent = `Actividad completada en modo ${modo === 'lectura' ? 'lectura' : 'escritura en regleta'}. Obtuviste ${aciertos} aciertos de ${ejercicios.length}.`;
    botonSiguiente.disabled = true;
    botonComprobar.disabled = true;
    botonLimpiar.hidden = false;
    botonLimpiar.textContent = 'Reiniciar actividad';
    botonLimpiar.onclick = () => cambiarModo(modo);
  });

  botonPista.addEventListener('click', () => {
    if (!ayudaActiva) return;
    const ejercicio = ejercicios[indice];
    const mensaje = modo === 'lectura'
      ? `El signo leído de frente utiliza ${ejercicio.puntos.length === 1 ? 'el punto' : 'los puntos'} ${ejercicio.puntos.join(', ')}.`
      : `En la regleta, punza ${ejercicio.puntos.length === 1 ? 'el punto' : 'los puntos'} ${ejercicio.puntos.join(', ')} en la disposición invertida que aparece en pantalla.`;
    resultado.className = 'resultado';
    resultado.textContent = mensaje;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const voz = new SpeechSynthesisUtterance(mensaje);
      voz.lang = 'es-PE';
      window.speechSynthesis.speak(voz);
    }
  });

  actualizarAyuda(false);
  actualizarNumeros(false);
  actualizarOrientacion();
  mostrarEjercicio();
})();