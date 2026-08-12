// ============================================================
// THREE.JS
// ============================================================

import * as THREE from 'three';

import { GLTFLoader }
    from 'three/addons/loaders/GLTFLoader.js';

import { OrbitControls }
    from 'three/addons/controls/OrbitControls.js';


// ============================================================
// CONTENEDOR DEL VISOR
// ============================================================

const contenedor = document.getElementById("visor3D");


// ============================================================
// ESCENA
// ============================================================

const escena = new THREE.Scene();

// Fondo azul oscuro
escena.background = new THREE.Color(0x061b35);


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

    alpha: false

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

// Activar rotación
controles.enableRotate = true;

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

controles.enableZoom = true;


// ⭐ ESTA ES UNA DE LAS MODIFICACIONES IMPORTANTES

controles.zoomSpeed = 0.35;


// Distancia mínima

controles.minDistance = 8;


// Distancia máxima

controles.maxDistance = 300;


// ============================================================
// MOVIMIENTO LATERAL
// ============================================================

controles.enablePan = true;


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

// Indicador de carga en pantalla (opcional, ver index.html)
const indicadorCarga = document.getElementById("cargaModelo");


// ============================================================
// CARGAR MODELO
// ============================================================

cargador.load(

    "./modelos/Infraestructura_Pio_XII.glb",


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
        30,
        70


        );


        // ====================================================
        // PUNTO AL QUE MIRA LA CÁMARA
        // ====================================================

        controles.target.set(
    40,   // X: centro del edificio
    5,  // Y: altura media
    15  // Z: profundidad
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


        console.error(

            error

        );


        console.error(

            "===================================="

        );

        if (indicadorCarga) {
            indicadorCarga.textContent =
                "No se pudo cargar el modelo 3D. Revisa la ruta del archivo .glb.";
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
// ANIMACIÓN
// ============================================================

function animar() {


    requestAnimationFrame(

        animar

    );


    // Suavizar controles

    controles.update();


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