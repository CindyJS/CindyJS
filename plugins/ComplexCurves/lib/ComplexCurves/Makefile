all: ComplexCurves

beautify_args = --max-preserve-newlines 3 --end-with-newline -r -f src/js/*.js

beautified:
	git diff --exit-code --name-only
	js-beautify $(beautify_args)
	git diff --exit-code

beautify:
	js-beautify $(beautify_args)

jshint:
	jshint index.js src/js/*.js

clean:
	$(RM) -r build

.PHONY: all beautified beautify clean

cc_mods = API Assembly CachedSurface Complex ComplexCurves Export GLSL Initial \
	Matrix Mesh Misc Monomial Parser Polynomial PolynomialParser Quaternion \
	Stage State3D StateGL Subdivision SubdivisionPre Surface Term Tokenizer
cc_srcs = build/resources.js $(cc_mods:%=src/js/%.js)

JAVA=java
CLOSURE_VERSION=20160911
CLOSURE=$(JAVA) -jar closure-compiler-v$(CLOSURE_VERSION).jar
cc_closure_level = ADVANCED
cc_closure_warnings = VERBOSE
cc_closure_args = \
	--language_in ECMASCRIPT6_STRICT \
	--language_out ECMASCRIPT5_STRICT \
	--dependency_mode LOOSE \
	--create_source_map build/ComplexCurves.js.map \
	--compilation_level $(cc_closure_level) \
	--warning_level $(cc_closure_warnings) \
 	--jscomp_warning=reportUnknownTypes \
	--rewrite_polyfills=false \
	--source_map_format V3 \
	--source_map_location_mapping "build/|" \
	--source_map_location_mapping "src/js/|../src/js/" \
	--output_wrapper_file src/js/ComplexCurves.js.wrapper \
	--summary_detail_level 3 \
	--js_output_file $@ \
	$(cc_extra_args) \
	--js $(cc_srcs)

build/resources.js: $(wildcard src/glsl/*)
	mkdir -p $(@D)
	echo "var resources = {};" > $@
	for i in src/glsl/*; do \
		echo "resources['$$(basename $$i)'] = \`" >> $@; \
		sed -e 's/ \+/ /g;s/^ //g' $$i >> $@; \
		echo '`;' >> $@; \
		done

build/ComplexCurves.js: closure-compiler $(cc_srcs) src/js/ComplexCurves.js.wrapper
	$(CLOSURE) $(cc_closure_args)

closure-compiler: closure-compiler-v$(CLOSURE_VERSION).jar

closure-compiler-v$(CLOSURE_VERSION).jar:
	wget http://dl.google.com/closure-compiler/compiler-$(CLOSURE_VERSION).zip
	unzip compiler-$(CLOSURE_VERSION).zip closure-compiler-v$(CLOSURE_VERSION).jar
	rm compiler-$(CLOSURE_VERSION).zip

ComplexCurves: build/ComplexCurves.js

.PHONY: ComplexCurves

test: ComplexCurves beautified jshint

.PHONY: test
