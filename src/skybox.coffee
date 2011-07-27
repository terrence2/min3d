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



class M3.Skybox
	VERTEX_SHADER = """
		attribute vec3 aVertexPosition;

		uniform mat4 uMVMatrix;
		uniform mat4 uPMatrix;

		varying vec3 vTexCoord;

		void main(void) {
			gl_PointSize = 10.0;
			gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
			vTexCoord = aVertexPosition;
		}
	"""

	FRAGMENT_SHADER = """
		#ifdef GL_ES
		precision highp float;
		#endif

		uniform samplerCube uSampler;

		varying vec3 vTexCoord;

		void main(void) {
			gl_FragColor = textureCube(uSampler, vTexCoord);
		}
	"""
	# /*

	constructor: (@M) ->
		@gl = @M.gl

		# sky selection
		@cubeMap = @M.loadCubeMap "/cubemap/background0-1024/", ".png"
		@sunPos = vec3.create([-2, -1, 1])
		@sunDir = vec3.create(vec3.scale(@sunPos, -1))
		@sunColor = new Float32Array([1.0, 0.99, 0.9, 1.0])

		@prog = @M.loadShaderFromStrings(VERTEX_SHADER, FRAGMENT_SHADER, 
				["aVertexPosition"], ["uSampler", "uPMatrix", "uMVMatrix"])
		@_buildSkybox()


	draw: ->
		# disable depth test and depth update
		@gl.disable @gl.DEPTH_TEST
		@gl.depthMask false

		# draw from origin, only rotation applied
		@M.mvPush()
		mat4.identity(@M.mMV)
		mat4.rotateX(@M.mMV, -@M.agent.ang[0])
		mat4.rotateY(@M.mMV, -@M.agent.ang[1])
		
		@vertBuf.bind()
		@indexBuf.bind()

		@prog.use()
		@prog.linkAttribute('aVertexPosition', @vertBuf, 0)
		@prog.linkUniformMatrix('uMVMatrix', @M.mMV)
		@prog.linkUniformMatrix('uPMatrix', @M.mP)

		@cubeMap.bind(0)
		@prog.linkSampler('uSampler', @cubeMap)

		@indexBuf.draw()
		@vertBuf.draw()

		@cubeMap.unbind(0)
		@vertBuf.unbind()
		@indexBuf.unbind()
		@prog.unuse()
		
		@M.mvPop()

		@gl.depthMask true
		@gl.enable @gl.DEPTH_TEST


	_buildSkybox: () ->
		A = (Math.sqrt(2/(5 + Math.sqrt(5))))
		B = (Math.sqrt(2/(5 - Math.sqrt(5))))
		SEED_VERTS = [
			-A,  0,  B,
			 A,  0,  B,
			-A,  0, -B,
			 A,  0, -B,
			 0,  B,  A,
			 0,  B, -A,
			 0, -B,  A,
			 0, -B, -A,
			 B,  A,  0,
			-B,  A,  0,
			 B, -A,  0,
			-B, -A,  0]
		SEED_INDICES = [
			 1,  0,  4, 
			 4,  0,  9, 
			 4,  9,  5, 
			 8,  4,  5, 
			 1,  4,  8,	
			 1,  8, 10, 
			10,  8,  3, 
			 8,  5,  3, 
			 3,  5,  2, 
			 3,  2,  7,	
			 3,  7, 10, 
			10,  7,  6, 
			 6,  7, 11, 
			 6, 11,  0, 
			 6,  0,  1,	
			10,  6,  1, 
			11,  9,  0, 
			 2,  9, 11, 
			 5,  9,  2, 
			11,  7,  2]
		[verts, indices] = [SEED_VERTS, SEED_INDICES]
		[verts, indices] = @_subdivide verts, indices
		[verts, indices] = @_subdivide verts, indices
		
		@vertBuf = new M3.ArrayBuffer(@M, new Float32Array(verts), 12, 
				[{size: 3, type: @gl.FLOAT, offset: 0, normalize: false}],
				@gl.STATIC_DRAW, @gl.POINTS)
		@indexBuf = new M3.IndexBuffer(@M, new Uint16Array(indices), @gl.TRIANGLES)
		console.log("Skybox: #{verts.length/3} verts, #{indices.length/3} tris")


	_subdivide: (verts, indices) ->
		# if we already created this edge from its adjacent tri, just add the
		#	tri, do not overwrite our existing edge
		edges = {}
		addEdge = (e0, tri) =>
			if not edges[e0]?
				edges[e0] = e0
			edges[e0].tris.push tri
			return edges[e0]

		# build geometry from our raw verticies
		edges = {}
		tris = []
		for i in [0..(indices.length - 1) / 3]
			index = i * 3
			[a, b, c] = indices[index..index+2]
			tri = new M3.Tri(a, b, c)
			e0 = new M3.Edge(a, b)
			e1 = new M3.Edge(b, c)
			e2 = new M3.Edge(c, a)
			e0 = addEdge e0, tri
			e1 = addEdge e1, tri
			e2 = addEdge e2, tri
			tri.edges.push e0, e1, e2
			tri.extra = [null, null, null]
			tris.push tri
			
		# we need to add these in the right order/slot so that we can figure
		#	out how to build tris for this face later
		addNewVertToTri = (tri, edge, vIndex) ->
			if edge == tri.edges[0]
				tri.extra[0] = vIndex
			else if edge == tri.edges[1]
				tri.extra[1] = vIndex
			else if edge == tri.edges[2]
				tri.extra[2] = vIndex
			else
				throw new "invalid edge for tri"

		verts = verts.slice(0)
		for _, edge of edges
			a = edge.i0
			b = edge.i1
			# get p0 and p1
			[x0, y0, z0] = verts[a * 3..a * 3 + 2]
			[x1, y1, z1] = verts[b * 3..b * 3 + 2]
			# split edge in half
			x2 = x0 + ((x1 - x0) / 2)
			y2 = y0 + ((y1 - y0) / 2)
			z2 = z0 + ((z1 - z0) / 2)
			# push edge out to spherical
			[r, phi, theta] = cart2polar x2, y2, z2
			[x3, y3, z3] = polar2cart 1, phi, theta
			# add vert index to triangle
			if edge.tris.length != 2
				throw "Invalid skybox geometry"
			addNewVertToTri edge.tris[0], edge, verts.length / 3
			addNewVertToTri edge.tris[1], edge, verts.length / 3
			# add new vert
			verts.push x3, y3, z3


		# note: no existing tris will survive
		nextIndices = []
		for tri in tris
			a = tri.a
			b = tri.b
			c = tri.c
			d = tri.extra[0]
			e = tri.extra[1]
			f = tri.extra[2]
			#    a
			#  f   d
			# c  e  b
			nextIndices.push a, d, f
			nextIndices.push b, e, d
			nextIndices.push c, f, e
			nextIndices.push d, e, f

		return [verts, nextIndices]

