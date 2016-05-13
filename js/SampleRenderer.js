/*
The MIT License

Copyright © 2010-2015 three.js authors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

// THREE.JS variables
var scene, camera, renderer;

// sphere width segments, heightSegments
var sp_wseg = 8;
var sp_hseg = 8;

var MaxLandmarks = 78;


// face base radius 
var sp_fradius = 0.21;

// face points
var face_points_array;
// face detection plane
var detectionPlane;

// maxFaces (only detection & landmark in current sample renderer)
var maxFaces = 1; //initialized to 1

// Create Sphere Function used across face & hand
function createSphere(_radius, _wSegments, _hSegments, _specularColor, _color, _emmisive, _shininess) {
    var geometry = new THREE.SphereGeometry(_radius, _wSegments, _hSegments);
    var material = new THREE.MeshPhongMaterial({
        specular: _specularColor,
        color: _color,
        emissive: _emmisive,
        shininess: _shininess
    });
    var sphere = new THREE.Mesh(geometry, material);
    return sphere;
}


/** FACE RENDERER METHODS **/

// update face detection plane position & scale
function renderFaceDetection(x, y, w, h) {

    detectionPlane.position.x = x + w / 2
    detectionPlane.position.y = y + h / 2;

    detectionPlane.scale.x = w;
    detectionPlane.scale.y = h;

}

// initialize sample face renderer
function initFaceRenderer(w, h, _maxFaceNum) {

    // setup THREE.JS scene, camera & renderer
    //w += 250;

    face_points_array = new Array(_maxFaceNum);

    // create 2d array
    for (i = 0; i < _maxFaceNum; i++) {
        face_points_array[i] = new Array(MaxLandmarks);
    }

    // Scene & Camera
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, w / h, 1, 1500);
    camera.position.z = 20;
    camera.position.y = 10;
    camera.position.x = 17;
    camera.rotation.z = 135;

    // Renderer
    renderer = new THREE.WebGLRenderer({ alpha: true });

    // set window size
    renderer.setSize(w, h);
    renderer.setClearColor(0x000000, 0); // the default
    var container = document.getElementById('renderercontainer');
    container.appendChild(renderer.domElement);

    // Ambient lighting
    var ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    // Directional lighting
    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 1, 0);
    scene.add(directionalLight);

    // Directional light from bottom
    var directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.85);
    directionalLight2.position.set(0, -1, 0);
    scene.add(directionalLight2);

    // Grid
    var grid = new THREE.GridHelper(300, 60);
    grid.setColors('#FFFFFF', '#FFFFFF');
    grid.position.z = -700;
    grid.position.x = 35;
    grid.position.y = 180;
    grid.rotation.z = 135;
    scene.add(grid);

    maxFaces = _maxFaceNum;

    fillFaceScene(); // create spheres
    faceRendererUpdate(); // face renderer update

    return face_points_array;
}

// show/hide spheres for landmarks not active
function checkFacePointsVisible() {
    for (i = 0; i < maxFaces; i++) {
        for (j = 0; j < 78; j++) {
            if (face_points_array[i][j].position.x == 0 && face_points_array[i][j].position.y == 0) {
                face_points_array[i][j].visible = false;
            } else {
                face_points_array[i][j].visible = true;
            }
        }
    }

    if (detectionPlane.scale.x == 0 && detectionPlane.scale.y == 0)
        detectionPlane.visible = false;
    else
        detectionPlane.visible = true;
}

// reset landmarks position, detection plane dimensions
function clearFaceRendererData() {
    for (i = 0; i < maxFaces; i++) {
        for (j = 0; j < MaxLandmarks; j++) {
            face_points_array[i][j].position.x = 0;
            face_points_array[i][j].position.y = 0;
        }
    }

    detectionPlane.scale.x = 0;
    detectionPlane.scale.y = 0;
}

// update face renderer
function faceRendererUpdate() {
    requestAnimationFrame(faceRendererUpdate);
    checkFacePointsVisible();
    renderer.render(scene, camera);
}

// create plane for face detection
function createDetectionPlane() {
    var geometry = new THREE.PlaneGeometry(1, 1, 1);
    var material = new THREE.MeshBasicMaterial({ color: '#E3E3E3' });
    var plane = new THREE.Mesh(geometry, material);
    plane.rotation.z = 135;
    return plane;
}

// // create objects(spheres), planes for the face scene 
function fillFaceScene() {

    for (i = 0; i < maxFaces; i++) {
        for (j = 0; j < MaxLandmarks; j++) {
            if ((j >= 10 && j <= 17) || (j >= 18 && j <= 25)) {
                face_points_array[i][j] = createSphere(sp_fradius - 0.075, sp_wseg, sp_hseg, '#525252', '#000000', '#0f0e0e', 100);
            } else if (j == 76 || j == 77) {
                face_points_array[i][j] = createSphere(sp_fradius + 0.05, sp_wseg, sp_hseg, '#525252', '#000000', '#0f0e0e', 100);
            } else if (j >= 33 && j <= 52) {
                face_points_array[i][j] = createSphere(sp_fradius, sp_wseg, sp_hseg, '#414141', '#ff000e', '#0f0e0e', 100);
            } else if (j >= 53 && j <= 69) {
                face_points_array[i][j] = createSphere(sp_fradius, sp_wseg, sp_hseg, '#414141', '#f0e53d', '#0f0e0e', 100);
            } else {
                face_points_array[i][j] = createSphere(sp_fradius, sp_wseg, sp_hseg, '#525252', '#1b93ff', '#0f0e0e', 100);
            }
            scene.add(face_points_array[i][j]);
        }
    }

    detectionPlane = createDetectionPlane();

    scene.add(detectionPlane);

}

/** END OF FACE RENDERER METHODS **/
