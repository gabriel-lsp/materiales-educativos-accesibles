(() => {
  'use strict';

  const alfabeto = [
    ['A',[1]],['B',[1,2]],['C',[1,4]],['D',[1,4,5]],['E',[1,5]],['F',[1,2,4]],['G',[1,2,4,5]],['H',[1,2,5]],['I',[2,4]],['J',[2,4,5]],
    ['K',[1,3]],['L',[1,2,3]],['M',[1,3,4]],['N',[1,3,4,5]],['O',[1,3,5]],['P',[1,2,3,4]],['Q',[1,2,3,4,5]],['R',[1,2,3,5]],['S',[2,3,4]],['T',[2,3,4,5]],
    ['U',[1,3,6]],['V',[1,2,3,6]],['W',[2,4,5,6]],['X',[1,3,4,6]],['Y',[1,3,4,5,6]],['Z',[1,3,5,6]]
  ].map(([letra,puntos]) => ({letra,puntos}));

  const niveles = {
    inicial:{nombre:'Nivel 1: Explorador Braille',etiqueta:'Nivel inicial',logro:'Explorador Braille',cantidadLetras:10,total:10,pistas:99,numeros:true,modoFijo:'lectura',tipoFijo:'signo-letra',umbral:0,criterio:'Constancia al completar los 10 ejercicios.'},
    intermedio:{nombre:'Nivel 2: Reconocedor Braille',etiqueta:'Nivel intermedio',logro:'Reconocedor Braille',cantidadLetras:20,total:15,pistas:3,numeros:true,modoFijo:null,tipoFijo:null,umbral:.80,criterio:'Constancia con al menos 80 % de aciertos al primer intento.'},
    avanzado:{nombre:'Nivel 3: Desafío Braille',etiqueta:'Nivel avanzado',logro:'Desafío Braille',cantidadLetras:26,total:20,pistas:0,numeros:false,modoFijo:null,tipoFijo:null,umbral:.90,criterio:'Constancia con al menos 90 % de aciertos al primer intento y sin pistas.'}
  };

  const $ = id => document.getElementById(id);
  const tarjetas = [...document.querySelectorAll('.tarjeta-nivel')];
  const radiosModo = [...document.querySelectorAll('input[name="modo"]')];
  const radiosTipo = [...document.querySelectorAll('input[name="tipo"]')];
  const panelPractica = $('panel-practica');
  const panelNiveles = $('seleccion-nivel');
  const resultado = $('resultado');
  let nivelClave='inicial', configuracion=niveles.inicial, ejercicios=[], indice=0, seleccion='', intentos=0, aciertosPrimerIntento=0, errores=0, pistasUsadas=0, modo='lectura', tipo='signo-letra', numerosVisibles=true;

  function mezclar(lista){ return [...lista].sort(()=>Math.random()-.5); }
  function prepararEjercicios(){
    const base=alfabeto.slice(0,configuracion.cantidadLetras);
    const lista=[];
    while(lista.length<configuracion.total) lista.push(...mezclar(base));
    ejercicios=lista.slice(0,configuracion.total);
  }
  function elegirConfiguracionEjercicio(){
    if(configuracion.modoFijo) modo=configuracion.modoFijo;
    else modo=(nivelClave==='avanzado' && indice%2===1)?'escritura':'lectura';
    if(configuracion.tipoFijo) tipo=configuracion.tipoFijo;
    else tipo=indice%2===0?'signo-letra':'letra-signo';
    radiosModo.forEach(r=>{r.checked=r.value===modo;r.disabled=Boolean(configuracion.modoFijo)||nivelClave==='avanzado';});
    radiosTipo.forEach(r=>{r.checked=r.value===tipo;r.disabled=Boolean(configuracion.tipoFijo)||nivelClave!=='inicial';});
  }
  function actualizarApoyos(){
    numerosVisibles=configuracion.numeros;
    $('interruptor-numeros').checked=numerosVisibles;
    $('interruptor-numeros').disabled=nivelClave==='avanzado';
    $('estado-numeros').textContent=numerosVisibles?'Visible':'Oculta';
    $('descripcion-numeros').textContent=numerosVisibles?'Los números están visibles.':'Los números están ocultos para aumentar la complejidad.';
    const ayudaDisponible=configuracion.pistas>pistasUsadas;
    $('interruptor-ayuda').checked=ayudaDisponible;
    $('interruptor-ayuda').disabled=nivelClave!=='inicial';
    $('contenedor-pista').hidden=!ayudaDisponible;
    $('mensaje-sin-ayuda').hidden=ayudaDisponible;
    $('estado-ayuda').textContent=ayudaDisponible?'Activada':'Desactivada';
    $('descripcion-ayuda').textContent=ayudaDisponible?(configuracion.pistas===99?'Las pistas están disponibles.':`Quedan ${configuracion.pistas-pistasUsadas} pistas.`):'Este nivel se realiza sin más pistas.';
    $('pistas-restantes').textContent=configuracion.pistas===99?'':`(${Math.max(0,configuracion.pistas-pistasUsadas)})`;
  }
  function crearCelda(puntos,pequena=false){
    const celda=document.createElement('div');
    celda.className=`mini-celda ${modo==='escritura'?'modo-regleta':'modo-lectura'}${pequena?' pequena':''}${numerosVisibles?'':' sin-numeros'}`;
    celda.setAttribute('aria-hidden','true');
    const orden=modo==='escritura'?[4,1,5,2,6,3]:[1,4,2,5,3,6];
    orden.forEach(n=>{const p=document.createElement('span');p.className=puntos.includes(n)?'mini-punto activo':'mini-punto';p.innerHTML=`<span>${n}</span>`;celda.appendChild(p);});
    return celda;
  }
  function opcionesPara(objetivo){
    const universo=alfabeto.slice(0,configuracion.cantidadLetras), conjunto=new Set([objetivo.letra]);
    while(conjunto.size<4) conjunto.add(universo[Math.floor(Math.random()*universo.length)].letra);
    return mezclar([...conjunto]).map(l=>universo.find(x=>x.letra===l));
  }
  function seleccionar(contenedor,boton,valor){[...contenedor.querySelectorAll('button')].forEach(b=>b.setAttribute('aria-pressed','false'));boton.setAttribute('aria-pressed','true');seleccion=valor;}
  function renderizarOpciones(){
    const objetivo=ejercicios[indice], letras=$('opciones-letras'), signos=$('opciones-signos'), signo=$('signo-principal'), letra=$('letra-objetivo');
    letras.innerHTML='';signos.innerHTML='';signo.innerHTML='';
    if(tipo==='signo-letra'){
      letra.hidden=true;letras.hidden=false;signo.hidden=false;signos.hidden=true;signo.appendChild(crearCelda(objetivo.puntos));
      opcionesPara(objetivo).forEach(op=>{const b=document.createElement('button');b.type='button';b.className='opcion-letra';b.textContent=op.letra;b.setAttribute('aria-pressed','false');b.onclick=()=>seleccionar(letras,b,op.letra);letras.appendChild(b);});
    }else{
      letra.hidden=false;letra.textContent=objetivo.letra;letras.hidden=true;signo.hidden=true;signos.hidden=false;
      opcionesPara(objetivo).forEach(op=>{const b=document.createElement('button');b.type='button';b.className='opcion-signo';b.setAttribute('aria-pressed','false');b.setAttribute('aria-label',`Opción Braille para la letra ${op.letra}`);b.appendChild(crearCelda(op.puntos,true));b.onclick=()=>seleccionar(signos,b,op.letra);signos.appendChild(b);});
    }
  }
  function mostrarEjercicio(){
    seleccion='';intentos=0;elegirConfiguracionEjercicio();actualizarApoyos();
    $('numero-ejercicio').textContent=indice+1;$('total-ejercicios').textContent=configuracion.total;$('aciertos').textContent=aciertosPrimerIntento;$('errores').textContent=errores;$('etiqueta-nivel').textContent=configuracion.etiqueta;
    $('titulo-practica').textContent=`${modo==='escritura'?'Escritura en regleta':'Lectura'}: ${tipo==='signo-letra'?'signo a letra':'letra a signo'}`;
    $('instruccion').textContent=tipo==='signo-letra'?'Observa el signo Braille y selecciona la letra que representa.':'Observa la letra y selecciona el signo Braille correspondiente.';
    $('titulo-orientacion').textContent=modo==='escritura'?'Orientación de escritura en regleta':'Orientación de lectura';
    $('texto-orientacion').textContent=modo==='escritura'?'Puntos 4, 5 y 6 a la izquierda; puntos 1, 2 y 3 a la derecha.':'Puntos 1, 2 y 3 a la izquierda; puntos 4, 5 y 6 a la derecha.';
    $('etiqueta-panel-izquierdo').textContent=tipo==='signo-letra'?'Opciones de letras':'Letra determinada';$('titulo-panel-izquierdo').textContent=tipo==='signo-letra'?'Elige la letra correcta':'Letra a representar';$('etiqueta-panel-derecho').textContent=tipo==='signo-letra'?'Signo a identificar':'Opciones de signos';$('titulo-panel-derecho').textContent=tipo==='signo-letra'?'Observa el signo Braille':'Elige el signo correcto';
    $('boton-comprobar').disabled=false;$('boton-siguiente').disabled=true;resultado.className='resultado';resultado.textContent='Selecciona una respuesta y comprueba.';renderizarOpciones();
  }
  function finalizar(){
    const porcentaje=aciertosPrimerIntento/configuracion.total, aprobado=configuracion.umbral===0||porcentaje>=configuracion.umbral;
    resultado.className=`resultado ${aprobado?'correcto':'incorrecto'}`;
    resultado.textContent=`Actividad completada. Obtuviste ${aciertosPrimerIntento} aciertos al primer intento de ${configuracion.total} (${Math.round(porcentaje*100)} %).`;
    $('boton-comprobar').disabled=true;$('boton-siguiente').disabled=true;
    $('panel-constancia').hidden=!aprobado;
    if(aprobado){$('texto-logro-panel').textContent=`Completaste ${configuracion.nombre} y alcanzaste el criterio del nivel. Escribe tu nombre para generar el reconocimiento.`;$('panel-constancia').scrollIntoView({behavior:'smooth',block:'center'});}else{resultado.textContent+=` Para obtener la constancia necesitas alcanzar al menos ${Math.round(configuracion.umbral*100)} % al primer intento.`;}
  }
  function iniciar(){
    configuracion=niveles[nivelClave];indice=0;aciertosPrimerIntento=0;errores=0;pistasUsadas=0;$('panel-constancia').hidden=true;prepararEjercicios();panelNiveles.hidden=true;panelPractica.hidden=false;mostrarEjercicio();panelPractica.scrollIntoView({behavior:'smooth'});
  }

  tarjetas.forEach(t=>t.addEventListener('click',()=>{nivelClave=t.dataset.nivel;configuracion=niveles[nivelClave];tarjetas.forEach(x=>{const a=x===t;x.classList.toggle('activa',a);x.setAttribute('aria-pressed',String(a));});$('nombre-nivel-seleccionado').textContent=configuracion.nombre;$('criterio-nivel').textContent=configuracion.criterio;}));
  $('iniciar-nivel').addEventListener('click',iniciar);
  $('cambiar-nivel').addEventListener('click',()=>{panelPractica.hidden=true;panelNiveles.hidden=false;$('panel-constancia').hidden=true;panelNiveles.scrollIntoView({behavior:'smooth'});});
  $('boton-comprobar').addEventListener('click',()=>{
    if(!seleccion){resultado.className='resultado incorrecto';resultado.textContent='Selecciona primero una respuesta.';return;}
    intentos+=1;const correcto=seleccion===ejercicios[indice].letra;
    if(correcto){if(intentos===1)aciertosPrimerIntento+=1;$('aciertos').textContent=aciertosPrimerIntento;resultado.className='resultado correcto';resultado.textContent=intentos===1?'Respuesta correcta al primer intento.':'Respuesta correcta. Puedes continuar.';$('boton-comprobar').disabled=true;$('boton-siguiente').disabled=false;}
    else{errores+=1;$('errores').textContent=errores;resultado.className='resultado incorrecto';resultado.textContent='La respuesta no es correcta. Inténtalo nuevamente.';}
  });
  $('boton-siguiente').addEventListener('click',()=>{if(indice<configuracion.total-1){indice+=1;mostrarEjercicio();}else finalizar();});
  $('boton-pista').addEventListener('click',()=>{if(configuracion.pistas<=pistasUsadas)return;pistasUsadas+=1;const e=ejercicios[indice],mensaje=`La letra ${e.letra} utiliza los puntos ${e.puntos.join(', ')}.`;resultado.className='resultado';resultado.textContent=mensaje;actualizarApoyos();if('speechSynthesis'in window){window.speechSynthesis.cancel();const voz=new SpeechSynthesisUtterance(mensaje);voz.lang='es-PE';window.speechSynthesis.speak(voz);}});
  $('interruptor-numeros').addEventListener('change',e=>{if(nivelClave==='avanzado')return;numerosVisibles=e.target.checked;document.querySelectorAll('.mini-celda').forEach(c=>c.classList.toggle('sin-numeros',!numerosVisibles));$('estado-numeros').textContent=numerosVisibles?'Visible':'Oculta';});

  const dialogo=$('dialogo-constancia');
  $('generar-constancia').addEventListener('click',()=>{const nombre=$('nombre-constancia').value.trim();if(!nombre){$('nombre-constancia').setCustomValidity('Escribe el nombre del participante.');$('nombre-constancia').reportValidity();return;}$('nombre-constancia').setCustomValidity('');$('constancia-nombre').textContent=nombre;$('constancia-nivel').textContent=configuracion.nombre;$('constancia-logro').textContent=`Logro motivacional: ${configuracion.logro}`;$('constancia-texto').textContent=`por completar satisfactoriamente ${configuracion.nombre}, alcanzando ${Math.round((aciertosPrimerIntento/configuracion.total)*100)} % de respuestas correctas al primer intento.`;$('constancia-fecha').textContent=new Intl.DateTimeFormat('es-PE',{dateStyle:'long'}).format(new Date());$('constancia-codigo').textContent=`MEA-BRAILLE-V2-${nivelClave.toUpperCase()}-${new Date().toISOString().slice(0,10).replaceAll('-','')}-${Math.random().toString(36).slice(2,8).toUpperCase()}`;dialogo.showModal();});
  $('nombre-constancia').addEventListener('input',e=>e.target.setCustomValidity(''));
  $('cerrar-constancia').addEventListener('click',()=>dialogo.close());$('imprimir-constancia').addEventListener('click',()=>window.print());dialogo.addEventListener('click',e=>{if(e.target===dialogo)dialogo.close();});
})();