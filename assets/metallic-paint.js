(function () {
  "use strict";

  var vertexShader =
    "#version 300 es\nprecision highp float;\nin vec2 a_position;\nout vec2 vP;\nvoid main(){vP=a_position*.5+.5;gl_Position=vec4(a_position,0.,1.);}";

  var fragmentShader =
    "#version 300 es\nprecision highp float;\nin vec2 vP;\nout vec4 oC;\nuniform sampler2D u_tex;\nuniform float u_time,u_ratio,u_imgRatio,u_seed,u_scale,u_refract,u_blur,u_liquid;\nuniform float u_bright,u_contrast,u_angle,u_fresnel,u_sharp,u_wave,u_noise,u_chroma;\nuniform float u_distort,u_contour;\nuniform vec3 u_lightColor,u_darkColor,u_tint;\n\nvec3 sC,sM;\n\nvec3 pW(vec3 v){\n  vec3 i=floor(v),f=fract(v),s=sign(fract(v*.5)-.5),h=fract(sM*i+i.yzx),c=f*(f-1.);\n  return s*c*((h*16.-4.)*c-1.);\n}\n\nvec3 aF(vec3 b,vec3 c){return pW(b+c.zxy-pW(b.zxy+c.yzx)+pW(b.yzx+c.xyz));}\nvec3 lM(vec3 s,vec3 p){return(p+aF(s,p))*.5;}\n\nvec2 fA(){\n  vec2 c=vP-.5;\n  c.x*=u_ratio>u_imgRatio?u_ratio/u_imgRatio:1.;\n  c.y*=u_ratio>u_imgRatio?1.:u_imgRatio/u_ratio;\n  return vec2(c.x+.5,.5-c.y);\n}\n\nvec2 rot(vec2 p,float r){float c=cos(r),s=sin(r);return vec2(p.x*c+p.y*s,p.y*c-p.x*s);}\n\nfloat bM(vec2 c,float t){\n  vec2 l=smoothstep(vec2(0.),vec2(t),c),u=smoothstep(vec2(0.),vec2(t),1.-c);\n  return l.x*l.y*u.x*u.y;\n}\n\nfloat mG(float hi,float lo,float t,float sh,float cv){\n  sh*=(2.-u_sharp);\n  float ci=smoothstep(.15,.85,cv),r=lo;\n  float e1=.08/u_scale;\n  r=mix(r,hi,smoothstep(0.,sh*1.5,t));\n  r=mix(r,lo,smoothstep(e1-sh,e1+sh,t));\n  float e2=e1+.05/u_scale*(1.-ci*.35);\n  r=mix(r,hi,smoothstep(e2-sh,e2+sh,t));\n  float e3=e2+.025/u_scale*(1.-ci*.45);\n  r=mix(r,lo,smoothstep(e3-sh,e3+sh,t));\n  float e4=e1+.1/u_scale;\n  r=mix(r,hi,smoothstep(e4-sh,e4+sh,t));\n  float rm=1.-e4,gT=clamp((t-e4)/rm,0.,1.);\n  r=mix(r,mix(hi,lo,smoothstep(0.,1.,gT)),smoothstep(e4-sh*.5,e4+sh*.5,t));\n  return r;\n}\n\nvoid main(){\n  sC=fract(vec3(.7548,.5698,.4154)*(u_seed+17.31))+.5;\n  sM=fract(sC.zxy-sC.yzx*1.618);\n  vec2 sc=vec2(vP.x*u_ratio,1.-vP.y);\n  float angleRad=u_angle*3.14159/180.;\n  sc=rot(sc-.5,angleRad)+.5;\n  sc=clamp(sc,0.,1.);\n  float sl=sc.x-sc.y,an=u_time*.001;\n  vec2 iC=fA();\n  vec4 texSample=texture(u_tex,iC);\n  float dp=texSample.r;\n  float shapeMask=texSample.a;\n  vec3 hi=u_lightColor*u_bright;\n  vec3 lo=u_darkColor*(2.-u_bright);\n  lo.b+=smoothstep(.6,1.4,sc.x+sc.y)*.08;\n  vec2 fC=sc-.5;\n  float rd=length(fC+vec2(0.,sl*.15));\n  vec2 ag=rot(fC,(.22-sl*.18)*3.14159);\n  float cv=1.-pow(rd*1.65,1.15);\n  cv*=pow(sc.y,.35);\n  float vs=shapeMask;\n  vs*=bM(iC,.01);\n  float fr=pow(1.-cv,u_fresnel)*.3;\n  vs=min(vs+fr*vs,1.);\n  float mT=an*.0625;\n  vec3 wO=vec3(-1.05,1.35,1.55);\n  vec3 wA=aF(vec3(31.,73.,56.),mT+wO)*.22*u_wave;\n  vec3 wB=aF(vec3(24.,64.,42.),mT-wO.yzx)*.22*u_wave;\n  vec2 nC=sc*45.*u_noise;\n  nC+=aF(sC.zxy,an*.17*sC.yzx-sc.yxy*.35).xy*18.*u_wave;\n  vec3 tC=vec3(.00041,.00053,.00076)*mT+wB*nC.x+wA*nC.y;\n  tC=lM(sC,tC);\n  tC=lM(sC+1.618,tC);\n  float tb=sin(tC.x*3.14159)*.5+.5;\n  tb=tb*2.-1.;\n  float noiseVal=pW(vec3(sc*8.+an,an*.5)).x;\n  float edgeFactor=smoothstep(0.,.5,dp)*smoothstep(1.,.5,dp);\n  float lD=dp+(1.-dp)*u_liquid*tb;\n  lD+=noiseVal*u_distort*.15*edgeFactor;\n  float rB=clamp(1.-cv,0.,1.);\n  float fl=ag.x+sl;\n  fl+=noiseVal*sl*u_distort*edgeFactor;\n  fl*=mix(1.,1.-dp*.5,u_contour);\n  fl-=dp*u_contour*.8;\n  float eI=smoothstep(0.,1.,lD)*smoothstep(1.,0.,lD);\n  fl-=tb*sl*1.8*eI;\n  float cA=cv*clamp(pow(sc.y,.12),.25,1.);\n  fl*=.12+(1.05-lD)*cA;\n  fl*=smoothstep(1.,.65,lD);\n  float vA1=smoothstep(.08,.18,sc.y)*smoothstep(.38,.18,sc.y);\n  float vA2=smoothstep(.08,.18,1.-sc.y)*smoothstep(.38,.18,1.-sc.y);\n  fl+=vA1*.16+vA2*.025;\n  fl*=.45+pow(sc.y,2.)*.55;\n  fl*=u_scale;\n  fl-=an;\n  float rO=rB+cv*tb*.025;\n  float vM1=smoothstep(-.12,.18,sc.y)*smoothstep(.48,.08,sc.y);\n  float cM1=smoothstep(.35,.55,cv)*smoothstep(.95,.35,cv);\n  rO+=vM1*cM1*4.5;\n  rO-=sl;\n  float bO=rB*1.25;\n  float vM2=smoothstep(-.02,.35,sc.y)*smoothstep(.75,.08,sc.y);\n  float cM2=smoothstep(.35,.55,cv)*smoothstep(.75,.35,cv);\n  bO+=vM2*cM2*.9;\n  bO-=lD*.18;\n  rO*=u_refract*u_chroma;\n  bO*=u_refract*u_chroma;\n  float sf=u_blur;\n  float rP=fract(fl+rO);\n  float rC=mG(hi.r,lo.r,rP,sf+.018+u_refract*cv*.025,cv);\n  float gP=fract(fl);\n  float gC=mG(hi.g,lo.g,gP,sf+.008/max(.01,1.-sl),cv);\n  float bP=fract(fl-bO);\n  float bC=mG(hi.b,lo.b,bP,sf+.008,cv);\n  vec3 col=vec3(rC,gC,bC);\n  col=(col-.5)*u_contrast+.5;\n  col=clamp(col,0.,1.);\n  col=mix(col,1.-min(vec3(1.),(1.-col)/max(u_tint,vec3(.001))),length(u_tint-1.)*.5);\n  col=clamp(col,0.,1.);\n  oC=vec4(col*vs,vs);\n}";

  function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [
          parseInt(result[1], 16) / 255,
          parseInt(result[2], 16) / 255,
          parseInt(result[3], 16) / 255,
        ]
      : [1, 1, 1];
  }

  function processImage(img) {
    var MAX_SIZE = 1000;
    var MIN_SIZE = 500;
    var width = img.naturalWidth || img.width;
    var height = img.naturalHeight || img.height;

    if (
      width > MAX_SIZE ||
      height > MAX_SIZE ||
      width < MIN_SIZE ||
      height < MIN_SIZE
    ) {
      var scale =
        width > height
          ? width > MAX_SIZE
            ? MAX_SIZE / width
            : width < MIN_SIZE
              ? MIN_SIZE / width
              : 1
          : height > MAX_SIZE
            ? MAX_SIZE / height
            : height < MIN_SIZE
              ? MIN_SIZE / height
              : 1;
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    var canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, width, height);

    var imageData = ctx.getImageData(0, 0, width, height);
    var data = imageData.data;
    var size = width * height;
    var alphaValues = new Float32Array(size);
    var shapeMask = new Uint8Array(size);
    var boundaryMask = new Uint8Array(size);

    for (var i = 0; i < size; i++) {
      var idx = i * 4;
      var r = data[idx],
        g = data[idx + 1],
        b = data[idx + 2],
        a = data[idx + 3];
      var isBackground = (r > 250 && g > 250 && b > 250 && a === 255) || a < 5;
      alphaValues[i] = isBackground ? 0 : a / 255;
      shapeMask[i] = alphaValues[i] > 0.1 ? 1 : 0;
    }

    for (var y = 0; y < height; y++) {
      for (var x = 0; x < width; x++) {
        var mi = y * width + x;
        if (!shapeMask[mi]) continue;
        if (
          x === 0 ||
          x === width - 1 ||
          y === 0 ||
          y === height - 1 ||
          !shapeMask[mi - 1] ||
          !shapeMask[mi + 1] ||
          !shapeMask[mi - width] ||
          !shapeMask[mi + width]
        ) {
          boundaryMask[mi] = 1;
        }
      }
    }

    var u = new Float32Array(size);
    var ITERATIONS = 200;
    var C = 0.01;
    var omega = 1.85;

    for (var iter = 0; iter < ITERATIONS; iter++) {
      for (var iy = 1; iy < height - 1; iy++) {
        for (var ix = 1; ix < width - 1; ix++) {
          var ii = iy * width + ix;
          if (!shapeMask[ii] || boundaryMask[ii]) continue;
          var sum =
            (shapeMask[ii + 1] ? u[ii + 1] : 0) +
            (shapeMask[ii - 1] ? u[ii - 1] : 0) +
            (shapeMask[ii + width] ? u[ii + width] : 0) +
            (shapeMask[ii - width] ? u[ii - width] : 0);
          u[ii] = (omega * (C + sum)) / 4 + (1 - omega) * u[ii];
        }
      }
    }

    var maxVal = 0;
    for (var mi2 = 0; mi2 < size; mi2++) if (u[mi2] > maxVal) maxVal = u[mi2];
    if (maxVal === 0) maxVal = 1;

    var outData = ctx.createImageData(width, height);
    for (var mi3 = 0; mi3 < size; mi3++) {
      var px = mi3 * 4;
      var depth = u[mi3] / maxVal;
      var gray = Math.round(255 * (1 - depth * depth));
      outData.data[px] = outData.data[px + 1] = outData.data[px + 2] = gray;
      outData.data[px + 3] = Math.round(alphaValues[mi3] * 255);
    }

    return outData;
  }

  function MetallicPaint(canvas, options) {
    this.canvas = canvas;
    this.opts = Object.assign(
      {
        imageSrc: "",
        seed: 42,
        scale: 4,
        refraction: 0.01,
        blur: 0.015,
        liquid: 0.75,
        speed: 0.3,
        brightness: 2,
        contrast: 0.5,
        angle: 0,
        fresnel: 1,
        lightColor: "#ffffff",
        darkColor: "#000000",
        patternSharpness: 1,
        waveAmplitude: 1,
        noiseScale: 0.5,
        chromaticSpread: 2,
        mouseAnimation: false,
        distortion: 1,
        contour: 0.2,
        tintColor: "#feb3ff",
      },
      options,
    );

    this.gl = null;
    this.program = null;
    this.uniforms = {};
    this.texture = null;
    this.animTime = 0;
    this.lastTime = 0;
    this.rafId = null;
    this.mouse = { x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 };
    this.imgData = null;
    this.ready = false;
    this.textureReady = false;

    this._init();
  }

  MetallicPaint.prototype._compileShader = function (gl, src, type) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error(
        "MetallicPaint shader compile error:",
        gl.getShaderInfoLog(s),
      );
      return null;
    }
    return s;
  };

  MetallicPaint.prototype._initGL = function () {
    var canvas = this.canvas;
    var gl = canvas.getContext("webgl2", { antialias: true, alpha: true });
    if (!gl) {
      console.error("MetallicPaint: WebGL2 not supported");
      return false;
    }

    var vs = this._compileShader(gl, vertexShader, gl.VERTEX_SHADER);
    var fs = this._compileShader(gl, fragmentShader, gl.FRAGMENT_SHADER);
    if (!vs || !fs) return false;

    var prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error(
        "MetallicPaint program link error:",
        gl.getProgramInfoLog(prog),
      );
      return false;
    }

    var uniforms = {};
    var count = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS);
    for (var i = 0; i < count; i++) {
      var info = gl.getActiveUniform(prog, i);
      if (info) uniforms[info.name] = gl.getUniformLocation(prog, info.name);
    }

    var verts = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

    gl.useProgram(prog);
    var pos = gl.getAttribLocation(prog, "a_position");
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    var dpr = devicePixelRatio || 1;
    var rect = canvas.getBoundingClientRect();
    var cw = Math.max(Math.round(rect.width * dpr), 300);
    var ch = Math.max(Math.round(rect.height * dpr), 60);
    canvas.width = cw;
    canvas.height = ch;
    gl.viewport(0, 0, cw, ch);

    gl.uniform1f(uniforms.u_imgRatio, 500 / 140);
    gl.uniform1f(uniforms.u_ratio, cw / ch);

    this.gl = gl;
    this.program = prog;
    this.uniforms = uniforms;
    return true;
  };

  MetallicPaint.prototype._uploadTexture = function (imgData) {
    var gl = this.gl;
    var uniforms = this.uniforms;
    if (!gl || !imgData) return;

    if (this.texture) gl.deleteTexture(this.texture);

    var tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      imgData.width,
      imgData.height,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      imgData.data,
    );
    gl.uniform1i(uniforms.u_tex, 0);

    var ratio = imgData.width / imgData.height;
    gl.uniform1f(uniforms.u_imgRatio, ratio);

    this.texture = tex;
    this.imgData = imgData;
  };

  MetallicPaint.prototype._updateUniforms = function () {
    var gl = this.gl;
    var u = this.uniforms;
    var o = this.opts;
    if (!gl) return;

    gl.uniform1f(u.u_seed, o.seed);
    gl.uniform1f(u.u_scale, o.scale);
    gl.uniform1f(u.u_refract, o.refraction);
    gl.uniform1f(u.u_blur, o.blur);
    gl.uniform1f(u.u_liquid, o.liquid);
    gl.uniform1f(u.u_bright, o.brightness);
    gl.uniform1f(u.u_contrast, o.contrast);
    gl.uniform1f(u.u_angle, o.angle);
    gl.uniform1f(u.u_fresnel, o.fresnel);

    var light = hexToRgb(o.lightColor);
    var dark = hexToRgb(o.darkColor);
    var tint = hexToRgb(o.tintColor);
    gl.uniform3f(u.u_lightColor, light[0], light[1], light[2]);
    gl.uniform3f(u.u_darkColor, dark[0], dark[1], dark[2]);
    gl.uniform1f(u.u_sharp, o.patternSharpness);
    gl.uniform1f(u.u_wave, o.waveAmplitude);
    gl.uniform1f(u.u_noise, o.noiseScale);
    gl.uniform1f(u.u_chroma, o.chromaticSpread);
    gl.uniform1f(u.u_distort, o.distortion);
    gl.uniform1f(u.u_contour, o.contour);
    gl.uniform3f(u.u_tint, tint[0], tint[1], tint[2]);
  };

  MetallicPaint.prototype._loadImage = function () {
    var self = this;
    if (!this.opts.imageSrc) return;

    var img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = function () {
      var imgData = processImage(img);
      self._uploadTexture(imgData);

      var dpr = devicePixelRatio || 1;
      var rect = self.canvas.getBoundingClientRect();
      var cw = Math.max(Math.round(rect.width * dpr), 300);
      var ch = Math.max(Math.round(rect.height * dpr), 60);
      if (self.canvas.width !== cw || self.canvas.height !== ch) {
        self.canvas.width = cw;
        self.canvas.height = ch;
        self.gl.viewport(0, 0, cw, ch);
      }

      self._updateUniforms();

      self.gl.uniform1f(self.uniforms.u_ratio, cw / ch);
      self.gl.uniform1f(
        self.uniforms.u_imgRatio,
        imgData.width / imgData.height,
      );

      self.textureReady = true;
      self._startLoop();
    };
    img.src = this.opts.imageSrc;
  };

  MetallicPaint.prototype._startLoop = function () {
    var self = this;
    var canvas = this.canvas;
    var mouse = this.mouse;

    var handleMouseMove = function (e) {
      var rect = canvas.getBoundingClientRect();
      mouse.targetX = (e.clientX - rect.left) / rect.width;
      mouse.targetY = (e.clientY - rect.top) / rect.height;
    };
    canvas.addEventListener("mousemove", handleMouseMove);

    this.lastTime = performance.now();

    var render = function (time) {
      var delta = time - self.lastTime;
      self.lastTime = time;

      if (self.opts.mouseAnimation) {
        mouse.x += (mouse.targetX - mouse.x) * 0.08;
        mouse.y += (mouse.targetY - mouse.y) * 0.08;
        self.animTime = mouse.x * 3000 + mouse.y * 1500;
      } else {
        self.animTime += delta * self.opts.speed;
      }

      self.gl.uniform1f(self.uniforms.u_time, self.animTime);
      self.gl.drawArrays(self.gl.TRIANGLE_STRIP, 0, 4);
      self.rafId = requestAnimationFrame(render);
    };

    this.rafId = requestAnimationFrame(render);

    this._cleanupMove = function () {
      canvas.removeEventListener("mousemove", handleMouseMove);
    };
  };

  MetallicPaint.prototype._init = function () {
    if (!this._initGL()) return;
    this._updateUniforms();
    this._loadImage();
  };

  MetallicPaint.prototype.destroy = function () {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    if (this._cleanupMove) this._cleanupMove();
    if (this.texture && this.gl) this.gl.deleteTexture(this.texture);
    if (this.gl && this.program) this.gl.deleteProgram(this.program);
    this.gl = null;
    this.canvas = null;
  };

  var initWhenReady = function () {
    var canvases = document.querySelectorAll("[data-metallic-paint]");
    canvases.forEach(function (el) {
      try {
        var opts = el.getAttribute("data-metallic-paint");
        new MetallicPaint(el, opts ? JSON.parse(opts) : {});
      } catch (e) {
        console.error("MetallicPaint init error:", e);
      }
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initWhenReady);
  } else {
    initWhenReady();
  }
})();
