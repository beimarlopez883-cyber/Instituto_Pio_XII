// ============================================================
// INSTITUTO TECNOLÓGICO PÍO XII — VISOR 3D DEL CAMPUS
// ============================================================
// Three.js + GLTFLoader + OrbitControls + GSAP
// ============================================================

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ============================================================
// 0. CONFIGURACIÓN EDITABLE DE CÁMARA POR CARRERA
// ============================================================
// El modelo real mide ~decenas/cientos de unidades y cada
// instituto tiene proporciones distintas, así que en vez de
// escribir coordenadas fijas "a ciegas" (lo que hacía que el
// vuelo casi no se notara y pareciera solo un giro), las
// posiciones de cada carrera se calculan como FRACCIONES
// (0 a 1) del tamaño real del edificio, una vez que el
// modelo .glb ya está cargado. Así el vuelo SIEMPRE entra al
// edificio sin importar su escala real.
//
// Para cada carrera defines:
//   piso              : 1, 2 o 3 (usa fraccionesPiso de abajo)
//   xFraccion         : 0 = extremo izquierdo del edificio
//                        1 = extremo derecho del edificio
//   zFraccionObjetivo : qué tan "adentro" mira la cámara
//                        0 = pared trasera, 1 = fachada frontal
//   zFraccionCamara   : dónde se coloca la cámara en Z
//                        (normalmente más cerca de la fachada
//                        que el objetivo, para que el vuelo dé
//                        la sensación de "entrar" al edificio)
//
// Después de cargar el modelo, edificio.js imprime en la
// consola del navegador las coordenadas (x, y, z) reales que
// resultan de estas fracciones, por si luego quieres afinarlas
// a mano con valores fijos.
// ============================================================

const CONFIG_CAMARA = {

    // Duración y easing de todos los vuelos de cámara (GSAP)
    duracionDefecto: 2.4,
    easingDefecto: 'power2.inOut',

    // Fracción vertical (0 a 1) de la altura del edificio en la
    // que se ubica cada piso. Ajusta estos números si un piso
    // aparece muy alto o muy bajo.
    fraccionesPiso: {
        0: 0.05,
        1: 0.23,
        2: 0.48,
        3: 0.65
    },

    // Qué tan cerca de la fachada queda la cámara (1 = justo en
    // el borde del edificio) y qué tan adentro mira el objetivo
    // (más bajo = más profundo dentro del edificio).
    zFraccionCamaraDefecto: 0.72,
    zFraccionObjetivoDefecto: 0.27,

    // Vista general del campus (botón "Volver al Campus").
    // Se recalcula automáticamente al cargar el modelo para que
    // SIEMPRE se vea el edificio completo, sin importar su
    // tamaño real — ver calcularVistaCampus().
    vistaCampus: null,

    // Un destino por cada botón de #menuCarreras (data-carrera="...")
   destinos: {

    contaduria: {
        nombre: 'Contaduría General',
        piso: 1,
        xFraccion: 0.25
    },

    sistemas: {
        nombre: 'Sistemas Informáticos',
        piso: 3,
        xFraccion: 0.28
    },

    secretariado: {
        nombre: 'Secretariado Ejecutivo',
        piso: 2,
        xFraccion: 0.26
    },

    gastronomia: {
        nombre: 'Gastronomía',
        piso: 1,
        xFraccion: 0.22,
        zFraccionCamara: -0.5,
        zFraccionObjetivo: 0.5
    },

    administracion: {
        nombre: 'Administración',
        piso: 0,
        xFraccion: 0.35
    }

}
};
// ============================================================
// INFORMACIÓN COMPLETA DE LAS CARRERAS
// ============================================================

const INFORMACION_CARRERAS = {

    contaduria: {

        titulo: 'CONTABILIDAD GENERAL',

        area: 'Área comercial y administrativa',

        resumen: 'Contabilidad financiera y gestión tributaria',

        imagen: 'imagenes/logo_carrera_conta.jpg',

        detalle: `Es una de las carreras pilares de la institución. Capacita en contabilidad financiera, auditoría básica, gestión tributaria y preparación de estados financieros para empresas públicas o privadas.

Duración general: 3 años · Nivel: Técnico Superior.`

    },

    secretariado: {

        titulo: 'SECRETARIADO EJECUTIVO',

        area: 'Área comercial y administrativa',

        resumen: 'Gestión de oficinas y asistencia administrativa',

        imagen: 'imagenes/logo_carrera_secretariado.jpg',

        detalle: `Está enfocada en la gestión de oficinas y la asistencia administrativa. Desarrolla destrezas en redacción comercial, archivo digital, relaciones públicas, etiqueta corporativa y herramientas de computación aplicadas a la oficina.

Duración general: 3 años · Nivel: Técnico Superior.`

    },

    administracion: {

        titulo: 'ADMINISTRACIÓN DE EMPRESAS',

        area: 'Área comercial y administrativa',

        resumen: 'Planificación y dirección de negocios',

        imagen: 'imagenes/logo_carrera_admi.jpg',

        detalle: `Orienta a los estudiantes en la planificación, organización, dirección y control de recursos para negocios locales y emprendimientos autónomos.

Duración general: 3 años · Nivel: Técnico Superior.`

    },

    sistemas: {

        titulo: 'SISTEMAS INFORMÁTICOS',

        area: 'Área de tecnología e informática',

        resumen: 'Soporte técnico, redes y bases de datos',

        imagen: 'imagenes/logo_carrera_sistemas.jpg',

        detalle: `Prepara profesionales capaces de dar soporte técnico a computadoras, diseñar redes de comunicación locales y gestionar bases de datos para optimizar los procesos de información de las empresas.

Duración general: 3 años · Nivel: Técnico Superior.`

    },

    gastronomia: {

        titulo: 'GASTRONOMÍA',

        area: 'Especialidad técnica y productiva',

        resumen: 'Cocina, repostería y gestión gastronómica',

        imagen: 'imagenes/logo_gastronomia.jpg',

        detalle: `Está enfocada en el arte culinario, las técnicas de cocina nacional e internacional, la repostería y la gestión de negocios de alimentos y bebidas.

Duración general: 3 años · Nivel: Técnico Superior.`

    }

};

// ============================================================
// 1. CONTENEDOR Y MODO
// ============================================================

const contenedor = document.getElementById('visor3D');
const modoExploracion = document.body.dataset.modo === 'exploracion';
const indicadorCarga = document.getElementById('cargaModelo');

// ============================================================
// 2. ESCENA
// ============================================================

const escena = new THREE.Scene();
escena.background = null; // deja ver el fondo PNG del CSS

// ============================================================
// 3. CÁMARA PERSPECTIVA
// ============================================================

const camara = new THREE.PerspectiveCamera(
    40,
    window.innerWidth / window.innerHeight,
    0.1,
    5000
);
camara.position.set(0, 5, 35);

// ============================================================
// 4. RENDERIZADOR A PANTALLA COMPLETA
// ============================================================

const renderizador = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderizador.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderizador.setSize(window.innerWidth, window.innerHeight);
renderizador.outputEncoding = THREE.sRGBEncoding;
renderizador.toneMapping = THREE.ACESFilmicToneMapping;
renderizador.toneMappingExposure = 1.0;
renderizador.shadowMap.enabled = true;
renderizador.shadowMap.type = THREE.PCFSoftShadowMap;
contenedor.appendChild(renderizador.domElement);

// ============================================================
// 5. CONTROLES ORBITALES
// ============================================================

const controles = new OrbitControls(camara, renderizador.domElement);
controles.enableDamping = true;
controles.dampingFactor = 0.08;
controles.enableZoom = true;
controles.zoomSpeed = 0.6;
controles.enablePan = false;
controles.rotateSpeed = 0.55;
controles.minDistance = 8;
controles.maxDistance = 400;
controles.minPolarAngle = 0.1;
controles.maxPolarAngle = Math.PI * 0.49;

// ============================================================
// 6. LUCES
// ============================================================

const luzAmbiental = new THREE.AmbientLight(0xffffff, 0.7);
escena.add(luzAmbiental);

const luzPrincipal = new THREE.DirectionalLight(0xffffff, 1.4);
luzPrincipal.position.set(50, 80, 50);
luzPrincipal.castShadow = true;
luzPrincipal.shadow.mapSize.set(2048, 2048);
luzPrincipal.shadow.camera.near = 0.5;
luzPrincipal.shadow.camera.far = 500;
escena.add(luzPrincipal);

const luzRelleno = new THREE.DirectionalLight(0x9ec9ff, 0.35);
luzRelleno.position.set(-40, 40, -50);
escena.add(luzRelleno);

const luzSuperior = new THREE.HemisphereLight(0xffffff, 0x223344, 0.35);
escena.add(luzSuperior);

// ============================================================
// 7. CARGA DEL MODELO .GLB (GLTFLoader)
// ============================================================

const cargador = new GLTFLoader();

let modeloCargado = null;
let nivelBaseModelo = 0;
let cajaModelo = null;   // THREE.Box3 real del edificio, ya centrado y rotado
let tamañoModelo = null; // THREE.Vector3 con ancho/alto/profundidad reales

cargador.load(
    './modelos/Model.glb',

    // --- éxito ---------------------------------------------
    (gltf) => {
        const modelo = gltf.scene;
        modeloCargado = modelo;

        modelo.traverse((objeto) => {
            if (objeto.isMesh) {
                objeto.castShadow = true;
                objeto.receiveShadow = true;
                if (objeto.material?.map) {
                    objeto.material.map.encoding = THREE.sRGBEncoding;
                }
            }
        });

        // --- centrar el modelo en el origen (antes de rotar) ---
        const cajaPrevia = new THREE.Box3().setFromObject(modelo);
        const centroPrevio = cajaPrevia.getCenter(new THREE.Vector3());
        modelo.position.sub(centroPrevio);

    // Rotación inicial del edificio para mostrar directamente la puerta
modelo.rotation.y = Math.PI / 1.5; // ~72° (ajusta según el modelo)

        // --- re-centrar después de rotar (la rotación puede
        //     desplazar el centro real del bounding box) ---
        escena.add(modelo);

        const cajaRotada = new THREE.Box3().setFromObject(modelo);
        const centroRotado = cajaRotada.getCenter(new THREE.Vector3());
        modelo.position.x -= centroRotado.x;
        modelo.position.z -= centroRotado.z;
        // el eje Y se deja tal cual para que el edificio "pise" y=0

        // --- bounding box FINAL, ya real y ya centrado ---
        cajaModelo = new THREE.Box3().setFromObject(modelo);
        tamañoModelo = cajaModelo.getSize(new THREE.Vector3());
        nivelBaseModelo = cajaModelo.min.y;

        const tamañoMaximo = Math.max(tamañoModelo.x, tamañoModelo.y, tamañoModelo.z);

        console.log('Modelo 3D cargado correctamente.');
        console.log('Tamaño real del edificio (x, y, z):', tamañoModelo);
        console.log('Bounding box:', cajaModelo.min, cajaModelo.max);

        // --- calcular vista general del campus (se ve TODO) ---
        calcularVistaCampus();

        // --- calcular las coordenadas reales de cada carrera ---
        calcularDestinosCarreras();

        // --- aplicar la vista inicial ---
        const vista = CONFIG_CAMARA.vistaCampus;
        camara.position.set(vista.posicion.x, vista.posicion.y, vista.posicion.z);
        controles.target.set(vista.objetivo.x, vista.objetivo.y, vista.objetivo.z);
        controles.update();

        controles.minDistance = Math.max(tamañoMaximo * 0.15, 5);
        controles.maxDistance = Math.max(tamañoMaximo * 3, 200);

        if (indicadorCarga) indicadorCarga.classList.add('oculto');
    },

    // --- progreso --------------------------------------------
    (progreso) => {
        if (progreso.total > 0 && indicadorCarga) {
            const porcentaje = (progreso.loaded / progreso.total) * 100;
            indicadorCarga.textContent = `Cargando modelo 3D... ${porcentaje.toFixed(0)}%`;
        }
    },

    // --- error -------------------------------------------------
    (error) => {
        console.error('Error al cargar el modelo 3D:', error);
        if (indicadorCarga) {
            indicadorCarga.textContent =
                'No se pudo cargar el modelo 3D. Verifica que exista en ./modelos/.';
        }
    }
);

// ============================================================
// 7.1 VISTA GENERAL DEL CAMPUS — SIEMPRE MUESTRA TODO EL EDIFICIO
// ============================================================
// La distancia y altura de la cámara se calculan a partir del
// tamaño REAL del modelo (cajaModelo / tamañoModelo), así que
// el edificio completo siempre entra en cuadro, sin recortes.
// ============================================================

function calcularVistaCampus() {
    const tamañoMaximoHorizontal = Math.max(tamañoModelo.x, tamañoModelo.z);

    // Distancia suficiente para que el FOV de 40° cubra todo el
    // ancho del edificio, con un margen extra (factor 1.35).
    const distancia = (tamañoMaximoHorizontal / 2) / Math.tan(THREE.MathUtils.degToRad(20)) * 0.7;

    const alturaCamara = cajaModelo.min.y + tamañoModelo.y * 1.1;
    const alturaObjetivo = cajaModelo.min.y + tamañoModelo.y * 0.35;

    CONFIG_CAMARA.vistaCampus = {
        nombre: 'Vista general del campus',
        posicion: { x: -15, y: alturaCamara, z: distancia },
        objetivo: { x: -15, y: alturaObjetivo, z: 0 }
    };

    console.log('Vista general del campus calculada:', CONFIG_CAMARA.vistaCampus);
}

// ============================================================
// 7.2 COORDENADAS REALES POR CARRERA (a partir de fracciones)
// ============================================================

function calcularDestinosCarreras() {
    const { fraccionesPiso, zFraccionCamaraDefecto, zFraccionObjetivoDefecto } = CONFIG_CAMARA;

    Object.entries(CONFIG_CAMARA.destinos).forEach(([clave, destino]) => {
        const fraccionY = fraccionesPiso[destino.piso] ?? 0.5;
        const zFraccionCamara = destino.zFraccionCamara ?? zFraccionCamaraDefecto;
        const zFraccionObjetivo = destino.zFraccionObjetivo ?? zFraccionObjetivoDefecto;

        const y = cajaModelo.min.y + fraccionY * tamañoModelo.y;
        const x = cajaModelo.min.x + destino.xFraccion * tamañoModelo.x;

        const zCamara = cajaModelo.min.z + zFraccionCamara * tamañoModelo.z;
        const zObjetivo = cajaModelo.min.z + zFraccionObjetivo * tamañoModelo.z;

        destino.posicion = { x, y: y + tamañoModelo.y * 0.04, z: zCamara };
        destino.objetivo = { x, y, z: zObjetivo };

        console.log(`Destino "${clave}" (${destino.nombre}) ->`, {
            posicion: destino.posicion,
            objetivo: destino.objetivo
        });
    });
}

// ============================================================
// 8. PERSONAJE FBX ANIMADO (solo fuera del modo exploración)
// ============================================================

let mezcladorPersonaje = null;
let accionCaminar = null;
let personajeCargado = null;

if (!modoExploracion) {
    const cargadorFBX = new FBXLoader();

    cargadorFBX.load(
        './modelos/camninando.fbx',
        (personaje) => {
            personajeCargado = personaje;
            mezcladorPersonaje = new THREE.AnimationMixer(personaje);

            if (personaje.animations.length > 0) {
                accionCaminar = mezcladorPersonaje.clipAction(personaje.animations[0]);
                accionCaminar.loop = THREE.LoopOnce;
                accionCaminar.clampWhenFinished = true;
            }

            personaje.traverse((objeto) => {
                if (objeto.isMesh) {
                    objeto.castShadow = true;
                    objeto.receiveShadow = true;
                }
            });

            const cajaPersonaje = new THREE.Box3().setFromObject(personaje);
            const tamañoPersonaje = cajaPersonaje.getSize(new THREE.Vector3());
            const escala = 6 / tamañoPersonaje.y;
            personaje.scale.setScalar(escala);
            personaje.position.set(25, nivelBaseModelo + 2, 34);
            personaje.rotation.y = Math.PI;

            escena.add(personaje);
        },
        undefined,
        (error) => console.error('No se pudo cargar el personaje FBX:', error)
    );
}

// ============================================================
// 9. NAVEGACIÓN ENTRE CARRERAS — VUELO DE CÁMARA CON GSAP
// ============================================================
//
// Mientras la animación de GSAP está en curso, OrbitControls
// se desactiva (controles.enabled = false) para que el usuario
// no "pelee" con la cámara. Al terminar el vuelo se reactiva.
// ============================================================

let animacionCamaraActiva = null; // referencia al tween activo de GSAP

function volarCamaraA(destino) {

    if (!destino || !destino.posicion || !destino.objetivo) {
        console.warn('El modelo todavía no terminó de cargar: espera un momento antes de navegar.');
        return;
    }

    if (typeof gsap === 'undefined') {
        console.warn('GSAP no está cargado: no se puede animar la cámara.');
        camara.position.set(destino.posicion.x, destino.posicion.y, destino.posicion.z);
        controles.target.set(destino.objetivo.x, destino.objetivo.y, destino.objetivo.z);
        controles.update();
        return;
    }

    // Si ya hay un vuelo en curso, lo cancelamos limpiamente
    if (animacionCamaraActiva) {
        animacionCamaraActiva.kill();
        animacionCamaraActiva = null;
    }

    const duracion = destino.duracion ?? CONFIG_CAMARA.duracionDefecto;
    const easing = destino.easing ?? CONFIG_CAMARA.easingDefecto;

    // Timeline única para animar posición + objetivo en paralelo
    const linea = gsap.timeline({

        onStart: () => {
            controles.enabled = false;
        },

        onUpdate: () => {
            controles.update();
        },

        onComplete: () => {
            controles.enabled = true;
            animacionCamaraActiva = null;
        }
    });

    linea.to(camara.position, {
        x: destino.posicion.x,
        y: destino.posicion.y,
        z: destino.posicion.z,
        duration: duracion,
        ease: easing
    }, 0);

    linea.to(controles.target, {
        x: destino.objetivo.x,
        y: destino.objetivo.y,
        z: destino.objetivo.z,
        duration: duracion,
        ease: easing
    }, 0);

    animacionCamaraActiva = linea;
}// ============================================================
// MOSTRAR INFORMACIÓN DE LA CARRERA
// ============================================================
function mostrarInformacionCarrera(carrera) {

    console.log('================================');
    console.log('MOSTRAR INFORMACIÓN');
    console.log('Carrera recibida:', carrera);
    console.log('================================');


    const info = INFORMACION_CARRERAS[carrera];

    if (!info) {

        console.error(
            'NO EXISTE INFORMACION_CARRERAS PARA:',
            carrera
        );

        return;

    }


    const panel = document.getElementById('infoCarrera');

    const area = document.getElementById('infoCarreraArea');

    const titulo = document.getElementById('infoCarreraTitulo');

    const resumen = document.getElementById('infoCarreraResumen');

    const detalle = document.getElementById('infoCarreraDetalle');

    const imagen = document.getElementById('infoCarreraImagen');


    console.log('Panel:', panel);
    console.log('Área:', area);
    console.log('Título:', titulo);
    console.log('Resumen:', resumen);
    console.log('Detalle:', detalle);
    console.log('Imagen:', imagen);


    if (!panel) {

        console.error(
            '❌ NO EXISTE #infoCarrera EN EL HTML'
        );

        return;

    }


    if (!area || !titulo || !resumen || !detalle || !imagen) {

        console.error(
            '❌ Faltan elementos del panel de información'
        );

        return;

    }


    area.textContent = info.area;

    titulo.textContent = info.titulo;

    resumen.textContent = info.resumen;

    detalle.textContent = info.detalle;

    imagen.src = info.imagen;

    imagen.alt = `Imagen de ${info.titulo}`;


    panel.hidden = false;


    console.log('✅ INFORMACIÓN MOSTRADA:', info.titulo);

}
function ocultarInformacionCarrera() {

    const panel = document.getElementById('infoCarrera');

    if (!panel) return;

    panel.hidden = true;

}

function irACarrera(carrera) {

    const destino = CONFIG_CAMARA.destinos[carrera];

    if (!destino) {

        console.warn(
            'No existe configuración de cámara para la carrera:',
            carrera
        );

        return;

    }

    console.log(
        `Volando hacia: ${destino.nombre} (piso ${destino.piso})`
    );


    // Primero mostramos la información
    mostrarInformacionCarrera(carrera);


    // Después hacemos el vuelo de cámara
    volarCamaraA(destino);

}

function volverAlCampus() {
    console.log('Regresando a la vista general del campus.');
    volarCamaraA(CONFIG_CAMARA.vistaCampus);
}

// Se exponen por si se necesitan invocar desde otro script/HTML
window.irACarrera = irACarrera;
window.volverAlCampus = volverAlCampus;

// ============================================================
// 10. BOTONES DEL MENÚ DE CARRERAS
// ============================================================

document.querySelectorAll('#menuCarreras [data-carrera]').forEach((boton) => {
    boton.addEventListener('click', () => irACarrera(boton.dataset.carrera));
});

document.getElementById('volverCampus')?.addEventListener('click', volverAlCampus);

// ============================================================
// 11. REDIMENSIONAMIENTO DE VENTANA
// ============================================================

window.addEventListener('resize', () => {
    camara.aspect = window.innerWidth / window.innerHeight;
    camara.updateProjectionMatrix();
    renderizador.setSize(window.innerWidth, window.innerHeight);
});

// ============================================================
// 12. GIRO AUTOMÁTICO DEL MODELO (solo en index.html)
// ============================================================
// En index.html (modoExploracion === false) el edificio gira
// lentamente sobre su propio eje, en el mismo lugar, como una
// vitrina. En campus.html el modelo NO gira: ahí el usuario
// se mueve libremente con el mouse/teclado dentro del campus.
// ============================================================

const velocidadGiroAutomatico = 0.12; // radianes por segundo

// ============================================================
// 13. MOVIMIENTO CON TECLADO (solo en campus.html, deshabilitado
//     durante el vuelo de cámara)
// ============================================================

const teclasPresionadas = new Set();
const velocidadMovimiento = 12;
const vectorArriba = new THREE.Vector3(0, 1, 0);

const teclasValidas = new Set(['KeyW', 'KeyD', 'KeyS', 'KeyA', 'KeyQ', 'KeyE']);

window.addEventListener('keydown', (evento) => {

    if (animacionCamaraActiva) return;

    if (!modoExploracion) return;


    if (teclasValidas.has(evento.code)) {

        teclasPresionadas.add(evento.code);

        evento.preventDefault();


        // ====================================================
        // AL COMENZAR A EXPLORAR, OCULTAMOS LA INFORMACIÓN
        // ====================================================

        ocultarInformacionCarrera();

    }

});

window.addEventListener('keyup', (evento) => teclasPresionadas.delete(evento.code));

function moverConTeclado(deltaSegundos) {
    if (!modoExploracion) return;
    if (animacionCamaraActiva) return;
    if (teclasPresionadas.size === 0) return;

    const frente = new THREE.Vector3();
    const derecha = new THREE.Vector3();
    const desplazamiento = new THREE.Vector3();

    camara.getWorldDirection(frente);
    frente.y = 0;
    if (frente.lengthSq() > 0) frente.normalize();
    derecha.crossVectors(frente, vectorArriba).normalize();

    const velocidad = velocidadMovimiento * deltaSegundos;

    if (teclasPresionadas.has('KeyW')) desplazamiento.addScaledVector(frente, velocidad);
    if (teclasPresionadas.has('KeyS')) desplazamiento.addScaledVector(frente, -velocidad);
    if (teclasPresionadas.has('KeyD')) desplazamiento.addScaledVector(derecha, velocidad);
    if (teclasPresionadas.has('KeyA')) desplazamiento.addScaledVector(derecha, -velocidad);
    if (teclasPresionadas.has('KeyQ')) desplazamiento.y += velocidad;
    if (teclasPresionadas.has('KeyE')) desplazamiento.y -= velocidad;

    if (desplazamiento.lengthSq() > 0) {
        camara.position.add(desplazamiento);
        controles.target.add(desplazamiento);
    }
}

// ============================================================
// 14. BUCLE DE ANIMACIÓN
// ============================================================

const reloj = new THREE.Clock();

function animar() {
    requestAnimationFrame(animar);

    const deltaSegundos = reloj.getDelta();

    if (mezcladorPersonaje) mezcladorPersonaje.update(deltaSegundos);

    // --- giro automático del modelo (solo index.html) ---
    if (modeloCargado && !modoExploracion && !animacionCamaraActiva) {
        modeloCargado.rotation.y += velocidadGiroAutomatico * deltaSegundos;
    }

    moverConTeclado(deltaSegundos);

    controles.update();

    renderizador.render(escena, camara);
}

animar();