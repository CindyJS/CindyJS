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
NODE_VERSION:=4.3.0
NODE_URLBASE:=http://nodejs.org/dist
NODE_BASENAME:=node-v$(NODE_VERSION)-$(NODE_OS)-$(NODE_ARCH)
NODE_TAR:=$(NODE_BASENAME).tar.gz
NODE_URL:=$(NODE_URLBASE)/v$(NODE_VERSION)/$(NODE_TAR)

ifeq ($(CURDIR),)
CURDIR:=$(shell pwd)
endif
NODE:=node
NPM:=npm
cmd_needed=$(shell $(1) >/dev/null 2>&1 || echo needed)
NODE_NEEDED:=$(call cmd_needed,$(NODE) make/check-node-version.js)

ifeq ($(NODE_NEEDED),needed)
ifeq ($(call cmd_needed,nodejs make/check-node-version.js),)
NODE:=nodejs
NODE_NEEDED:=
endif
endif
NPM_NEEDED:=$(call cmd_needed,$(NPM) -version)
NPM_DOWNLOADED:=download/$(NODE_BASENAME)/bin/npm
NPM_WRAPPER:=
ifneq ($(NODE),node)
NPM_WRAPPER:=build/bin/node
endif
NPM_DEP:=$(if $(NODE_NEEDED)$(NPM_NEEDED),$(NPM_DOWNLOADED),$(NPM_WRAPPER))
NODE_PATH:=PATH=$(if $(NPM_DEP),$(CURDIR)/$(dir $(NPM_DEP)):,)$$PATH
NPM_CMD:=$(if $(NPM_DEP),$(NODE_PATH) npm,$(NPM))
NODE_CMD:=$(if $(NPM_DEP),$(NODE_PATH) node,$(NODE))
JS_MAKE=$(NODE_CMD) make/index.js build=$(build)

download/arch/$(NODE_TAR):
	mkdir -p $(@D)
	$(DOWNLOAD) $@ $(NODE_URL)

download/$(NODE_BASENAME)/bin/npm: download/arch/$(NODE_TAR)
	rm -rf download/$(NODE_BASENAME) download/node
	cd download && tar xzf arch/$(NODE_TAR)
	test -e $@
	touch $@

build/bin/node:
	mkdir -p $(@D)
	echo '#!/bin/sh' >> $@
	echo 'exec $(NODE) "$$@"' >> $@
	chmod a+x $@

js_make: $(NPM_DEP)

.PHONY: js_make

######################################################################
## Build different flavors of Cindy.js
######################################################################

# Specify build=release on the command line to run closure compiler
build=debug

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
	cindygl \
	cindygl-dbg \
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

.PHONY: $(fwdtargets)
