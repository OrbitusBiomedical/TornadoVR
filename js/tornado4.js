
/*
	Three.js "TornadoVR"
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
var Gravity = new THREE.Vector3(0.0, 0.01,0.0);

//particle properties
var S = new THREE.Vector3(100,0,100);	//position
var V = new THREE.Vector3(0.0,0.1,0.1); //velocity
var M = 1;								//mass
var mesh_falling = false;
var mesh_raising = true;
var mesh_height = 5;

var texture;
var geometry;
var material;

var stereo = false;
var deviceOrientation = false;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

var shaderSelection = 0;
var uniforms1, uniforms2;


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
$('body').scrollTop(1);

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
	if (deviceOrientation)
	{
		camera.position.set(100,20,400);
	}
	else
	{
		camera.position.set(400,200,400);
	}
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


	particleOptions = {
		particleCount: 1000,
		deltaTime:500,
		betaX:0.0,
		betaY:0.01,
		betaZ:0.0,
		GX:0.0,
		GY:0.001,
		GZ:0.0,
		gravity:0.01,
		betaLiftChaos:10,
		height:750,
		heightChaos:250,
		tornadoFactor:25
	};



	uniforms1 = {
		time: { type: "f", value: 1.0 },
		resolution: { type: "v2", value: new THREE.Vector2() }
	};
	uniforms2 = {
		time: { type: "f", value: 1.0 },
		resolution: { type: "v2", value: new THREE.Vector2() },
		texture: { type: "t", value: new THREE.TextureLoader().load( "img/disturb.jpg" ) }
	};
	uniforms2.texture.value.wrapS = uniforms2.texture.value.wrapT = THREE.RepeatWrapping;
	

	rebuildParticles();

	
	var gui = new dat.GUI();

	// material (attributes)

	h = gui.addFolder( "Particle Options" );

	h.add( particleOptions, "particleCount", 1, 10000, 1 ).name( "#particles" ).onChange( rebuildParticles );
	h.add( particleOptions, "deltaTime", 100, 1000, 1 ).name( "dt" ).onChange( rebuildParticles );
	h.add( particleOptions, "gravity", 0, 0.1, 0.01 ).name( "Gravity" ).onChange( rebuildParticles );
	h.add( particleOptions, "height", 0, 5000, 1 ).name( "height" ).onChange( rebuildParticles );
	h.add( particleOptions, "heightChaos", 0, 2500, 1 ).name( "heightChaos" ).onChange( rebuildParticles );

	h = gui.addFolder( "Magnetic Field Options" );
	h.add( particleOptions, "betaX", 0, 0.1, 0.01 ).name( "betaX" ).onChange( rebuildParticles );
	h.add( particleOptions, "betaY", 0, 0.1, 0.01 ).name( "betaY" ).onChange( rebuildParticles );
	h.add( particleOptions, "betaZ", 0, 0.1, 0.01 ).name( "betaZ" ).onChange( rebuildParticles );

	h.add( particleOptions, "GX", 0, 0.1, 0.001 ).name( "beta Lift X" ).onChange( rebuildParticles );
	h.add( particleOptions, "GY", 0, 0.1, 0.001 ).name( "beta Lift Y" ).onChange( rebuildParticles );
	h.add( particleOptions, "GZ", 0, 0.1, 0.001 ).name( "beta Lift Z" ).onChange( rebuildParticles );

	h.add( particleOptions, "tornadoFactor", 0, 100, 25 ).name( "Tornado Factor" ).onChange( rebuildParticles );

	h.add( particleOptions, "betaLiftChaos", 1, 50, 1 ).name( "beta Lift Chaos" ).onChange( rebuildParticles );

	h = gui.addFolder( "Shader Options" );

	var shaderSelectionController = {
										shader1:function(){ shaderSelection = 0; rebuildParticles();},
										shader2:function(){ shaderSelection = 1; rebuildParticles();},
										shader3:function(){ shaderSelection = 2; rebuildParticles();},
										shader4:function(){ shaderSelection = 3; rebuildParticles();}																														
									};

	h.add(shaderSelectionController,'shader1').name("Shader 1");
	h.add(shaderSelectionController,'shader2').name("Shader 2");
	h.add(shaderSelectionController,'shader3').name("Shader 3");
	h.add(shaderSelectionController,'shader4').name("Shader 4");	


	window.addEventListener( 'resize', onWindowResize, false );


}


function rebuildParticles() {
	console.log('rebuildParticles' + scene.children);
	
	B.x = particleOptions.betaX;
	B.y = particleOptions.betaY;
	B.z = particleOptions.betaZ;

	G.x = -particleOptions.GX;
	G.y = -particleOptions.GY;
	G.z = -particleOptions.GZ;

	//-----
	//create particles

	//Crate
	//THREE.TextureLoader.crossOrigin = '';
	//THREE.ImageUtils.crossOrigin = '';
	texture = new THREE.TextureLoader().load( 'img/crate.gif' );
	geometry = new THREE.BoxGeometry( 10, 10, 10 );

	/*
	//------
	//We can't uyse the cross origin image file on the file:/// during development... 
	if (document.location.href.indexOf("file:///") > -1)
	{
		material = new THREE.MeshLambertMaterial( { color:0xffff00 } );
	}	
	else
	{
		material = new THREE.MeshLambertMaterial( { map:texture, color:0xffff00 } );
	}
	//------
	*/
	var params = [
		[ 'fragment_shader1', uniforms1 ],
		[ 'fragment_shader2', uniforms2 ],
		[ 'fragment_shader3', uniforms1 ],
		[ 'fragment_shader4', uniforms1 ]
	];

	var material = new THREE.ShaderMaterial( {
						uniforms: params[ shaderSelection ][ 1 ],
						vertexShader: document.getElementById( 'vertexShader' ).textContent,
						fragmentShader: document.getElementById( params[ shaderSelection ][ 0 ] ).textContent
						} );

	
	//Sphere
	//geometry = new THREE.SphereGeometry( 1, 32, 16 );
	//material = new THREE.MeshLambertMaterial( { color: 0x000088 } );

	//remove all particles meshes from the scene
	
	var children = scene.children;
    for(var i = children.length-1;i>=0;i--){
        var child = children[i];
        if (child.isParticle)
        {
        	scene.remove(child);	
        }
        
    };   

	particles = [];

	for (var i = 0; i < particleOptions.particleCount; i++)
	{

		mesh = new THREE.Mesh( geometry, material );//THREEx.Crates.createCrate1();   //
		mesh.position.set(-500 + Math.floor((Math.random() * 1000) + 1), 5,  -500 + Math.floor((Math.random() * 1000) + 1));
		scene.add(mesh);
		mesh.S = new THREE.Vector3(mesh.position.x,mesh.position.y,mesh.position.z);	//position
		mesh.V = new THREE.Vector3(0.0,0.1,0.1);//Math.floor((Math.random() * 1))-0.5,Math.floor((Math.random() * 1))-0.5); //velocity
		mesh.M = 1;								//mass
		mesh.mesh_falling = true;
		mesh.mesh_raising = false;
		mesh.isParticle = true;
		mesh.topCutOff = particleOptions.height + Math.floor((Math.random() * particleOptions.heightChaos) + 1)
		//G is the raising velocity and makes a great tornado when its randomness is varied
		//tempG just holds individual values for each particle
		mesh.tempG = new THREE.Vector3(G.x,G.y - Math.floor((Math.random()*particleOptions.betaLiftChaos) - particleOptions.betaLiftChaos/2.0) * .0001, G.z);// -.001
		particles.push(mesh);
	}

	//-----

	
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

		if (Math.abs(particle.S.x-100) < 10 && Math.abs(particle.S.y-5) < 10 && Math.abs(particle.S.z-100) < 10 && particle.mesh_falling == true)
		{
			A.x = 0;
			A.y = 0;
			A.z = 0;
			particle.mesh_falling = false;
			particle.mesh_raising = true;
			//Controlling the Vx when raising gives us a cool variable magnetic function 
			//50 = tornado level 5 
			//10 = tornado level 1

			particle.V.x = 0.01 + Math.floor((Math.random() * particleOptions.tornadoFactor) + 1) * 0.1;
			particle.V.y = 0.0;
			particle.V.z = 0.01 + Math.floor((Math.random() * particleOptions.tornadoFactor) + 1) * 0.1;
		
		}

	   	if (particle.S.y > particle.topCutOff && particle.mesh_falling == false)
	   	{
	   		particle.mesh_falling = true;
	   		particle.mesh_raising = false;
	   	}
	   	

		if (particle.mesh_raising)
		{
			F.crossVectors( particle.V , B); 			// F = (VxB)
			F.addVectors(F, particle.tempG);
		}	
		else
		{
			if (particle.position.y > mesh_height && particle.mesh_falling)
			{
				F.addVectors(F, Gravity)
			}
			else
			{
				particle.V = new THREE.Vector3(80-particle.position.x+Math.floor((Math.random() * 40) + 1), 0, 80-particle.position.z+Math.floor((Math.random() * 40) + 1));
				particle.V.normalize();
				particle.V.multiplyScalar(1);
				particle.S.y = mesh_height;
				particle.position.y = mesh_height;

				//----------
				//Use these two lines to make the tornado infinite without suction
				//particle.S.set(60 + Math.floor((Math.random() * 80) + 1), 5,  60 + Math.floor((Math.random() * 80) + 1));
				//particle.position.set(60 + Math.floor((Math.random() * 80) + 1), 5,  60 + Math.floor((Math.random() * 80) + 1));
				//----------

			}
		}

		F.multiplyScalar(-1); //negative charge
		//F.multiplyScalar(M); //just 1
		A.copy(F) 	// A = F/M
		
		A.multiplyScalar(dt*particleOptions.deltaTime)

		Vnew.addVectors(particle.V, A);
		//Vnew.multiplyScalar(dt*80)
		particle.S.add(Vnew);
		
		Snew.copy(particle.S);
		particle.V.copy(Vnew);   	

	   	particle.position.x = Snew.x;
	   	particle.position.y = Snew.y;
	   	particle.position.z = Snew.z;
		
	}
	
	//------
	// Enable these 3 lines to show a tracer of the last particle stored into mesh
	//mesh = new THREE.Mesh( geometry, material );
	//mesh.position.set(Snew.x,Snew.y,Snew.z);
	//scene.add(mesh);
	//------
	
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
	var delta = clock.getDelta();

	uniforms1.time.value += delta * 5;
	uniforms2.time.value = clock.elapsedTime;


	if (stereo)
	{
		effect.render( scene, camera );
	}
	else
	{
		renderer.render( scene, camera );
	}
}

