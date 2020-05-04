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
let cindyXrDrawCallback = function() {};
let cindyXrInputSourcesChangeCallback = function() {};
let cindyXrSelectStartCallback = function() {};
let cindyXrSelectEndCallback = function() {};
let cindyXrSelectCallback = function() {};
let cindyXrSqueezeStartCallback = function() {};
let cindyXrSqueezeEndCallback = function() {};
let cindyXrSqueezeCallback = function() {};

/**
 * Sets all callbacks defined above.
 */
function setupCindyScriptEventCallbacks() {
    var xrScripts = [
        "xrdraw", "xrinputsourceschange",
        "xrselectstart", "xrselectend", "xrselect",
        "xrsqueezestart", "xrsqueezeend", "xrsqueeze"
    ];

    xrScripts.forEach(function(scriptName) {
        let csCode = document.getElementById(scriptName);
        if (!csCode) {
            return;
        }
        csCode = csCode.text;
        csCode = xrCindyApi.instance.parse(csCode, false);
        if (csCode.ctype === "error") {
            console.error("Error compiling " + scriptName + " script: " + csCode.message);
        } else {
            xrCsCompiled[scriptName] = xrCindyApi.labelCode(csCode, scriptName);
        }
    });

    if (xrCsCompiled['xrdraw'] !== undefined) {
        cindyXrDrawCallback = function() {
            xrCindyApi.evaluate(xrCsCompiled['xrdraw']);
        }
    }
    if (xrCsCompiled['xrinputsourceschange'] !== undefined) {
        cindyXrInputSourcesChangeCallback = function() {
            xrCindyApi.evaluate(xrCsCompiled['xrinputsourceschange']);
        }
    }
    if (xrCsCompiled['xrselectstart'] !== undefined) {
        cindyXrSelectStartCallback = function() {
            xrCindyApi.evaluate(xrCsCompiled['xrselectstart']);
        }
    }
    if (xrCsCompiled['xrselectend'] !== undefined) {
        cindyXrSelectEndCallback = function() {
            xrCindyApi.evaluate(xrCsCompiled['xrselectend']);
        }
    }
    if (xrCsCompiled['xrselect'] !== undefined) {
        cindyXrSelectCallback = function() {
            xrCindyApi.evaluate(xrCsCompiled['xrselect']);
        }
    }
    if (xrCsCompiled['xrsqueezestart'] !== undefined) {
        cindyXrSqueezeStartCallback = function() {
            xrCindyApi.evaluate(xrCsCompiled['xrsqueezestart']);
        }
    }
    if (xrCsCompiled['xrsqueezeend'] !== undefined) {
        cindyXrSqueezeEndCallback = function() {
            xrCindyApi.evaluate(xrCsCompiled['xrsqueezeend']);
        }
    }
    if (xrCsCompiled['xrsqueeze'] !== undefined) {
        cindyXrSqueezeCallback = function() {
            xrCindyApi.evaluate(xrCsCompiled['xrsqueeze']);
        }
    }
}

/**
 * Called when the list of active XR input sources has changed.
 * @param {XRInputSourcesChangeEvent} event The triggered event.
 */
function onInputSourcesChange(event) {
    cindyXrInputSourcesChangeCallback();
}

/**
 * Called when one of the input sources begins its primary action.
 * @param {XRInputSourceEvent} event The triggered event.
 */
function onSelectStart(event) {
    cindyXrSelectStartCallback();
}

/**
 * Called when one of the input sources ends its primary action or when
 * an XRInputSource that has begun a primary action is disconnected.
 * @param {XRInputSourceEvent} event The triggered event.
 */
function onSelectEnd(event) {
    cindyXrSelectEndCallback();
}

/**
 * Called when one of the input sources has fully completed a primary action.
 * @param {XRInputSourceEvent} event The triggered event.
 */
function onSelect(event) {
    cindyXrSelectCallback();
}

/**
 * Called when one of the input sources begins its primary squeeze action,
 * indicating that the user has begun to grab, squeeze, or grip the controller.
 * @param {XRInputSourceEvent} event The triggered event.
 */
function onSqueezeStart(event) {
    cindyXrSqueezeStartCallback();
}

/**
 * Called when one of the input sources ends its primary squeeze action or when
 * an XRInputSource that has begun a primary squeeze action is disconnected.
 * @param {XRInputSourceEvent} event The triggered event.
 */
function onSqueezeEnd(event) {
    cindyXrSqueezeEndCallback();
}

/**
 * Called when one of the input sources has fully completed a primary squeeze action.
 * @param {XRInputSourceEvent} event The triggered event.
 */
function onSqueeze(event) {
    cindyXrSqueezeCallback();
}
