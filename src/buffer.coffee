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


###
An OpenGL "Buffer".  Useful for packing up and sending vertex data to a
 	rendering device.

NOTE: this class does not take on the potentially quite difficult task of 
	packaging data.  The user is expected to build the data buffer manually
	and just pass in it and the info needed to bind it.
###
class M3.ArrayBuffer
	# Build a new ArrayBuffer
	# bufferData: the data buffer, already filled out
	# stride: the size in bytes of one element in the array buffer
	# components: a list of components in this buffer; each component must be 
	#		an object with properties:
	#			size: number of data items in this component
	#			type: the data type of this component
	#			offset: offset in bytes from the start of the array for first element
	#			normalize: true if the data needs to be normalized at draw time
	# usageMode: expected data usage; STATIC_DRAW if left out
	# drawType: if needed, sets the type of primitive layout in the array
	constructor: (@M, bufferData, @stride, @components, @usageMode, @drawType) ->
		@gl = @M.gl
		if not @usageMode? then @usageMode = @gl.STATIC_DRAW
		if not @drawType? then @drawType = @gl.TRIANGLES

		# create a new buffer
		@bufferId = @gl.createBuffer()
		
		# activate the buffer as an array buffer
		@gl.bindBuffer(@gl.ARRAY_BUFFER, @bufferId)

		# upload the data
		@gl.bufferData(@gl.ARRAY_BUFFER, bufferData, @usageMode)

		# compute number of verticies from length (in bytes) and stride
		@numElements = (bufferData.length * bufferData.BYTES_PER_ELEMENT) / @stride


	bind: () ->
		@gl.bindBuffer(@gl.ARRAY_BUFFER, @bufferId)


	unbind: () ->
		@gl.bindBuffer(@gl.ARRAY_BUFFER, null)


	update: (data) ->
		@bind()
		@gl.bufferData(@gl.ARRAY_BUFFER, data, @usageMode)
	

	# We can draw the buffer directly, with the drawType specified at construction,
	#	if the data is ordered in a such a way that it does not require indexes to draw.
	# offset: optional (default 0)
	# count: optional (default this.numElements)
	draw: (offset, count) ->
		if not offset? then offset = 0
		if not count? then count = @numElements
		@gl.drawArrays(@drawType, offset, count)


class M3.IndexBuffer
	constructor: (@M, indexes, @drawType, @usageMode) ->
		@gl = @M.gl
		if not @usageMode? then @usageMode = @gl.STATIC_DRAW
	
		# create a new buffer
		@bufferId = @gl.createBuffer()
		
		# activate the buffer as an element buffer
		@gl.bindBuffer(@gl.ELEMENT_ARRAY_BUFFER, @bufferId)

		# upload the data
		@realLength = indexes.length
		@numIndices = indexes.length
		@data = new Uint16Array(indexes)
		@gl.bufferData(@gl.ELEMENT_ARRAY_BUFFER, @data, @usageMode)
	
	
	bind: () ->
		@gl.bindBuffer(@gl.ELEMENT_ARRAY_BUFFER, @bufferId)


	unbind: () ->
		@gl.bindBuffer(@gl.ARRAY_BUFFER, null)


	###
	update: (indices) ->
		if indices.length < @realLength
			@data.set(indices, 0)
			@numIndices = indices.length
		else
			@data = new Uint16Array(indices)
			@realLength = indices.length
			@numIndices = indices.length
			@gl.bufferData(@gl.ELEMENT_ARRAY_BUFFER, @data, @usageMode)
	###

	# Draw by using this buffer to index the currently bound array buffer(s).
	#	This buffer must be bound first. 
	# count: optional (default: @numIndices)
	# offset: optional (default: 0) in bytes, must be aligned with our type
	draw: (count, offset) ->
		if not count? then count = @numIndices
		if not offset? then offset = 0
		#args are: mode, count, type, offset
		@gl.drawElements(@drawType, count, @gl.UNSIGNED_SHORT, offset)


###
class M3.VertexBuffer extends M3.Buffer
	constructor: (M, args...) ->
		@BUFFER_TYPE = M.gl.ARRAY_BUFFER
		@BUFFER_DATA_TYPE = Float32Array
		super(M, args...)

	draw: ->
		@gl.drawArrays(@drawType, 0, @numVertices)
		

class M3.TexCoordBuffer extends M3.Buffer
	constructor: (M, args...) ->
		@BUFFER_TYPE = M.gl.ARRAY_BUFFER
		@BUFFER_DATA_TYPE = Float32Array
		super(M, args...)


class M3.IndexBuffer
	constructor: (M, args...) ->
		@BUFFER_TYPE = M.gl.ELEMENT_ARRAY_BUFFER
		@BUFFER_DATA_TYPE = Uint16Array
		super(M, args...)


	draw: ->
		#mode, count, type, offset
		@gl.drawElements(@drawType, @numVertices, @gl.UNSIGNED_SHORT, 0)
		
###
