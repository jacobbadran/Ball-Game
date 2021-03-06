
var Obj = function(dimX, dimY, dimZ, groundRadius) {
	this.g_objDoc = null;
	this.g_drawingInfo = null;

	this.g_modelMatrix = new Matrix4();
	this.g_mvpMatrix = new Matrix4();
	this.g_normalMatrix = new Matrix4();

	this.position = new Float32Array(3);
	this.xYPos = new XYPosition(dimX / 2, groundRadius);
	this.angle; // rotate around itself
	this.dim = [dimX, dimY, dimZ]; // dimentions(x,y,z) of the object (real size)
}

var XYPosition = function(objRadius, groundRadius) {
	var rad = Math.PI / 180.0;

  this.clock0X = (groundRadius - objRadius) * Math.cos(0);
	this.clock0Y = (groundRadius - objRadius) * Math.sin(0);
  this.clock45X = (groundRadius - objRadius) * Math.cos(rad * 45);
	this.clock45Y = (groundRadius - objRadius) * Math.sin(rad * 45);
  this.clock90X = (groundRadius - objRadius) * Math.cos(rad * 90);
	this.clock90Y = (groundRadius - objRadius) * Math.sin(rad * 90);
  this.clock135X = (groundRadius - objRadius) * Math.cos(rad * 135);
	this.clock135Y = (groundRadius - objRadius) * Math.sin(rad * 135);
  this.clock180X = (groundRadius - objRadius) * Math.cos(rad * 180);
	this.clock180Y = (groundRadius - objRadius) * Math.sin(rad * 180);
  this.clock225X = (groundRadius - objRadius) * Math.cos(rad * 225);
	this.clock225Y = (groundRadius - objRadius) * Math.sin(rad * 225);
  this.clock270X = (groundRadius - objRadius) * Math.cos(rad * 270);
	this.clock270Y = (groundRadius - objRadius) * Math.sin(rad * 270);
  this.clock315X = (groundRadius - objRadius) * Math.cos(rad * 315);
	this.clock315Y = (groundRadius - objRadius) * Math.sin(rad * 315);
}

function rebufferingVsAndNs(gl, a_attribute, num, type, buffer) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);  // Assign the buffer object to the attribute variable
	gl.enableVertexAttribArray(a_attribute);  // Enable the assignment
}

function rebufferingIs(model, gl) {
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
}

function drawRowDmd(obj, gl, program, angle, viewProjMatrix, model, x, y, zClockPos) {
	obj.position[0] = x;
	obj.position[1] = y;
	obj.angle = angle;
	for(var i = 0; i < zClockPos.length; i++) {
		if(zClockPos[i] != null)	{
			obj.position[2] = zClockPos[i];
			drawDiamond(obj, gl, program, viewProjMatrix, model);
		}
	}
}

function drawRowWall(obj, gl, program, angle, viewProjMatrix, model, x, y, zClockPos) {
	obj.position[0] = x;
	obj.position[1] = y;
	obj.angle = angle;
	for(var i = 0; i < zClockPos.length; i++) {
		obj.position[2] = zClockPos[i];
		drawWall(obj, gl, program, viewProjMatrix, model);
	}
}

function getLocations(program, programName, gl) {
  program.a_Position = gl.getAttribLocation(program, 'a_Position');
  program.a_Normal = gl.getAttribLocation(program, 'a_Normal');
  program.a_Color = gl.getAttribLocation(program, 'a_Color');
  program.u_MvpMatrix = gl.getUniformLocation(program, 'u_MvpMatrix');
  program.u_NormalMatrix = gl.getUniformLocation(program, 'u_NormalMatrix');

  if (program.a_Position < 0 ||  program.a_Normal < 0 || program.a_Color < 0 ||
      !program.u_MvpMatrix || !program.u_NormalMatrix) {
    console.log(programName + ' : can not get the uniform or attribute location of program'); 
    return false;
  }

	return true;
}

function initBuffers(gl, program, modelName) {
	var model = initVertexBuffers(gl, program);
  if (!model) {
    console.log('Failed to set the vertex information in ' + modelName);
    return null;
	}

	return model;
}

function initializeVariables() {
	var groundRadius = ground.dim[0] / 2;
	var playerMid = player.dim[0] / 2;
	var dmdMidX = diamond.dim[0] / 2;
	var dmdMidY = diamond.dim[1] / 2;
	var	groundRadiusMinusPlayerMid = groundRadius - playerMid;

	/**
	 * theta = (arc length * 360) / (2 * Math.PI * Radius)
	 * theta in degrees
	 * arc length = "playerSpeedXY" global variable
	 */
	player.speedZ = playerSpeedZ;
	player.speedTheta = (playerSpeedXY * 360) / (2 * Math.PI * groundRadiusMinusPlayerMid);

	player.theta = 0.0;
  var rad = (player.theta * Math.PI) / 180.0;
  player.position[0] = groundRadiusMinusPlayerMid * Math.cos(rad);
  player.position[1] = groundRadiusMinusPlayerMid * Math.sin(rad);

	xDistancePlayerDiamondCenters = dmdMidX + playerMid;
	yDistancePlayerDiamondCenters = dmdMidY + playerMid;
	zDistancePlayerDiamondCenters = (player.dim[2] / 2.0) + (diamond.dim[2] / 2.0);

	/**
	 *										B wall
	 *									 /\
	 *									/  \
	 *								 /		\
	 *	 origin(0, 0)A/______\C player before the wall
	 *
	 *
	 * Triangle equations
	 * C.x = (AB² - BC² + AC²) / (2 * AB)
	 * C.y = sqrt(BC² - (B.x - C.x)²) - B.y
	 */
	xDistancePlayerWallCenters = (wall.dim[0] / 2) + playerMid;
	zDistancePlayerWallCenters = (player.dim[2] / 2.0) + (wall.dim[2] / 2.0);
	xPlayerToTouchTheWall = Math.abs((Math.pow(groundRadius, 2) - Math.pow(xDistancePlayerWallCenters, 2) + Math.pow(groundRadius, 2)) / (2 * 	
													groundRadius));
	yPlayerToTouchTheWall = Math.abs(Math.sqrt(Math.abs(Math.pow(xDistancePlayerWallCenters, 2) - Math.pow((wall.xYPos.clock45X - 			
													xPlayerToTouchTheWall), 2))) - wall.xYPos.clock45Y);

	playerThetaToTouchTheWall = new function() {
		// B = before = the theta of the player is less than the theta of the wall.
		// A = after = the theta of the player is bigger than the theta of the wall.
		this.thetaB45 = Math.atan(yPlayerToTouchTheWall / xPlayerToTouchTheWall) * 180 / Math.PI;
		this.thetaA45 = this.thetaB45 + (45 - this.thetaB45) * 2;
		this.thetaB135 = this.thetaB45 + 90;
		this.theraA135 = this.thetaA45 + 90;
		this.thetaB225 = this.thetaB45 + 180;
		this.theraA225 = this.thetaA45 + 180;
		this.thetaB315 = this.thetaB45 + 270;
		this.theraA315 = this.thetaA45 + 270;
	};
}

