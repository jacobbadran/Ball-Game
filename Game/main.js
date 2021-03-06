
function main() {

  var canvas = document.getElementById('webgl');

  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  var program_player = createProgram(gl, PLAYER_VSHADER_SOURCE, PLAYER_FSHADER_SOURCE);
  var program_ground = createProgram(gl, GROUND_VSHADER_SOURCE, GROUND_FSHADER_SOURCE);
  var program_diamond = createProgram(gl, DIAMOND_VSHADER_SOURCE, DIAMOND_FSHADER_SOURCE);
  var program_wall = createProgram(gl, WALL_VSHADER_SOURCE, WALL_FSHADER_SOURCE);
  if (!program_player || !program_ground || !program_diamond || !program_wall) {
    console.log('Failed to intialize shaders.');
    return;
  }

  gl.clearColor(0.3, 0.3, 0.3, 1.0);
  gl.enable(gl.DEPTH_TEST);

	var l1 = getLocations(program_player, 'program_player', gl);
	var l2 = getLocations(program_ground, 'program_ground', gl);
	var l3 = getLocations(program_diamond, 'program_diamond', gl);
	var l4 = getLocations(program_wall, 'program_wall', gl);
	if(!l1 || !l2 || !l3 || !l4) {
		return;
	}

	var modelGround = initBuffers(gl, program_ground, 'modelGround');
	var modelPlayer = initBuffers(gl, program_player, 'modelPlayer');
	var modelDiamond = initBuffers(gl, program_diamond, 'modelDiamond');
	var modelWall = initBuffers(gl, program_wall, 'modelWall');
  if (!modelGround || !modelPlayer || !modelDiamond || !modelWall) {
    return;
	}

	var groundRadius = 5; // ground radius
	var groundDiameter = groundRadius * 2;

	player = new Obj(2, 2, 2, groundRadius); player.theta;
	ground = new Obj(groundDiameter, groundDiameter, groundDiameter, groundRadius);
	diamond = new Obj(2, 2, 3, groundRadius);
	wall = new Obj(2, 4, 2.5, groundRadius);

  readOBJFile(player, 'objects/Ball.obj', gl, modelPlayer, 2, true);
	readOBJFile(ground, 'objects/Cylinder.obj', gl, modelGround, 10, true);
	readOBJFile(diamond, 'objects/diamond.obj', gl, modelDiamond, 2, true);
	readOBJFile(wall, 'objects/Ball.obj', gl, modelWall, 2, true);

  var viewProjMatrix = new Matrix4();
  viewProjMatrix.setPerspective(30.0, canvas.width/canvas.height, 1.0, 5000.0);
  viewProjMatrix.lookAt(0.0, 2.0, cameraZPos, 0.0, 0.0, player.position[2], 0.0, 1.0, 0.0);

	initializeVariables();

  document.onkeydown = function(ev){ keydown(ev); };

  var tick = function() {
		updatePlayerPos();

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

////////////////////////////////////////////////////////////////
// Draw player
		viewProjMatrix.setPerspective(30.0, canvas.width/canvas.height, 1.0, 5000.0);
		viewProjMatrix.lookAt(0.0, 2.0, cameraZPos, 0.0, 0.0, player.position[2], 0.0, 1.0, 0.0);

    gl.useProgram(program_player);
    gl.program = program_player;

    rebufferingVsAndNs(gl, program_player.a_Position, 3, gl.FLOAT, modelPlayer.vertexBuffer); 
    rebufferingVsAndNs(gl, program_player.a_Normal, 3, gl.FLOAT, modelPlayer.normalBuffer);
    rebufferingIs(modelPlayer, gl);

		player.angle = 0;
    drawPlayer(player, gl, gl.program, viewProjMatrix, modelPlayer);

////////////////////////////////////////////////////////////////
// Draw grounds
    gl.useProgram(program_ground);
    gl.program = program_ground;

    rebufferingVsAndNs(gl, program_ground.a_Position, 3, gl.FLOAT, modelGround.vertexBuffer); 
    rebufferingVsAndNs(gl, program_ground.a_Normal, 3, gl.FLOAT, modelGround.normalBuffer);
    rebufferingIs(modelGround, gl);

		for(var i = 0; i < groundZPos.length; i++) {
			ground.position[2] = groundZPos[i];
			drawGround(ground, gl, gl.program, viewProjMatrix, modelGround);
		}

////////////////////////////////////////////////////////////////
// Draw diamonds
    gl.useProgram(program_diamond);
    gl.program = program_diamond;

    rebufferingVsAndNs(gl, program_diamond.a_Position, 3, gl.FLOAT, modelDiamond.vertexBuffer); 
    rebufferingVsAndNs(gl, program_diamond.a_Normal, 3, gl.FLOAT, modelDiamond.normalBuffer);
    rebufferingIs(modelDiamond, gl);

		drawRowDmd(diamond, gl, gl.program, 0, viewProjMatrix, modelDiamond, diamond.xYPos.clock0X, diamond.xYPos.clock0Y, dmdZ0Pos);
		drawRowDmd(diamond, gl, gl.program, 90, viewProjMatrix, modelDiamond, diamond.xYPos.clock90X, diamond.xYPos.clock90Y, dmdZ90Pos);
		drawRowDmd(diamond, gl, gl.program, 180, viewProjMatrix, modelDiamond, diamond.xYPos.clock180X, diamond.xYPos.clock180Y, dmdZ180Pos);
		drawRowDmd(diamond, gl, gl.program, 270, viewProjMatrix, modelDiamond, diamond.xYPos.clock270X, diamond.xYPos.clock270Y, dmdZ270Pos);

////////////////////////////////////////////////////////////////
// Draw walls
    gl.useProgram(program_wall);
    gl.program = program_wall;

    rebufferingVsAndNs(gl, program_wall.a_Position, 3, gl.FLOAT, modelWall.vertexBuffer); 
    rebufferingVsAndNs(gl, program_wall.a_Normal, 3, gl.FLOAT, modelWall.normalBuffer);
    rebufferingIs(modelWall, gl);

		drawRowWall(wall, gl, gl.program, 45, viewProjMatrix, modelWall, wall.xYPos.clock45X, wall.xYPos.clock45Y, wallZPos);
		drawRowWall(wall, gl, gl.program, 135, viewProjMatrix, modelWall, wall.xYPos.clock135X, wall.xYPos.clock135Y, wallZPos);
		drawRowWall(wall, gl, gl.program, 225, viewProjMatrix, modelWall, wall.xYPos.clock225X, wall.xYPos.clock225Y, wallZPos);
		drawRowWall(wall, gl, gl.program, 315, viewProjMatrix, modelWall, wall.xYPos.clock315X, wall.xYPos.clock315Y, wallZPos);

////////////////////////////////////////////////////////////////

    requestAnimationFrame(tick, canvas);
  };
  tick();
}

