JAVA=java

all: build/js/Cindy.js

clean:
	$(RM) -r build
	cd GWT && ant clean

.PHONY: all clean

libcs := src/js/libcs/Namespace.js src/js/libcs/Accessors.js src/js/libcs/CSNumber.js src/js/libcs/List.js src/js/libcs/Essentials.js src/js/libcs/General.js src/js/libcs/Operators.js src/js/libcs/OpDrawing.js src/js/libcs/OpImageDrawing.js src/js/libcs/Parser.js src/js/libcs/OpSound.js

libgeo := src/js/libgeo/GeoState.js src/js/libgeo/GeoBasics.js src/js/libgeo/GeoOps.js src/js/libgeo/GeoScripts.js

liblab := src/js/liblab/LabBasics.js src/js/liblab/LabObjects.js

lib := src/js/lib/numeric-1.2.6.js src/js/lib/clipper.js

ours = src/js/Setup.js src/js/Events.js src/js/Timer.js $(libcs) $(libgeo) $(liblab)

srcs = $(ours) $(lib)

# by defaul compile with SIMPLE flag
closure_level = SIMPLE
ifeq ($(O),1)
	closure_level = ADVANCED
endif

closure_language = ECMASCRIPT5_STRICT
closure_args = \
	--language_in $(closure_language) \
	--create_source_map build/js/Cindy.js.map \
	--compilation_level $(closure_level) \
	--source_map_format V3 \
	--source_map_location_mapping "build/js/|" \
	--source_map_location_mapping "src/js/|../../src/js/" \
	--output_wrapper_file $(filter %.wrapper,$^) \
	--js_output_file $@ \
	--js $(filter %.js,$^)

#by default use closure compiler
js_compiler = closure

ifeq ($(plain),1)
	js_compiler = plain 
endif


build/js/Cindy.closure.js: compiler.jar src/js/Cindy.js.wrapper $(srcs)
	mkdir -p $(@D)
	$(JAVA) -jar $(filter %compiler.jar,$^) $(closure_args)

build/js/Cindy.plain.js: $(srcs)

build/js/ours.js: $(ours)

build/js/Cindy.plain.js build/js/ours.js: src/js/Cindy.plain.js.wrapper
	mkdir -p $(@D)
	awk '/%output%/{exit}{print}' $(filter %.wrapper,$^) > $@
	cat $(filter %.js,$^) >> $@
	awk '/%output%/{i=1;getline}{if(i)print}' $(filter %.wrapper,$^) \
	| sed 's://#.*::' >> $@

build/js/Cindy.js: build/js/Cindy.$(js_compiler).js
	cp $< $@

NPM = npm

node_modules/jshint/bin/jshint:
	$(NPM) install jshint

jshint: node_modules/jshint/bin/jshint build/js/ours.js
	$< -c Administration/jshint.conf --verbose $(filter %.js,$^)

.PHONY: jshint

ANT_VERSION=1.9.4
ANT_MIRROR=http://apache.openmirror.de
ANT_PATH=ant/binaries
ANT_ZIP=apache-ant-$(ANT_VERSION)-bin.zip
ANT_URL=$(ANT_MIRROR)/$(ANT_PATH)/$(ANT_ZIP)

GWT/download/arch/$(ANT_ZIP):
	mkdir -p $(@D)
	curl -o $@ $(ANT_URL)

GWT/download/ant/bin/ant: GWT/download/arch/$(ANT_ZIP)
	rm -rf GWT/download/ant GWT/download/apache-ant-*
	cd GWT/download && unzip arch/$(ANT_ZIP)
	mv GWT/download/apache-ant-$(ANT_VERSION) GWT/download/ant
	touch $@

ANT:=ant
ANT_DEP:=$(shell $(ANT) -version > /dev/null 2>&1 || echo GWT/download/ant/bin/ant)
ANT_CMD:=$(if $(ANT_DEP),$(ANT_DEP),$(ANT))

GWT_modules = $(patsubst src/java/cindyjs/%.gwt.xml,%,$(wildcard src/java/cindyjs/*.gwt.xml))

define GWT_template

GWT/war/$(1)/$(1).nocache.js: src/java/cindyjs/$(1).gwt.xml $$(wildcard src/java/cindyjs/$(1)/*.java) $$(ANT_DEP)
	cd GWT && $$(ANT_CMD:GWT/%=%) -Dcjs.module=$(1)

build/js/$(1)/$(1).nocache.js: GWT/war/$(1)/$(1).nocache.js
	rm -rf build/js/$(1)
	cp -r GWT/war/$(1) build/js/

all: build/js/$(1)/$(1).nocache.js

endef

$(foreach mod,$(GWT_modules),$(eval $(call GWT_template,$(mod))))
