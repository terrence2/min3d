###
# Copyright 2011, Terrence Cole
# 
# This file is part of MIN3D.
# 
# MIN3D is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
# 
# MIN3D is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
# 
# You should have received a copy of the GNU Affero General Public License
# along with MIN3D.  If not, see <http://www.gnu.org/licenses/>.
###


class M3.Board
	# Cube scale factor
	SCALE = 10.0
	
	# Block states
	STATE_NORMAL = 0
	STATE_EMPTY = 1
	STATE_FLAGGED = 2
	STATE_CAKED = 3
	
	# Block overlays
	FOCUS_NONE = 0
	FOCUS_HOVER = 1
	
	# Block content
	CONTENT_NONE = 0
	CONTENT_MINE = 1
	CONTENT_CAKE = 2

	
	constructor: (@M, @szX, @szY, @szZ) ->
		@nMines = 0
		@size = vec3.create([@szX, @szY, @szZ])
		console.log("Board size: " + vec3.str(@size))
		@gl = @M.gl

		# the board has its own local coordinate center
		@center = vec3.create([@szX * SCALE / 2, @szY * SCALE / 2, @szZ * SCALE / 2])

		# build the cube state list
		@cubes = []
		@nCubes = @szX * @szY * @szZ
		for i in [0..@szX-1]
			@cubes.push []
			for j in [0..@szY-1]
				@cubes[i].push []
				for k in [0..@szZ-1]
					pos = [i * SCALE, j * SCALE, k * SCALE]
					@cubes[i][j].push({
						state: STATE_NORMAL
						focus: FOCUS_NONE
						content: CONTENT_NONE
						aabb: new M3.AABB(pos, [pos[0] + SCALE, pos[1] + SCALE, pos[2] + SCALE])
					})


		# create drawing stuff
		@createCubeSurfaces()
		@createNumberSurfaces()


	# setup rendering bits for drawing the numbers floating next to the cubes
	createNumberSurfaces: () ->
		# create verts for the numbers
		[verts, nElmts] = @_fillNumbers()		

		# push the number vertices to the card
		vertData = new Float32Array(verts);
		@numberVertBuf = new M3.ArrayBuffer(@M, vertData, nElmts * 4, 
			[{size: 4, type: @gl.FLOAT, offset: 0, normalize: false},
			 {size: 3, type: @gl.FLOAT, offset: 16, normalize: false}], 
			@gl.STATIC_DRAW, @gl.TRIANGLES)

		# push the number states to the card
		@numberStateData = new Float32Array(verts.length / nElmts * 1)
		@numberStateBuf = new M3.ArrayBuffer(@M, @numberStateData, 4,
			[{size: 1, type: @gl.FLOAT, offset:0, normalize:false}],
			@gl.STATIC_DRAW)

		# load shader for the numbers
		uniforms = ["uMVMatrix", "uPMatrix"]
		for i in [1..6]
			uniforms.push ("uSampler" + String(i))
		@numberShader = @M.loadShaderFromStrings(NUMBER_VERTEX_SHADER, NUMBER_FRAGMENT_SHADER, 
			["aNumberPosition", "aVertexPosition", "aState"], uniforms)
		
		# load textures for the numbers
		@numberTex = []
		for n in [1..6]
			@numberTex.push @M.loadTexture ("/materials/number/number0"+String(n)+"-128.png")


	_fillNumbers: ->
		#  world    sz     vert 
		_verts = [
			0, 0, 0, 1,  -1, -1, 0,
			0, 0, 0, 1,   1, -1, 0,
			0, 0, 0, 1,   1,  1, 0,
			0, 0, 0, 1,   1,  1, 0,
			0, 0, 0, 1,  -1,  1, 0,
			0, 0, 0, 1,  -1, -1, 0,
		]
		nElmts = 7
		
		verts = []
		extendVerts = (delta) =>
			offset = 0
			for val in _verts
				if offset < 3 # position
					verts.push(val + delta[offset])
				else
					verts.push(val)
				offset += 1
				offset %= nElmts
		
		for i in [-1..@szX]
			posX = SCALE / 2 + SCALE * i
			for j in [-1..@szY]
				posY = SCALE / 2 + SCALE * j
				for k in [-1..@szY]
					posZ = SCALE / 2 + SCALE * k
					extendVerts [posX, posY, posZ]

		return [verts, nElmts]


	# Setup the rendering bits for drawing the cubes
	createCubeSurfaces: ->
		# load the cube verts list
		[verts, nElmts] = @_fillVerts()

		# push the cube vertices to the card
		vertData = new Float32Array(verts);
		@cubeVertBuf = new M3.ArrayBuffer(@M, vertData, nElmts * 4, 
			[{size: 3, type: @gl.FLOAT, offset: 0, normalize: false},
			 {size: 2, type: @gl.FLOAT, offset: 12, normalize: false},
			 {size: 3, type: @gl.FLOAT, offset: 20, normalize: false}], 
			@gl.STATIC_DRAW, @gl.TRIANGLES)

		# each frame we will also need to provide the state number to the
		#	renderer, so create an array buffer for it
		@cubeStateData = new Float32Array(verts.length / nElmts * 2)
		@cubeStateBuf = new M3.ArrayBuffer(@M, @cubeStateData, 8,
			[{size: 1, type: @gl.FLOAT, offset: 0, normalize: false}
			 {size: 1, type: @gl.FLOAT, offset: 4, normalize: false}],
			@gl.DYNAMIC_DRAW)

		# the shader to draw the cubes		
		@cubeShader = @M.loadShaderFromStrings(VERTEX_SHADER, FRAGMENT_SHADER,
			["aVertexPosition", "aTextureCoord", "aVertexNormal", "aState", "aFocus"], 
			["uMVMatrix", "uPMatrix", "uSampler", "uNormals", "uSkymap", "uReflectivity", "uMark", "uSunDir", "uSunColor"])
		
		# load textures for the cube
		@cubeFaceTex = @M.loadTexture "/materials/cube/color-256.jpg"
		@cubeNormalTex = @M.loadTexture "/materials/cube/normal-256.png"
		@cubeReflectivityTex = @M.loadTexture "/materials/cube/reflectivity-256.png"
		@cubeMarkTex = @M.loadTexture "/materials/cube/marked-512.png"


	_fillVerts: ->
		###
		 The cube faces are arranged as
		   ____
		  / 4 /| <- 2
	3 -> +---+ |  
		 | 0 |1+       |   /
		 |___|/   x->  y  z
		   /\ 
		   5

		###
		# Note: we need per-face normals, so have to specify every vertex for 
		#	every face here, rather than doing something clever with strips.
		#   x  y  z    u  v   nx  ny  nz    tangent
		_verts = [
			# Front
			0, 0, 0,   0, 0,   0,  0,  1,
			1, 1, 0,   1, 1,   0,  0,  1,   
			1, 0, 0,   1, 0,   0,  0,  1,   
			1, 1, 0,   1, 1,   0,  0,  1,
			0, 0, 0,   0, 0,   0,  0,  1,
			0, 1, 0,   0, 1,   0,  0,  1,
			# Right
			1, 0, 0,   0, 0,   1,  0,  0,
			1, 1, 1,   1, 1,   1,  0,  0,
			1, 0, 1,   1, 0,   1,  0,  0,
			1, 1, 1,   1, 1,   1,  0,  0,
			1, 0, 0,   0, 0,   1,  0,  0,
			1, 1, 0,   0, 1,   1,  0,  0,
			# Back
			1, 0, 1,   0, 0,   0,  0, -1,
			0, 1, 1,   1, 1,   0,  0, -1,
			0, 0, 1,   1, 0,   0,  0, -1,
			0, 1, 1,   1, 1,   0,  0, -1,
			1, 0, 1,   0, 0,   0,  0, -1,
			1, 1, 1,   0, 1,   0,  0, -1,
			# Left
			0, 0, 1,   0, 0,  -1,  0,  0,
			0, 1, 0,   1, 1,  -1,  0,  0,
			0, 0, 0,   1, 0,  -1,  0,  0,
			0, 1, 0,   1, 1,  -1,  0,  0,
			0, 0, 1,   0, 0,  -1,  0,  0,
			0, 1, 1,   0, 1,  -1,  0,  0,
			# Top
			0, 1, 0,   0, 0,   0,  1,  0,
			1, 1, 1,   1, 1,   0,  1,  0,
			1, 1, 0,   1, 0,   0,  1,  0,
			1, 1, 1,   1, 1,   0,  1,  0,
			0, 1, 0,   0, 0,   0,  1,  0,
			0, 1, 1,   0, 1,   0,  1,  0,
			# Bottom
			0, 0, 1,   0, 0,   0, -1,  0,
			1, 0, 0,   1, 1,   0, -1,  0,
			1, 0, 1,   1, 0,   0, -1,  0,
			1, 0, 0,   1, 1,   0, -1,  0,
			0, 0, 1,   0, 0,   0, -1,  0,
			0, 0, 0,   0, 1,   0, -1,  0,
		]
		nElmts = 8
		@nVertsPerCube = _verts.length / nElmts

		# scale up vert positions to be SCALE sized
		for i in [0..(_verts.length / nElmts) - 1]
			for j in [0..2]
				index = i * nElmts + j
				_verts[index] = _verts[index] * SCALE
			
		# full vert and index list
		verts = []
		
		# fill the vert and index lists from the per-cube _vert and _index list
		extendCube = (n, delta) =>
			offset = 0
			for val in _verts
				if offset < 3 # position
					verts.push(val + delta[offset])
				else
					verts.push(val)
				offset += 1
				offset %= nElmts
		
		# build all verts
		n = 0
		for i in [0..@szX-1]
			for j in [0..@szY-1]
				for k in [0..@szZ-1]
					pos = [i * SCALE, j * SCALE, k * SCALE]
					extendCube(n, pos)
					n += 1

		return [verts, nElmts]



	# Set initial states from a text representation, face on.
	initFromPlanarChars: (S) ->
		if S.length != @szZ then throw "Incorrect Z dimension initing from state vector"
		for i in [0..@szZ-1]
			if S[i].length != @szY then throw "Incorrect Y dimension initing from state vector"
			for j in [0..@szY-1]
				if S[i][@szY - j - 1].length != @szX then throw "Incorrect X dimension initing from state vector"
				for k in [0..@szX-1]
					st = switch S[i][@szY - j - 1][k]
						when "x" then STATE_NORMAL
						when " " then STATE_EMPTY
						when "m" then STATE_FLAGGED
					@cubes[k][j][i].state = st
		@updateNumberStates()


	# Setup n mines in the board randomly.
	# @return a list of the positions where we placed the mines
	fillRandomMines: (nMines) ->
		positions = []
		@nMines = nMines
		while nMines > 0
			# select x,y,z
			x = Math.floor(Math.random() * @szX)
			y = Math.floor(Math.random() * @szY)
			z = Math.floor(Math.random() * @szZ)
			# if we found a random position, set it, otherwise continue
			if @cubes[x][y][z].content == CONTENT_NONE
				@cubes[x][y][z].content = CONTENT_MINE
				nMines -= 1
				positions.push [x, y, z]
		@updateNumberStates()
		return positions


	# As returned by fillRandomMines, for instance
	fillMinesFromPositions: (positions) ->
		for pos in positions
			@cubes[pos[0]][pos[1]][pos[2]].content = CONTENT_MINE
		@updateNumberStates()


	# Search for and apply focusing on cubes
	updateFocus: ->
		# note: transform ray by world center to get the real coordinates
		ptr = @M.agent.worldPointer
		tmp = vec3.create(ptr.pos)
		vec3.add(tmp, @center)
		ray = new M3.Ray tmp, ptr.dir

		# find cubes that intersect our pointer and update cube focus
		hits = []
		for i in [0..@szX-1]
			for j in [0..@szY-1]
				for k in [0..@szZ-1]
					@cubes[i][j][k].focus = FOCUS_NONE
					if @cubes[i][j][k].state == STATE_EMPTY
						continue
					hit = @cubes[i][j][k].aabb.intersectRay ray
					if hit > 0
						hits.push [hit, i, j, k]
		hits.sort()
		if hits.length == 0
			return
		
		@cubes[hits[0][1]][hits[0][2]][hits[0][3]].focus = FOCUS_HOVER
		
	
	# Apply cube states to the state buf and upload
	updateStateBuf: ->
		n = 0
		for i in [0..@szX-1]
			for j in [0..@szY-1]
				for k in [0..@szZ-1]
					st = @cubes[i][j][k].state
					fc = @cubes[i][j][k].focus
					for m in [0..@nVertsPerCube-1]
						@cubeStateData[n] = st
						@cubeStateData[n+1] = fc
						n += 2
		@cubeStateBuf.update(@cubeStateData)


	# Count and apply number states to numbers
	updateNumberStates: ->
		# reset to 0's
		for i in [0..@numberStateData.length-1]
			@numberStateData[i] = 0.0
		offset = 0 # offset into vert list
		# for each numbered square
		for i in [-1..@szX]
			for j in [-1..@szY]
				for k in [-1..@szZ]
					cnt = 0

					### NOTE: this is for 26-adjacency mode
					# for each adjacent cube
					for i0 in [-1..1]
						for j0 in [-1..1]
							for k0 in [-1..1]
								i1 = i + i0
								j1 = j + j0
								k1 = k + k0
								if 0 <= i1 < @szX and 0 <= j1 < @szY and 0 <= k1 < @szZ
									if @cubes[i1][j1][k1].content == CONTENT_MINE
										cnt += 1
					###
					
					for [i0,j0,k0] in [[-1,0,0], [1,0,0], [0,-1,0], [0,1,0], [0,0,-1], [0,0,1]]
						i1 = i + i0
						j1 = j + j0
						k1 = k + k0
						if 0 <= i1 < @szX and 0 <= j1 < @szY and 0 <= k1 < @szZ
							if @cubes[i1][j1][k1].content == CONTENT_MINE
								cnt += 1
						
					
					# for each vert in this number
					for _ in [1..6]
						@numberStateData[offset] = cnt
						offset += 1

		@numberStateBuf.update(@numberStateData)


	# get a cube position (in world space) from an i,j,k cube index
	getCubePos: (i, j, k) ->
		return vec3.create([
			i * SCALE - @center[0] + SCALE / 2,
			j * SCALE - @center[1] + SCALE / 2,
			k * SCALE - @center[2] + SCALE / 2
		])

	# return the minimum and maximum position of the board in world space
	getExtents: ->
		minPos = @getCubePos 0, 0, 0
		minPos[0] -= SCALE / 2
		minPos[1] -= SCALE / 2
		minPos[2] -= SCALE / 2
		maxPos = @getCubePos @szX-1, @szY-1, @szZ-1
		maxPos[0] += SCALE / 2
		maxPos[1] += SCALE / 2
		maxPos[2] += SCALE / 2
		return [minPos, maxPos]
		

	# clear the square that is currently hovered
	clear_current: () ->
		for i in [0..@szX-1]
			for j in [0..@szY-1]
				for k in [0..@szZ-1]
					if @cubes[i][j][k].focus == FOCUS_HOVER
						# don't open flagged boxes
						if @cubes[i][j][k].state == STATE_FLAGGED
							return
						# if we open a mined box, we die
						if @cubes[i][j][k].content == CONTENT_MINE
							minePos = @getCubePos i, j, k
							@M.doDeath minePos
							return
						@cubes[i][j][k].state = STATE_EMPTY
						return

	mark_current: () ->
		for i in [0..@szX-1]
			for j in [0..@szY-1]
				for k in [0..@szZ-1]
					if @cubes[i][j][k].focus == FOCUS_HOVER
						if @cubes[i][j][k].state == STATE_FLAGGED
							@cubes[i][j][k].state = STATE_NORMAL
						else
							@cubes[i][j][k].state = STATE_FLAGGED
						return


	move: (dt) ->
		;	


	VERTEX_SHADER = """
		attribute vec3 aVertexPosition;
		attribute vec2 aTextureCoord;
		attribute vec3 aVertexNormal;
		attribute float aState;
		attribute float aFocus;

		uniform mat4 uMVMatrix;
		uniform mat4 uPMatrix;
		uniform vec3 uSunDir;
		uniform vec4 uSunColor;
	
		varying float vState;
		varying vec4 vColor;
		varying vec2 vTextureCoord;
		varying vec3 vTLightVec;
		varying vec3 vTEyeVec;
		varying vec3 vHalfVec;

		void main(void) {
			// figure out what our object space tangent vector is, based on axis
			vec3 faceTangent;
			if(aVertexNormal.y == 0.0) // all side faces
				faceTangent = vec3(0.0, 1.0, 0.0);
			else // the top and bottom faces
				faceTangent = vec3(0.0, 0.0, 1.0);
			vec3 faceBinorm = cross(aVertexNormal, faceTangent);

			// move light vector into tangent space
			vTLightVec.x = dot(uSunDir, faceTangent);
			vTLightVec.y = dot(uSunDir, faceBinorm);
			vTLightVec.z = dot(uSunDir, aVertexNormal);
			vTLightVec = normalize(vTLightVec);
			// move eye vector into tangent space
			vec3 pos = (uMVMatrix * vec4(aVertexPosition, 1.0)).xyz;
			vTEyeVec.x = dot(pos, faceTangent);
			vTEyeVec.y = dot(pos, faceBinorm);
			vTEyeVec.z = dot(pos, aVertexNormal);
			// compute half vector between eye and light
			vec3 h = (normalize(pos) + uSunDir) / 2.0;
			vHalfVec = normalize(h);

			// transform and apply base tc
			gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
			vTextureCoord = aTextureCoord;
			vState = aState;

			// set color modifier based on state and focus status		
			if(aState == 0.0) { // normal
				vColor = vec4(1.0, 1.0, 1.0, 1.0);
			} else if(aState == 1.0) { // empty
				vColor = vec4(0.0, 0.0, 0.0, 0.0);
			} else if(aState == 2.0) { // flagged
				vColor = vec4(1.0, 0.7, 0.7, 1.0);
			} else {
				vColor = vec4(1.0, 0.0, 1.0, 1.0);
			}
		
			if(aFocus == 1.0 && aState != 2.0) {
				vColor *= vec4(0.7, 0.7, 1.0, 1.0);
			}
		}
	"""

	FRAGMENT_SHADER = """	
		#ifdef GL_ES
		precision highp float;
		#endif

		varying float vState;
		varying vec4 vColor;
		varying vec2 vTextureCoord;
		varying vec3 vTLightVec;
		varying vec3 vTEyeVec;
		varying vec3 vHalfVec;

		uniform sampler2D uSampler;
		uniform sampler2D uNormals;
		uniform sampler2D uReflectivity;
		uniform sampler2D uMark;
		uniform samplerCube uSkymap;
	
		uniform vec3 uSunDir;
		uniform vec4 uSunColor;

		void main(void) {
			// discard transparent fragments
			if(vColor.w == 0.0) discard;
		
			// lookup and compute base color
			vec4 color = texture2D(uSampler, vTextureCoord);
			color *= vColor;

			// if flagged, overlay the flag color
			if(vState >= 1.5 && vState < 2.5) { // flagged
				vec4 mark = texture2D(uMark, 1.0 - vTextureCoord);
				color = vColor * vec4(mix(color.xyz, mark.xyz, mark.w), 1.0);
			}

			// base ambient light
			gl_FragColor = vec4(0.3, 0.3, 0.3, 1.0) * color;

			// perform normal lookup and renormalization
			vec3 normal = texture2D(uNormals, vTextureCoord).xyz;
			normal = normalize(2.0 * normal - 1.0); // renormalize to [-1,1]

			// compute reflection vector
			// vTEyeVec is incident ray in tangent space for this formula
			//		R = I - 2 * N * (N dot I)
			vec3 I = -vTEyeVec;
			vec3 vReflection = I - 2.0 * normal * dot(normal, I);
		
			// lookup sky reflection position using the reflection vector
			vec4 skycolor = textureCube(uSkymap, vReflection);

			// compute diffuse lighting
			float lambertFactor = max(dot(vTLightVec, normal), 0.0);
			if(lambertFactor > 0.0) {
				gl_FragColor += vec4((color * uSunColor * lambertFactor).xyz, 1.0);

				//vec4 mSpecular = vec4(1.0);
				//vec4 lSpecular = vec4(1.0);
				//gl_FragColor += mSpecular * lSpecular * shininess;
				float shininess = pow(max(dot(vHalfVec, normal), 0.0), 2.0);
			}
		
			// mix in the background reflection
			gl_FragColor += skycolor * texture2D(uReflectivity, vTextureCoord) / 2.25;

		}
	"""

	NUMBER_VERTEX_SHADER = """
		uniform mat4 uMVMatrix;
		uniform mat4 uPMatrix;

		attribute vec3 aVertexPosition;
		attribute vec4 aNumberPosition;
		attribute float aState;
		
		varying float vState;
		varying vec2 vTexCoord;

		void main(void) {
			vState = aState;
			
			vec4 wpos = vec4(aNumberPosition.xyz, 1.0);
			vec4 epos = uMVMatrix * wpos;
			epos.xy += aVertexPosition.xy * aNumberPosition.w; 
			gl_Position = uPMatrix * epos;
			vTexCoord = vec2(aVertexPosition.x, -aVertexPosition.y) * 0.5 + vec2(0.5);
		}
	"""
	
	NUMBER_FRAGMENT_SHADER = """
		#ifdef GL_ES
		precision highp float;
		#endif

		uniform sampler2D uSampler1;
		uniform sampler2D uSampler2;
		uniform sampler2D uSampler3;
		uniform sampler2D uSampler4;
		uniform sampler2D uSampler5;
		uniform sampler2D uSampler6;

		varying float vState;
		varying vec2 vTexCoord;

		void main(void) {
			vec3 color = vec3(1.0, 1.0, 1.0);
			vec4 alpha = vec4(1.0, 1.0, 1.0, 1.0);
		
			if(vState < 0.5) {
				discard;
			} else if(0.5 <= vState && vState < 1.5) { // 1
				color = vec3(0.0, 0.0, 1.0);
				alpha = texture2D(uSampler1, vTexCoord);
			} else if(1.5 <= vState && vState < 2.5) { // 2
				color = vec3(0.0, 1.0, 0.0);
				alpha = texture2D(uSampler2, vTexCoord);
			} else if(2.5 <= vState && vState < 3.5) { // 3
				color = vec3(1.0, 0.0, 0.0);
				alpha = texture2D(uSampler3, vTexCoord);
			} else if(3.5 <= vState && vState < 4.5) { // 4
				color = vec3(0.01, 0.0, 0.5);
				alpha = texture2D(uSampler4, vTexCoord);
			} else if(4.5 <= vState && vState < 5.5) { // 5
				color = vec3(0.5, 0.0, 0.0);
				alpha = texture2D(uSampler5, vTexCoord);
			} else if(5.5 <= vState && vState < 6.5) { // 6
				color = vec3(0.0, 0.5, 0.51);
				alpha = texture2D(uSampler6, vTexCoord);
			} else {
				color = vec3(1.0, 0.0, 1.0);
			}

			// NOTE: we do this without blending so that we can avoid a large
			//		sort in the client code.  This still ends up looking pretty
			//		good, although obviously not optimal.
			if(alpha.x < 0.1) {
				discard;
			}

			gl_FragColor = vec4(color, 1.0);
		}
	"""
	# /*
	

	draw: ->
		@updateFocus()
		@updateStateBuf()

		@gl.enable(@gl.BLEND)
		@gl.blendFunc(@gl.SRC_ALPHA, @gl.ONE_MINUS_SRC_ALPHA)
		
		@M.mvPush()
		mat4.translate(@M.mMV, vec3.negate(vec3.create(@center)))
		
		## CUBE
		@cubeShader.use()
		@cubeVertBuf.bind()
		@cubeShader.linkAttribute('aVertexPosition', @cubeVertBuf, 0)
		@cubeShader.linkAttribute('aTextureCoord', @cubeVertBuf, 1)
		@cubeShader.linkAttribute('aVertexNormal', @cubeVertBuf, 2)
		@cubeStateBuf.bind()
		@cubeShader.linkAttribute('aState', @cubeStateBuf, 0)
		@cubeShader.linkAttribute('aFocus', @cubeStateBuf, 1)
		@cubeShader.linkUniformMatrix('uPMatrix', @M.mP)
		@cubeShader.linkUniformMatrix('uMVMatrix', @M.mMV)
		@cubeShader.linkUniformVec3('uSunDir', @M.skybox.sunDir)
		@cubeShader.linkUniformVec4('uSunColor', @M.skybox.sunColor)

		@cubeFaceTex.bind(0)
		@cubeShader.linkSampler('uSampler', @cubeFaceTex)

		@cubeNormalTex.bind(1)
		@cubeShader.linkSampler('uNormals', @cubeNormalTex)

		@cubeReflectivityTex.bind(2)
		@cubeShader.linkSampler('uReflectivity', @cubeReflectivityTex)

		@M.skybox.cubeMap.bind(3)
		@cubeShader.linkSampler('uSkymap', @M.skybox.cubeMap)

		@cubeMarkTex.bind(4)
		@cubeShader.linkSampler('uMark', @cubeMarkTex)

		@cubeVertBuf.draw()
		
		@cubeFaceTex.unbind()
		@cubeNormalTex.unbind()
		@cubeShader.unuse()

		@gl.disable(@gl.BLEND)
		
		## NUMBERS
		@numberShader.use()
		@numberShader.linkUniformMatrix 'uPMatrix', @M.mP
		@numberShader.linkUniformMatrix 'uMVMatrix', @M.mMV
		@numberVertBuf.bind()
		@numberShader.linkAttribute 'aNumberPosition', @numberVertBuf, 0
		@numberShader.linkAttribute 'aVertexPosition', @numberVertBuf, 1
		@numberStateBuf.bind()
		@numberShader.linkAttribute 'aState', @numberStateBuf, 0

		i = 0
		for tex in @numberTex
			tex.bind(i)
			@numberShader.linkSampler 'uSampler' + String(i + 1), tex
			i += 1

		@numberVertBuf.draw()

		## ## DEBUG
		#@M.debug.drawRay @M.agent.worldPointer, 500
		#return
		## ## END DEBUG

		@M.mvPop()


