/**
 * CindyJS WebXR integration code:
 *
 * Copyright 2019 Christoph Neuhauser
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * All callbacks to CindyScript code for WebXR events.
 */
var xrCsCompiled = {};
let cindyXrDrawCallback = function () {};
let cindyXrInputSourcesChangeCallback = function (cindyScriptAddedInputSources, cindyScriptRemovedInputSources) {};
let cindyXrSelectStartCallback = function (cindyScriptInputSource) {};
let cindyXrSelectEndCallback = function (cindyScriptInputSource) {};
let cindyXrSelectCallback = function (cindyScriptInputSource) {};
let cindyXrSelectHoldCallback = function (cindyScriptInputSource) {};
let cindyXrSqueezeStartCallback = function (cindyScriptInputSource) {};
let cindyXrSqueezeEndCallback = function (cindyScriptInputSource) {};
let cindyXrSqueezeCallback = function (cindyScriptInputSource) {};
let cindyXrSqueezeHoldCallback = function (cindyScriptInputSource) {};

let activeSelectInputSources = [];
let activeSqueezeInputSources = [];

/**
 * For setting global CindyJS variables.
 */
let setCindyScriptVariable = function (name, value) {
    let csVariableSetterCompiled = xrCindyApi.instance.parse(name + " = 0", false);
    csVariableSetterCompiled.args[1] = value;
    xrCindyApi.evaluate(csVariableSetterCompiled);
};

/**
 * Sets all callbacks defined above.
 */
function setupCindyScriptEventCallbacks() {
    xrCsCompiled = xrCindyApi.cscompiled;

    if (xrCsCompiled["xrdraw"] !== undefined) {
        cindyXrDrawCallback = function () {
            xrCindyApi.evaluate(xrCsCompiled["xrdraw"]);
        };
    }
    if (xrCsCompiled["xrinputsourceschange"] !== undefined) {
        cindyXrInputSourcesChangeCallback = function (cindyScriptAddedInputSources, cindyScriptRemovedInputSources) {
            setCindyScriptVariable("addedinputsources", cindyScriptAddedInputSources);
            setCindyScriptVariable("removedinputsources", cindyScriptRemovedInputSources);
            xrCindyApi.evaluate(xrCsCompiled["xrinputsourceschange"]);
        };
    }
    if (xrCsCompiled["xrselectstart"] !== undefined) {
        cindyXrSelectStartCallback = function (cindyScriptInputSource) {
            setCindyScriptVariable("inputsource", cindyScriptInputSource);
            xrCindyApi.evaluate(xrCsCompiled["xrselectstart"]);
        };
    }
    if (xrCsCompiled["xrselectend"] !== undefined) {
        cindyXrSelectEndCallback = function (cindyScriptInputSource) {
            setCindyScriptVariable("inputsource", cindyScriptInputSource);
            xrCindyApi.evaluate(xrCsCompiled["xrselectend"]);
        };
    }
    if (xrCsCompiled["xrselect"] !== undefined) {
        cindyXrSelectCallback = function (cindyScriptInputSource) {
            setCindyScriptVariable("inputsource", cindyScriptInputSource);
            xrCindyApi.evaluate(xrCsCompiled["xrselect"]);
        };
    }
    if (xrCsCompiled["xrselecthold"] !== undefined) {
        cindyXrSelectHoldCallback = function (cindyScriptInputSource) {
            setCindyScriptVariable("inputsource", cindyScriptInputSource);
            xrCindyApi.evaluate(xrCsCompiled["xrselecthold"]);
        };
    }
    if (xrCsCompiled["xrsqueezestart"] !== undefined) {
        cindyXrSqueezeStartCallback = function (cindyScriptInputSource) {
            setCindyScriptVariable("inputsource", cindyScriptInputSource);
            xrCindyApi.evaluate(xrCsCompiled["xrsqueezestart"]);
        };
    }
    if (xrCsCompiled["xrsqueezeend"] !== undefined) {
        cindyXrSqueezeEndCallback = function (cindyScriptInputSource) {
            setCindyScriptVariable("inputsource", cindyScriptInputSource);
            xrCindyApi.evaluate(xrCsCompiled["xrsqueezeend"]);
        };
    }
    if (xrCsCompiled["xrsqueeze"] !== undefined) {
        cindyXrSqueezeCallback = function (cindyScriptInputSource) {
            setCindyScriptVariable("inputsource", cindyScriptInputSource);
            xrCindyApi.evaluate(xrCsCompiled["xrsqueeze"]);
        };
    }
    if (xrCsCompiled["xrsqueezehold"] !== undefined) {
        cindyXrSqueezeHoldCallback = function (cindyScriptInputSource) {
            setCindyScriptVariable("inputsource", cindyScriptInputSource);
            xrCindyApi.evaluate(xrCsCompiled["xrsqueezehold"]);
        };
    }
}

/**
 * Called when the list of active XR input sources has changed.
 * @param {XRInputSourcesChangeEvent} event The triggered event.
 */
function onInputSourcesChange(event) {
    let cindyScriptAddedInputSources = convertObjectToCindyDict(
        xrFilterInputSourceArray(event.added, null),
        new Set([]),
        new Map()
    );
    let cindyScriptRemovedInputSources = convertObjectToCindyDict(
        xrFilterInputSourceArray(event.removed, null),
        new Set([]),
        new Map()
    );
    cindyXrInputSourcesChangeCallback(cindyScriptAddedInputSources, cindyScriptRemovedInputSources);
}

/**
 * Called when one of the input sources begins its primary select action.
 * @param {XRInputSourceEvent} event The triggered event.
 */
function onSelectStart(event) {
    activeSelectInputSources.push(event.inputSource);
    let cindyScriptInputSource = convertObjectToCindyDict(
        xrFilterInputSource(event.inputSource, event.frame),
        new Set([]),
        new Map()
    );
    cindyXrSelectStartCallback(cindyScriptInputSource);
}

/**
 * Called when one of the input sources ends its primary select action or when an
 * XRInputSource that has begun a primary select action is disconnected.
 * @param {XRInputSourceEvent} event The triggered event.
 */
function onSelectEnd(event) {
    let idx = activeSelectInputSources.indexOf(event.inputSource);
    if (idx > -1) {
        activeSelectInputSources.splice(idx, 1);
    }
    let cindyScriptInputSource = convertObjectToCindyDict(
        xrFilterInputSource(event.inputSource, event.frame),
        new Set([]),
        new Map()
    );
    cindyXrSelectEndCallback(cindyScriptInputSource);
}

/**
 * Called when one of the input sources has fully completed a primary select action.
 * @param {XRInputSourceEvent} event The triggered event.
 */
function onSelect(event) {
    let cindyScriptInputSource = convertObjectToCindyDict(
        xrFilterInputSource(event.inputSource, event.frame),
        new Set([]),
        new Map()
    );
    cindyXrSelectCallback(cindyScriptInputSource);
}

/**
 * Called each frame as long as a select event is active (once for each event triggering input source).
 * @param {XRInputSource} event The triggering input source.
 */
function onSelectHold(inputSource) {
    let cindyScriptInputSource = convertObjectToCindyDict(
        xrFilterInputSource(inputSource, xrLastFrame),
        new Set([]),
        new Map()
    );
    cindyXrSelectHoldCallback(cindyScriptInputSource);
}

/**
 * Called when one of the input sources begins its primary squeeze action,
 * indicating that the user has begun to grab, squeeze, or grip the controller.
 * @param {XRInputSourceEvent} event The triggered event.
 */
function onSqueezeStart(event) {
    activeSqueezeInputSources.push(event.inputSource);
    let cindyScriptInputSource = convertObjectToCindyDict(
        xrFilterInputSource(event.inputSource, event.frame),
        new Set([]),
        new Map()
    );
    cindyXrSqueezeStartCallback(cindyScriptInputSource);
}

/**
 * Called when one of the input sources ends its primary squeeze action or when
 * an XRInputSource that has begun a primary squeeze action is disconnected.
 * @param {XRInputSourceEvent} event The triggered event.
 */
function onSqueezeEnd(event) {
    let idx = activeSqueezeInputSources.indexOf(event.inputSource);
    if (idx > -1) {
        activeSqueezeInputSources.splice(idx, 1);
    }
    let cindyScriptInputSource = convertObjectToCindyDict(
        xrFilterInputSource(event.inputSource, event.frame),
        new Set([]),
        new Map()
    );
    cindyXrSqueezeEndCallback(cindyScriptInputSource);
}

/**
 * Called when one of the input sources has fully completed a primary squeeze action.
 * @param {XRInputSourceEvent} event The triggered event.
 */
function onSqueeze(event) {
    let cindyScriptInputSource = convertObjectToCindyDict(
        xrFilterInputSource(event.inputSource, event.frame),
        new Set([]),
        new Map()
    );
    cindyXrSqueezeCallback(cindyScriptInputSource);
}

/**
 * Called each frame as long as a squeeze event is active (once for each event triggering input source).
 * @param {XRInputSource} event The triggering input source.
 */
function onSqueezeHold(inputSource) {
    let cindyScriptInputSource = convertObjectToCindyDict(
        xrFilterInputSource(inputSource, xrLastFrame),
        new Set([]),
        new Map()
    );
    cindyXrSqueezeHoldCallback(cindyScriptInputSource);
}
