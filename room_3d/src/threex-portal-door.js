var THREEx = THREEx || {}

THREEx.Portal360 = function(videoImageURL, doorWidth, doorHeight, radius){
	
	this.update1 = this.update1.bind(this);
	this.update2 = this.update2.bind(this);
	this.update3 = this.update3.bind(this);
	this.update4 = this.update4.bind(this);
	this.update5 = this.update5.bind(this);
	
	this.radius = radius;

	this.update = this.update1;

	var doorCenter = new THREE.Group
	this.doorCenter = doorCenter;
	doorCenter.position.y = doorHeight/2
	this.object3d = doorCenter

	//////////////////////////////////////////////////////////////////////////////
	//		build texture360
	//////////////////////////////////////////////////////////////////////////////
	var isVideo = videoImageURL.match(/.(mp4|webm|ogv)/i) ? true : false
	if( isVideo ){
		var video = document.createElement( 'video' )
		video.width = 640;
		video.height = 360;
		video.loop = true;
		video.muted = true;
		video.src = videoImageURL;
		video.crossOrigin = 'anonymous'
		video.setAttribute( 'webkit-playsinline', 'webkit-playsinline' );
		video.play();

		var texture360 = new THREE.VideoTexture( video );
		texture360.minFilter = THREE.LinearFilter;
		texture360.format = THREE.RGBFormat;	
		texture360.flipY = false;		
	}else{
		var texture360 = new THREE.TextureLoader().load(videoImageURL)
		texture360.minFilter = THREE.NearestFilter;
		texture360.format = THREE.RGBFormat;
		texture360.flipY = false;		
	}

	//////////////////////////////////////////////////////////////////////////////
	//		build mesh
	//////////////////////////////////////////////////////////////////////////////

	// create insideMesh which is visible IIF inside the portal
	var insideMesh = this._buildInsideMesh(texture360, doorWidth, doorHeight, radius)
	doorCenter.add(insideMesh)
	this.insideMesh = insideMesh

	// create outsideMesh which is visible IIF outside the portal
	var outsideMesh = this._buildOutsideMesh(texture360, doorWidth, doorHeight, radius)
	doorCenter.add(outsideMesh)
	this.outsideMesh = outsideMesh

	// create frameMesh for the frame of the portal
	var frameMesh = this._buildRectangularFrame(doorWidth/100, doorWidth, doorHeight)

	// // it adds glow Effect to portal.
	// var spriteMesh = this._buildSpriteMesh(doorWidth, doorHeight);

	doorCenter.add(frameMesh);
//	doorCenter.add(glowMesh);

}
//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////
THREEx.Portal360.buildTransparentMaterial = function(){
	// if there is a cached version, return it
	if( THREEx.Portal360.buildTransparentMaterial.material ){
		return THREEx.Portal360.buildTransparentMaterial.material
	}
	var material = new THREE.MeshBasicMaterial({
		colorWrite: false // only write to z-buf
	})

	THREEx.Portal360.buildTransparentMaterial.material = material
	
	return material		
}

//////////////////////////////////////////////////////////////////////////////
//		Build various cache
//////////////////////////////////////////////////////////////////////////////
THREEx.Portal360.buildSquareCache = function(){
	var container = new THREE.Group
	// add outter cube - invisibility cloak
	var geometry = new THREE.PlaneGeometry(50,50);
	var material = THREEx.Portal360.buildTransparentMaterial()

	var mesh = new THREE.Mesh( geometry, material);
	mesh.position.x =  geometry.parameters.width/2 + 0.5
	mesh.position.y = -geometry.parameters.height/2 + 0.5
	container.add(mesh)
	
	var mesh = new THREE.Mesh( geometry, material);
	mesh.position.x = -geometry.parameters.width/2 + 0.5
	mesh.position.y = -geometry.parameters.height/2 - 0.5
	container.add(mesh)
	
	var mesh = new THREE.Mesh( geometry, material);
	mesh.position.x = -geometry.parameters.width/2 - 0.5
	mesh.position.y =  geometry.parameters.height/2 - 0.5
	container.add(mesh)
	
	var mesh = new THREE.Mesh( geometry, material);
	mesh.position.x = +geometry.parameters.width/2 - 0.5
	mesh.position.y =  geometry.parameters.height/2 + 0.5
	container.add(mesh)

	return container
}

//////////////////////////////////////////////////////////////////////////////
//		build meshes
//////////////////////////////////////////////////////////////////////////////

/**
 * create insideMesh which is visible IIF inside the portal
 */
THREEx.Portal360.prototype._buildInsideMesh	= function(texture360, doorWidth, doorHeight, radius){
	var doorInsideCenter = new THREE.Group

	var geometry = new THREE.PlaneGeometry(doorWidth, doorHeight)
	var material = THREEx.Portal360.buildTransparentMaterial()
	// var material = new THREE.MeshNormalMaterial()
	var mesh = new THREE.Mesh( geometry, material)
	mesh.rotation.y = Math.PI
	// mesh.position.z = 0.03
	doorInsideCenter.add( mesh )


	//////////////////////////////////////////////////////////////////////////////
	//		add 360 sphere
	//////////////////////////////////////////////////////////////////////////////
	// add 360 texture
	// TODO put that in a this.data
	var radius360Sphere = radius
	// var radius360Sphere = 1

	var geometry = new THREE.SphereGeometry( radius360Sphere, 16, 16).rotateZ(Math.PI)
	var material = new THREE.MeshBasicMaterial( {
		map: texture360,
		// opacity: 0.9,
		side: THREE.DoubleSide,
	});
	// var material = new THREE.MeshNormalMaterial()
	var sphere360Mesh = new THREE.Mesh( geometry, material );
	sphere360Mesh.position.z = -radius360Sphere*0.01
	sphere360Mesh.rotation.y = Math.PI
	doorInsideCenter.add(sphere360Mesh)
	
	return doorInsideCenter
}

/**
 * create outsideMesh which is visible IIF outside the portal
 */
THREEx.Portal360.prototype._buildOutsideMesh = function(texture360, doorWidth, doorHeight, radius){
	var doorOutsideCenter = new THREE.Group

	//////////////////////////////////////////////////////////////////////////////
	//		add squareCache
	//////////////////////////////////////////////////////////////////////////////
	var squareCache = THREEx.Portal360.buildSquareCache()
	squareCache.scale.y = doorWidth
	squareCache.scale.y = doorHeight
	doorOutsideCenter.add( squareCache )

	//////////////////////////////////////////////////////////////////////////////
	//		add 360 sphere
	//////////////////////////////////////////////////////////////////////////////
	// add 360 texture
	var radius360Sphere = radius;

	var geometry = new THREE.SphereGeometry( radius360Sphere, 16, 16, Math.PI, Math.PI, 0, Math.PI).rotateZ(Math.PI)
	// fix UVs
	geometry.faceVertexUvs[0].forEach(function(faceUvs){
		faceUvs.forEach(function(uv){
			uv.x /= 2
		})
	})
	geometry.uvsNeedUpdate = true
	var material = new THREE.MeshBasicMaterial( {
		map: texture360,
		// opacity: 0.9,
		side: THREE.BackSide,
	});
	var sphere360Mesh = new THREE.Mesh( geometry, material );
	sphere360Mesh.position.z = -radius360Sphere*0.01
	doorOutsideCenter.add(sphere360Mesh)
	
	return doorOutsideCenter
}

/**
 * create frameMesh for the frame of the portal
 */
THREEx.Portal360.prototype._buildRectangularFrame = function(radius, width, height){
	var container = new THREE.Group();
	var material = new THREE.MeshNormalMaterial();
	var material = new THREE.MeshPhongMaterial({
		color: 'silver',
		emissive: 'green'
	});

	var spriteMap = new THREE.TextureLoader().load( 'images/textures/disturb.jpg' );
	var spriteMaterial = new THREE.SpriteMaterial( { map: spriteMap} );
	var sprite = new THREE.Sprite( spriteMaterial );
	sprite.scale.set(width*1.2, height*1.2, 1);
	// sprite.position.set(0,0,-1);
	// container.add(sprite);

	var SpriteContainerMesh = new THREE.Object3D();
	SpriteContainerMesh.add(sprite);

	container.add(SpriteContainerMesh);


	var geometryBeamVertical = new THREE.CylinderGeometry(radius, radius, height - radius)

	// mesh right
	var meshRight = new THREE.Mesh(geometryBeamVertical, material)
	meshRight.position.x = width/2
	container.add(meshRight)

	// mesh right
	var meshLeft = new THREE.Mesh(geometryBeamVertical, material)
	meshLeft.position.x = -width/2
	container.add(meshLeft)

	var geometryBeamHorizontal = new THREE.CylinderGeometry(radius, radius, width - radius).rotateZ(Math.PI/2)

	// mesh top
	var meshTop = new THREE.Mesh(geometryBeamHorizontal, material)
	meshTop.position.y = height/2
	container.add(meshTop)

	// mesh bottom
	var meshBottom = new THREE.Mesh(geometryBeamHorizontal, material)
	meshBottom.position.y = -height/2
	container.add(meshBottom)

	return container
}	


/**
 * create frameMesh for the frame of the portal
 */
THREEx.Portal360.prototype._buildSpriteMesh = function(width, height){

	var geometry = new THREE.PlaneGeometry(width, height);
	var material = new THREE.MeshNormalMaterial();
	var SpriteMesh = new THREE.Mesh(geometry, material);
	SpriteMesh.scale.multiplyScalar(1.1);

	var spriteMap = new THREE.TextureLoader().load( 'images/textures/disturb.jpg' );
	var spriteMaterial = new THREE.SpriteMaterial( { map: spriteMap} );
	var sprite = new THREE.Sprite( spriteMaterial );
	sprite.scale.set(width, height, 1);
	
	SpriteMesh.add( sprite );

	return SpriteMesh;
};	

//////////////////////////////////////////////////////////////////////////////
//	                         	update function
//////////////////////////////////////////////////////////////////////////////

THREEx.Portal360.prototype.changeUpdateFunctionTo2 = function ()
{
	this.SceneCopy = AAnchor.object3D;
	AAnchor.object3D = new THREE.Scene();
	this.n = 100;
	/*this.rx = (this.SceneCopy.rotation.x-Math.Pi/2)/this.n;	
	this.ry = this.SceneCopy.rotation.y/this.n;	
	this.rz = this.SceneCopy.rotation.z/this.n;*/
	this.px = this.SceneCopy.position.x / this.n;
	this.py = this.SceneCopy.position.y / this.n;
	this.update = this.update2;
};

THREEx.Portal360.prototype.changeUpdateFunctionTo3 = function ()
{
	this.update = this.update3;
};


THREEx.Portal360.prototype.changeUpdateFunctionTo4 = function ()
{
	this.AntiVec = this.SceneCopy.position.clone();
	this.AntiVec.normalize();
	this.AntiVec.multiplyScalar(-0.05);	
	this.update = this.update4;
};

THREEx.Portal360.prototype.update1 = function (now, delta) {
	// determine if the user is isOutsidePortal
	var localPosition = new THREE.Vector3();
	this.object3d.worldToLocal(localPosition)
	var isOutsidePortal = localPosition.z >= 0 ? true : false
}

THREEx.Portal360.prototype.update2 = function() 
{
	/*if (this.SceneCopy.rotation.x !== Math.Pi/2)
		this.SceneCopy.rotation.x-=this.rx*Math.PI/360;

	if (this.SceneCopy.rotation.y !== 0)
		this.SceneCopy.rotation.y-=this.ry*Math.PI/360;

	if (this.SceneCopy.rotation.z !== 0)
		this.SceneCopy.rotation.z-=this.rz*Math.PI/360;*/
	if(this.SceneCopy.rotation.x !== Math.PI/2)
		if (Math.abs(this.SceneCopy.rotation.x-Math.PI/2)>Math.PI/180)
			if (this.SceneCopy.rotation.x -Math.PI/2> 0)
				this.SceneCopy.rotation.x-=Math.PI/360;
			else
				this.SceneCopy.rotation.x+=Math.PI/360;
		else this.SceneCopy.rotation.x = Math.PI/2;

	if(this.SceneCopy.rotation.y !== 0)
		if (Math.abs(this.SceneCopy.rotation.y)>Math.PI/180)
			if (this.SceneCopy.rotation.y > 0)
				this.SceneCopy.rotation.y-=Math.PI/360;
			else
				this.SceneCopy.rotation.y+=Math.PI/360;
		else this.SceneCopy.rotation.y = 0;

	if(this.SceneCopy.rotation.z !== 0)
		if (Math.abs(this.SceneCopy.rotation.z)>Math.PI/180)
			if (this.SceneCopy.rotation.z > 0)
				this.SceneCopy.rotation.z-=Math.PI/360;
			else
				this.SceneCopy.rotation.z+=Math.PI/360;	
		else this.SceneCopy.rotation.z = 0;
	if (this.SceneCopy.rotation.x === Math.PI/2 && this.SceneCopy.rotation.y === 0 && this.SceneCopy.rotation.z === 0)
		this.changeUpdateFunctionTo3();
};

THREEx.Portal360.prototype.update3 = function() 
{	
/*
	if (this.SceneCopy.position.x !== 0)
		this.SceneCopy.position.x -= this.px;

	if (this.SceneCopy.position.y !== 0)
		this.SceneCopy.position.y -= this.py;*/
	if (this.SceneCopy.position.x !== 0)
		if (Math.abs(this.SceneCopy.position.x)>0.02)
			if (this.SceneCopy.position.x> 0)
				this.SceneCopy.position.x-=0.01;
			else
				this.SceneCopy.position.x+=0.01;
		else this.SceneCopy.position.x = 0;

	if (this.SceneCopy.position.y !== 0)
		if (Math.abs(this.SceneCopy.position.y)>0.02)
			if (this.SceneCopy.position.y > 0)
				this.SceneCopy.position.y-=0.01;
			else
				this.SceneCopy.position.y+=0.01;
		else this.SceneCopy.position.y = 0;
	if (this.SceneCopy.position.x === 0 && this.SceneCopy.position.y === 0)
		this.changeUpdateFunctionTo4();
};

THREEx.Portal360.prototype.update4 = function() 
{
	/*if(this.SceneCopy.position.length() < 0.5)
	{
		//this.SceneCopy.position.set(0,0,0);
		this.changeUpdateFunctionTo3();
	} else {
		this.SceneCopy.position.add(this.AntiVec);
	}*/
	this.SceneCopy.position.add(this.AntiVec);
	if (this.SceneCopy.position.z > 0)	
		this.update = this.update5;
};


THREEx.Portal360.prototype.update5 = function() 
{

	
};


/*
THREEx.Portal360.prototype.rotateAroundObjectAxis = funcition(axis, radians) {

        rotObjectMatrix = new THREE.Matrix4();
        rotObjectMatrix.makeRotationAxis(axis.normalize(), radians);                
        this.matrix.multiply(rotObjectMatrix);
        this.rotation.setFromRotationMatrix(this.matrix);

};

THREEx.Portal360.prototype.rotateAroundObjectAxis = funcition(axis, radians) {
  		

  		var rotWorldMatrix = new THREE.Matrix4();
        rotWorldMatrix.makeRotationAxis(axis.normalize(), radians);

        var currentPos = new THREE.Vector4(this.position.x, this.position.y, this.position.z, 1);
        var newPos = currentPos.applyMatrix4(rotWorldMatrix);

        rotWorldMatrix.multiply(this.matrix);
        this.matrix = rotWorldMatrix;
        this.rotation.setFromRotationMatrix(this.matrix);

        this.position.x = newPos.x;
        this.position.y = newPos.y;	
        this.position.z = newPos.z;;                

};*/

THREEx.Portal360.prototype.onOrientationEvent = function (event)
{

};

THREEx.Portal360.prototype.onAccelerationEvent = function (event)
{

};