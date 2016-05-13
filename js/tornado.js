
/*
	Three.js "Tornado"
	Author: Rodolfo Aramayo
	Date: May 2016
 */

// MAIN

// standard global variables
var container, scene, camera, renderer, effect, controls, stats;
var keyboard = new THREEx.KeyboardState();
var clock = new THREE.Clock();

// custom global variables
var lastFrameTime = new Date().getTime() / 1000;
var totalGameTime = 0;
var dt;
var currTime;


var particles = [];
var mesh;
//global physics properties
var B = new THREE.Vector3(0,.01,0); //magnetic field
var G = new THREE.Vector3(0.0,-.001,0.0);
var Gravity = new THREE.Vector3(0.0, 0.1,0.0);

//particle properties
var S = new THREE.Vector3(100,0,100);	//position
var V = new THREE.Vector3(0.0,0.1,0.1); //velocity
var M = 1;								//mass
var mesh_falling = false;
var mesh_raising = true;



var geometry;
var material;

var stereo = false;
var deviceOrientation = false;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;


var stereoFieldParam = getUrlVars()["stereo"];
if ( typeof stereoFieldParam !== 'undefined' && stereoFieldParam != 'undefined' )
{
	stereo = true;		
}
var deviceOrientationFieldParam = getUrlVars()["deviceOrientation"];
if ( typeof deviceOrientationFieldParam !== 'undefined' && deviceOrientationFieldParam != 'undefined' )
{
	deviceOrientation = true;
}

function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return vars;
}

init();
animate();

// FUNCTIONS 		
function init() 
{
	// SCENE
	scene = new THREE.Scene();
	// CAMERA
	var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
	var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 20000;
	camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
	camera.zoom = 1;
	scene.add(camera);
	camera.position.set(0,150,400);
	camera.lookAt(scene.position);	
	// RENDERER
	if ( Detector.webgl )
		renderer = new THREE.WebGLRenderer( {antialias:true} );
	else
		renderer = new THREE.CanvasRenderer(); 
	
	renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
	
	container = document.getElementById( 'ThreeJS' );
	container.appendChild( renderer.domElement );
	// EVENTS
	THREEx.WindowResize(renderer, camera);
	THREEx.FullScreen.bindKey({ charCode : 'm'.charCodeAt(0) });
	// CONTROLS

	if (deviceOrientation)
	{
		controls = new THREE.DeviceOrientationControls( camera );		
	}
	else
	{
		controls = new THREE.OrbitControls( camera, renderer.domElement );	
	}

	
	// STATS
	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.bottom = '0px';
	stats.domElement.style.zIndex = 100;
	container.appendChild( stats.domElement );
	// LIGHT
	var light = new THREE.PointLight(0xffffff);
	light.position.set(100,250,100);
	scene.add(light);
	
	// SKYBOX
	var skyBoxGeometry = new THREE.CubeGeometry( 10000, 10000, 10000 );
	var skyBoxMaterial = new THREE.MeshBasicMaterial( { color: 0x9999ff, side: THREE.BackSide } );
	var skyBox = new THREE.Mesh( skyBoxGeometry, skyBoxMaterial );
	scene.add(skyBox);
	
	////////////
	// CUSTOM //
	////////////
	
	//-----
	//create particles
	geometry = new THREE.SphereGeometry( 1, 32, 16 );
	material = new THREE.MeshLambertMaterial( { color: 0x000088 } );
	
	for (var i = 0; i < 1000; i++)
	{
		mesh = new THREE.Mesh( geometry, material );
		mesh.position.set(50 + Math.floor((Math.random() * 100) + 1), 0,  50 + Math.floor((Math.random() * 100) + 1));
		scene.add(mesh);
		mesh.S = new THREE.Vector3(mesh.position.x,mesh.position.y,mesh.position.z);	//position
		mesh.V = new THREE.Vector3(0.0,0.1,0.1);//Math.floor((Math.random() * 1))-0.5,Math.floor((Math.random() * 1))-0.5); //velocity
		mesh.M = 1;								//mass
		mesh.mesh_falling = true;
		mesh.mesh_raising = false;
		mesh.topCutOff = 750 + Math.floor((Math.random() * 250) + 1)
		particles.push(mesh);
	}
	//-----


	var axes = new THREE.AxisHelper(50);
	axes.position = mesh.position;
	scene.add(axes);
	
	var gridXZ = new THREE.GridHelper(100, 10);
	gridXZ.setColors( new THREE.Color(0x006600), new THREE.Color(0x006600) );
	gridXZ.position.set( 100,0,100 );
	scene.add(gridXZ);
	
	var gridXY = new THREE.GridHelper(100, 10);
	gridXY.position.set( 100,100,0 );
	gridXY.rotation.x = Math.PI/2;
	gridXY.setColors( new THREE.Color(0x000066), new THREE.Color(0x000066) );
	scene.add(gridXY);

	var gridYZ = new THREE.GridHelper(100, 10);
	gridYZ.position.set( 0,100,100 );
	gridYZ.rotation.z = Math.PI/2;
	gridYZ.setColors( new THREE.Color(0x660000), new THREE.Color(0x660000) );
	scene.add(gridYZ);
	
	// direction (normalized), origin, length, color(hex)
	var origin = new THREE.Vector3(0+100,0,0+100);
	var terminus  = new THREE.Vector3(B.x+100, B.y+100, B.z+100);
	var direction = new THREE.Vector3().subVectors(terminus, origin).normalize();
	var arrow = new THREE.ArrowHelper(direction, origin, 100, 0x884400);
	scene.add(arrow);
	
	
	if (stereo)
	{
		effect = new THREE.StereoEffect( renderer, deviceOrientation );
		effect.eyeSeparation = 2;
		effect.setSize( window.innerWidth, window.innerHeight );
	}

	window.addEventListener( 'resize', onWindowResize, false );

}

function onWindowResize() {

	windowHalfX = window.innerWidth / 2;
	windowHalfY = window.innerHeight / 2;

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	if (deviceOrientation)
	{

	}
	else
	{
		// *** OTHER CONTROLS WILL NEED THIS!!! ***
		//controls.handleResize(); OrbitControls do not have this function 
	}

	if (stereo)
	{
		effect.setSize( window.innerWidth, window.innerHeight );
		renderer.setSize( window.innerWidth, window.innerHeight );
	}
	else
	{
		renderer.setSize( window.innerWidth, window.innerHeight );
	}
}

function animate() 
{
    requestAnimationFrame( animate );
	render();		
	update();
}


function update()
{

	currTime = new Date().getTime() / 1000;
    dt = currTime - (lastFrameTime || currTime);
    //console.log(dt);
    totalGameTime += dt;
	lastFrameTime = currTime;
	

	for (particle of particles)
	{
		var F = new THREE.Vector3(0,0,0);
		var A = new THREE.Vector3(0,0,0);
		var Vnew = new THREE.Vector3(0,0,0); //Velocity at t+dt
		var Snew = new THREE.Vector3(0,0,0); //Position at t+dt
		
		if (particle.S.x-100 < 10 && particle.S.z-100 < 10 && particle.mesh_falling == true)
		{
			A.x = 0;
			A.y = 0;
			A.z = 0;
			particle.mesh_falling = false;
			if (particle.mesh_raising == false)
			{
				particle.V.x = 0.1 + Math.floor((Math.random() * 10) + 1) * 0.1;
				particle.V.y = 0.0;
				particle.V.z = 0.1 + Math.floor((Math.random() * 10) + 1) * 0.1;
				particle.mesh_raising = true;
			}
		}

	   	if (particle.S.y > particle.topCutOff && particle.mesh_falling == false)
	   		particle.mesh_falling = true;
	   	

		if (!particle.mesh_falling)
		{
			F.crossVectors( particle.V , B); 			// F = (VxB)
			F.addVectors(F, G);
		}	
		else
		{

			if (particle.position.y > 0)
			{
				F.addVectors(F, Gravity)
			}
			else
			{
				particle.V = new THREE.Vector3(80-particle.position.x+Math.floor((Math.random() * 40) + 1), 0, 80-particle.position.z+Math.floor((Math.random() * 40) + 1));
				particle.V.normalize();
			}
		}
		
		F.multiplyScalar(-1); //negative charge
		//F.multiplyScalar(M); //just 1
		A.copy(F) 	// A = F/M
		
		A.multiplyScalar(dt*500)

		Vnew.addVectors(particle.V, A);
		//Vnew.multiplyScalar(dt*80)
		particle.S.add(Vnew);
		
		Snew.copy(particle.S);
		particle.V.copy(Vnew);   	

	   	particle.position.x = Snew.x;
	   	particle.position.y = Snew.y;
	   	particle.position.z = Snew.z;
		
	}
	
	//mesh = new THREE.Mesh( geometry, material );
	//mesh.position.set(Snew.x,Snew.y,Snew.z);
	//scene.add(mesh);

	
	if ( keyboard.pressed("z") ) 
	{	// do something   
		V = new THREE.Vector3(0,0.1,0.1);
		S.x = 100;
		S.y = 0;
		S.z = 100;
		Snew.x = 100;
		Snew.y = 100;
		Snew.z = 100;
		A.x = 0;
		A.y = 0;
		A.z = 0;
		lastFrameTime = new Date().getTime() / 1000;
	}
	
	//console.log('(' + Snew.x + "," + Snew.y + "," + Snew.z );

	controls.update();
	stats.update();
}

function render() 
{
	if (stereo)
	{
		effect.render( scene, camera );
	}
	else
	{
		renderer.render( scene, camera );
	}
}

