all: js_make
	$(JS_MAKE)

clean:
	$(RM) -r build

.PHONY: all clean

.DELETE_ON_ERROR:

######################################################################
## Download stuff either using curl or wget
######################################################################

CURL=curl
WGET=wget
CURL_CMD=$(shell $(CURL) --version > /dev/null 2>&1 && echo $(CURL) -o)
WGET_CMD=$(shell $(WGET) --version > /dev/null 2>&1 && echo $(WGET) -O)
DOWNLOAD=$(if $(CURL_CMD),$(CURL_CMD),$(if $(WGET_CMD),$(WGET_CMD),$(error curl or wget is required to automatically download required tools)))

######################################################################
## Download Node.js with npm to run ECMAScript tools
######################################################################

NODE_OS:=$(subst Darwin,darwin,$(subst Linux,linux,$(shell uname -s)))
NODE_ARCH:=$(subst x86_64,x64,$(subst i386,x86,$(subst i686,x86,$(shell uname -m))))
NODE_VERSION:=0.12.6
NODE_URLBASE:=http://nodejs.org/dist
NODE_BASENAME:=node-v$(NODE_VERSION)-$(NODE_OS)-$(NODE_ARCH)
NODE_TAR:=$(NODE_BASENAME).tar.gz
NODE_URL:=$(NODE_URLBASE)/v$(NODE_VERSION)/$(NODE_TAR)

NODE:=node
NPM:=npm
cmd_needed=$(shell $(1) >/dev/null 2>&1 || echo needed)
NODE_NEEDED:=$(call cmd_needed,$(NODE) tools/check-node-version.js)
NPM_NEEDED:=$(call cmd_needed,$(NPM) -version)
NPM_DEP:=$(if $(NODE_NEEDED)$(NPM_NEEDED),download/$(NODE_BASENAME)/bin/npm,)
NODE_PATH:=PATH=node_modules/.bin:$(if $(NPM_DEP),$(dir $(NPM_DEP)):,)$$PATH
NPM_CMD:=$(if $(NPM_DEP),$(NODE_PATH) npm,$(NPM))
NODE_CMD:=$(if $(NPM_DEP),$(NODE_PATH) node,$(NODE))
JS_MAKE=$(NODE_CMD) make/index.js js_compiler=$(js_compiler)

download/arch/$(NODE_TAR):
	mkdir -p $(@D)
	$(DOWNLOAD) $@ $(NODE_URL)

download/$(NODE_BASENAME)/bin/npm: download/arch/$(NODE_TAR)
	rm -rf download/$(NODE_BASENAME) download/node
	cd download && tar xzf arch/$(NODE_TAR)
	test -e $@
	touch $@

js_make:

.PHONY: js_make

######################################################################
## Build different flavors of Cindy.js
######################################################################

#by default use closure compiler
js_compiler = closure

ifeq ($(plain),1)
	js_compiler = plain
endif

build/js/Cindy.plain.js: js_make
	$(JS_MAKE) plain

build/js/ours.js: js_make
	$(JS_MAKE) ours

build/js/exposed.js: js_make
	$(JS_MAKE) exposed

build/js/Cindy.closure.js: js_make
	$(JS_MAKE) closure

build/js/Cindy.js: js_make
	$(JS_MAKE) Cindy.js

######################################################################
## Forward targets to make/index.js
######################################################################

fwdtargets = \
	alltests \
	beautified \
	beautify \
	cindy3d \
	cindy3d-dbg \
	deploy \
	forbidden \
	jshint \
	katex \
	nodetest \
	proxy \
	ref \
	tests \
	textattr \
	unittests

$(fwdtargets): js_make
	$(JS_MAKE) $@

<<<<<<< HEAD
.PHONY: proxy



######################################################################
## Build JavaScript version of CindyGL
######################################################################


#cgl_shaders = $(wildcard *.glsl)
#cgl_str_res = $(cgl_shaders:%=src/str/gl/%)
cgl_shaders = $(wildcard src/str/cindygl/*.glsl)

build/js/cglres.js: $(cgl_shaders) tools/files2json.js $(NPM_DEP)
	$(NODE_CMD) $(filter %tools/files2json.js,$^) -varname=cgl_resources -output=$@ \
	$(filter %.glsl,$^)

##ADVANCED_OPTIMIZATIONS
##WHITESPACE_ONLY
cgl_closure_level = WHITESPACE_ONLY
cgl_closure_warnings = VERBOSE
cgl_closure_args = \
	--language_in ECMASCRIPT6_STRICT \
	--language_out ECMASCRIPT5_STRICT \
	--compilation_level $(cgl_closure_level) \
	--warning_level VERBOSE \
	--create_source_map build/js/CindyGL.js.map \
  --source_map_format V3 \
  --source_map_location_mapping "build/js/|" \
  --source_map_location_mapping "src/js/|../../src/js/" \
	--output_wrapper_file $(filter %.wrapper,$^) \
	--js_output_file $@ \
	--externs $(filter %.externs,$^) \
	--js $(js_src)
cgl_dbg_args = --transpile_only --formatting PRETTY_PRINT
cgl_mods = ShaderProgram Init ShaderProgram Renderer Plugin TypeInference Types IncludeFunctions compileToWebGL WebGLImplementation
cgl_srcs = $(cgl_mods:%=src/js/cindygl/%.js) \
	src/js/cindygl/cindyjs.externs src/js/cindygl/CindyGL.js.wrapper \
	build/js/cglres.js
#build/js/cglres.js src/js/cindy3d/Interface.js
build/js/CindyGL.js: tools/compiler.jar $(cgl_srcs)
	mkdir -p $(@D)
	$(CLOSURE) $(cgl_closure_args)

build/js/CindyGL.plain.js:
	cat $(cgl_srcs) > $@


cindyGL: build/js/CindyGL.js build/js/cglres.js

cindyGL-dbg:
	$(RM) build/js/CindyGL.js
	$(MAKE) cgl_extra_args='$(cgl_dbg_args)' build/js/CindyGL.js


cindyGL-plain: build/js/CindyGL.plain.js
