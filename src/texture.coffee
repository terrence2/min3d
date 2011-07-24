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


class M3.Texture2D
	constructor: (@M, @url) ->
		@gl = @M.gl

		# texture mode is always 2D
		@MODE = @gl.TEXTURE_2D

		# load the texture
		@id = @gl.createTexture()
		@img = new Image()
		@img.onload = (e) =>
			@gl.activeTexture @gl.TEXTURE0
			@gl.bindTexture @MODE, @id
			@gl.texImage2D @MODE, 0, @gl.RGBA, @gl.RGBA, @gl.UNSIGNED_BYTE, @img
			@M.checkGLError()
			@gl.texParameteri @MODE, @gl.TEXTURE_MAG_FILTER, @gl.LINEAR
			@gl.texParameteri @MODE, @gl.TEXTURE_MIN_FILTER, @gl.LINEAR_MIPMAP_NEAREST
			@gl.texParameteri @MODE, @gl.TEXTURE_WRAP_S, @gl.REPEAT
			@gl.texParameteri @MODE, @gl.TEXTURE_WRAP_T, @gl.REPEAT
			@gl.generateMipmap @MODE
			@gl.bindTexture @MODE, null

		@img.src = @url

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
