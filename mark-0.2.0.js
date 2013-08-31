(function () {
    var modules = {},
        events = {},
        callbacks = {},

        STATUS_NOT_LOADED = "not_loaded",
        STATUS_LOADED = "loaded",
        STATUS_LOADING = "loading",

        MARK_PATH = "mark:path",
        MARK_PROTOCOL = "mark:protocol",

        THROW_UNKNOWN_FUNCTION_ARGUMENTS = "unknown signature for mark function.";

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
        return modules[name] = modules[name]? modules[name] : { name: name, status: STATUS_NOT_LOADED };
    }

    function addCallback(event, fn) {
        if (!callbacks[event]) {
            callbacks[event] = fn;
        } else {
            throw "callback '" + event + "' has been register before.";
        }
    }

    function justLoad(m) {
        var markPathFinder = callbacks[MARK_PATH],
            markProtocolFinder = callbacks[MARK_PROTOCOL],
            //name = m.name;
            protocol;

        if (!isFunction(markPathFinder)) {
            throw "function for event '" + MARK_PATH + "' is not defined.";
        }

        m.path = markPathFinder(m.name);

        if (!isFunction(markProtocolFinder)) {
            throw "function for event '" + MARK_PROTOCOL + "' is not defined.";
        }

        m.protocol = markProtocolFinder(m.name, m.path);

        protocol = callbacks['protocol:' + m.protocol];

        if (!isFunction(protocol)) {
            throw "function for protocol '" + m.protocol + "' is not defined.";
        }


        async(protocol, [m.path], {
            done: function (content) {
                if (m.attach) {
                    m.obj = window[m.attach];
                    m.status = STATUS_LOADED;
                    trigger(m.name, [m.name]);
                } else if (content) {
                    m.obj = content;
                    m.status = STATUS_LOADED;
                    trigger(m.name, [m.name]);
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
                    this.args[i] = dependency.obj;
                    break;
                }
            }
        }

        if (this.counter == 0) {
            if (!this.attach) {
                this.obj = this.fn.apply(null, this.args);
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
                m.obj = m.fn.apply(null, m.args);
                trigger(name, [name]);
            }

        } else {
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
                if (isString(one) && isArray(two)) {
                    if (isString(three)) {
                        addGlobal(one, two, three);
                    } else if (isFunction(three)) {
                        addModule(one, two, three);
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

    window.mark = mark;
}());