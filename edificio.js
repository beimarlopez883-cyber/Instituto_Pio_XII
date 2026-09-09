// ============================================================
// THREE.JS
// ============================================================

import * as THREE from 'three';

import { GLTFLoader }
    from 'three/addons/loaders/GLTFLoader.js';

import { FBXLoader }
    from 'three/addons/loaders/FBXLoader.js';

import { OrbitControls }
    from 'three/addons/controls/OrbitControls.js';


// ============================================================
// CONTENEDOR DEL VISOR
// ============================================================

const contenedor = document.getElementById("visor3D");
const modoExploracion = document.body.dataset.modo === "exploracion";


// ============================================================
// ESCENA
// ============================================================

const escena = new THREE.Scene();

// Fondo transparente para mostrar el PNG del CSS detrás
escena.background = null;


// ============================================================
// CÁMARA
// ============================================================

const camara = new THREE.PerspectiveCamera(

    40,                                      // Campo de visión
    window.innerWidth / window.innerHeight,  // Relación
    0.1,                                     // Cerca
    5000                                     // Lejos

);


// ============================================================
// VISTA INICIAL DE LA CÁMARA
// ============================================================
//
// X = izquierda / derecha
// Y = altura
// Z = adelante / atrás
//
// Estos valores controlan la vista que tendrás
// cuando abras la página.
//

camara.position.set(

    0,      // X
    0,     // Y
    0       // Z

);


// ============================================================
// RENDERIZADOR
// ============================================================

const renderizador = new THREE.WebGLRenderer({

    antialias: true,

    alpha: true

}); 


// ------------------------------------------------------------
// CALIDAD DE IMAGEN
// ------------------------------------------------------------

renderizador.setPixelRatio(

    Math.min(

        window.devicePixelRatio,

        2

    )

);


// Tamaño completo de la pantalla

renderizador.setSize(

    window.innerWidth,

    window.innerHeight

);


// ============================================================
// COLORES Y MATERIALES
// ============================================================
//
// Esta parte es MUY importante para que los colores
// provenientes de Blender se vean correctamente.
//

renderizador.outputEncoding = THREE.sRGBEncoding;


// ============================================================
// TONE MAPPING
// ============================================================
//
// Evita que las luces quemen demasiado los colores.
//

renderizador.toneMapping =
    THREE.ACESFilmicToneMapping;


// Exposición de la escena

renderizador.toneMappingExposure = 1.0;


// ============================================================
// SOMBRAS
// ============================================================

renderizador.shadowMap.enabled = true;

renderizador.shadowMap.type =
    THREE.PCFSoftShadowMap;


// ============================================================
// AGREGAR CANVAS AL HTML
// ============================================================

contenedor.appendChild(

    renderizador.domElement

);


// ============================================================
// CONTROLES ORBIT
// ============================================================

const controles = new OrbitControls(

    camara,

    renderizador.domElement

);


// ============================================================
// ROTACIÓN
// ============================================================

// En la vista del campus el mouse controla la cámara.
controles.enableRotate = false;

// Movimiento suave
controles.enableDamping = true;

// Cantidad de suavizado
controles.dampingFactor = 0.08;


// ============================================================
// ZOOM
// ============================================================
//
// Aquí hacemos que el zoom sea menos sensible.
//

controles.enableZoom = false;


// ⭐ ESTA ES UNA DE LAS MODIFICACIONES IMPORTANTES

controles.zoomSpeed = 0.35;


// Distancia mínima

controles.minDistance = 8;


// Distancia máxima

controles.maxDistance = 300;


// ============================================================
// MOVIMIENTO LATERAL
// ============================================================

controles.enablePan = false;


// Velocidad del movimiento lateral

controles.panSpeed = 0.5;


// ============================================================
// ROTACIÓN
// ============================================================

controles.rotateSpeed = 0.5;


// ============================================================
// LÍMITES VERTICALES
// ============================================================
//
// Evita que la cámara se meta debajo del edificio.
//

controles.minPolarAngle = 0.15;

controles.maxPolarAngle = Math.PI * 0.48;


// ============================================================
// LUZ AMBIENTAL
// ============================================================
//
// Antes teníamos:
//
// AmbientLight = 2.0
//
// Era demasiado fuerte.
//
// Ahora usamos una iluminación más moderada.
//

const luzAmbiental =

    new THREE.AmbientLight(

        0xffffff,

        0.7

    );


escena.add(

    luzAmbiental

);


// ============================================================
// LUZ PRINCIPAL
// ============================================================

const luzPrincipal =

    new THREE.DirectionalLight(

        0xffffff,

        1.4

    );


// Posición de la luz

luzPrincipal.position.set(

    50,
    80,
    50

);


// Activar sombras

luzPrincipal.castShadow = true;


// ============================================================
// CONFIGURACIÓN DE SOMBRAS
// ============================================================

luzPrincipal.shadow.mapSize.width = 2048;

luzPrincipal.shadow.mapSize.height = 2048;


// Área de sombra

luzPrincipal.shadow.camera.near = 0.5;

luzPrincipal.shadow.camera.far = 500;


// ============================================================
// AGREGAR LUZ PRINCIPAL
// ============================================================

escena.add(

    luzPrincipal

);


// ============================================================
// LUZ DE RELLENO
// ============================================================
//
// Una luz azul muy suave para evitar zonas
// completamente negras.
//

const luzRelleno =

    new THREE.DirectionalLight(

        0x9ec9ff,

        0.35

    );


luzRelleno.position.set(

    -40,
    40,
    -50

);


escena.add(

    luzRelleno

);


// ============================================================
// LUZ SUPERIOR SUAVE
// ============================================================

const luzSuperior =

    new THREE.HemisphereLight(

        0xffffff,   // Color del cielo

        0x223344,   // Color del suelo

        0.35

    );


escena.add(

    luzSuperior

);


// ============================================================
// CARGADOR GLB
// ============================================================

const cargador = new GLTFLoader();
const cargadorFBX = new FBXLoader();

// Indicador de carga en pantalla (opcional, ver index.html)
const indicadorCarga = document.getElementById("cargaModelo");

// Variable global para el modelo
let modeloCargado = null;
let personajeCargado = null;
let mezcladorPersonaje = null;
let accionCaminar = null;
let nivelBaseModelo = null;
const reloj = new THREE.Clock();

function alinearBasePersonaje() {
    if (!personajeCargado || nivelBaseModelo === null) {
        return;
    }

    const cajaPersonaje = new THREE.Box3().setFromObject(personajeCargado);
    personajeCargado.position.y += nivelBaseModelo + 2 - cajaPersonaje.min.y;
}


// ============================================================
// CARGAR PERSONAJE ANIMADO EN LA PORTADA
// ============================================================

if (!modoExploracion) {
    cargadorFBX.load(
        "./modelos/camninando.fbx",
        function(personaje) {
            personajeCargado = personaje;
            mezcladorPersonaje = new THREE.AnimationMixer(personaje);

            if (personaje.animations.length > 0) {
                accionCaminar = mezcladorPersonaje.clipAction(personaje.animations[0]);
                accionCaminar.loop = THREE.LoopOnce;
                accionCaminar.clampWhenFinished = true;
                accionCaminar.reset().play();
            }

            personaje.traverse(function(objeto) {
                if (objeto.isMesh) {
                    objeto.castShadow = true;
                    objeto.receiveShadow = true;
                }
            });

            const cajaPersonaje = new THREE.Box3().setFromObject(personaje);
            const tamañoPersonaje = cajaPersonaje.getSize(new THREE.Vector3());
            const alturaDeseada = 6;
            const escala = alturaDeseada / tamañoPersonaje.y;

            personaje.scale.setScalar(escala);
            personaje.position.set(25, 0, 34);
            personaje.rotation.y = Math.PI;

            escena.add(personaje);
            alinearBasePersonaje();
            console.log("Personaje FBX cargado con animación:", personaje.animations[0]?.name || "sin nombre");
        },
        undefined,
        function(error) {
            console.error("No se pudo cargar ./modelos/camninando.fbx:", error);
        }
    );
}


// ============================================================
// CARGAR MODELO
// ============================================================

cargador.load(

    "./modelos/pio12todo.glb",  // Ruta del modelo


    // ========================================================
    // MODELO CARGADO
    // ========================================================

    function(gltf) {

        console.log(
            "===================================="
        );

        console.log(
            "MODELO 3D CARGADO CORRECTAMENTE"
        );

        console.log(
            "===================================="
        );
        const modelo = gltf.scene;
        
        // Guardar referencia global
        modeloCargado = modelo;


        // ====================================================
        // PROPIEDADES DE LOS MATERIALES
        // ====================================================

        modelo.traverse(

            function(objeto) {

                if (objeto.isMesh) {


                    // ----------------------------------------
                    // SOMBRAS
                    // ----------------------------------------

                    objeto.castShadow = true;

                    objeto.receiveShadow = true;


                    // ----------------------------------------
                    // MATERIALES
                    // ----------------------------------------

                    if (objeto.material) {


                        // Activar actualización
                        // de material

                        objeto.material.needsUpdate = true;


                        // ------------------------------------
                        // TEXTURAS
                        // ------------------------------------

                        if (
                            objeto.material.map
                        ) {

                            objeto.material.map.encoding =
                                THREE.sRGBEncoding;

                        }

                    }

                }

            }

        );


        // ====================================================
        // CENTRAR MODELO
        // ====================================================

        const caja =

            new THREE.Box3()

                .setFromObject(

                    modelo

                );


        const centro =

            caja.getCenter(

                new THREE.Vector3()

            );


        // ====================================================
        // MOVER MODELO AL CENTRO
        // ====================================================

        modelo.position.x -=
            centro.x;


        modelo.position.y -=
            centro.y;


        modelo.position.z -=
            centro.z;

        // En la portada queda a la derecha; en el campus queda centrado.
        modelo.position.x += modoExploracion ? 0 : 60;
        modelo.rotation.set(0, Math.PI / 2, 0);

        nivelBaseModelo = new THREE.Box3()
            .setFromObject(modelo)
            .min.y;


        // ====================================================
        // OBTENER TAMAÑO
        // ====================================================

        const tamaño =

            caja.getSize(

                new THREE.Vector3()

            );


        const tamañoMaximo =

            Math.max(

                tamaño.x,

                tamaño.y,

                tamaño.z

            );


        console.log(
            "Tamaño del modelo:",
            tamañoMaximo
        );


        // ====================================================
        // AGREGAR MODELO
        // ====================================================

        escena.add(

            modelo

        );

        alinearBasePersonaje();


        // ====================================================
        // VISTA INICIAL
        // ====================================================
        //
        // IMPORTANTE:
        //
        // NO usamos aquí el tamaño del modelo
        // para modificar la cámara.
        //
        // De esta manera mantenemos nuestra vista
        // inicial controlada manualmente.
        //

        camara.position.set(

        0,
        modoExploracion ? 0 : 5,
        modoExploracion ? 45 : 52


        );


        // ====================================================
        // PUNTO AL QUE MIRA LA CÁMARA
        // ====================================================

        controles.target.set(
    modoExploracion ? 0 : 20,
    modoExploracion ? 0 : 5,
    modoExploracion ? 0 : 15
);


        // Actualizar controles

        controles.update();


       // ====================================================
        // LÍMITES DE ZOOM
        // ====================================================
        //
        // Se calculan según el tamaño del modelo.
        //
        // Esto evita acercarnos demasiado.
        //

        controles.minDistance =

            Math.max(

                tamañoMaximo * 0.25,

                8

            );


        controles.maxDistance =

            Math.max(

                tamañoMaximo * 5,

                150

            );


        console.log(
            "Vista inicial configurada."
        );

        if (indicadorCarga) {
            indicadorCarga.classList.add("oculto");
        }


    },


    // ========================================================
    // PROGRESO
    // ========================================================

    function(progreso) {


        if (
            progreso.total > 0
        ) {


            const porcentaje =

                (
                    progreso.loaded /
                    progreso.total
                ) * 100;


            console.log(

                "Cargando: " +

                porcentaje.toFixed(0) +

                "%"

            );

            if (indicadorCarga) {
                indicadorCarga.textContent =
                    "Cargando modelo 3D... " +
                    porcentaje.toFixed(0) + "%";
            }

        }

    },


    // ========================================================
    // ERROR
    // ========================================================

    function(error) {


        console.error(

            "===================================="

        );


        console.error(

            "ERROR AL CARGAR EL MODELO 3D"

        );


        console.error("Ruta del modelo:", "./modelos/pio12todo.glb");
        console.error(
            "El archivo existe, pero el navegador no pudo descargarlo o procesarlo:",
            error
        );


        console.error(

            "===================================="

        );

        if (indicadorCarga) {
            indicadorCarga.textContent =
                "El modelo es muy pesado para el navegador. Optimiza pio12todo.glb y vuelve a cargar.";
        }

    }

);


// ============================================================
// REDIMENSIONAMIENTO
// ============================================================

window.addEventListener(

    "resize",

    function() {


        // Actualizar relación de aspecto

        camara.aspect =

            window.innerWidth /
            window.innerHeight;


        camara.updateProjectionMatrix();


        // Actualizar tamaño

        renderizador.setSize(

            window.innerWidth,

            window.innerHeight

        );


    }

);


// ============================================================
// SCROLL PARA ROTAR
// ============================================================

let rotacionScroll = 0;

if (!modoExploracion) {
    window.addEventListener("wheel", (evento) => {
        rotacionScroll += evento.deltaY * 0.005;
    });
}


// ============================================================
// MOVIMIENTO CON TECLADO
// ============================================================

const teclasPresionadas = new Set();
const velocidadMovimiento = 12;
const velocidadRotacion = 1.5;
const vectorArriba = new THREE.Vector3(0, 1, 0);

window.addEventListener("keydown", (evento) => {

    if (evento.code === "Space" && !modoExploracion && accionCaminar) {
        accionCaminar.reset().play();
        evento.preventDefault();
        return;
    }

    if ([
        "KeyW",
        "KeyA",
        "KeyS",
        "KeyD",
        "KeyQ",
        "KeyE",
        ...(modoExploracion ? ["KeyZ", "KeyX"] : [])
    ].includes(evento.code)) {

        teclasPresionadas.add(evento.code);
        evento.preventDefault();

    }

});

window.addEventListener("keyup", (evento) => {

    teclasPresionadas.delete(evento.code);

});

function moverConTeclado(deltaSegundos) {

    if (teclasPresionadas.size === 0) {
        if (modoExploracion && accionCaminar) {
            accionCaminar.stop();
        }
        return;
    }

    if (modoExploracion && personajeCargado) {
        const direccion = new THREE.Vector3();

        if (teclasPresionadas.has("KeyW")) {
            direccion.z -= 1;
        }

        if (teclasPresionadas.has("KeyS")) {
            direccion.z += 1;
        }

        if (teclasPresionadas.has("KeyD")) {
            direccion.x += 1;
        }

        if (teclasPresionadas.has("KeyA")) {
            direccion.x -= 1;
        }

        if (direccion.lengthSq() > 0) {
            direccion.normalize();
            personajeCargado.position.addScaledVector(
                direccion,
                velocidadMovimiento * deltaSegundos
            );
            personajeCargado.rotation.y = Math.atan2(
                direccion.x,
                -direccion.z
            );
        }

        if (accionCaminar) {
            if (teclasPresionadas.has("KeyW")) {
                accionCaminar.play();
            } else {
                accionCaminar.stop();
            }
        }

        return;
    }

    const frente = new THREE.Vector3();
    const derecha = new THREE.Vector3();
    const desplazamiento = new THREE.Vector3();

    camara.getWorldDirection(frente);
    frente.y = 0;

    if (frente.lengthSq() > 0) {
        frente.normalize();
    }

    derecha.crossVectors(frente, vectorArriba).normalize();

    const velocidad = velocidadMovimiento * deltaSegundos;

    if (modoExploracion && modeloCargado) {
        if (teclasPresionadas.has("KeyZ")) {
            modeloCargado.rotation.y += velocidadRotacion * deltaSegundos;
        }

        if (teclasPresionadas.has("KeyX")) {
            modeloCargado.rotation.y -= velocidadRotacion * deltaSegundos;
        }
    }

    if (teclasPresionadas.has("KeyW")) {
        desplazamiento.addScaledVector(frente, velocidad);
    }

    if (teclasPresionadas.has("KeyS")) {
        desplazamiento.addScaledVector(frente, -velocidad);
    }

    if (teclasPresionadas.has("KeyD")) {
        desplazamiento.addScaledVector(derecha, velocidad);
    }

    if (teclasPresionadas.has("KeyA")) {
        desplazamiento.addScaledVector(derecha, -velocidad);
    }

    if (teclasPresionadas.has("KeyQ")) {
        desplazamiento.y += velocidad;
    }

    if (teclasPresionadas.has("KeyE")) {
        desplazamiento.y -= velocidad;
    }

    if (desplazamiento.lengthSq() > 0) {
        camara.position.add(desplazamiento);
        controles.target.add(desplazamiento);
    }

}


// ============================================================
// ANIMACIÓN
// ============================================================

function animar() {


    requestAnimationFrame(

        animar

    );

    const deltaSegundos = reloj.getDelta();

    if (mezcladorPersonaje) {
        mezcladorPersonaje.update(deltaSegundos);
    }

    moverConTeclado(deltaSegundos);

    // Suavizar controles

    controles.update();

    // Aplicar rotación por scroll al modelo
    if (modeloCargado && !modoExploracion) {
        modeloCargado.rotation.y = rotacionScroll;
    }

    // Dibujar escena

    renderizador.render(

        escena,

        camara

    );

}


// ============================================================
// INICIAR ANIMACIÓN
// ============================================================

animar();
function init_controls() {
            controls = new THREE.OrbitControls(camera, renderer.domElement);

            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
            controls.enableZoom = true;
            controls.enablePan = false;

            controls.minPolarAngle = Math.PI / 4;
            controls.maxPolarAngle = Math.PI / 2.1;

            controls.minDistance = 3;
            controls.maxDistance = 10;

            controls.autoRotate = true;
            controls.autoRotateSpeed = 1.2;
        }