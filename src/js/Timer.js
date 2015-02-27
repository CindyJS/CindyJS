var d3_arraySlice = [].slice,
    d3_window,
    d3_array = function(list) {
        return d3_arraySlice.call(list);
    };


if (!instanceInvocationArguments.isNode) {
    var d3_document = document,
        d3_documentElement = d3_document.documentElement;
    d3_window = window;

    // Redefine d3_array if the browser doesn’t support slice-based conversion.
    try {
        d3_array(d3_documentElement.childNodes)[0].nodeType; // jshint ignore:line
    } catch (e) {
        d3_array = function(list) {
            var i = list.length,
                array = new Array(i);
            while (i--) array[i] = list[i];
            return array;
        };
    }
}


function d3_vendorSymbol(object, name) {
    if (name in object) return name;
    name = name.charAt(0).toUpperCase() + name.substring(1);
    for (var i = 0, n = d3_vendorPrefixes.length; i < n; ++i) {
        var prefixName = d3_vendorPrefixes[i] + name;
        if (prefixName in object) return prefixName;
    }
}

var d3_vendorPrefixes = ["webkit", "ms", "moz", "Moz", "o", "O"];

var d3 = {};

var d3_timer_queueHead,
    d3_timer_queueTail,
    d3_timer_interval, // is an interval (or frame) active?
    d3_timer_timeout, // is a timeout active?
    d3_timer_active, // active timer object
    d3_timer_frame = (!instanceInvocationArguments.isNode && d3_window[d3_vendorSymbol(d3_window, "requestAnimationFrame")]) || function(callback) {
        setTimeout(callback, 17);
    };

// The timer will continue to fire until callback returns true.
d3.timer = function(callback, delay, then) {
    var n = arguments.length;
    if (n < 2) delay = 0;
    if (n < 3) then = Date.now();

    // Add the callback to the tail of the queue.
    var time = then + delay,
        timer = {
            c: callback,
            t: time,
            f: false,
            n: null
        };
    if (d3_timer_queueTail) d3_timer_queueTail.n = timer;
    else d3_timer_queueHead = timer;
    d3_timer_queueTail = timer;

    // Start animatin'!
    if (!d3_timer_interval) {
        d3_timer_timeout = clearTimeout(d3_timer_timeout);
        d3_timer_interval = 1;
        d3_timer_frame(d3_timer_step);
    }
};

function d3_timer_step() {
    var now = d3_timer_mark(),
        delay = d3_timer_sweep() - now;
    if (delay > 24) {
        if (isFinite(delay)) {
            clearTimeout(d3_timer_timeout);
            d3_timer_timeout = setTimeout(d3_timer_step, delay);
        }
        d3_timer_interval = 0;
    } else {
        d3_timer_interval = 1;
        d3_timer_frame(d3_timer_step);
    }
}

d3.timer.flush = function() {
    d3_timer_mark();
    d3_timer_sweep();
};

function d3_timer_mark() {
    var now = Date.now();
    d3_timer_active = d3_timer_queueHead;
    while (d3_timer_active) {
        if (now >= d3_timer_active.t) d3_timer_active.f = d3_timer_active.c(now - d3_timer_active.t);
        d3_timer_active = d3_timer_active.n;
    }
    return now;
}

// Flush after callbacks to avoid concurrent queue modification.
// Returns the time of the earliest active timer, post-sweep.
function d3_timer_sweep() {
    var t0,
        t1 = d3_timer_queueHead,
        time = Infinity;
    while (t1) {
        if (t1.f) {
            t1 = t0 ? t0.n = t1.n : d3_timer_queueHead = t1.n;
        } else {
            if (t1.t < time) time = t1.t;
            t1 = (t0 = t1).n;
        }
    }
    d3_timer_queueTail = t0;
    return time;
}
