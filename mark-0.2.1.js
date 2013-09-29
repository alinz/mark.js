/** @preserve mark.js: Tiny/Open framework for managing dependencies in JavaScript
 * version: 0.2.1
 * By Ali Najafizadeh
 * MIT Licensed.
 */
(function () {
    var modules = {},
        events = {},
        callbacks = {},

        STATUS_NOT_LOADED                   = "not_loaded",
        STATUS_LOADED                       = "loaded",
        STATUS_LOADING                      = "loading",

        MARK_PATH                           = "mark:path",
        MARK_PROTOCOL                       = "mark:protocol",

        THROW_UNKNOWN_FUNCTION_ARGUMENTS    = "unknown signature for mark function.";

    function async(fn, args, context) {
        setTimeout(function () {
            fn.apply(context, args);
        }, 13);
    }

    function checkType(obj) {
        return obj instanceof Array? 'array' : typeof obj;
    }

    function isString(obj) {
        return checkType(obj) == 'string';
    }

    function isArray(obj) {
        return checkType(obj) == 'array';
    }

    function isFunction(obj) {
        return checkType(obj) == 'function';
    }

    function trigger(event, args) {
        var fns = events[event],
            i;
        if (fns) {
            for (i = 0; i < fns.length; i++) {
                async(fns[i], args);
            }
            delete events[event];
        }
    }

    function listenTo(event, fn, context) {
        if (!events[event]) events[event] = [];
        events[event].push(function () { fn.apply(context, arguments); });
    }

    function getModule(name) {
        return modules[name] = modules[name]? modules[name] : { name: name, status: STATUS_NOT_LOADED, argsMap: {} };
    }

    function addCallback(event, fn) {
        if (!callbacks[event]) {
            callbacks[event] = fn;
        } else {
            throw "callback '" + event + "' has been register before.";
        }
    }

    function updateProtocolPath(m) {
        var markPathFinder = callbacks[MARK_PATH],
            markProtocolFinder = callbacks[MARK_PROTOCOL],
            name = m.name;

        if (!isFunction(markPathFinder)) {
            throw "function for event '" + MARK_PATH + "' is not defined.";
        }

        m.path = markPathFinder(name);

        if (!isFunction(markProtocolFinder)) {
            throw "function for event '" + MARK_PROTOCOL + "' is not defined.";
        }

        m.protocol = markProtocolFinder(name, m.path);
    }

    function justLoad(m) {
        var name = m.name,
            protocol;

        if (!m.path) {
            updateProtocolPath(m);
        }

        protocol = callbacks['protocol:' + m.protocol];

        if (!isFunction(protocol)) {
            throw "function for protocol '" + m.protocol + "' is not defined.";
        }

        async(protocol, [m.path], {
            done: function (content) {
                if (m.attach) {
                    m.obj = window[m.attach];
                    m.status = STATUS_LOADED;
                    trigger(name, [name]);
                } else if (content) {
                    m.obj = content;
                    m.status = STATUS_LOADED;
                    trigger(name, [name]);
                }
            },
            failed: function (message) {
                if (message) {
                    throw message;
                } else {
                    throw "asset '" + name + "' is not loaded.";
                }
            }
        });
    }

    function counterCallback(dependencyName) {
        var dependency = modules[dependencyName],
            i;

        this.counter--;

        if (!this.attach) {
            for (i = 0; i < this.args.length; i++) {
                if (this.args[i] == dependencyName) {
                    this.argsMap[dependencyName] = this.args[i] = dependency.obj;
                    break;
                }
            }
        }

        if (this.counter == 0) {
            if (!this.attach) {
                this.obj = this.fn.apply(this.argsMap, this.args);
                this.status = STATUS_LOADED;
                trigger(this.name, [this.name]);
            } else {
                justLoad(this);
            }
        }
    }

    function load(name) {
        var m = getModule(name),
            i;

        switch (m.status) {
            case STATUS_LOADED:
                trigger(name, [name]);
                break;
            case STATUS_NOT_LOADED:
                if (m.attach && m.counter != 0) {
                    for (i = 0; i < m.counter; i++) {
                        listenTo(m.args[i], counterCallback, m);
                        async(load, [m.args[i]]);
                    }
                } else {
                    justLoad(m);
                }
                break;
        }
    }

    function addGlobal(name, dependencies, attach) {
        var m = getModule(name);
        if (!m.args) {
            m.args = dependencies;
            m.counter = m.args.length;
            m.attach = attach;
        }
    }

    function addModule(name, dependencies, fn) {
        var m = getModule(name);

        if (m.status == STATUS_NOT_LOADED) {
            m.args = dependencies;
            m.counter = m.args.length;
            m.fn = fn;

            if (m.counter) {
                m.status = STATUS_LOADING;

                for (var i = 0; i < m.counter; i++) {
                    listenTo(m.args[i], counterCallback, m);
                    async(load, [m.args[i]]);
                }

            } else {
                m.status = STATUS_LOADED;
                m.obj = m.fn.apply(m.argsMap, m.args);
                trigger(name, [name]);
            }

        } else if (m.status != STATUS_LOADING) {
            throw "Module '" + name + "' is implemented before. duplicate implementation";
        }
    }

    function mark(one, two, three) {
        switch(arguments.length) {
            case 1:
                if (isString(one)) {
                    addGlobal(one, [], one);
                } else {
                    throw THROW_UNKNOWN_FUNCTION_ARGUMENTS;
                }
                break;
            case 2:
                if (isString(one)) {
                    if (isString(two)) {
                        addGlobal(one, [], two);
                    } else if (isArray(two)) {
                        addGlobal(one, two, one);
                    } else if (isFunction(two)) {
                        addCallback(one, two);
                    } else {
                        throw THROW_UNKNOWN_FUNCTION_ARGUMENTS;
                    }
                } else {
                    throw THROW_UNKNOWN_FUNCTION_ARGUMENTS;
                }
                break;
            case 3:
                if (isString(one)) {
                    if (isArray(two)) {
                        if (isString(three)) {
                            addGlobal(one, two, three);
                        } else if (isFunction(three)) {
                            addModule(one, two, three);
                        } else {
                            throw THROW_UNKNOWN_FUNCTION_ARGUMENTS;
                        }
                    } else if (isString(two) && isFunction(three)) {
                        if (one == "load") {
                            listenTo(two, function() {
                                var m = getModule(two);
                                three.call(null, m.obj);
                            });
                            async(load, [two]);
                        } else {
                            throw "internal function is not defined.";
                        }
                    } else {
                        throw THROW_UNKNOWN_FUNCTION_ARGUMENTS;
                    }
                } else {
                    throw THROW_UNKNOWN_FUNCTION_ARGUMENTS;
                }
                break;
            default:
                throw THROW_UNKNOWN_FUNCTION_ARGUMENTS;
        }
    }
    mark.VERSION = "0.2.0";
    window.mark = mark;
}());