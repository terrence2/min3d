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


class M3.CubeMap
	constructor: (@M, baseUrl, extension) ->
		@gl = @M.gl

		# texture mode is always 2D
		@MODE = @gl.TEXTURE_CUBE_MAP
		@id = @gl.createTexture()
		@gl.bindTexture @MODE, @id

		# create all images
		@imgPX = new Image()
		@imgNX = new Image()
		@imgPY = new Image()
		@imgNY = new Image()
		@imgPZ = new Image()
		@imgNZ = new Image()

		# setup for doing loading
		allLoaded = () =>
			@gl.bindTexture @MODE, @id
			
			@gl.texImage2D(
				@gl.TEXTURE_CUBE_MAP_POSITIVE_X, 
				0, 
				@gl.RGBA, 
				@gl.RGBA, 
				@gl.UNSIGNED_BYTE, 
				@imgPX)
			#glTexImage2D(GL_TEXTURE_CUBE_MAP_POSITIVE_X,
			#	0, 
			#	GL_RGBA8, 
			#	width, height, 
			#	0, GL_BGRA, GL_UNSIGNED_BYTE, pixels_face0);
			#glTexImage2D(GL_TEXTURE_CUBE_MAP_POSITIVE_X,
			#	0, info->format, info->width, info->height, 0, GL_RGBA, GL_UNSIGNED_BYTE, data + info->ofsCMSides[i]);

			@gl.texImage2D @gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, @gl.RGBA, @gl.RGBA, @gl.UNSIGNED_BYTE, @imgNX
			@gl.texImage2D @gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, @gl.RGBA, @gl.RGBA, @gl.UNSIGNED_BYTE, @imgPY
			@gl.texImage2D @gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, @gl.RGBA, @gl.RGBA, @gl.UNSIGNED_BYTE, @imgNY
			@gl.texImage2D @gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, @gl.RGBA, @gl.RGBA, @gl.UNSIGNED_BYTE, @imgPZ
			@gl.texImage2D @gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, @gl.RGBA, @gl.RGBA, @gl.UNSIGNED_BYTE, @imgNZ

			@gl.texParameteri @MODE, @gl.TEXTURE_WRAP_S, @gl.CLAMP_TO_EDGE
			@gl.texParameteri @MODE, @gl.TEXTURE_WRAP_T, @gl.CLAMP_TO_EDGE
			#@gl.texParameteri @MODE, @gl.TEXTURE_WRAP_R, @gl.CLAMP_TO_EDGE
			@gl.texParameteri @MODE, @gl.TEXTURE_MAG_FILTER, @gl.LINEAR
			@gl.texParameteri @MODE, @gl.TEXTURE_MIN_FILTER, @gl.LINEAR
		done = 0
		preLoaded = (e) =>
			done += 1
			if done == 6
				allLoaded()
		@imgPX.onload = preLoaded
		@imgNX.onload = preLoaded
		@imgPY.onload = preLoaded
		@imgNY.onload = preLoaded
		@imgPZ.onload = preLoaded
		@imgNZ.onload = preLoaded
		
		# begin loading
		@imgPX.src = baseUrl + "px" + extension
		@imgNX.src = baseUrl + "nx" + extension
		@imgPY.src = baseUrl + "py" + extension
		@imgNY.src = baseUrl + "ny" + extension
		@imgPZ.src = baseUrl + "pz" + extension
		@imgNZ.src = baseUrl + "nz" + extension

		# control the bind index... we need this available after bind
		#	to tell the shader which texture unit to pull from
		@index = null


	index2TexUnit: (index) -> @gl['TEXTURE' + String(index)]

	# Bind the texture to a specific texture unit.  
	#	'index' should be a number in 0..95
	bind: (@index) ->
		actual = @index2TexUnit @index
		@gl.activeTexture actual
		@gl.bindTexture @MODE, @id


	unbind: () ->
		actual = @index2TexUnit @index
		@gl.activeTexture actual
		@gl.bindTexture @MODE, null

