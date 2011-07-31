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

get '/': ->
	render 'index'

view index: ->

layout ->
	html ->
		head ->
			title "MIN3D"
			meta charset: 'utf-8'
			link rel: 'stylesheet', href: "/css/ui-darkness/jquery-ui-1.8.14.custom.css"
			style '''
			body {padding: 0px; margin: 0px;}
			'''
			script src: "/js/glMatrix-0.9.5.min.js"
			script src: "/js/jquery-1.6.2.min.js"
			script src: "/js/jquery-ui-1.8.14.custom.min.js"
			script src: "/release/min3d.js"
			coffeescript ->
				$().ready ->
					mined_start()

		body ->
			canvas {id:'mined-canvas', tabindex:'1'}, ->
				p """Your browser doesn't appear to support the HTML5 
					<code>&lt;canvas&gt;</code> element."""
			
			div id:"start", 'class':'menu', ->
				"Start"

			div id:"main", 'class':'menu', ->
				div id:"main-single", ->
					"Play Single"
				div id:"single-options"

