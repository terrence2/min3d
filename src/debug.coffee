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


# Utility functions
class M3.Debug
	VERTEX_SHADER = """
		attribute vec3 aVertexPosition;

		uniform mat4 uMVMatrix;
		uniform mat4 uPMatrix;

		void main(void) {
			gl_PointSize = 3.0;
			gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
		}
	"""

	FRAGMENT_SHADER = """
		#ifdef GL_ES
		precision highp float;
		#endif

		uniform vec4 uColor;
	
		void main(void) {
			gl_FragColor = uColor;
		}
	"""
	# /*


	constructor: (@M) ->
		@gl = @M.gl

		@prog = @M.loadShaderFromStrings(VERTEX_SHADER, FRAGMENT_SHADER,
			["aVertexPosition"], 
			["uMVMatrix", "uPMatrix", "uColor"])
		tri = [0.0, 0.0, 0.0,   0.0, -1.0, 0.0,   1.0, 0.0, 0.0]
		@triVerts = new M3.ArrayBuffer(@M, new Float32Array(tri), 12,
			[{size: 3, type: @gl.FLOAT, offset: 0, normalize: false}],
			@gl.STATIC_DRAW, @gl.TRIANGLES)


	drawRay: (ray, scale, color) ->
		if not scale? then scale = 50
		if not color? then color = [1, 1, 1, 1]
		
		dir = vec3.create(ray.dir)
		vec3.scale(dir, scale)
		dst = vec3.create(ray.pos)
		vec3.add(dst, dir)
		
		#console.log(vec3.str(ray.pos), vec3.str(dst))
		
		line = [ray.pos[0], ray.pos[1], ray.pos[2], dst[0], dst[1], dst[2]]
		lineVerts = new M3.ArrayBuffer(@M, new Float32Array(line), 12,
			[{size: 3, type: @gl.FLOAT, offset: 0, normalize: false}],
			@gl.STATIC_DRAW, @gl.LINES)
		point = [dst[0], dst[1], dst[2]]
		pointVerts = new M3.ArrayBuffer(@M, new Float32Array(point), 12,
			[{size: 3, type: @gl.FLOAT, offset: 0, normalize: false}],
			@gl.STATIC_DRAW, @gl.POINTS)

		
		@gl.disable @gl.DEPTH_TEST
		
		@prog.use()
		lineVerts.bind()
		@prog.linkAttribute('aVertexPosition', lineVerts, 0)
		@prog.linkUniformMatrix('uPMatrix', @M.mP)
		@prog.linkUniformMatrix('uMVMatrix', @M.mMV)
		@prog.linkUniformVec4('uColor', new Float32Array(color))
		lineVerts.draw()
		@prog.unuse()

		@prog.use()
		pointVerts.bind()
		@prog.linkAttribute('aVertexPosition', pointVerts, 0)
		@prog.linkUniformMatrix('uPMatrix', @M.mP)
		@prog.linkUniformMatrix('uMVMatrix', @M.mMV)
		@prog.linkUniformVec4('uColor', new Float32Array(color))
		pointVerts.draw()
		@prog.unuse()

		@gl.enable @gl.DEPTH_TEST

