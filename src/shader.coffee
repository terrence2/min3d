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
Represents a shader.  Default constructor takes a vertex and fragment shader as
element id's on the current html document and a map for attribute and uniform
names to attach to the underlying program id.
###
class M3.ShaderProgram
	constructor: (@M, vshader_id, fshader_id, aNames, uNames, literal) ->
		@gl = @M.gl

		# vertex shader id (WebGLShader)
		@vshader = null
		
		# fragment shader id (WebGLShader)
		@fshader = null
		
		# program id (WebGLProgram)
		if literal? and literal
			@vshader = @loadShaderFromString vshader_id, @gl.VERTEX_SHADER
			@fshader = @loadShaderFromString fshader_id, @gl.FRAGMENT_SHADER
		else
			@vshader = @loadShaderFromElement vshader_id
			@fshader = @loadShaderFromElement fshader_id
		@prog = @loadProgram @vshader, @fshader, aNames, uNames


	# bind as part of current rendering state
	use: ->
		@gl.useProgram @prog
		for name, _ of @attributes
			@enableAttribute name


	unuse: ->
		@gl.useProgram null
		for name, _ of @attributes
			@disableAttribute name
			


	# Link the named program attribute variable to the given vertex buffer.
	# name: a program variable name
	# buffer: an ArrayBuffer; MUST BE BOUND!
	# componentNumber: which component in the array buffer to bind
	linkAttribute: (name, buffer, componentNumber) ->
		# 0: attribute location
		# 1: size, in number of components of the given type
		# 2: the data type
		# 3: whether to normalize values
		# 4: stride between elements, in bytes
		# 5: offset into the buffer of first element, in bytes
		component = buffer.components[componentNumber]
		@gl.vertexAttribPointer(
			@attributes[name], 
			component.size, 
			component.type, 
			component.normalize, 
			buffer.stride, 
			component.offset
		)


	linkUniformMatrix: (name, mat) ->
		@gl.uniformMatrix4fv @uniforms[name], false, mat

	linkUniformMatrix3: (name, mat) ->
		@gl.uniformMatrix3fv @uniforms[name], false, mat


	linkSampler: (name, tex) ->
		@gl.uniform1i @uniforms[name], tex.index

	linkUniformVec3: (name, vec) ->
		@gl.uniform3fv @uniforms[name], vec

	linkUniformVec4: (name, vec) ->
		@gl.uniform4fv @uniforms[name], vec


	enableAttribute: (name) ->
		@gl.enableVertexAttribArray @attributes[name]

	disableAttribute: (name) ->
		@gl.disableVertexAttribArray @attributes[name]


	debugAttribute: (name) ->
		@debugAttributeId @attributes[name]
	debugAttributeId: (id) ->
		enabled = @gl.getVertexAttrib(	id, @gl.VERTEX_ATTRIB_ARRAY_ENABLED)
		size = @gl.getVertexAttrib(		id, @gl.VERTEX_ATTRIB_ARRAY_SIZE)
		stride = @gl.getVertexAttrib(	id, @gl.VERTEX_ATTRIB_ARRAY_STRIDE)
		type = @gl.getVertexAttrib(		id, @gl.VERTEX_ATTRIB_ARRAY_TYPE)
		normalized = @gl.getVertexAttrib(id, @gl.VERTEX_ATTRIB_ARRAY_NORMALIZED)
		console.log(id, enabled, size, stride, type, normalized)


	loadProgram: (@vshader, @fshader, aNames, uNames) ->
		prog = @gl.createProgram()
		@gl.attachShader prog, @vshader
		@gl.attachShader prog, @fshader
		@gl.linkProgram prog
		
		if not @gl.getProgramParameter prog, @gl.LINK_STATUS
			throw 'Shader Program failed to link'

		@use()

		@uniforms = {}
		for name in uNames
			@uniforms[name] = @gl.getUniformLocation prog, name
			if -1 == @uniforms[name]
				throw ("LinkError: unknown name '"+name+"'")

		@attributes = {}
		for name in aNames
			@attributes[name] = @gl.getAttribLocation prog, name
			if -1 == @attributes[name]
				throw ("LinkError: unknown name '"+name+"'")

		return prog


	loadShaderFromElement: (shader_id) ->
		elmt = document.getElementById(shader_id)
		if not elmt?
			throw "No such shader: '#{shader_id}'"
		
		shader_str = elmt.firstChild
		while k?
			if k.nodeType == 3
				shader_str += k.textContent
			k = k.nextSibling
		shader_str = shader_str.textContent

		switch elmt.type
			when 'x-shader/x-fragment'
				shader_type = @gl.FRAGMENT_SHADER
			when 'x-shader/x-vertex'
				shader_type = @gl.VERTEX_SHADER
			else
				throw "Unknown shader type: '#{elmt.type}'"

		return @loadShaderFromString shader_str, shader_type


	loadShaderFromString: (shader_str, shader_type) ->
		shader = @gl.createShader shader_type
		@gl.shaderSource shader, shader_str
		@gl.compileShader shader
		
		res = @gl.getShaderParameter shader, @gl.COMPILE_STATUS
		if not res
			v = (@gl.getShaderInfoLog shader) or 'success'
			console.log(v)
			throw "Shader failed to compile: '#{v}'"
		
		return shader

