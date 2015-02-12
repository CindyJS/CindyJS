all: build/js/Cindy.js cindy3d

clean:
	$(RM) -r build

.PHONY: all clean

.DELETE_ON_ERROR:

######################################################################
## List all our sources
######################################################################

libcs := src/js/libcs/Namespace.js src/js/libcs/Accessors.js src/js/libcs/CSNumber.js src/js/libcs/List.js src/js/libcs/Essentials.js src/js/libcs/General.js src/js/libcs/Operators.js src/js/libcs/OpDrawing.js src/js/libcs/OpImageDrawing.js src/js/libcs/Parser.js src/js/libcs/OpSound.js

libgeo := src/js/libgeo/GeoState.js src/js/libgeo/GeoBasics.js src/js/libgeo/GeoOps.js src/js/libgeo/GeoScripts.js

liblab := src/js/liblab/LabBasics.js src/js/liblab/LabObjects.js

lib := src/js/lib/numeric-1.2.6.js src/js/lib/clipper.js

ours = src/js/Setup.js src/js/Events.js src/js/Timer.js $(libcs) $(libgeo) $(liblab)

srcs = $(ours) $(lib)

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
NODE_ARCH:=$(subst x86_64,x86,$(subst i386,x86,$(shell uname -m)))
NODE_VERSION:=0.10.33
NODE_URLBASE:=http://nodejs.org/dist
NODE_TAR:=node-v$(NODE_VERSION)-$(NODE_OS)-$(NODE_ARCH).tar.gz
NODE_URL:=$(NODE_URLBASE)/v$(NODE_VERSION)/$(NODE_TAR)
NPM:=npm
NPM_DEP:=$(shell $(NPM) -version > /dev/null 2>&1 || echo download/node/bin/npm)
NODE_PATH:=$(if $(NPM_DEP),PATH=$(dir $(NPM_DEP)):$$PATH,)
NPM_CMD:=$(if $(NPM_DEP),$(NODE_PATH) npm,$(NPM))
NODE:=node
NODE_CMD:=$(if $(NPM_DEP),$(NODE_PATH) node,$(NODE))

download/arch/$(NODE_TAR):
	mkdir -p $(@D)
	$(DOWNLOAD) $@ $(NODE_URL)

download/node/bin/npm: download/arch/$(NODE_TAR)
	rm -rf download/node*
	cd download && tar xzf arch/$(NODE_TAR)
	mv download/node-v$(NODE_VERSION)-* download/node
	touch $@

######################################################################
## Build different flavors of Cindy.js
######################################################################

# by defaul compile with SIMPLE flag
closure_level = SIMPLE
ifeq ($(O),1)
	closure_level = ADVANCED
endif

closure_language = ECMASCRIPT5_STRICT
closure_args_common = \
	--language_in $(closure_language) \
	--compilation_level $(closure_level) \
	--js_output_file $@ \
	--js $(filter %.js,$^)
closure_args_wrapper = \
	$(closure_args_common)
closure_args = \
	--create_source_map $@.map \
	--source_map_format V3 \
	--source_map_location_mapping "build/js/|" \
	--source_map_location_mapping "src/js/|../../src/js/" \
	--output_wrapper_file $(filter %.wrapper,$^) \
	$(closure_args_common)

#by default use closure compiler
js_compiler = closure

ifeq ($(plain),1)
	js_compiler = plain
endif

JAVA=java
CLOSURE=$(JAVA) -jar $(filter %compiler.jar,$^)

build/js/wrapper.js: src/js/Outside.js tools/compiler.jar
	mkdir -p $(@D)
	$(CLOSURE) $(closure_args_wrapper)

build/js/Cindy.js.wrapper: src/js/newInstance.js build/js/wrapper.js \
		tools/mkwrapper.sed $(NPM_DEP)
	$(NODE_CMD) tools/wrap.js 'placeholder\(\)' build/js/wrapper.js < $< \
	| sed -f tools/mkwrapper.sed > $@
	echo "//# sourceMappingURL=Cindy.js.map" >> $@

build/js/Cindy.closure.js: tools/compiler.jar build/js/Cindy.js.wrapper $(srcs)
	$(CLOSURE) $(closure_args)
	sed 's:$(@F):Cindy.js:g' $@.map > $(@:%.closure.js=%.js.map)

build/js/Cindy.plain.js: $(srcs)

build/js/ours.js: $(ours)

build/js/plain.wrapper: src/js/newInstance.js src/js/Outside.js $(NPM_DEP)
	mkdir -p $(@D)
	$(NODE_CMD) tools/wrap.js 'placeholder\(\)' src/js/Outside.js < $< > $@

build/js/Cindy.plain.js build/js/ours.js: build/js/plain.wrapper $(NPM_DEP)
	cat $(filter %.js,$^) | \
	$(NODE_CMD) tools/wrap.js '%output%' $< > $@

build/js/Cindy.js: build/js/Cindy.$(js_compiler).js
	cp $< $@

######################################################################
## Run jshint to detect syntax problems
######################################################################

node_modules/.bin/jshint: $(NPM_DEP)
	$(NPM_CMD) install jshint

jshint: node_modules/.bin/jshint build/js/ours.js
	$(NODE_PATH) $< -c Administration/jshint.conf --verbose $(filter %.js,$^)

.PHONY: jshint

######################################################################
## Run test suite from reference manual using node
######################################################################

nodetest: build/js/Cindy.plain.js $(NPM_DEP)
	$(NODE) ref/runtests.js

tests: nodetest

.PHONY: tests nodetest

######################################################################
## Format reference manual using markdown
######################################################################

node_modules/marked/package.json: $(NPM_DEP)
	$(NPM_CMD) install marked

refmd:=$(wildcard ref/*.md)
refimg:=$(wildcard ref/img/*.png)
refhtml:=$(refmd:ref/%.md=build/ref/%.html)
refres:=ref.css

$(refhtml): build/ref/%.html: ref/%.md node_modules/marked/package.json \
		ref/md2html.js ref/template.html $(NPM_DEP)
	@mkdir -p $(@D)
	$(NODE_CMD) ref/md2html.js $< $@

$(refres:%=build/ref/%): build/ref/%: ref/%
	cp $< $@

$(refimg:%=build/%): build/%: %
	@mkdir -p $(@D)
	cp $< $@

ref: $(refhtml) $(refres:%=build/ref/%) $(refimg:%=build/%)

.PHONY: ref

######################################################################
## Build JavaScript version of Cindy3D
######################################################################

c3d_primitives = sphere cylinder triangle
c3d_shaders = $(c3d_primitives:%=%-vert.glsl) $(c3d_primitives:%=%-frag.glsl) \
	lighting.glsl common-frag.glsl
c3d_str_res = $(c3d_shaders:%=src/str/cindy3d/%)

build/js/c3dres.js: $(c3d_str_res) tools/files2json.js $(NPM_DEP)
	$(NODE_CMD) tools/files2json.js -varname=c3d_resources -output=$@ \
	$(c3d_str_res)

# For debugging use these command line arguments for make:
# c3d_closure_level=WHITESPACE_ONLY c3d_extra_args='--formatting PRETTY_PRINT'

c3d_closure_level = ADVANCED
c3d_closure_warnings = VERBOSE
c3d_closure_args = \
	--language_in ECMASCRIPT6_STRICT \
	--language_out ECMASCRIPT5_STRICT \
	--create_source_map build/js/Cindy3D.js.map \
	--compilation_level $(c3d_closure_level) \
	--warning_level $(c3d_closure_warnings) \
	--source_map_format V3 \
	--source_map_location_mapping "build/js/|" \
	--source_map_location_mapping "src/js/|../../src/js/" \
	--output_wrapper_file $(filter %.wrapper,$^) \
	--js_output_file $@ \
	--externs $(filter %.externs,$^) \
	$(c3d_extra_args) \
	--js $(filter %.js,$^)
c3d_mods = ShaderProgram Camera Appearance Viewer PrimitiveRenderer \
	Spheres Cylinders Triangles Interface Ops3D
c3d_srcs = build/js/c3dres.js $(c3d_mods:%=src/js/cindy3d/%.js) \
	src/js/cindy3d/cindyjs.externs src/js/cindy3d/Cindy3D.js.wrapper

build/js/Cindy3D.js: tools/compiler.jar $(c3d_srcs)
	mkdir -p $(@D)
	$(CLOSURE) $(c3d_closure_args)

cindy3d: build/js/Cindy3D.js

.PHONY: cindy3d

######################################################################
## Download Apache Ant to build java-like projects
######################################################################

ANT_VERSION=1.9.4
ANT_MIRROR=http://apache.openmirror.de
ANT_PATH=ant/binaries
ANT_ZIP=apache-ant-$(ANT_VERSION)-bin.zip
ANT_URL=$(ANT_MIRROR)/$(ANT_PATH)/$(ANT_ZIP)

download/arch/$(ANT_ZIP):
	mkdir -p $(@D)
	$(DOWNLOAD) $@ $(ANT_URL)

download/ant/bin/ant: download/arch/$(ANT_ZIP)
	rm -rf download/ant download/apache-ant-*
	cd download && unzip arch/$(ANT_ZIP)
	mv download/apache-ant-$(ANT_VERSION) download/ant
	touch $@

ANT:=ant
ANT_DEP:=$(shell $(ANT) -version > /dev/null 2>&1 || echo download/ant/bin/ant)
ANT_CMD:=$(if $(ANT_DEP),$(ANT_DEP),$(ANT))

######################################################################
## Run GWT for each listed GWT module
######################################################################

GWT_modules = $(patsubst src/java/cindyjs/%.gwt.xml,%,$(wildcard src/java/cindyjs/*.gwt.xml))

define GWT_template

GWT/war/$(1)/$(1).nocache.js: src/java/cindyjs/$(1).gwt.xml $$(wildcard src/java/cindyjs/$(1)/*.java) $$(ANT_DEP)
	cd GWT && $$(ANT_CMD:download/%=../download/%) -Dcjs.module=$(1)

build/js/$(1)/$(1).nocache.js: GWT/war/$(1)/$(1).nocache.js
	rm -rf build/js/$(1)
	cp -r GWT/war/$(1) build/js/

all: build/js/$(1)/$(1).nocache.js

endef

$(foreach mod,$(GWT_modules),$(eval $(call GWT_template,$(mod))))

######################################################################
## Help debugging a remote site
######################################################################

node_modules/http-proxy/package.json: $(NPM_DEP)
	$(NPM_CMD) install http-proxy

proxy: tools/CindyReplacingProxy.js node_modules/http-proxy/package.json
	@echo Configure browser for host 127.0.0.1 port 8080.
	@echo Press Ctrl+C to interrupt once you are done.
	-$(NODE_CMD) $<
