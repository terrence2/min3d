/*
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
*/var M3, mined_start;
var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __indexOf = Array.prototype.indexOf || function(item) {
  for (var i = 0, l = this.length; i < l; i++) {
    if (this[i] === item) return i;
  }
  return -1;
};
M3 = new Object();
window.requestAnimFrame = (function() {
  return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || (function(callback, element) {
    return window.setTimeout(callback, 1000 / 60);
  });
})();
mined_start = function() {
  return window.M = new M3.Min3d;
};
M3.Min3d = (function() {
  var DATA_DIR;
  DATA_DIR = 'data';
  function Min3d() {
    this.onResize = __bind(this.onResize, this);
    this.frame = __bind(this.frame, this);    var req;
    this.mMV = mat4.create();
    this.sMV = [];
    this.mP = mat4.create();
    this.sP = [];
    this.shaders = {};
    this.textures = {};
    this.canvas = document.getElementById('mined-canvas');
    req = {
      alpha: false,
      depth: true,
      stencil: false,
      antialias: true,
      premultipliedAlpha: true,
      preserveDrawingBuffer: false
    };
    this.gl = this.canvas.getContext('experimental-webgl', req);
    this.setupGL();
    this.agent = new M3.Agent(this);
    this.input = new M3.Input(this, this.agent);
    this.skybox = new M3.Skybox(this);
    this.world = new M3.World(this);
    this.menu = new M3.Menu(this);
    this.board = null;
    this.doStart();
    $(window).resize(this.onResize);
    this.debug = new M3.Debug(this);
    this.prior = new Date().getTime();
    requestAnimFrame(this.frame, this.canvas);
    this.frame();
  }
  Min3d.prototype.frame = function() {
    var dt, now;
    now = (new Date()).getTime();
    dt = (now - this.prior) / 1000;
    this.agent.move(dt);
    this.board.move(dt);
    this.draw_scene();
    this.prior = now;
    return requestAnimFrame(this.frame, this.canvas);
  };
  Min3d.prototype.checkGLError = function() {
    var error, str;
    error = this.gl.getError();
    if (error !== this.gl.NO_ERROR) {
      str = "GL Error: " + error;
      document.body.appendChild(document.createTextNode(str));
      throw str;
    }
  };
  Min3d.prototype.draw_scene = function() {
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.mvPush();
    mat4.rotateX(this.mMV, -this.agent.ang[0]);
    mat4.rotateY(this.mMV, -this.agent.ang[1]);
    mat4.translate(this.mMV, vec3.negate(this.agent.pos, vec3.create()));
    this.agent.draw();
    this.skybox.draw();
    this.board.draw();
    this.mvPop();
    this.gl.finish();
    return this.gl.flush();
  };
  Min3d.prototype.setupGL = function() {
    this.gl.clearColor(0, 0, 0, 1);
    this.gl.clearDepth(1);
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.depthFunc(this.gl.LEQUAL);
    this.gl.enable(this.gl.CULL_FACE);
    this.gl.frontFace(this.gl.CCW);
    this.gl.cullFace(this.gl.BACK);
    mat4.identity(this.mP);
    mat4.identity(this.mMV);
    this.onResize();
    return console.log("Supported Extensions: ", this.gl.getSupportedExtensions());
  };
  Min3d.prototype.onResize = function(e) {
    this.canvas.width = $(window).width();
    this.canvas.height = $(window).height();
    this.aspectRatio = this.canvas.width / this.canvas.height;
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    return mat4.perspective(60, this.canvas.width / this.canvas.height, 0.1, 10000.0, this.mP);
  };
  Min3d.prototype.mvPush = function() {
    return this.sMV.push(mat4.create(this.mMV));
  };
  Min3d.prototype.mvPop = function() {
    return this.mMV = this.sMV.pop();
  };
  Min3d.prototype.pPush = function() {
    return this.sP.push(mat4.create(this.mP));
  };
  Min3d.prototype.pPop = function() {
    return this.mP = this.sP.pop();
  };
  /*
  	Enter the game start state
  	*/
  Min3d.prototype.doStart = function() {
    this.menu.nextState('start');
    this.board = this.world.makeStart();
    return this.agent.reset();
  };
  /*
  	Restart the current state.
  	*/
  Min3d.prototype.doRestart = function() {
    this.menu.nextState('play');
    this.board = this.world.resetLevel();
    return this.world.positionAgentForBoard(this.board);
  };
  /*
  	Restart with the same layout, but different mines.
  	*/
  Min3d.prototype.doNewGame = function() {
    this.menu.nextState('play');
    this.board = this.world.makeCustomLikeCurrent();
    return this.world.positionAgentForBoard(this.board);
  };
  /*
  	Enter the death state.
  	*/
  Min3d.prototype.doDeath = function(minePos) {
    return this.menu.nextState('death');
  };
  /*
  	Enter the win state.
  	*/
  Min3d.prototype.doVictory = function() {
    return this.menu.nextState('win');
  };
  /*
  	Load a new level with the given parameters.
  	*/
  Min3d.prototype.loadCustomLevel = function(nX, nY, nZ, nMines) {
    this.board = this.world.makeCustom(nX, nY, nZ, nMines);
    return this.world.positionAgentForBoard(this.board);
  };
  /*
  	Create and return a shader, unless it is already loaded, in which case we 
  	return the already loaded shared of the given resources.
  	*/
  Min3d.prototype.loadShaderFromElements = function(vshader_id, fshader_id, aNames, uNames) {
    var index, shader;
    index = vshader_id + ':' + fshader_id;
    if (__indexOf.call(this.shaders, index) >= 0) {
      return this.shaders[index];
    }
    shader = new M3.ShaderProgram(this, vshader_id, fshader_id, aNames, uNames);
    this.shaders[index] = shader;
    return shader;
  };
  Min3d.prototype.loadShaderFromStrings = function(vshader, fshader, aNames, uNames) {
    var index, shader;
    index = vshader + ':' + fshader;
    if (__indexOf.call(this.shaders, index) >= 0) {
      return this.shaders[index];
    }
    shader = new M3.ShaderProgram(this, vshader, fshader, aNames, uNames, true);
    this.shaders[index] = shader;
    return shader;
  };
  Min3d.prototype.loadTexture = function(url) {
    var texture;
    url = DATA_DIR + url;
    if (__indexOf.call(this.textures, url) >= 0) {
      return this.textures[url];
    }
    texture = new M3.Texture2D(this, url);
    this.textures[url] = texture;
    return texture;
  };
  Min3d.prototype.loadCubeMap = function(url, extension) {
    var cm;
    url = DATA_DIR + url;
    if (__indexOf.call(this.textures, url) >= 0) {
      return this.textures[url];
    }
    cm = new M3.CubeMap(this, url, extension);
    this.textures[url] = cm;
    return cm;
  };
  return Min3d;
})();/*
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
*/M3.Debug = (function() {
  var FRAGMENT_SHADER, VERTEX_SHADER;
  VERTEX_SHADER = "attribute vec3 aVertexPosition;\n\nuniform mat4 uMVMatrix;\nuniform mat4 uPMatrix;\n\nvoid main(void) {\n	gl_PointSize = 3.0;\n	gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);\n}";
  FRAGMENT_SHADER = "	#ifdef GL_ES\n	precision highp float;\n	#endif\n\n	uniform vec4 uColor;\n\n	void main(void) {\n		gl_FragColor = uColor;\n	}";
  function Debug(M) {
    var tri;
    this.M = M;
    this.gl = this.M.gl;
    this.prog = this.M.loadShaderFromStrings(VERTEX_SHADER, FRAGMENT_SHADER, ["aVertexPosition"], ["uMVMatrix", "uPMatrix", "uColor"]);
    tri = [0.0, 0.0, 0.0, 0.0, -1.0, 0.0, 1.0, 0.0, 0.0];
    this.triVerts = new M3.ArrayBuffer(this.M, new Float32Array(tri), 12, [
      {
        size: 3,
        type: this.gl.FLOAT,
        offset: 0,
        normalize: false
      }
    ], this.gl.STATIC_DRAW, this.gl.TRIANGLES);
  }
  Debug.prototype.drawRay = function(ray, scale, color) {
    var dir, dst, line, lineVerts, point, pointVerts;
    if (!(scale != null)) {
      scale = 50;
    }
    if (!(color != null)) {
      color = [1, 1, 1, 1];
    }
    dir = vec3.create(ray.dir);
    vec3.scale(dir, scale);
    dst = vec3.create(ray.pos);
    vec3.add(dst, dir);
    line = [ray.pos[0], ray.pos[1], ray.pos[2], dst[0], dst[1], dst[2]];
    lineVerts = new M3.ArrayBuffer(this.M, new Float32Array(line), 12, [
      {
        size: 3,
        type: this.gl.FLOAT,
        offset: 0,
        normalize: false
      }
    ], this.gl.STATIC_DRAW, this.gl.LINES);
    point = [dst[0], dst[1], dst[2]];
    pointVerts = new M3.ArrayBuffer(this.M, new Float32Array(point), 12, [
      {
        size: 3,
        type: this.gl.FLOAT,
        offset: 0,
        normalize: false
      }
    ], this.gl.STATIC_DRAW, this.gl.POINTS);
    this.gl.disable(this.gl.DEPTH_TEST);
    this.prog.use();
    lineVerts.bind();
    this.prog.linkAttribute('aVertexPosition', lineVerts, 0);
    this.prog.linkUniformMatrix('uPMatrix', this.M.mP);
    this.prog.linkUniformMatrix('uMVMatrix', this.M.mMV);
    this.prog.linkUniformVec4('uColor', new Float32Array(color));
    lineVerts.draw();
    this.prog.unuse();
    this.prog.use();
    pointVerts.bind();
    this.prog.linkAttribute('aVertexPosition', pointVerts, 0);
    this.prog.linkUniformMatrix('uPMatrix', this.M.mP);
    this.prog.linkUniformMatrix('uMVMatrix', this.M.mMV);
    this.prog.linkUniformVec4('uColor', new Float32Array(color));
    pointVerts.draw();
    this.prog.unuse();
    return this.gl.enable(this.gl.DEPTH_TEST);
  };
  return Debug;
})();/*
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
*/var cart2polar, polar2cart;
M3.Ray = (function() {
  function Ray(pos, dir) {
    this.pos = pos;
    this.dir = dir;
  }
  Ray.prototype.toString = function() {
    return "@(" + this.pos[0] + ", " + this.pos[1] + ", " + this.pos[2] + ") ->(" + this.dir[0] + ", " + this.dir[1] + ", " + this.dir[2] + ")";
  };
  return Ray;
})();
M3.AABB = (function() {
  function AABB(lo, hi) {
    this.lo = lo;
    this.hi = hi;
  }
  AABB.prototype.intersectPoint = function(v) {
    var axis;
    for (axis = 0; axis <= 2; axis++) {
      if (v[axis] < this.lo[axis] || v[axis] > this.hi[axis]) {
        return 0;
      }
    }
    return 1;
  };
  AABB.prototype.intersectRay = function(ray) {
    var a, t1, t2, tFar, tNear, _ref;
    tNear = -1000000000;
    tFar = 1000000000;
    if (this.intersectPoint(ray.pos)) {
      return 0;
    }
    for (a = 0; a <= 2; a++) {
      if (ray.dir[a] === 0 && (ray.pos[a] > this.hi[a] || ray.pos[a] < this.lo[a])) {
        return -1;
      }
      t1 = (this.lo[a] - ray.pos[a]) / ray.dir[a];
      t2 = (this.hi[a] - ray.pos[a]) / ray.dir[a];
      if (t1 > t2) {
        _ref = [t1, t2], t2 = _ref[0], t1 = _ref[1];
      }
      if (t1 > tNear) {
        tNear = t1;
      }
      if (t2 < tFar) {
        tFar = t2;
      }
      if (tNear > tFar || tFar < 0) {
        return -1;
      }
    }
    if (tNear < 0) {
      return -1;
    }
    return tNear;
  };
  return AABB;
})();
/*
	byte a;
	float t1, t2, temp;
	float tnear = -999999.9f;
	float tfar = 999999.9f;
	*tNear = 0.0f;
	*tFar = 0.0f;

	if( m_PointInBox( start, bbox ) ) return 1;
	
	for( a=0 ; a<3 ; a++ )
	{
		// check for simple exclusions
		if( (dir[a] == 0) && ( (start[a] > bbox->hibounds[a]) || (start[a] < bbox->lobounds[a]) ) )
			return 0;

		// get a distance to each plane
		t1 = ( bbox->lobounds[a] - start[a] ) / dir[a];
		t2 = ( bbox->hibounds[a] - start[a] ) / dir[a];

		// the farther plane is always t2
		if( t1 > t2 ) // swap
		{
			temp = t1;
			t1 = t2;
			t2 = temp;
		}

		// we need to cross the near plane first on EVERY axis
		if( t1 > tnear ) tnear = t1;
		if( t2 < tfar ) tfar = t2;

		if( tnear > tfar ) return 0;
		if( tfar < 0 ) return 0;
	}

	*tNear = tnear;
	*tFar = tfar;
	return 1;
*/
M3.Edge = (function() {
  function Edge(i0, i1) {
    if (i0 < i1) {
      this.i0 = i0;
      this.i1 = i1;
    } else {
      this.i0 = i1;
      this.i1 = i0;
    }
    this.tris = [];
  }
  Edge.prototype.toString = function() {
    return "" + this.i0 + "-" + this.i1;
  };
  return Edge;
})();
M3.Tri = (function() {
  function Tri(a, b, c) {
    this.a = a;
    this.b = b;
    this.c = c;
    this.edges = [];
  }
  Tri.prototype.toString = function() {
    return "" + this.a + "-" + this.b + "-" + this.c;
  };
  return Tri;
})();
cart2polar = function(x, y, z) {
  var phi, r, theta;
  r = Math.sqrt(x * x + y * y + z * z);
  phi = Math.atan2(x, z);
  theta = Math.acos(y / r);
  return [r, phi, theta];
};
polar2cart = function(r, phi, theta) {
  var x, y, z;
  z = r * Math.sin(theta) * Math.cos(phi);
  x = r * Math.sin(theta) * Math.sin(phi);
  y = r * Math.cos(theta);
  return [x, y, z];
};/*
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
*/var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
M3.Input = (function() {
  var CLICK_TIMEOUT, CLICK_TRAVEL;
  CLICK_TIMEOUT = 200;
  CLICK_TRAVEL = 15;
  function Input(M, agent) {
    var action, az, defaultActions, i, keyname;
    this.M = M;
    this.onKeyUp = __bind(this.onKeyUp, this);
    this.onKeyDown = __bind(this.onKeyDown, this);
    this.onMouseMove = __bind(this.onMouseMove, this);
    this.onMouseOut = __bind(this.onMouseOut, this);
    this.onMouseOver = __bind(this.onMouseOver, this);
    this.onMouseUp = __bind(this.onMouseUp, this);
    this.onMouseDown = __bind(this.onMouseDown, this);
    this.onClick = __bind(this.onClick, this);
    this.code2name = {
      16: "shift",
      32: "space",
      37: "left",
      38: "up",
      39: "right",
      40: "down"
    };
    az = "abcdefghijklmnopqrstuvwxyz";
    for (i = 0; i <= 26; i++) {
      this.code2name[65 + i] = az[i];
    }
    az = "0123456789";
    for (i = 0; i <= 10; i++) {
      this.code2name[48 + i] = az[i];
    }
    this.keydown2action = {};
    this.keyup2action = {};
    defaultActions = {
      "w": "+forward",
      "a": "+left",
      "s": "+backward",
      "d": "+right",
      "left": "+turnleft",
      "right": "+turnright",
      "up": "+turnup",
      "down": "+turndown",
      "space": "+up",
      "r": "+up",
      "f": "+down"
    };
    for (keyname in defaultActions) {
      action = defaultActions[keyname];
      this.bind(keyname, action);
    }
    this.heldActions = {};
    this.mode = "skin";
    this.actionMap = {
      "skin": {
        "+forward": agent.forward_on,
        "-forward": agent.forward_off,
        "+backward": agent.backward_on,
        "-backward": agent.backward_off,
        "+left": agent.left_on,
        "-left": agent.left_off,
        "+right": agent.right_on,
        "-right": agent.right_off,
        "+up": agent.up_on,
        "-up": agent.up_off,
        "+down": agent.down_on,
        "-down": agent.down_off,
        "+turnleft": agent.turnleft_on,
        "-turnleft": agent.turnleft_off,
        "+turnright": agent.turnright_on,
        "-turnright": agent.turnright_off,
        "+turnup": agent.turnup_on,
        "-turnup": agent.turnup_off,
        "+turndown": agent.turndown_on,
        "-turndown": agent.turndown_off
      }
    };
    this.mouseDragState = false;
    this.mouseMap = {
      "skin": {
        "bclick0": agent.browser_leftclick,
        "bclick1": agent.browser_middleclick,
        "bclick2": agent.browser_rightclick,
        "click0": agent.mouse_leftclick,
        "click1": agent.mouse_middleclick,
        "click2": agent.mouse_rightclick,
        "+drag0": agent.mouse_dragturn_on,
        "@drag0": agent.mouse_dragturn_event,
        "-drag0": agent.mouse_dragturn_off,
        "+drag1": agent.mouse_joyturn_on,
        "@drag1": agent.mouse_joyturn_event,
        "-drag1": agent.mouse_joyturn_off
      }
    };
    this.mousePosition = vec3.create();
    this.downPosition = null;
    $(this.M.canvas).click(this.onClick);
    $(this.M.canvas).mousedown(this.onMouseDown);
    $(this.M.canvas).mouseup(this.onMouseUp);
    $(this.M.canvas).mousemove(this.onMouseMove);
    $(this.M.canvas).mouseover(this.onMouseOver);
    $(this.M.canvas).mouseout(this.onMouseOut);
    $(this.M.canvas).keydown(this.onKeyDown);
    $(this.M.canvas).keyup(this.onKeyUp);
  }
  Input.prototype.bind = function(keyname, action) {
    this.keydown2action[keyname] = action;
    if (action[0] === "+") {
      return this.keyup2action[keyname] = "-" + action.slice(1, action.length);
    }
  };
  Input.prototype.onClick = function(e) {
    var callback;
    callback = this.mouseMap[this.mode]["bclick" + String(e.button)];
    if (callback != null) {
      return callback(e.clientX, e.clientY);
    }
  };
  Input.prototype.onMouseDown = function(e) {
    var callback, _ref;
    console.log("mousedown: " + String(e.button));
    if ((0 <= (_ref = e.button) && _ref <= 1)) {
      if (this.mouseDragState !== false) {
        return;
      }
      this.mouseDragState = e.button;
      this.downPosition = [e.clientX, e.clientY, (new Date()).getTime()];
      callback = this.mouseMap[this.mode]["+drag" + String(e.button)];
      if (callback != null) {
        return callback(e.clientX, e.clientY);
      }
    }
  };
  Input.prototype.onMouseUp = function(e) {
    var callback, dX, dY, deltaT, deltaV;
    console.log("mouseup: " + String(e.button));
    if (this.mouseDragState !== false) {
      callback = this.mouseMap[this.mode]["@drag" + String(this.mouseDragState)];
      if (callback != null) {
        callback(e.clientX, e.clientY);
      }
      callback = this.mouseMap[this.mode]["-drag" + String(this.mouseDragState)];
      if (callback != null) {
        callback();
      }
      this.mouseDragState = false;
      deltaT = (new Date()).getTime() - this.downPosition[2];
      if (deltaT < CLICK_TIMEOUT) {
        dX = e.clientX - this.downPosition[0];
        dY = e.clientY - this.downPosition[1];
        deltaV = Math.sqrt(dX * dX + dY * dY);
        if (deltaV < CLICK_TRAVEL) {
          callback = this.mouseMap[this.mode]["click" + String(e.button)];
          if (callback != null) {
            return callback(e.clientX, e.clientY);
          }
        }
      }
    }
  };
  Input.prototype.onMouseOver = function(e) {
    return this.mousePosition[2] = 1;
  };
  Input.prototype.onMouseOut = function(e) {
    this.mousePosition[2] = 0;
    console.log("mouseout: " + String(e.button));
    return this.onMouseUp(e);
  };
  Input.prototype.onMouseMove = function(e) {
    var callback;
    this.mousePosition[0] = e.clientX;
    this.mousePosition[1] = e.clientY;
    if (this.mouseDragState !== false) {
      callback = this.mouseMap[this.mode]["@drag" + String(this.mouseDragState)];
      if (callback != null) {
        return callback(e.clientX, e.clientY);
      }
    }
  };
  Input.prototype.onKeyDown = function(e) {
    var action, callback, keyname, subaction;
    keyname = this.code2name[e.which];
    if (!(keyname != null)) {
      return;
    }
    action = this.keydown2action[keyname];
    if (!(action != null)) {
      return;
    }
    if (action[0] === "+") {
      subaction = action.slice(1, (action.length + 1) || 9e9);
      if (this.heldActions[subaction] != null) {
        return;
      }
      this.heldActions[subaction] = true;
    }
    console.log(action);
    callback = this.actionMap[this.mode][action];
    if (!(callback != null)) {
      return;
    }
    return callback(action);
  };
  Input.prototype.onKeyUp = function(e) {
    var action, callback, keyname, subaction;
    keyname = this.code2name[e.which];
    if (!(keyname != null)) {
      return;
    }
    action = this.keyup2action[keyname];
    if (!(action != null)) {
      return;
    }
    if (action[0] === "-") {
      subaction = action.slice(1, (action.length + 1) || 9e9);
      delete this.heldActions[subaction];
    }
    console.log(action);
    callback = this.actionMap[this.mode][action];
    if (!(callback != null)) {
      return;
    }
    return callback(action);
  };
  return Input;
})();/*
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
*/
/*
Represents a shader.  Default constructor takes a vertex and fragment shader as
element id's on the current html document and a map for attribute and uniform
names to attach to the underlying program id.
*/M3.ShaderProgram = (function() {
  function ShaderProgram(M, vshader_id, fshader_id, aNames, uNames, literal) {
    this.M = M;
    this.gl = this.M.gl;
    this.vshader = null;
    this.fshader = null;
    if ((literal != null) && literal) {
      this.vshader = this.loadShaderFromString(vshader_id, this.gl.VERTEX_SHADER);
      this.fshader = this.loadShaderFromString(fshader_id, this.gl.FRAGMENT_SHADER);
    } else {
      this.vshader = this.loadShaderFromElement(vshader_id);
      this.fshader = this.loadShaderFromElement(fshader_id);
    }
    this.prog = this.loadProgram(this.vshader, this.fshader, aNames, uNames);
  }
  ShaderProgram.prototype.use = function() {
    var name, _, _ref, _results;
    this.gl.useProgram(this.prog);
    _ref = this.attributes;
    _results = [];
    for (name in _ref) {
      _ = _ref[name];
      _results.push(this.enableAttribute(name));
    }
    return _results;
  };
  ShaderProgram.prototype.unuse = function() {
    var name, _, _ref, _results;
    this.gl.useProgram(null);
    _ref = this.attributes;
    _results = [];
    for (name in _ref) {
      _ = _ref[name];
      _results.push(this.disableAttribute(name));
    }
    return _results;
  };
  ShaderProgram.prototype.linkAttribute = function(name, buffer, componentNumber) {
    var component;
    component = buffer.components[componentNumber];
    return this.gl.vertexAttribPointer(this.attributes[name], component.size, component.type, component.normalize, buffer.stride, component.offset);
  };
  ShaderProgram.prototype.linkUniformMatrix = function(name, mat) {
    return this.gl.uniformMatrix4fv(this.uniforms[name], false, mat);
  };
  ShaderProgram.prototype.linkUniformMatrix3 = function(name, mat) {
    return this.gl.uniformMatrix3fv(this.uniforms[name], false, mat);
  };
  ShaderProgram.prototype.linkSampler = function(name, tex) {
    return this.gl.uniform1i(this.uniforms[name], tex.index);
  };
  ShaderProgram.prototype.linkUniformVec3 = function(name, vec) {
    return this.gl.uniform3fv(this.uniforms[name], vec);
  };
  ShaderProgram.prototype.linkUniformVec4 = function(name, vec) {
    return this.gl.uniform4fv(this.uniforms[name], vec);
  };
  ShaderProgram.prototype.enableAttribute = function(name) {
    return this.gl.enableVertexAttribArray(this.attributes[name]);
  };
  ShaderProgram.prototype.disableAttribute = function(name) {
    return this.gl.disableVertexAttribArray(this.attributes[name]);
  };
  ShaderProgram.prototype.debugAttribute = function(name) {
    return this.debugAttributeId(this.attributes[name]);
  };
  ShaderProgram.prototype.debugAttributeId = function(id) {
    var enabled, normalized, size, stride, type;
    enabled = this.gl.getVertexAttrib(id, this.gl.VERTEX_ATTRIB_ARRAY_ENABLED);
    size = this.gl.getVertexAttrib(id, this.gl.VERTEX_ATTRIB_ARRAY_SIZE);
    stride = this.gl.getVertexAttrib(id, this.gl.VERTEX_ATTRIB_ARRAY_STRIDE);
    type = this.gl.getVertexAttrib(id, this.gl.VERTEX_ATTRIB_ARRAY_TYPE);
    normalized = this.gl.getVertexAttrib(id, this.gl.VERTEX_ATTRIB_ARRAY_NORMALIZED);
    return console.log(id, enabled, size, stride, type, normalized);
  };
  ShaderProgram.prototype.loadProgram = function(vshader, fshader, aNames, uNames) {
    var name, prog, _i, _j, _len, _len2;
    this.vshader = vshader;
    this.fshader = fshader;
    prog = this.gl.createProgram();
    this.gl.attachShader(prog, this.vshader);
    this.gl.attachShader(prog, this.fshader);
    this.gl.linkProgram(prog);
    if (!this.gl.getProgramParameter(prog, this.gl.LINK_STATUS)) {
      throw 'Shader Program failed to link';
    }
    this.use();
    this.uniforms = {};
    for (_i = 0, _len = uNames.length; _i < _len; _i++) {
      name = uNames[_i];
      this.uniforms[name] = this.gl.getUniformLocation(prog, name);
      if (-1 === this.uniforms[name]) {
        throw "LinkError: unknown name '" + name + "'";
      }
    }
    this.attributes = {};
    for (_j = 0, _len2 = aNames.length; _j < _len2; _j++) {
      name = aNames[_j];
      this.attributes[name] = this.gl.getAttribLocation(prog, name);
      if (-1 === this.attributes[name]) {
        throw "LinkError: unknown name '" + name + "'";
      }
    }
    return prog;
  };
  ShaderProgram.prototype.loadShaderFromElement = function(shader_id) {
    var elmt, k, shader_str, shader_type;
    elmt = document.getElementById(shader_id);
    if (!(elmt != null)) {
      throw "No such shader: '" + shader_id + "'";
    }
    shader_str = elmt.firstChild;
    while (k != null) {
      if (k.nodeType === 3) {
        shader_str += k.textContent;
      }
      k = k.nextSibling;
    }
    shader_str = shader_str.textContent;
    switch (elmt.type) {
      case 'x-shader/x-fragment':
        shader_type = this.gl.FRAGMENT_SHADER;
        break;
      case 'x-shader/x-vertex':
        shader_type = this.gl.VERTEX_SHADER;
        break;
      default:
        throw "Unknown shader type: '" + elmt.type + "'";
    }
    return this.loadShaderFromString(shader_str, shader_type);
  };
  ShaderProgram.prototype.loadShaderFromString = function(shader_str, shader_type) {
    var res, shader, v;
    shader = this.gl.createShader(shader_type);
    this.gl.shaderSource(shader, shader_str);
    this.gl.compileShader(shader);
    res = this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS);
    if (!res) {
      v = (this.gl.getShaderInfoLog(shader)) || 'success';
      console.log(v);
      throw "Shader failed to compile: '" + v + "'";
    }
    return shader;
  };
  return ShaderProgram;
})();/*
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
*/
/*
An OpenGL "Buffer".  Useful for packing up and sending vertex data to a
 	rendering device.

NOTE: this class does not take on the potentially quite difficult task of 
	packaging data.  The user is expected to build the data buffer manually
	and just pass in it and the info needed to bind it.
*/M3.ArrayBuffer = (function() {
  function ArrayBuffer(M, bufferData, stride, components, usageMode, drawType) {
    this.M = M;
    this.stride = stride;
    this.components = components;
    this.usageMode = usageMode;
    this.drawType = drawType;
    this.gl = this.M.gl;
    if (!(this.usageMode != null)) {
      this.usageMode = this.gl.STATIC_DRAW;
    }
    if (!(this.drawType != null)) {
      this.drawType = this.gl.TRIANGLES;
    }
    this.bufferId = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.bufferId);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, bufferData, this.usageMode);
    this.numElements = (bufferData.length * bufferData.BYTES_PER_ELEMENT) / this.stride;
  }
  ArrayBuffer.prototype.bind = function() {
    return this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.bufferId);
  };
  ArrayBuffer.prototype.unbind = function() {
    return this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
  };
  ArrayBuffer.prototype.update = function(data) {
    this.bind();
    return this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.usageMode);
  };
  ArrayBuffer.prototype.draw = function(offset, count) {
    if (!(offset != null)) {
      offset = 0;
    }
    if (!(count != null)) {
      count = this.numElements;
    }
    return this.gl.drawArrays(this.drawType, offset, count);
  };
  return ArrayBuffer;
})();
M3.IndexBuffer = (function() {
  function IndexBuffer(M, indexes, drawType, usageMode) {
    this.M = M;
    this.drawType = drawType;
    this.usageMode = usageMode;
    this.gl = this.M.gl;
    if (!(this.usageMode != null)) {
      this.usageMode = this.gl.STATIC_DRAW;
    }
    this.bufferId = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.bufferId);
    this.realLength = indexes.length;
    this.numIndices = indexes.length;
    this.data = new Uint16Array(indexes);
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, this.data, this.usageMode);
  }
  IndexBuffer.prototype.bind = function() {
    return this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.bufferId);
  };
  IndexBuffer.prototype.unbind = function() {
    return this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
  };
  /*
  	update: (indices) ->
  		if indices.length < @realLength
  			@data.set(indices, 0)
  			@numIndices = indices.length
  		else
  			@data = new Uint16Array(indices)
  			@realLength = indices.length
  			@numIndices = indices.length
  			@gl.bufferData(@gl.ELEMENT_ARRAY_BUFFER, @data, @usageMode)
  	*/
  IndexBuffer.prototype.draw = function(count, offset) {
    if (!(count != null)) {
      count = this.numIndices;
    }
    if (!(offset != null)) {
      offset = 0;
    }
    return this.gl.drawElements(this.drawType, count, this.gl.UNSIGNED_SHORT, offset);
  };
  return IndexBuffer;
})();
/*
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
		
*//*
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
*/var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
M3.Texture2D = (function() {
  function Texture2D(M, url) {
    this.M = M;
    this.url = url;
    this.gl = this.M.gl;
    this.MODE = this.gl.TEXTURE_2D;
    this.id = this.gl.createTexture();
    this.img = new Image();
    this.img.onload = __bind(function(e) {
      this.gl.activeTexture(this.gl.TEXTURE0);
      this.gl.bindTexture(this.MODE, this.id);
      this.gl.texImage2D(this.MODE, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.img);
      this.M.checkGLError();
      this.gl.texParameteri(this.MODE, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
      this.gl.texParameteri(this.MODE, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_NEAREST);
      this.gl.texParameteri(this.MODE, this.gl.TEXTURE_WRAP_S, this.gl.REPEAT);
      this.gl.texParameteri(this.MODE, this.gl.TEXTURE_WRAP_T, this.gl.REPEAT);
      this.gl.generateMipmap(this.MODE);
      return this.gl.bindTexture(this.MODE, null);
    }, this);
    this.img.src = this.url;
    this.index = null;
  }
  Texture2D.prototype.index2TexUnit = function(index) {
    return this.gl['TEXTURE' + String(index)];
  };
  Texture2D.prototype.bind = function(index) {
    var actual;
    this.index = index;
    actual = this.index2TexUnit(this.index);
    this.gl.activeTexture(actual);
    return this.gl.bindTexture(this.MODE, this.id);
  };
  Texture2D.prototype.unbind = function() {
    var actual;
    actual = this.index2TexUnit(this.index);
    this.gl.activeTexture(actual);
    return this.gl.bindTexture(this.MODE, null);
  };
  return Texture2D;
})();/*
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
*/var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
M3.CubeMap = (function() {
  function CubeMap(M, baseUrl, extension) {
    var allLoaded, done, preLoaded;
    this.M = M;
    this.gl = this.M.gl;
    this.MODE = this.gl.TEXTURE_CUBE_MAP;
    this.id = this.gl.createTexture();
    this.gl.bindTexture(this.MODE, this.id);
    this.imgPX = new Image();
    this.imgNX = new Image();
    this.imgPY = new Image();
    this.imgNY = new Image();
    this.imgPZ = new Image();
    this.imgNZ = new Image();
    allLoaded = __bind(function() {
      this.gl.bindTexture(this.MODE, this.id);
      this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.imgPX);
      this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.imgNX);
      this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.imgPY);
      this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.imgNY);
      this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.imgPZ);
      this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.imgNZ);
      this.gl.texParameteri(this.MODE, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
      this.gl.texParameteri(this.MODE, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
      this.gl.texParameteri(this.MODE, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
      return this.gl.texParameteri(this.MODE, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    }, this);
    done = 0;
    preLoaded = __bind(function(e) {
      done += 1;
      if (done === 6) {
        return allLoaded();
      }
    }, this);
    this.imgPX.onload = preLoaded;
    this.imgNX.onload = preLoaded;
    this.imgPY.onload = preLoaded;
    this.imgNY.onload = preLoaded;
    this.imgPZ.onload = preLoaded;
    this.imgNZ.onload = preLoaded;
    this.imgPX.src = baseUrl + "px" + extension;
    this.imgNX.src = baseUrl + "nx" + extension;
    this.imgPY.src = baseUrl + "py" + extension;
    this.imgNY.src = baseUrl + "ny" + extension;
    this.imgPZ.src = baseUrl + "pz" + extension;
    this.imgNZ.src = baseUrl + "nz" + extension;
    this.index = null;
  }
  CubeMap.prototype.index2TexUnit = function(index) {
    return this.gl['TEXTURE' + String(index)];
  };
  CubeMap.prototype.bind = function(index) {
    var actual;
    this.index = index;
    actual = this.index2TexUnit(this.index);
    this.gl.activeTexture(actual);
    return this.gl.bindTexture(this.MODE, this.id);
  };
  CubeMap.prototype.unbind = function() {
    var actual;
    actual = this.index2TexUnit(this.index);
    this.gl.activeTexture(actual);
    return this.gl.bindTexture(this.MODE, null);
  };
  return CubeMap;
})();/*
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
*/var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
M3.Agent = (function() {
  var MOUSE_DRAG_SPEED, MOUSE_JOY_SPEED, PITCH, ROT_SPEED, SPEED, X, Y, YAW, Z;
  X = 0;
  Y = 1;
  Z = 2;
  YAW = 1;
  PITCH = 0;
  SPEED = 15.0;
  ROT_SPEED = Math.PI / 180;
  MOUSE_DRAG_SPEED = 1 / 500;
  MOUSE_JOY_SPEED = 1 / 200;
  function Agent(M) {
    this.M = M;
    this.mouse_joyturn_event = __bind(this.mouse_joyturn_event, this);
    this.mouse_joyturn_off = __bind(this.mouse_joyturn_off, this);
    this.mouse_joyturn_on = __bind(this.mouse_joyturn_on, this);
    this.mouse_dragturn_event = __bind(this.mouse_dragturn_event, this);
    this.mouse_dragturn_off = __bind(this.mouse_dragturn_off, this);
    this.mouse_dragturn_on = __bind(this.mouse_dragturn_on, this);
    this.mouse_rightclick = __bind(this.mouse_rightclick, this);
    this.mouse_middleclick = __bind(this.mouse_middleclick, this);
    this.mouse_leftclick = __bind(this.mouse_leftclick, this);
    this.browser_rightclick = __bind(this.browser_rightclick, this);
    this.browser_middleclick = __bind(this.browser_middleclick, this);
    this.browser_leftclick = __bind(this.browser_leftclick, this);
    this.turnright_off = __bind(this.turnright_off, this);
    this.turnright_on = __bind(this.turnright_on, this);
    this.turnleft_off = __bind(this.turnleft_off, this);
    this.turnleft_on = __bind(this.turnleft_on, this);
    this.turndown_off = __bind(this.turndown_off, this);
    this.turndown_on = __bind(this.turndown_on, this);
    this.turnup_off = __bind(this.turnup_off, this);
    this.turnup_on = __bind(this.turnup_on, this);
    this.right_off = __bind(this.right_off, this);
    this.right_on = __bind(this.right_on, this);
    this.left_off = __bind(this.left_off, this);
    this.left_on = __bind(this.left_on, this);
    this.down_off = __bind(this.down_off, this);
    this.down_on = __bind(this.down_on, this);
    this.up_off = __bind(this.up_off, this);
    this.up_on = __bind(this.up_on, this);
    this.backward_off = __bind(this.backward_off, this);
    this.backward_on = __bind(this.backward_on, this);
    this.forward_off = __bind(this.forward_off, this);
    this.forward_on = __bind(this.forward_on, this);
    this.pos = vec3.create();
    this.ang = vec3.create();
    this.forward = vec3.create([0, 0, -1]);
    this.worldPointer = new M3.Ray(this.pos, this.forward);
    this.mvReq = vec3.create();
    this.angReq = vec3.create();
    this.dragCenter = vec3.create();
    this.dragPrior = vec3.create();
  }
  Agent.prototype.reset = function() {
    this.pos = vec3.create();
    return this.ang = vec3.create();
  };
  Agent.prototype.forward_on = function(action) {
    return this.mvReq[Z] -= 1.0;
  };
  Agent.prototype.forward_off = function(action) {
    return this.mvReq[Z] += 1.0;
  };
  Agent.prototype.backward_on = function(action) {
    return this.mvReq[Z] += 1.0;
  };
  Agent.prototype.backward_off = function(action) {
    return this.mvReq[Z] -= 1.0;
  };
  Agent.prototype.up_on = function(action) {
    return this.mvReq[Y] += 1.0;
  };
  Agent.prototype.up_off = function(action) {
    return this.mvReq[Y] -= 1.0;
  };
  Agent.prototype.down_on = function(action) {
    return this.mvReq[Y] -= 1.0;
  };
  Agent.prototype.down_off = function(action) {
    return this.mvReq[Y] += 1.0;
  };
  Agent.prototype.left_on = function(action) {
    return this.mvReq[X] -= 1.0;
  };
  Agent.prototype.left_off = function(action) {
    return this.mvReq[X] += 1.0;
  };
  Agent.prototype.right_on = function(action) {
    return this.mvReq[X] += 1.0;
  };
  Agent.prototype.right_off = function(action) {
    return this.mvReq[X] -= 1.0;
  };
  Agent.prototype.turnup_on = function(action) {
    return this.angReq[PITCH] += 1.0;
  };
  Agent.prototype.turnup_off = function(action) {
    return this.angReq[PITCH] -= 1.0;
  };
  Agent.prototype.turndown_on = function(action) {
    return this.angReq[PITCH] -= 1.0;
  };
  Agent.prototype.turndown_off = function(action) {
    return this.angReq[PITCH] += 1.0;
  };
  Agent.prototype.turnleft_on = function(action) {
    return this.angReq[YAW] += 1.0;
  };
  Agent.prototype.turnleft_off = function(action) {
    return this.angReq[YAW] -= 1.0;
  };
  Agent.prototype.turnright_on = function(action) {
    return this.angReq[YAW] -= 1.0;
  };
  Agent.prototype.turnright_off = function(action) {
    return this.angReq[YAW] += 1.0;
  };
  Agent.prototype.browser_leftclick = function(action) {};
  Agent.prototype.browser_middleclick = function(action) {};
  Agent.prototype.browser_rightclick = function(action) {};
  Agent.prototype.mouse_leftclick = function(action) {
    return this.M.board.clear_current();
  };
  Agent.prototype.mouse_middleclick = function(action) {
    return this.M.board.mark_current();
  };
  Agent.prototype.mouse_rightclick = function(action) {};
  Agent.prototype.mouse_dragturn_on = function(x, y) {
    this.dragPrior[0] = x;
    this.dragPrior[1] = y;
    this.dragPrior[2] = (new Date).getTime();
    return this.M.canvas.style.cursor = "move";
  };
  Agent.prototype.mouse_dragturn_off = function() {
    this.angReq[YAW] = this.angReq[PITCH] = 0;
    return this.M.canvas.style.cursor = "auto";
  };
  Agent.prototype.mouse_dragturn_event = function(x, y) {
    var dX, dY;
    dX = x - this.dragPrior[0];
    dY = y - this.dragPrior[1];
    this.dragPrior[0] = x;
    this.dragPrior[1] = y;
    this.ang[YAW] += dX * MOUSE_DRAG_SPEED;
    return this.ang[PITCH] += dY * MOUSE_DRAG_SPEED;
  };
  Agent.prototype.mouse_joyturn_on = function(x, y) {
    this.dragCenter[0] = x;
    this.dragCenter[1] = y;
    this.dragPrior[0] = x;
    this.dragPrior[1] = y;
    this.dragPrior[2] = (new Date).getTime();
    return this.M.canvas.style.cursor = "crosshair";
  };
  Agent.prototype.mouse_joyturn_off = function() {
    this.angReq[YAW] = this.angReq[PITCH] = 0;
    return this.M.canvas.style.cursor = "auto";
  };
  Agent.prototype.mouse_joyturn_event = function(x, y) {
    var D, ang, dX, dY;
    dX = x - this.dragPrior[0];
    dY = y - this.dragPrior[1];
    this.dragPrior[0] = x;
    this.dragPrior[1] = y;
    this.angReq[YAW] += dX * MOUSE_JOY_SPEED;
    this.angReq[PITCH] += dY * MOUSE_JOY_SPEED;
    ang = Math.atan2(x - this.dragCenter[0], y - this.dragCenter[1]);
    D = Math.PI / 8;
    if ((-D <= ang && ang < D)) {
      this.M.canvas.style.cursor = "s-resize";
    }
    if ((D <= ang && ang < 3 * D)) {
      this.M.canvas.style.cursor = "se-resize";
    }
    if ((3 * D <= ang && ang < 5 * D)) {
      this.M.canvas.style.cursor = "e-resize";
    }
    if ((5 * D <= ang && ang < 7 * D)) {
      this.M.canvas.style.cursor = "ne-resize";
    }
    if ((-3 * D <= ang && ang < -D)) {
      this.M.canvas.style.cursor = "sw-resize";
    }
    if ((-5 * D <= ang && ang < -3 * D)) {
      this.M.canvas.style.cursor = "w-resize";
    }
    if ((-7 * D <= ang && ang < -5 * D)) {
      this.M.canvas.style.cursor = "nw-resize";
    }
    if (ang >= 7 * D || ang < -7 * D) {
      return this.M.canvas.style.cursor = "n-resize";
    }
  };
  Agent.prototype._findForward = function(ang, dir) {
    var cx, cy, delta, sx, sy;
    cy = Math.cos(ang[YAW]);
    sy = Math.sin(ang[YAW]);
    cx = Math.cos(ang[PITCH]);
    sx = Math.sin(ang[PITCH]);
    delta = vec3.create();
    delta[X] = (dir[Z] * cx * sy) + (dir[Y] * sx * sy) + (dir[X] * cy);
    delta[Y] = (dir[Y] * cx) - (dir[Z] * sx);
    delta[Z] = (dir[Z] * cx * cy) + (dir[Y] * sx * cy) - (dir[X] * sy);
    return delta;
  };
  Agent.prototype._findPointerGeometry = function(pos) {
    var c, dir, h, mInvMV, mInvP, ray, v, vX, vY, vZ, w;
    vX = pos[0] - 8;
    vY = pos[1] - 8;
    vZ = 0;
    w = this.M.canvas.width;
    h = this.M.canvas.height;
    c = [2 * vX / w - 1, 1 - 2 * vY / h, 2 * vZ - 1, 1];
    v = [0, 0, 0, 0];
    mInvP = mat4.create(this.M.mP);
    mat4.inverse(mInvP);
    mat4.multiplyVec4(mInvP, c, v);
    v[0] /= v[3];
    v[1] /= v[3];
    v[2] /= v[3];
    v[3] /= v[3];
    w = [0, 0, 0, 0];
    mInvMV = mat4.create(this.M.mMV);
    mat4.inverse(mInvMV);
    mat4.multiplyVec4(mInvMV, v, w);
    dir = vec3.create(w);
    vec3.subtract(dir, this.M.agent.pos);
    vec3.normalize(dir);
    ray = new M3.Ray(this.M.agent.pos, dir);
    return ray;
  };
  Agent.prototype.move = function(dt) {
    var delta, tmp;
    this.ang[PITCH] += this.angReq[PITCH] * ROT_SPEED;
    this.ang[YAW] += this.angReq[YAW] * ROT_SPEED;
    if (this.ang[PITCH] > Math.PI / 2) {
      this.ang[PITCH] = Math.PI / 2;
    }
    if (this.ang[PITCH] < -Math.PI / 2) {
      this.ang[PITCH] = -Math.PI / 2;
    }
    while (this.ang[YAW] < 0) {
      this.ang[YAW] += Math.PI * 2;
    }
    this.ang[YAW] %= Math.PI * 2;
    tmp = vec3.create();
    vec3.normalize(this.mvReq, tmp);
    vec3.scale(tmp, dt * SPEED);
    delta = this._findForward(this.ang, tmp);
    vec3.add(this.pos, delta);
    return this.forward = this._findForward(this.ang, [0, 0, -1]);
  };
  Agent.prototype.draw = function() {
    return this.worldPointer = this._findPointerGeometry(this.M.input.mousePosition);
  };
  return Agent;
})();/*
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
*/var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
M3.Board = (function() {
  var CONTENT_CAKE, CONTENT_MINE, CONTENT_NONE, FOCUS_HOVER, FOCUS_NONE, FRAGMENT_SHADER, NUMBER_FRAGMENT_SHADER, NUMBER_VERTEX_SHADER, SCALE, STATE_CAKED, STATE_EMPTY, STATE_FLAGGED, STATE_NORMAL, VERTEX_SHADER;
  SCALE = 10.0;
  STATE_NORMAL = 0;
  STATE_EMPTY = 1;
  STATE_FLAGGED = 2;
  STATE_CAKED = 3;
  FOCUS_NONE = 0;
  FOCUS_HOVER = 1;
  CONTENT_NONE = 0;
  CONTENT_MINE = 1;
  CONTENT_CAKE = 2;
  function Board(M, szX, szY, szZ) {
    var i, j, k, pos, _ref, _ref2, _ref3;
    this.M = M;
    this.szX = szX;
    this.szY = szY;
    this.szZ = szZ;
    this.nMines = 0;
    this.size = vec3.create([this.szX, this.szY, this.szZ]);
    console.log("Board size: " + vec3.str(this.size));
    this.gl = this.M.gl;
    this.center = vec3.create([this.szX * SCALE / 2, this.szY * SCALE / 2, this.szZ * SCALE / 2]);
    this.cubes = [];
    this.nCubes = this.szX * this.szY * this.szZ;
    for (i = 0, _ref = this.szX - 1; 0 <= _ref ? i <= _ref : i >= _ref; 0 <= _ref ? i++ : i--) {
      this.cubes.push([]);
      for (j = 0, _ref2 = this.szY - 1; 0 <= _ref2 ? j <= _ref2 : j >= _ref2; 0 <= _ref2 ? j++ : j--) {
        this.cubes[i].push([]);
        for (k = 0, _ref3 = this.szZ - 1; 0 <= _ref3 ? k <= _ref3 : k >= _ref3; 0 <= _ref3 ? k++ : k--) {
          pos = [i * SCALE, j * SCALE, k * SCALE];
          this.cubes[i][j].push({
            state: STATE_NORMAL,
            focus: FOCUS_NONE,
            content: CONTENT_NONE,
            aabb: new M3.AABB(pos, [pos[0] + SCALE, pos[1] + SCALE, pos[2] + SCALE])
          });
        }
      }
    }
    this.createCubeSurfaces();
    this.createNumberSurfaces();
  }
  Board.prototype.createNumberSurfaces = function() {
    var i, n, nElmts, uniforms, vertData, verts, _ref, _results;
    _ref = this._fillNumbers(), verts = _ref[0], nElmts = _ref[1];
    vertData = new Float32Array(verts);
    this.numberVertBuf = new M3.ArrayBuffer(this.M, vertData, nElmts * 4, [
      {
        size: 4,
        type: this.gl.FLOAT,
        offset: 0,
        normalize: false
      }, {
        size: 3,
        type: this.gl.FLOAT,
        offset: 16,
        normalize: false
      }
    ], this.gl.STATIC_DRAW, this.gl.TRIANGLES);
    this.numberStateData = new Float32Array(verts.length / nElmts * 1);
    this.numberStateBuf = new M3.ArrayBuffer(this.M, this.numberStateData, 4, [
      {
        size: 1,
        type: this.gl.FLOAT,
        offset: 0,
        normalize: false
      }
    ], this.gl.STATIC_DRAW);
    uniforms = ["uMVMatrix", "uPMatrix"];
    for (i = 1; i <= 6; i++) {
      uniforms.push("uSampler" + String(i));
    }
    this.numberShader = this.M.loadShaderFromStrings(NUMBER_VERTEX_SHADER, NUMBER_FRAGMENT_SHADER, ["aNumberPosition", "aVertexPosition", "aState"], uniforms);
    this.numberTex = [];
    _results = [];
    for (n = 1; n <= 6; n++) {
      _results.push(this.numberTex.push(this.M.loadTexture("/materials/number/number0" + String(n) + "-128.png")));
    }
    return _results;
  };
  Board.prototype._fillNumbers = function() {
    var extendVerts, i, j, k, nElmts, posX, posY, posZ, verts, _ref, _ref2, _ref3, _ref4, _ref5, _ref6, _verts;
    _verts = [0, 0, 0, 1, -1, -1, 0, 0, 0, 0, 1, 1, -1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 1, -1, 1, 0, 0, 0, 0, 1, -1, -1, 0];
    nElmts = 7;
    verts = [];
    extendVerts = __bind(function(delta) {
      var offset, val, _i, _len, _results;
      offset = 0;
      _results = [];
      for (_i = 0, _len = _verts.length; _i < _len; _i++) {
        val = _verts[_i];
        if (offset < 3) {
          verts.push(val + delta[offset]);
        } else {
          verts.push(val);
        }
        offset += 1;
        _results.push(offset %= nElmts);
      }
      return _results;
    }, this);
    for (i = _ref = -1, _ref2 = this.szX; _ref <= _ref2 ? i <= _ref2 : i >= _ref2; _ref <= _ref2 ? i++ : i--) {
      posX = SCALE / 2 + SCALE * i;
      for (j = _ref3 = -1, _ref4 = this.szY; _ref3 <= _ref4 ? j <= _ref4 : j >= _ref4; _ref3 <= _ref4 ? j++ : j--) {
        posY = SCALE / 2 + SCALE * j;
        for (k = _ref5 = -1, _ref6 = this.szY; _ref5 <= _ref6 ? k <= _ref6 : k >= _ref6; _ref5 <= _ref6 ? k++ : k--) {
          posZ = SCALE / 2 + SCALE * k;
          extendVerts([posX, posY, posZ]);
        }
      }
    }
    return [verts, nElmts];
  };
  Board.prototype.createCubeSurfaces = function() {
    var nElmts, vertData, verts, _ref;
    _ref = this._fillVerts(), verts = _ref[0], nElmts = _ref[1];
    vertData = new Float32Array(verts);
    this.cubeVertBuf = new M3.ArrayBuffer(this.M, vertData, nElmts * 4, [
      {
        size: 3,
        type: this.gl.FLOAT,
        offset: 0,
        normalize: false
      }, {
        size: 2,
        type: this.gl.FLOAT,
        offset: 12,
        normalize: false
      }, {
        size: 3,
        type: this.gl.FLOAT,
        offset: 20,
        normalize: false
      }
    ], this.gl.STATIC_DRAW, this.gl.TRIANGLES);
    this.cubeStateData = new Float32Array(verts.length / nElmts * 2);
    this.cubeStateBuf = new M3.ArrayBuffer(this.M, this.cubeStateData, 8, [
      {
        size: 1,
        type: this.gl.FLOAT,
        offset: 0,
        normalize: false
      }, {
        size: 1,
        type: this.gl.FLOAT,
        offset: 4,
        normalize: false
      }
    ], this.gl.DYNAMIC_DRAW);
    this.cubeShader = this.M.loadShaderFromStrings(VERTEX_SHADER, FRAGMENT_SHADER, ["aVertexPosition", "aTextureCoord", "aVertexNormal", "aState", "aFocus"], ["uMVMatrix", "uPMatrix", "uSampler", "uNormals", "uSkymap", "uReflectivity", "uMark", "uSunDir", "uSunColor"]);
    this.cubeFaceTex = this.M.loadTexture("/materials/cube/color-256.jpg");
    this.cubeNormalTex = this.M.loadTexture("/materials/cube/normal-256.png");
    this.cubeReflectivityTex = this.M.loadTexture("/materials/cube/reflectivity-256.png");
    return this.cubeMarkTex = this.M.loadTexture("/materials/cube/marked-512.png");
  };
  Board.prototype._fillVerts = function() {
    /*
    		 The cube faces are arranged as
    		   ____
    		  / 4 /| <- 2
    	3 -> +---+ |  
    		 | 0 |1+       |   /
    		 |___|/   x->  y  z
    		   /\ 
    		   5
    
    		*/    var extendCube, i, index, j, k, n, nElmts, pos, verts, _ref, _ref2, _ref3, _ref4, _verts;
    _verts = [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 0, 0, 0, 1, 1, 1, 0, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 1, 0, 0, 0, 0, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 0, 0, -1, 0, 1, 1, 1, 1, 0, 0, -1, 0, 0, 1, 1, 0, 0, 0, -1, 0, 1, 1, 1, 1, 0, 0, -1, 1, 0, 1, 0, 0, 0, 0, -1, 1, 1, 1, 0, 1, 0, 0, -1, 0, 0, 1, 0, 0, -1, 0, 0, 0, 1, 0, 1, 1, -1, 0, 0, 0, 0, 0, 1, 0, -1, 0, 0, 0, 1, 0, 1, 1, -1, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 1, 1, 0, 1, -1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, -1, 0, 1, 0, 0, 1, 1, 0, -1, 0, 1, 0, 1, 1, 0, 0, -1, 0, 1, 0, 0, 1, 1, 0, -1, 0, 0, 0, 1, 0, 0, 0, -1, 0, 0, 0, 0, 0, 1, 0, -1, 0];
    nElmts = 8;
    this.nVertsPerCube = _verts.length / nElmts;
    for (i = 0, _ref = (_verts.length / nElmts) - 1; 0 <= _ref ? i <= _ref : i >= _ref; 0 <= _ref ? i++ : i--) {
      for (j = 0; j <= 2; j++) {
        index = i * nElmts + j;
        _verts[index] = _verts[index] * SCALE;
      }
    }
    verts = [];
    extendCube = __bind(function(n, delta) {
      var offset, val, _i, _len, _results;
      offset = 0;
      _results = [];
      for (_i = 0, _len = _verts.length; _i < _len; _i++) {
        val = _verts[_i];
        if (offset < 3) {
          verts.push(val + delta[offset]);
        } else {
          verts.push(val);
        }
        offset += 1;
        _results.push(offset %= nElmts);
      }
      return _results;
    }, this);
    n = 0;
    for (i = 0, _ref2 = this.szX - 1; 0 <= _ref2 ? i <= _ref2 : i >= _ref2; 0 <= _ref2 ? i++ : i--) {
      for (j = 0, _ref3 = this.szY - 1; 0 <= _ref3 ? j <= _ref3 : j >= _ref3; 0 <= _ref3 ? j++ : j--) {
        for (k = 0, _ref4 = this.szZ - 1; 0 <= _ref4 ? k <= _ref4 : k >= _ref4; 0 <= _ref4 ? k++ : k--) {
          pos = [i * SCALE, j * SCALE, k * SCALE];
          extendCube(n, pos);
          n += 1;
        }
      }
    }
    return [verts, nElmts];
  };
  Board.prototype.initFromPlanarChars = function(S) {
    var i, j, k, st, _ref, _ref2, _ref3;
    if (S.length !== this.szZ) {
      throw "Incorrect Z dimension initing from state vector";
    }
    for (i = 0, _ref = this.szZ - 1; 0 <= _ref ? i <= _ref : i >= _ref; 0 <= _ref ? i++ : i--) {
      if (S[i].length !== this.szY) {
        throw "Incorrect Y dimension initing from state vector";
      }
      for (j = 0, _ref2 = this.szY - 1; 0 <= _ref2 ? j <= _ref2 : j >= _ref2; 0 <= _ref2 ? j++ : j--) {
        if (S[i][this.szY - j - 1].length !== this.szX) {
          throw "Incorrect X dimension initing from state vector";
        }
        for (k = 0, _ref3 = this.szX - 1; 0 <= _ref3 ? k <= _ref3 : k >= _ref3; 0 <= _ref3 ? k++ : k--) {
          st = (function() {
            switch (S[i][this.szY - j - 1][k]) {
              case "x":
                return STATE_NORMAL;
              case " ":
                return STATE_EMPTY;
              case "m":
                return STATE_FLAGGED;
            }
          }).call(this);
          this.cubes[k][j][i].state = st;
        }
      }
    }
    return this.updateNumberStates();
  };
  Board.prototype.fillRandomMines = function(nMines) {
    var positions, x, y, z;
    positions = [];
    this.nMines = nMines;
    while (nMines > 0) {
      x = Math.floor(Math.random() * this.szX);
      y = Math.floor(Math.random() * this.szY);
      z = Math.floor(Math.random() * this.szZ);
      if (this.cubes[x][y][z].content === CONTENT_NONE) {
        this.cubes[x][y][z].content = CONTENT_MINE;
        nMines -= 1;
        positions.push([x, y, z]);
      }
    }
    this.updateNumberStates();
    return positions;
  };
  Board.prototype.fillMinesFromPositions = function(positions) {
    var pos, _i, _len;
    this.nMines = positions.length;
    for (_i = 0, _len = positions.length; _i < _len; _i++) {
      pos = positions[_i];
      this.cubes[pos[0]][pos[1]][pos[2]].content = CONTENT_MINE;
    }
    return this.updateNumberStates();
  };
  Board.prototype.updateFocus = function() {
    var hit, hits, i, j, k, ptr, ray, tmp, _ref, _ref2, _ref3;
    ptr = this.M.agent.worldPointer;
    tmp = vec3.create(ptr.pos);
    vec3.add(tmp, this.center);
    ray = new M3.Ray(tmp, ptr.dir);
    hits = [];
    for (i = 0, _ref = this.szX - 1; 0 <= _ref ? i <= _ref : i >= _ref; 0 <= _ref ? i++ : i--) {
      for (j = 0, _ref2 = this.szY - 1; 0 <= _ref2 ? j <= _ref2 : j >= _ref2; 0 <= _ref2 ? j++ : j--) {
        for (k = 0, _ref3 = this.szZ - 1; 0 <= _ref3 ? k <= _ref3 : k >= _ref3; 0 <= _ref3 ? k++ : k--) {
          this.cubes[i][j][k].focus = FOCUS_NONE;
          if (this.cubes[i][j][k].state === STATE_EMPTY) {
            continue;
          }
          hit = this.cubes[i][j][k].aabb.intersectRay(ray);
          if (hit > 0) {
            hits.push([hit, i, j, k]);
          }
        }
      }
    }
    hits.sort();
    if (hits.length === 0) {
      return;
    }
    return this.cubes[hits[0][1]][hits[0][2]][hits[0][3]].focus = FOCUS_HOVER;
  };
  Board.prototype.updateStateBuf = function() {
    var fc, i, j, k, m, n, st, _ref, _ref2, _ref3, _ref4;
    n = 0;
    for (i = 0, _ref = this.szX - 1; 0 <= _ref ? i <= _ref : i >= _ref; 0 <= _ref ? i++ : i--) {
      for (j = 0, _ref2 = this.szY - 1; 0 <= _ref2 ? j <= _ref2 : j >= _ref2; 0 <= _ref2 ? j++ : j--) {
        for (k = 0, _ref3 = this.szZ - 1; 0 <= _ref3 ? k <= _ref3 : k >= _ref3; 0 <= _ref3 ? k++ : k--) {
          st = this.cubes[i][j][k].state;
          fc = this.cubes[i][j][k].focus;
          for (m = 0, _ref4 = this.nVertsPerCube - 1; 0 <= _ref4 ? m <= _ref4 : m >= _ref4; 0 <= _ref4 ? m++ : m--) {
            this.cubeStateData[n] = st;
            this.cubeStateData[n + 1] = fc;
            n += 2;
          }
        }
      }
    }
    return this.cubeStateBuf.update(this.cubeStateData);
  };
  Board.prototype.updateNumberStates = function() {
    var cnt, i, i0, i1, j, j0, j1, k, k0, k1, offset, _, _i, _len, _ref, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9;
    for (i = 0, _ref = this.numberStateData.length - 1; 0 <= _ref ? i <= _ref : i >= _ref; 0 <= _ref ? i++ : i--) {
      this.numberStateData[i] = 0.0;
    }
    offset = 0;
    for (i = _ref2 = -1, _ref3 = this.szX; _ref2 <= _ref3 ? i <= _ref3 : i >= _ref3; _ref2 <= _ref3 ? i++ : i--) {
      for (j = _ref4 = -1, _ref5 = this.szY; _ref4 <= _ref5 ? j <= _ref5 : j >= _ref5; _ref4 <= _ref5 ? j++ : j--) {
        for (k = _ref6 = -1, _ref7 = this.szZ; _ref6 <= _ref7 ? k <= _ref7 : k >= _ref7; _ref6 <= _ref7 ? k++ : k--) {
          cnt = 0;
          /* NOTE: this is for 26-adjacency mode
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
          					*/
          _ref8 = [[-1, 0, 0], [1, 0, 0], [0, -1, 0], [0, 1, 0], [0, 0, -1], [0, 0, 1]];
          for (_i = 0, _len = _ref8.length; _i < _len; _i++) {
            _ref9 = _ref8[_i], i0 = _ref9[0], j0 = _ref9[1], k0 = _ref9[2];
            i1 = i + i0;
            j1 = j + j0;
            k1 = k + k0;
            if ((0 <= i1 && i1 < this.szX) && (0 <= j1 && j1 < this.szY) && (0 <= k1 && k1 < this.szZ)) {
              if (this.cubes[i1][j1][k1].content === CONTENT_MINE) {
                cnt += 1;
              }
            }
          }
          for (_ = 1; _ <= 6; _++) {
            this.numberStateData[offset] = cnt;
            offset += 1;
          }
        }
      }
    }
    return this.numberStateBuf.update(this.numberStateData);
  };
  Board.prototype.getCubePos = function(i, j, k) {
    return vec3.create([i * SCALE - this.center[0] + SCALE / 2, j * SCALE - this.center[1] + SCALE / 2, k * SCALE - this.center[2] + SCALE / 2]);
  };
  Board.prototype.getExtents = function() {
    var maxPos, minPos;
    minPos = this.getCubePos(0, 0, 0);
    minPos[0] -= SCALE / 2;
    minPos[1] -= SCALE / 2;
    minPos[2] -= SCALE / 2;
    maxPos = this.getCubePos(this.szX - 1, this.szY - 1, this.szZ - 1);
    maxPos[0] += SCALE / 2;
    maxPos[1] += SCALE / 2;
    maxPos[2] += SCALE / 2;
    return [minPos, maxPos];
  };
  Board.prototype.isVictory = function() {
    var cb, i, j, k, nCorrect, nCovered, nInval, _ref, _ref2, _ref3;
    nCovered = 0;
    nCorrect = 0;
    nInval = 0;
    for (i = 0, _ref = this.szX - 1; 0 <= _ref ? i <= _ref : i >= _ref; 0 <= _ref ? i++ : i--) {
      for (j = 0, _ref2 = this.szY - 1; 0 <= _ref2 ? j <= _ref2 : j >= _ref2; 0 <= _ref2 ? j++ : j--) {
        for (k = 0, _ref3 = this.szZ - 1; 0 <= _ref3 ? k <= _ref3 : k >= _ref3; 0 <= _ref3 ? k++ : k--) {
          cb = this.cubes[i][j][k];
          if (cb.state === STATE_FLAGGED) {
            if (cb.content === CONTENT_MINE) {
              nCorrect += 1;
            } else {
              nInval += 1;
            }
          }
          if (cb.state !== STATE_EMPTY) {
            nCovered += 1;
          }
        }
      }
    }
    console.log(this.nMines, nCorrect, nInval, nCovered);
    if (nCorrect === this.nMines && nInval === 0) {
      return true;
    }
    if (nCovered === this.nMines) {
      return true;
    }
    return false;
  };
  Board.prototype.clear_current = function() {
    var i, j, k, minePos, _ref, _ref2, _ref3, _results;
    _results = [];
    for (i = 0, _ref = this.szX - 1; 0 <= _ref ? i <= _ref : i >= _ref; 0 <= _ref ? i++ : i--) {
      for (j = 0, _ref2 = this.szY - 1; 0 <= _ref2 ? j <= _ref2 : j >= _ref2; 0 <= _ref2 ? j++ : j--) {
        for (k = 0, _ref3 = this.szZ - 1; 0 <= _ref3 ? k <= _ref3 : k >= _ref3; 0 <= _ref3 ? k++ : k--) {
          if (this.cubes[i][j][k].focus === FOCUS_HOVER) {
            if (this.cubes[i][j][k].state === STATE_FLAGGED) {
              return;
            }
            if (this.cubes[i][j][k].content === CONTENT_MINE) {
              minePos = this.getCubePos(i, j, k);
              this.M.doDeath(minePos);
              return;
            }
            this.cubes[i][j][k].state = STATE_EMPTY;
            if (this.isVictory()) {
              this.M.doVictory();
            }
            return;
          }
        }
      }
    }
    return _results;
  };
  Board.prototype.mark_current = function() {
    var i, j, k, _ref, _ref2, _ref3, _results;
    _results = [];
    for (i = 0, _ref = this.szX - 1; 0 <= _ref ? i <= _ref : i >= _ref; 0 <= _ref ? i++ : i--) {
      for (j = 0, _ref2 = this.szY - 1; 0 <= _ref2 ? j <= _ref2 : j >= _ref2; 0 <= _ref2 ? j++ : j--) {
        for (k = 0, _ref3 = this.szZ - 1; 0 <= _ref3 ? k <= _ref3 : k >= _ref3; 0 <= _ref3 ? k++ : k--) {
          if (this.cubes[i][j][k].focus === FOCUS_HOVER) {
            if (this.cubes[i][j][k].state === STATE_FLAGGED) {
              this.cubes[i][j][k].state = STATE_NORMAL;
            } else {
              this.cubes[i][j][k].state = STATE_FLAGGED;
            }
            if (this.isVictory()) {
              this.M.doVictory();
            }
            return;
          }
        }
      }
    }
    return _results;
  };
  Board.prototype.move = function(dt) {};
  VERTEX_SHADER = "	attribute vec3 aVertexPosition;\n	attribute vec2 aTextureCoord;\n	attribute vec3 aVertexNormal;\n	attribute float aState;\n	attribute float aFocus;\n\n	uniform mat4 uMVMatrix;\n	uniform mat4 uPMatrix;\n	uniform vec3 uSunDir;\n	uniform vec4 uSunColor;\n\n	varying float vState;\n	varying vec4 vColor;\n	varying vec2 vTextureCoord;\n	varying vec3 vTLightVec;\n	varying vec3 vTEyeVec;\n	varying vec3 vHalfVec;\n\n	void main(void) {\n		// figure out what our object space tangent vector is, based on axis\n		vec3 faceTangent;\n		if(aVertexNormal.y == 0.0) // all side faces\n			faceTangent = vec3(0.0, 1.0, 0.0);\n		else // the top and bottom faces\n			faceTangent = vec3(0.0, 0.0, 1.0);\n		vec3 faceBinorm = cross(aVertexNormal, faceTangent);\n\n		// move light vector into tangent space\n		vTLightVec.x = dot(uSunDir, faceTangent);\n		vTLightVec.y = dot(uSunDir, faceBinorm);\n		vTLightVec.z = dot(uSunDir, aVertexNormal);\n		vTLightVec = normalize(vTLightVec);\n		// move eye vector into tangent space\n		vec3 pos = (uMVMatrix * vec4(aVertexPosition, 1.0)).xyz;\n		vTEyeVec.x = dot(pos, faceTangent);\n		vTEyeVec.y = dot(pos, faceBinorm);\n		vTEyeVec.z = dot(pos, aVertexNormal);\n		// compute half vector between eye and light\n		vec3 h = (normalize(pos) + uSunDir) / 2.0;\n		vHalfVec = normalize(h);\n\n		// transform and apply base tc\n		gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);\n		vTextureCoord = aTextureCoord;\n		vState = aState;\n\n		// set color modifier based on state and focus status		\n		if(aState == 0.0) { // normal\n			vColor = vec4(1.0, 1.0, 1.0, 1.0);\n		} else if(aState == 1.0) { // empty\n			vColor = vec4(0.0, 0.0, 0.0, 0.0);\n		} else if(aState == 2.0) { // flagged\n			vColor = vec4(1.0, 0.7, 0.7, 1.0);\n		} else {\n			vColor = vec4(1.0, 0.0, 1.0, 1.0);\n		}\n	\n		if(aFocus == 1.0 && aState != 2.0) {\n			vColor *= vec4(0.7, 0.7, 1.0, 1.0);\n		}\n	}";
  FRAGMENT_SHADER = "	\n	#ifdef GL_ES\n	precision highp float;\n	#endif\n\n	varying float vState;\n	varying vec4 vColor;\n	varying vec2 vTextureCoord;\n	varying vec3 vTLightVec;\n	varying vec3 vTEyeVec;\n	varying vec3 vHalfVec;\n\n	uniform sampler2D uSampler;\n	uniform sampler2D uNormals;\n	uniform sampler2D uReflectivity;\n	uniform sampler2D uMark;\n	uniform samplerCube uSkymap;\n\n	uniform vec3 uSunDir;\n	uniform vec4 uSunColor;\n\n	void main(void) {\n		// discard transparent fragments\n		if(vColor.w == 0.0) discard;\n	\n		// lookup and compute base color\n		vec4 color = texture2D(uSampler, vTextureCoord);\n		color *= vColor;\n\n		// if flagged, overlay the flag color\n		if(vState >= 1.5 && vState < 2.5) { // flagged\n			vec4 mark = texture2D(uMark, 1.0 - vTextureCoord);\n			color = vColor * vec4(mix(color.xyz, mark.xyz, mark.w), 1.0);\n		}\n\n		// base ambient light\n		gl_FragColor = vec4(0.3, 0.3, 0.3, 1.0) * color;\n\n		// perform normal lookup and renormalization\n		vec3 normal = texture2D(uNormals, vTextureCoord).xyz;\n		normal = normalize(2.0 * normal - 1.0); // renormalize to [-1,1]\n\n		// compute reflection vector\n		// vTEyeVec is incident ray in tangent space for this formula\n		//		R = I - 2 * N * (N dot I)\n		vec3 I = -vTEyeVec;\n		vec3 vReflection = I - 2.0 * normal * dot(normal, I);\n	\n		// lookup sky reflection position using the reflection vector\n		vec4 skycolor = textureCube(uSkymap, vReflection);\n\n		// compute diffuse lighting\n		float lambertFactor = max(dot(vTLightVec, normal), 0.0);\n		if(lambertFactor > 0.0) {\n			gl_FragColor += vec4((color * uSunColor * lambertFactor).xyz, 1.0);\n\n			//vec4 mSpecular = vec4(1.0);\n			//vec4 lSpecular = vec4(1.0);\n			//gl_FragColor += mSpecular * lSpecular * shininess;\n			float shininess = pow(max(dot(vHalfVec, normal), 0.0), 2.0);\n		}\n	\n		// mix in the background reflection\n		gl_FragColor += skycolor * texture2D(uReflectivity, vTextureCoord) / 2.25;\n\n	}";
  NUMBER_VERTEX_SHADER = "uniform mat4 uMVMatrix;\nuniform mat4 uPMatrix;\n\nattribute vec3 aVertexPosition;\nattribute vec4 aNumberPosition;\nattribute float aState;\n\nvarying float vState;\nvarying vec2 vTexCoord;\n\nvoid main(void) {\n	vState = aState;\n	\n	vec4 wpos = vec4(aNumberPosition.xyz, 1.0);\n	vec4 epos = uMVMatrix * wpos;\n	epos.xy += aVertexPosition.xy * aNumberPosition.w; \n	gl_Position = uPMatrix * epos;\n	vTexCoord = vec2(aVertexPosition.x, -aVertexPosition.y) * 0.5 + vec2(0.5);\n}";
  NUMBER_FRAGMENT_SHADER = "#ifdef GL_ES\nprecision highp float;\n#endif\n\nuniform sampler2D uSampler1;\nuniform sampler2D uSampler2;\nuniform sampler2D uSampler3;\nuniform sampler2D uSampler4;\nuniform sampler2D uSampler5;\nuniform sampler2D uSampler6;\n\nvarying float vState;\nvarying vec2 vTexCoord;\n\nvoid main(void) {\n	vec3 color = vec3(1.0, 1.0, 1.0);\n	vec4 alpha = vec4(1.0, 1.0, 1.0, 1.0);\n\n	if(vState < 0.5) {\n		discard;\n	} else if(0.5 <= vState && vState < 1.5) { // 1\n		color = vec3(0.0, 0.0, 1.0);\n		alpha = texture2D(uSampler1, vTexCoord);\n	} else if(1.5 <= vState && vState < 2.5) { // 2\n		color = vec3(0.0, 1.0, 0.0);\n		alpha = texture2D(uSampler2, vTexCoord);\n	} else if(2.5 <= vState && vState < 3.5) { // 3\n		color = vec3(1.0, 0.0, 0.0);\n		alpha = texture2D(uSampler3, vTexCoord);\n	} else if(3.5 <= vState && vState < 4.5) { // 4\n		color = vec3(0.01, 0.0, 0.5);\n		alpha = texture2D(uSampler4, vTexCoord);\n	} else if(4.5 <= vState && vState < 5.5) { // 5\n		color = vec3(0.5, 0.0, 0.0);\n		alpha = texture2D(uSampler5, vTexCoord);\n	} else if(5.5 <= vState && vState < 6.5) { // 6\n		color = vec3(0.0, 0.5, 0.51);\n		alpha = texture2D(uSampler6, vTexCoord);\n	} else {\n		color = vec3(1.0, 0.0, 1.0);\n	}\n\n	// NOTE: we do this without blending so that we can avoid a large\n	//		sort in the client code.  This still ends up looking pretty\n	//		good, although obviously not optimal.\n	if(alpha.x < 0.1) {\n		discard;\n	}\n\n	gl_FragColor = vec4(color, 1.0);\n}";
  Board.prototype.draw = function() {
    var i, tex, _i, _len, _ref;
    this.updateFocus();
    this.updateStateBuf();
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    this.M.mvPush();
    mat4.translate(this.M.mMV, vec3.negate(vec3.create(this.center)));
    this.cubeShader.use();
    this.cubeVertBuf.bind();
    this.cubeShader.linkAttribute('aVertexPosition', this.cubeVertBuf, 0);
    this.cubeShader.linkAttribute('aTextureCoord', this.cubeVertBuf, 1);
    this.cubeShader.linkAttribute('aVertexNormal', this.cubeVertBuf, 2);
    this.cubeStateBuf.bind();
    this.cubeShader.linkAttribute('aState', this.cubeStateBuf, 0);
    this.cubeShader.linkAttribute('aFocus', this.cubeStateBuf, 1);
    this.cubeShader.linkUniformMatrix('uPMatrix', this.M.mP);
    this.cubeShader.linkUniformMatrix('uMVMatrix', this.M.mMV);
    this.cubeShader.linkUniformVec3('uSunDir', this.M.skybox.sunDir);
    this.cubeShader.linkUniformVec4('uSunColor', this.M.skybox.sunColor);
    this.cubeFaceTex.bind(0);
    this.cubeShader.linkSampler('uSampler', this.cubeFaceTex);
    this.cubeNormalTex.bind(1);
    this.cubeShader.linkSampler('uNormals', this.cubeNormalTex);
    this.cubeReflectivityTex.bind(2);
    this.cubeShader.linkSampler('uReflectivity', this.cubeReflectivityTex);
    this.M.skybox.cubeMap.bind(3);
    this.cubeShader.linkSampler('uSkymap', this.M.skybox.cubeMap);
    this.cubeMarkTex.bind(4);
    this.cubeShader.linkSampler('uMark', this.cubeMarkTex);
    this.cubeVertBuf.draw();
    this.cubeFaceTex.unbind();
    this.cubeNormalTex.unbind();
    this.cubeShader.unuse();
    this.gl.disable(this.gl.BLEND);
    this.numberShader.use();
    this.numberShader.linkUniformMatrix('uPMatrix', this.M.mP);
    this.numberShader.linkUniformMatrix('uMVMatrix', this.M.mMV);
    this.numberVertBuf.bind();
    this.numberShader.linkAttribute('aNumberPosition', this.numberVertBuf, 0);
    this.numberShader.linkAttribute('aVertexPosition', this.numberVertBuf, 1);
    this.numberStateBuf.bind();
    this.numberShader.linkAttribute('aState', this.numberStateBuf, 0);
    i = 0;
    _ref = this.numberTex;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      tex = _ref[_i];
      tex.bind(i);
      this.numberShader.linkSampler('uSampler' + String(i + 1), tex);
      i += 1;
    }
    this.numberVertBuf.draw();
    return this.M.mvPop();
  };
  return Board;
})();/*
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
*/var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
M3.Skybox = (function() {
  var FRAGMENT_SHADER, VERTEX_SHADER;
  VERTEX_SHADER = "attribute vec3 aVertexPosition;\n\nuniform mat4 uMVMatrix;\nuniform mat4 uPMatrix;\n\nvarying vec3 vTexCoord;\n\nvoid main(void) {\n	gl_PointSize = 10.0;\n	gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);\n	vTexCoord = aVertexPosition;\n}";
  FRAGMENT_SHADER = "#ifdef GL_ES\nprecision highp float;\n#endif\n\nuniform samplerCube uSampler;\n\nvarying vec3 vTexCoord;\n\nvoid main(void) {\n	gl_FragColor = textureCube(uSampler, vTexCoord);\n}";
  function Skybox(M) {
    this.M = M;
    this.gl = this.M.gl;
    this.cubeMap = this.M.loadCubeMap("/cubemap/background0-1024/", ".png");
    this.sunPos = vec3.create([-2, -1, 1]);
    this.sunDir = vec3.create(vec3.scale(this.sunPos, -1));
    this.sunColor = new Float32Array([1.0, 0.99, 0.9, 1.0]);
    this.prog = this.M.loadShaderFromStrings(VERTEX_SHADER, FRAGMENT_SHADER, ["aVertexPosition"], ["uSampler", "uPMatrix", "uMVMatrix"]);
    this._buildSkybox();
  }
  Skybox.prototype.draw = function() {
    this.gl.disable(this.gl.DEPTH_TEST);
    this.gl.depthMask(false);
    this.M.mvPush();
    mat4.identity(this.M.mMV);
    mat4.rotateX(this.M.mMV, -this.M.agent.ang[0]);
    mat4.rotateY(this.M.mMV, -this.M.agent.ang[1]);
    this.vertBuf.bind();
    this.indexBuf.bind();
    this.prog.use();
    this.prog.linkAttribute('aVertexPosition', this.vertBuf, 0);
    this.prog.linkUniformMatrix('uMVMatrix', this.M.mMV);
    this.prog.linkUniformMatrix('uPMatrix', this.M.mP);
    this.cubeMap.bind(0);
    this.prog.linkSampler('uSampler', this.cubeMap);
    this.indexBuf.draw();
    this.vertBuf.draw();
    this.cubeMap.unbind(0);
    this.vertBuf.unbind();
    this.indexBuf.unbind();
    this.prog.unuse();
    this.M.mvPop();
    this.gl.depthMask(true);
    return this.gl.enable(this.gl.DEPTH_TEST);
  };
  Skybox.prototype._buildSkybox = function() {
    var A, B, SEED_INDICES, SEED_VERTS, indices, verts, _ref, _ref2, _ref3;
    A = Math.sqrt(2 / (5 + Math.sqrt(5)));
    B = Math.sqrt(2 / (5 - Math.sqrt(5)));
    SEED_VERTS = [-A, 0, B, A, 0, B, -A, 0, -B, A, 0, -B, 0, B, A, 0, B, -A, 0, -B, A, 0, -B, -A, B, A, 0, -B, A, 0, B, -A, 0, -B, -A, 0];
    SEED_INDICES = [1, 0, 4, 4, 0, 9, 4, 9, 5, 8, 4, 5, 1, 4, 8, 1, 8, 10, 10, 8, 3, 8, 5, 3, 3, 5, 2, 3, 2, 7, 3, 7, 10, 10, 7, 6, 6, 7, 11, 6, 11, 0, 6, 0, 1, 10, 6, 1, 11, 9, 0, 2, 9, 11, 5, 9, 2, 11, 7, 2];
    _ref = [SEED_VERTS, SEED_INDICES], verts = _ref[0], indices = _ref[1];
    _ref2 = this._subdivide(verts, indices), verts = _ref2[0], indices = _ref2[1];
    _ref3 = this._subdivide(verts, indices), verts = _ref3[0], indices = _ref3[1];
    this.vertBuf = new M3.ArrayBuffer(this.M, new Float32Array(verts), 12, [
      {
        size: 3,
        type: this.gl.FLOAT,
        offset: 0,
        normalize: false
      }
    ], this.gl.STATIC_DRAW, this.gl.POINTS);
    this.indexBuf = new M3.IndexBuffer(this.M, new Uint16Array(indices), this.gl.TRIANGLES);
    return console.log("Skybox: " + (verts.length / 3) + " verts, " + (indices.length / 3) + " tris");
  };
  Skybox.prototype._subdivide = function(verts, indices) {
    var a, addEdge, addNewVertToTri, b, c, d, e, e0, e1, e2, edge, edges, f, i, index, nextIndices, phi, r, theta, tri, tris, x0, x1, x2, x3, y0, y1, y2, y3, z0, z1, z2, z3, _, _i, _len, _ref, _ref2, _ref3, _ref4, _ref5, _ref6;
    edges = {};
    addEdge = __bind(function(e0, tri) {
      if (!(edges[e0] != null)) {
        edges[e0] = e0;
      }
      edges[e0].tris.push(tri);
      return edges[e0];
    }, this);
    edges = {};
    tris = [];
    for (i = 0, _ref = (indices.length - 1) / 3; 0 <= _ref ? i <= _ref : i >= _ref; 0 <= _ref ? i++ : i--) {
      index = i * 3;
      _ref2 = indices.slice(index, (index + 2 + 1) || 9e9), a = _ref2[0], b = _ref2[1], c = _ref2[2];
      tri = new M3.Tri(a, b, c);
      e0 = new M3.Edge(a, b);
      e1 = new M3.Edge(b, c);
      e2 = new M3.Edge(c, a);
      e0 = addEdge(e0, tri);
      e1 = addEdge(e1, tri);
      e2 = addEdge(e2, tri);
      tri.edges.push(e0, e1, e2);
      tri.extra = [null, null, null];
      tris.push(tri);
    }
    addNewVertToTri = function(tri, edge, vIndex) {
      if (edge === tri.edges[0]) {
        return tri.extra[0] = vIndex;
      } else if (edge === tri.edges[1]) {
        return tri.extra[1] = vIndex;
      } else if (edge === tri.edges[2]) {
        return tri.extra[2] = vIndex;
      } else {
        throw new "invalid edge for tri";
      }
    };
    verts = verts.slice(0);
    for (_ in edges) {
      edge = edges[_];
      a = edge.i0;
      b = edge.i1;
      _ref3 = verts.slice(a * 3, (a * 3 + 2 + 1) || 9e9), x0 = _ref3[0], y0 = _ref3[1], z0 = _ref3[2];
      _ref4 = verts.slice(b * 3, (b * 3 + 2 + 1) || 9e9), x1 = _ref4[0], y1 = _ref4[1], z1 = _ref4[2];
      x2 = x0 + ((x1 - x0) / 2);
      y2 = y0 + ((y1 - y0) / 2);
      z2 = z0 + ((z1 - z0) / 2);
      _ref5 = cart2polar(x2, y2, z2), r = _ref5[0], phi = _ref5[1], theta = _ref5[2];
      _ref6 = polar2cart(1, phi, theta), x3 = _ref6[0], y3 = _ref6[1], z3 = _ref6[2];
      if (edge.tris.length !== 2) {
        throw "Invalid skybox geometry";
      }
      addNewVertToTri(edge.tris[0], edge, verts.length / 3);
      addNewVertToTri(edge.tris[1], edge, verts.length / 3);
      verts.push(x3, y3, z3);
    }
    nextIndices = [];
    for (_i = 0, _len = tris.length; _i < _len; _i++) {
      tri = tris[_i];
      a = tri.a;
      b = tri.b;
      c = tri.c;
      d = tri.extra[0];
      e = tri.extra[1];
      f = tri.extra[2];
      nextIndices.push(a, d, f);
      nextIndices.push(b, e, d);
      nextIndices.push(c, f, e);
      nextIndices.push(d, e, f);
    }
    return [verts, nextIndices];
  };
  return Skybox;
})();/*
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
*/var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
M3.Menu = (function() {
  function Menu(M) {
    this.M = M;
    this.leaveWin = __bind(this.leaveWin, this);
    this.enterWin = __bind(this.enterWin, this);
    this.leaveDeath = __bind(this.leaveDeath, this);
    this.enterDeath = __bind(this.enterDeath, this);
    this.leavePlay = __bind(this.leavePlay, this);
    this.enterPlay = __bind(this.enterPlay, this);
    this.leaveMain = __bind(this.leaveMain, this);
    this.enterMain = __bind(this.enterMain, this);
    this.leaveStart = __bind(this.leaveStart, this);
    this.enterStart = __bind(this.enterStart, this);
    this.machine = {
      start: [this.enterStart, this.leaveStart],
      main: [this.enterMain, this.leaveMain],
      play: [this.enterPlay, this.leavePlay],
      death: [this.enterDeath, this.leaveDeath],
      win: [this.enterWin, this.leaveWin]
    };
    this.prepareStart();
    this.prepareMain();
    this.preparePlay();
    this.prepareDeath();
    this.prepareWin();
    this.state = 'start';
    this.enterStart();
  }
  Menu.prototype.nextState = function(n) {
    this.machine[this.state][1]();
    this.state = n;
    return this.machine[this.state][0]();
  };
  Menu.prototype.prepareStart = function() {
    var b;
    b = $("#start.menu");
    b.button();
    b.click(__bind(function() {
      return this.nextState('main');
    }, this));
    return b.position({
      of: $(window),
      my: "center center",
      at: "center bottom",
      offset: "0 -100",
      collision: "fit fit"
    });
  };
  Menu.prototype.enterStart = function() {
    return $("#start.menu").fadeIn();
  };
  Menu.prototype.leaveStart = function() {
    return $("#start.menu").fadeOut();
  };
  Menu.prototype.prepareMain = function() {
    var MAX_SIZE, MIN_SIZE, a, d, h, m, maxMines, minesCurrent, updateMines, w;
    MIN_SIZE = 1;
    MAX_SIZE = 20;
    m = $("#main.menu");
    m.show();
    w = $("#main-custom-slider-width-current");
    h = $("#main-custom-slider-height-current");
    d = $("#main-custom-slider-depth-current");
    maxMines = __bind(function() {
      return Number(w.html()) * Number(h.html()) * Number(d.html());
    }, this);
    minesCurrent = $("#main-custom-slider-mines-current");
    updateMines = __bind(function() {
      var currentMax, currentPos, elmt, maxM;
      elmt = $("#main-custom-slider-mines");
      currentPos = elmt.slider('value');
      currentMax = elmt.slider('option', 'max');
      maxM = Math.floor(maxMines() / 2);
      elmt.slider('option', "max", maxM);
      elmt.slider('value', Math.floor(currentPos / currentMax * maxM));
      return minesCurrent.html(elmt.slider('value'));
    }, this);
    minesCurrent.html(Math.floor(0.2 * maxMines()));
    $("#main-custom-slider-width").slider({
      min: MIN_SIZE,
      max: MAX_SIZE,
      step: 1,
      value: Number(d.html()),
      change: __bind(function(e, ui) {
        w.html(ui.value);
        return updateMines();
      }, this)
    });
    $("#main-custom-slider-height").slider({
      min: MIN_SIZE,
      max: MAX_SIZE,
      step: 1,
      value: Number(d.html()),
      change: __bind(function(e, ui) {
        h.html(ui.value);
        return updateMines();
      }, this)
    });
    $("#main-custom-slider-depth").slider({
      min: MIN_SIZE,
      max: MAX_SIZE,
      step: 1,
      value: Number(d.html()),
      change: __bind(function(e, ui) {
        d.html(ui.value);
        return updateMines();
      }, this)
    });
    $("#main-custom-slider-mines").slider({
      min: 0,
      max: maxMines(),
      step: 1,
      value: Number(minesCurrent.html()),
      change: __bind(function(e, ui) {
        return minesCurrent.html(ui.value);
      }, this)
    });
    $("#main-custom-play").button();
    $("#main-custom-play").click(__bind(function() {
      this.M.loadCustomLevel(Number(w.html()), Number(d.html()), Number(h.html()), Number(minesCurrent.html()));
      return this.nextState('play');
    }, this));
    a = $("#main-accordian");
    a.accordion();
    m.hide();
    return m.position({
      of: $(window),
      my: "center center",
      at: "center center",
      collision: "fit fit"
    });
  };
  Menu.prototype.enterMain = function(e) {
    return $("#main.menu").fadeIn();
  };
  Menu.prototype.leaveMain = function(e) {
    return $("#main.menu").fadeOut();
  };
  Menu.prototype.preparePlay = function() {};
  Menu.prototype.enterPlay = function(e) {
    return $('#mined-canvas').focus();
  };
  Menu.prototype.leavePlay = function(e) {};
  Menu.prototype.prepareDeath = function() {
    var m, overlay, quit, restart, undo;
    undo = $('#death-undo');
    undo.button();
    undo.click(__bind(function() {
      return this.nextState('play');
    }, this));
    restart = $('#death-restart');
    restart.button();
    restart.click(__bind(function() {
      return this.M.doRestart();
    }, this));
    quit = $('#death-quit');
    quit.button();
    quit.click(__bind(function() {
      return this.M.doStart();
    }, this));
    m = $('#death.menu');
    m.position({
      of: $(window),
      my: "center center",
      at: "center center",
      collision: "fit fit"
    });
    overlay = $('#death-overlay.menu');
    return overlay.css({
      width: $(window).width(),
      height: $(window).height(),
      'background-color': 'white',
      top: '0px',
      left: '0px'
    });
  };
  Menu.prototype.enterDeath = function(e) {
    $('#death-overlay.menu').fadeIn('slow');
    return $('#death.menu').fadeIn();
  };
  Menu.prototype.leaveDeath = function(e) {
    $('#death.menu').fadeOut();
    return $('#death-overlay.menu').hide();
  };
  Menu.prototype.prepareWin = function() {
    var cont, m, overlay, quit, renew, replay;
    renew = $('#win-new');
    renew.button();
    renew.click(__bind(function() {
      return this.M.doNewGame();
    }, this));
    replay = $('#win-replay');
    replay.button();
    replay.click(__bind(function() {
      return this.M.doRestart();
    }, this));
    cont = $('#win-continue');
    cont.button();
    cont.click(__bind(function() {
      return this.nextState('play');
    }, this));
    quit = $('#win-quit');
    quit.button();
    quit.click(__bind(function() {
      return this.M.doStart();
    }, this));
    m = $('#win.menu');
    m.position({
      of: $(window),
      my: "center center",
      at: "center center",
      collision: "fit fit"
    });
    overlay = $('#win-overlay.menu');
    return overlay.css({
      width: $(window).width(),
      height: $(window).height(),
      'background-color': 'black',
      top: '0px',
      left: '0px'
    });
  };
  Menu.prototype.enterWin = function(e) {
    $('#win-overlay.menu').fadeIn('slow');
    return $('#win.menu').fadeIn();
  };
  Menu.prototype.leaveWin = function(e) {
    $('#win.menu').fadeOut();
    return $('#win-overlay.menu').hide();
  };
  return Menu;
})();/*
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
*/M3.World = (function() {
  function World(M) {
    this.M = M;
    this.state = ['start', []];
  }
  World.prototype.makeStart = function() {
    var b;
    this.state = ['start', []];
    b = new M3.Board(this.M, 28, 7, 1);
    b.initFromPlanarChars([["xx   xx m x   x  xxx  xxxx  ", "xx   xx   xx  x x   x x   x ", "x x x x x x x x     x x    x", "x x x x x x x x   xx  x    x", "x  x  x x x  xx     x x    x", "x  x  x x x   x x   x x   x ", "x     x x x   x  xxx  xxxx  "]]);
    b.center = vec3.create([14 * 10, 3.5 * 10, 230]);
    return b;
  };
  World.prototype.makeCustom = function(nX, nY, nZ, nMines) {
    var b, positions;
    b = new M3.Board(this.M, nX, nY, nZ);
    positions = b.fillRandomMines(nMines);
    this.state = ['custom', [nX, nY, nZ, positions]];
    return b;
  };
  World.prototype.makeCustomLikeCurrent = function() {
    var b, positions;
    if (this.state[0] !== 'custom') {
      throw "World.makeCustomLikeCurrent is only valid when a custom map is running.";
    }
    b = new M3.Board(this.M, this.state[1][0], this.state[1][1], this.state[1][2]);
    positions = b.fillRandomMines(this.state[1][3].length);
    this.state = ['custom', [this.state[1][0], this.state[1][1], this.state[1][2], positions]];
    return b;
  };
  World.prototype.positionAgentForBoard = function(board) {
    var maxPos, minPos, _ref;
    _ref = board.getExtents(), minPos = _ref[0], maxPos = _ref[1];
    this.M.agent.reset();
    return this.M.agent.pos[2] = maxPos[2] + 10 + (maxPos[0] - minPos[0]) / 2;
  };
  World.prototype.resetLevel = function() {
    var b;
    if (this.state[0] === 'start') {
      return this.makeStart();
    } else if (this.state[0] === 'custom') {
      b = new M3.Board(this.M, this.state[1][0], this.state[1][1], this.state[1][2]);
      b.fillMinesFromPositions(this.state[1][3]);
      this.positionAgentForBoard(b);
      return b;
    }
    throw "Invalid board state in world!";
  };
  return World;
})();