/* eslint-disable */
function workerContent(workerId) {
    function extendPrototype(sources, destination) {
        var i;
        var len = sources.length;
        var sourcePrototype;
        for (i = 0; i < len; i += 1) {
            sourcePrototype = sources[i].prototype;
            for (var attr in sourcePrototype) {
                if (Object.prototype.hasOwnProperty.call(sourcePrototype, attr))
                    destination.prototype[attr] = sourcePrototype[attr];
            }
        }
    }
    function ProxyElement(type, namespace) {
        this._state = "init";
        this._isDirty = false;
        this._isProxy = true;
        this._changedStyles = [];
        this._changedAttributes = [];
        this._changedElements = [];
        this._textContent = null;
        this.type = type;
        this.namespace = namespace;
        this.children = [];
        localIdCounter += 1;
        this.attributes = {
            id: "l_d_" + localIdCounter,
        };
        this.style = new Style(this);
    }
    ProxyElement.prototype = {
        appendChild: function (_child) {
            _child.parentNode = this;
            this.children.push(_child);
            this._isDirty = true;
            this._changedElements.push([_child, this.attributes.id]);
        },

        insertBefore: function (_newElement, _nextElement) {
            var children = this.children;
            for (var i = 0; i < children.length; i += 1) {
                if (children[i] === _nextElement) {
                    children.splice(i, 0, _newElement);
                    this._isDirty = true;
                    this._changedElements.push([
                        _newElement,
                        this.attributes.id,
                        _nextElement.attributes.id,
                    ]);
                    return;
                }
            }
            children.push(_nextElement);
        },

        setAttribute: function (_attribute, _value) {
            this.attributes[_attribute] = _value;
            if (!this._isDirty) {
                this._isDirty = true;
            }
            this._changedAttributes.push(_attribute);
        },

        serialize: function () {
            return {
                type: this.type,
                namespace: this.namespace,
                style: this.style.serialize(),
                attributes: this.attributes,
                children: this.children.map(function (child) {
                    return child.serialize();
                }),
                textContent: this._textContent,
            };
        },

        // eslint-disable-next-line class-methods-use-this
        addEventListener: function (_, _callback) {
            setTimeout(_callback, 1);
        },

        setAttributeNS: function (_, _attribute, _value) {
            this.attributes[_attribute] = _value;
            if (!this._isDirty) {
                this._isDirty = true;
            }
            this._changedAttributes.push(_attribute);
        },
    };

    Object.defineProperty(ProxyElement.prototype, "textContent", {
        set: function (_value) {
            this._isDirty = true;
            this._textContent = _value;
        },
    });

    var localIdCounter = 0;
    var animations = {
        0: {},
        1: {},
        2: {},
        3: {},
    };

    var styleProperties = [
        "width",
        "height",
        "display",
        "transform",
        "opacity",
        "contentVisibility",
        "mix-blend-mode",
    ];

    function convertArguments(args) {
        var arr = [];
        var i;
        var len = args.length;
        for (i = 0; i < len; i += 1) {
            arr.push(args[i]);
        }
        return arr;
    }

    function Style(element) {
        this.element = element;
    }
    Style.prototype = {
        serialize: function () {
            var obj = {};
            for (var i = 0; i < styleProperties.length; i += 1) {
                var propertyKey = styleProperties[i];
                var keyName = "_" + propertyKey;
                if (keyName in this) {
                    obj[propertyKey] = this[keyName];
                }
            }
            return obj;
        },
    };
    styleProperties.forEach(function (propertyKey) {
        Object.defineProperty(Style.prototype, propertyKey, {
            set: function (value) {
                if (!this.element._isDirty) {
                    this.element._isDirty = true;
                }
                this.element._changedStyles.push(propertyKey);
                var keyName = "_" + propertyKey;
                this[keyName] = value;
            },
            get: function () {
                var keyName = "_" + propertyKey;
                return this[keyName];
            },
        });
    });

    function CanvasContext(element) {
        this.element = element;
    }

    CanvasContext.prototype = {
        createRadialGradient: function () {
            function addColorStop() {
                instruction.stops.push(convertArguments(arguments));
            }
            var instruction = {
                t: "rGradient",
                a: convertArguments(arguments),
                stops: [],
            };
            this.element.instructions.push(instruction);
            return {
                addColorStop: addColorStop,
            };
        },

        createLinearGradient: function () {
            function addColorStop() {
                instruction.stops.push(convertArguments(arguments));
            }
            var instruction = {
                t: "lGradient",
                a: convertArguments(arguments),
                stops: [],
            };
            this.element.instructions.push(instruction);
            return {
                addColorStop: addColorStop,
            };
        },
    };

    Object.defineProperties(CanvasContext.prototype, {
        canvas: {
            enumerable: true,
            get: function () {
                return this.element;
            },
        },
    });

    var canvasContextMethods = [
        "fillRect",
        "setTransform",
        "drawImage",
        "beginPath",
        "moveTo",
        "save",
        "restore",
        "fillText",
        "setLineDash",
        "clearRect",
        "clip",
        "rect",
        "stroke",
        "fill",
        "closePath",
        "bezierCurveTo",
        "lineTo",
    ];

    canvasContextMethods.forEach(function (method) {
        CanvasContext.prototype[method] = function () {
            this.element.instructions.push({
                t: method,
                a: convertArguments(arguments),
            });
        };
    });

    var canvasContextProperties = [
        "globalAlpha",
        "strokeStyle",
        "fillStyle",
        "lineCap",
        "lineJoin",
        "lineWidth",
        "miterLimit",
        "lineDashOffset",
        "globalCompositeOperation",
    ];

    canvasContextProperties.forEach(function (property) {
        Object.defineProperty(CanvasContext.prototype, property, {
            set: function (_value) {
                this.element.instructions.push({
                    t: property,
                    a: _value,
                });
            },
        });
    });

    function CanvasElement(type, namespace) {
        ProxyElement.call(this, type, namespace);
        this.instructions = [];
        this.width = 0;
        this.height = 0;
        this.context = new CanvasContext(this);
    }

    CanvasElement.prototype = {
        getContext: function () {
            return this.context;
        },

        resetInstructions: function () {
            this.instructions.length = 0;
        },
    };
    extendPrototype([ProxyElement], CanvasElement);

    function createElement(namespace, type) {
        if (type === "canvas") {
            return new CanvasElement(type, namespace);
        }
        return new ProxyElement(type, namespace);
    }

    var window = self; // eslint-disable-line no-redeclare, no-unused-vars

    var document = {
        // eslint-disable-line no-redeclare
        createElementNS: function (namespace, type) {
            return createElement(namespace, type);
        },
        createElement: function (type) {
            return createElement("", type);
        },
        getElementsByTagName: function () {
            return [];
        },
        body: createElement("", "body"),
        _isProxy: true,
    };
    /* eslint-disable */
    var lottieInternal = (function () {
        "use strict";

        /* <%= contents %> */

        function addElementToList(element, list) {
            list.push(element);
            element._isDirty = false;
            element._changedStyles.length = 0;
            element._changedAttributes.length = 0;
            element._changedElements.length = 0;
            element._textContent = null;
            element.children.forEach(function (child) {
                addElementToList(child, list);
            });
        }

        function addChangedAttributes(element) {
            var changedAttributes = element._changedAttributes;
            var attributes = [];
            var attribute;
            for (var i = 0; i < changedAttributes.length; i += 1) {
                attribute = changedAttributes[i];
                attributes.push([attribute, element.attributes[attribute]]);
            }
            return attributes;
        }

        function addChangedStyles(element) {
            var changedStyles = element._changedStyles;
            var styles = [];
            var style;
            for (var i = 0; i < changedStyles.length; i += 1) {
                style = changedStyles[i];
                styles.push([style, element.style[style]]);
            }
            return styles;
        }

        function addChangedElements(element, elements) {
            var changedElements = element._changedElements;
            var elementsList = [];
            var elementData;
            for (var i = 0; i < changedElements.length; i += 1) {
                elementData = changedElements[i];
                elementsList.push([
                    elementData[0].serialize(),
                    elementData[1],
                    elementData[2],
                ]);
                addElementToList(elementData[0], elements);
            }
            return elementsList;
        }

        function loadAnimation(payload) {
            var params = payload.params;
            var wrapper;
            var animation;
            var elements = [];
            var canvas;
            if (params.renderer === "svg") {
                wrapper = document.createElement("div");
                params.container = wrapper;
            } else {
                canvas = params.rendererSettings.canvas;
                if (!canvas) {
                    canvas = document.createElement("canvas");
                    canvas.width = params.animationData.w;
                    canvas.height = params.animationData.h;
                }
                var ctx = canvas.getContext("2d");
                params.rendererSettings.context = ctx;
            }
            animation = lottie.loadAnimation(params);
            animation.addEventListener("error", function (error) {
                console.log(error); // eslint-disable-line
            });
            animation.onError = function (error) {
                console.log("ERRORO", error); // eslint-disable-line
            };
            animation.addEventListener("_play", function () {
                self.postMessage({
                    type: "playing",
                    payload: {
                        id: payload.id,
                        workerId: workerId,
                    },
                });
            });
            animation.addEventListener("_pause", function () {
                self.postMessage({
                    type: "paused",
                    payload: {
                        id: payload.id,
                        workerId: workerId,
                    },
                });
            });
            if (params.renderer === "svg") {
                animation.addEventListener("DOMLoaded", function () {
                    var serialized = wrapper.serialize();
                    addElementToList(wrapper, elements);
                    self.postMessage({
                        type: "SVGloaded",
                        payload: {
                            id: payload.id,
                            tree: serialized.children[0],
                            workerId: workerId,
                        },
                    });
                });
                animation.addEventListener("drawnFrame", function (event) {
                    var changedElements = [];
                    var element;
                    for (var i = 0; i < elements.length; i += 1) {
                        element = elements[i];
                        if (element._isDirty) {
                            var changedElement = {
                                id: element.attributes.id,
                                styles: addChangedStyles(element),
                                attributes: addChangedAttributes(element),
                                elements: addChangedElements(element, elements),
                                textContent: element._textContent || undefined,
                            };
                            changedElements.push(changedElement);
                            element._isDirty = false;
                            element._changedAttributes.length = 0;
                            element._changedStyles.length = 0;
                            element._changedElements.length = 0;
                            element._textContent = null;
                        }
                    }
                    self.postMessage({
                        type: "SVGupdated",
                        payload: {
                            elements: changedElements,
                            id: payload.id,
                            currentTime: event.currentTime,
                            workerId: workerId,
                        },
                    });
                });
            } else if (canvas._isProxy) {
                animation.addEventListener("drawnFrame", function (event) {
                    self.postMessage({
                        type: "CanvasUpdated",
                        payload: {
                            instructions: canvas.instructions,
                            id: payload.id,
                            currentTime: event.currentTime,
                            workerId: workerId,
                        },
                    });
                    canvas.resetInstructions();
                });
            }
            animation.addEventListener("DOMLoaded", function () {
                self.postMessage({
                    type: "DOMLoaded",
                    payload: {
                        id: payload.id,
                        totalFrames: animation.totalFrames,
                        frameRate: animation.frameRate,
                        firstFrame: animation.firstFrame,
                        currentFrame: animation.currentFrame,
                        playDirection: animation.playDirection,
                        isSubframeEnabled: animation.isSubframeEnabled,
                        currentRawFrame: animation.currentRawFrame,
                        timeCompleted: animation.timeCompleted,
                        workerId: workerId,
                    },
                });
            });
            animations[workerId][payload.id] = {
                animation: animation,
                events: {},
            };
        }

        return {
            loadAnimation: loadAnimation,
        };
    })({});
    onmessage = function (evt) {
        var data = evt.data;
        var type = data.type;
        var payload = data.payload;
        var workerId = undefined;
        if (type === "load") {
            lottieInternal.loadAnimation(payload);
        } else if (type === "pause") {
            if (animations[payload.workerId][payload.id]) {
                animations[payload.workerId][payload.id].animation.pause();
            }
        } else if (type === "play") {
            if (animations[payload.workerId][payload.id]) {
                animations[payload.workerId][payload.id].animation.play();
            }
        } else if (type === "stop") {
            if (animations[payload.workerId][payload.id]) {
                animations[payload.workerId][payload.id].animation.stop();
            }
        } else if (type === "setSpeed") {
            if (animations[payload.workerId][payload.id]) {
                animations[payload.workerId][payload.id].animation.setSpeed(
                    payload.value
                );
            }
        } else if (type === "setDirection") {
            if (animations[payload.workerId][payload.id]) {
                animations[payload.workerId][payload.id].animation.setDirection(
                    payload.value
                );
            }
        } else if (type === "setLoop") {
            if (animations[payload.workerId][payload.id]) {
                animations[payload.workerId][payload.id].animation.setLoop(
                    payload.value
                );
            }
        } else if (type === "goToAndPlay") {
            if (animations[payload.workerId][payload.id]) {
                animations[payload.workerId][payload.id].animation.goToAndPlay(
                    payload.value,
                    payload.isFrame
                );
            }
        } else if (type === "goToAndStop") {
            if (animations[payload.workerId][payload.id]) {
                animations[payload.workerId][payload.id].animation.goToAndStop(
                    payload.value,
                    payload.isFrame
                );
            }
        } else if (type === "setSubframe") {
            if (animations[payload.workerId][payload.id]) {
                animations[payload.workerId][payload.id].animation.setSubframe(
                    payload.value
                );
            }
        } else if (type === "addEventListener") {
            if (animations[payload.workerId][payload.id]) {
                var eventCallback = function () {
                    self.postMessage({
                        type: "event",
                        payload: {
                            id: payload.id,
                            callbackId: payload.callbackId,
                            argument: arguments[0],
                            workerId: workerId,
                        },
                    });
                };
                animations[payload.workerId][payload.id].events[
                    payload.callbackId
                ] = {
                    callback: eventCallback,
                };
                animations[payload.workerId][
                    payload.id
                ].animation.addEventListener(payload.eventName, eventCallback);
            }
        } else if (type === "removeEventListener") {
            if (animations[payload.workerId][payload.id]) {
                var callback =
                    animations[payload.workerId][payload.id].events[
                        payload.callbackId
                    ];
                animations[payload.workerId][
                    payload.id
                ].animation.removeEventListener(payload.eventName, callback);
            }
        } else if (type === "destroy") {
            if (animations[payload.workerId][payload.id]) {
                animations[payload.workerId][payload.id].animation.destroy();
                animations[payload.workerId][payload.id] = null;
            }
        } else if (type === "resize") {
            if (animations[payload.workerId][payload.id]) {
                animations[payload.workerId][payload.id].animation.resize(
                    payload.width,
                    payload.height
                );
            }
        } else if (type === "playSegments") {
            if (animations[payload.workerId][payload.id]) {
                animations[payload.workerId][payload.id].animation.playSegments(
                    payload.arr,
                    payload.forceFlag
                );
            }
        } else if (type === "updateDocumentData") {
            animations[payload.workerId][
                payload.id
            ].animation.updateDocumentData(
                payload.path,
                payload.documentData,
                payload.index
            );
        }
    };
}

function createWorker(fn, id) {
    var blob = new Blob(["(" + fn.toString() + "(" + id + "))"], {
        type: "text/javascript",
    });
    var url = URL.createObjectURL(blob);
    return new Worker(url);
}
// eslint-disable-next-line no-unused-vars
var lottie = (function () {
    "use strict";

    var workerInstances = new Array([0, 1, 2, 3]).map(({ index }) =>
        createWorker(workerContent, index)
    );
    var animationIdCounter = 0;
    var eventsIdCounter = 0;
    var animations = {
        0: {},
        1: {},
        2: {},
        3: {},
    };
    var defaultSettings = {
        rendererSettings: {},
    };

    function createTree(data, container, map, afterElement) {
        var elem;
        if (data.type === "div") {
            elem = document.createElement("div");
        } else {
            elem = document.createElementNS(data.namespace, data.type);
        }
        if (data.textContent) {
            elem.textContent = data.textContent;
        }
        for (var attr in data.attributes) {
            if (Object.prototype.hasOwnProperty.call(data.attributes, attr)) {
                if (attr === "href") {
                    elem.setAttributeNS(
                        "http://www.w3.org/1999/xlink",
                        attr,
                        data.attributes[attr]
                    );
                } else {
                    elem.setAttribute(attr, data.attributes[attr]);
                }
                if (attr === "id") {
                    map[data.attributes[attr]] = elem;
                }
            }
        }
        for (var style in data.style) {
            if (Object.prototype.hasOwnProperty.call(data.style, style)) {
                elem.style[style] = data.style[style];
            }
        }
        data.children.forEach(function (element) {
            createTree(element, elem, map);
        });
        if (!afterElement) {
            container.appendChild(elem);
        } else {
            container.insertBefore(elem, afterElement);
        }
    }

    var handleAnimationLoaded = (function () {
        return function (payload) {
            var animation = animations[payload.workerId][payload.id];
            animation._loaded = true;
            // if callbacks have been added before the animation has loaded
            animation.pendingCallbacks.forEach(function (callbackData) {
                animation.animInstance.addEventListener(
                    callbackData.eventName,
                    callbackData.callback
                );
                if (callbackData.eventName === "DOMLoaded") {
                    callbackData.callback();
                }
            });
            animation.animInstance.totalFrames = payload.totalFrames;
            animation.animInstance.frameRate = payload.frameRate;
            animation.animInstance.firstFrame = payload.firstFrame;
            animation.animInstance.playDirection = payload.playDirection;
            animation.animInstance.currentFrame = payload.isSubframeEnabled
                ? payload.currentRawFrame
                : ~~payload.currentRawFrame; // eslint-disable-line no-bitwise

            if (
                payload.timeCompleted !== payload.totalFrames &&
                payload.currentFrame > payload.timeCompleted
            ) {
                animation.animInstance.currentFrame = payload.timeCompleted;
            }
        };
    })();

    var handleSVGLoaded = (function () {
        return function (payload) {
            var animation = animations[payload.workerId][payload.id];
            var container = animation.container;
            var elements = animation.elements;
            createTree(payload.tree, container, elements);
        };
    })();

    function addNewElements(newElements, elements) {
        var element;
        for (var i = 0; i < newElements.length; i += 1) {
            element = newElements[i];
            var parent = elements[element[1]];
            if (parent) {
                var sibling;
                if (element[2]) {
                    sibling = elements[element[2]];
                }
                createTree(element[0], parent, elements, sibling);
                newElements.splice(i, 1);
                i -= 1;
            }
        }
    }

    function updateElementStyles(element, styles) {
        var style;
        for (var i = 0; i < styles.length; i += 1) {
            style = styles[i];
            element.style[style[0]] = style[1];
        }
    }

    function updateElementAttributes(element, attributes) {
        var attribute;
        for (var i = 0; i < attributes.length; i += 1) {
            attribute = attributes[i];
            element.setAttribute(attribute[0], attribute[1]);
        }
    }

    function updateTextContent(element, text) {
        if (text) {
            element.textContent = text;
        }
    }

    function handleAnimationUpdate(payload) {
        var changedElements = payload.elements;
        var animation = animations[payload.workerId][payload.id];
        if (animation) {
            var elements = animation.elements;
            var elementData;
            for (var i = 0; i < changedElements.length; i += 1) {
                elementData = changedElements[i];
                var element = elements[elementData.id];
                addNewElements(elementData.elements, elements);
                updateElementStyles(element, elementData.styles);
                updateElementAttributes(element, elementData.attributes);
                updateTextContent(element, elementData.textContent);
            }
            animation.animInstance.currentFrame = payload.currentTime;
        }
    }

    function createInstructionsHandler(canvas) {
        var ctx = canvas.getContext("2d");
        var map = {
            beginPath: ctx.beginPath,
            closePath: ctx.closePath,
            rect: ctx.rect,
            clip: ctx.clip,
            clearRect: ctx.clearRect,
            setTransform: ctx.setTransform,
            moveTo: ctx.moveTo,
            bezierCurveTo: ctx.bezierCurveTo,
            lineTo: ctx.lineTo,
            fill: ctx.fill,
            save: ctx.save,
            restore: ctx.restore,
        };
        return function (instructions) {
            for (var i = 0; i < instructions.length; i += 1) {
                var instruction = instructions[i];
                var fn = map[instruction.t];
                if (fn) {
                    fn.apply(ctx, instruction.a);
                } else {
                    ctx[instruction.t] = instruction.a;
                }
            }
        };
    }

    function handleCanvasAnimationUpdate(payload) {
        var animation = animations[payload.workerId][payload.id];
        animation.instructionsHandler(payload.instructions);
    }

    function handleEvent(payload) {
        var animation = animations[payload.workerId][payload.id];
        if (animation) {
            var callbacks = animation.callbacks;
            if (callbacks[payload.workerId][payload.callbackId]) {
                callbacks[payload.workerId][payload.callbackId].callback(
                    payload.argument
                );
            }
        }
    }

    function handlePlaying(payload) {
        var animation = animations[payload.workerId][payload.id];
        if (animation) {
            animation.animInstance.isPaused = false;
        }
    }

    function handlePaused(payload) {
        var animation = animations[payload.workerId][payload.id];
        if (animation) {
            animation.animInstance.isPaused = true;
        }
    }

    var messageHandlers = {
        DOMLoaded: handleAnimationLoaded,
        SVGloaded: handleSVGLoaded,
        SVGupdated: handleAnimationUpdate,
        CanvasUpdated: handleCanvasAnimationUpdate,
        event: handleEvent,
        playing: handlePlaying,
        paused: handlePaused,
    };

    workerInstances.forEach((instance) => {
        instance.onmessage = function (event) {
            if (messageHandlers[event.data.type]) {
                messageHandlers[event.data.type](event.data.payload);
            }
        };
    });

    function resolveAnimationData(params) {
        return new Promise(function (resolve, reject) {
            var paramsCopy = Object.assign({}, defaultSettings, params);
            if (paramsCopy.animType && !paramsCopy.renderer) {
                paramsCopy.renderer = paramsCopy.animType;
            }
            if (paramsCopy.wrapper) {
                if (!paramsCopy.container) {
                    paramsCopy.container = paramsCopy.wrapper;
                }
                delete paramsCopy.wrapper;
            }
            if (paramsCopy.animationData) {
                resolve(paramsCopy);
            } else if (paramsCopy.path) {
                fetch(paramsCopy.path)
                    .then(function (response) {
                        return response.json();
                    })
                    .then(function (animationData) {
                        paramsCopy.animationData = animationData;
                        delete paramsCopy.path;
                        resolve(paramsCopy);
                    });
            } else {
                reject();
            }
        });
    }

    function randomWorkerId() {
        var WORKER_COUNT = 4;
        return Math.floor(Math.random() * WORKER_COUNT);
    }

    function loadAnimation(params) {
        animationIdCounter += 1;
        var animationId = "lottie_animationId_" + animationIdCounter;
        var workerId = randomWorkerId();
        var animation = {
            elements: {},
            callbacks: {},
            pendingCallbacks: [],
            status: "init",
        };
        var animInstance = {
            id: animationId,
            isPaused: true,
            pause: function () {
                workerInstances[workerId].postMessage({
                    type: "pause",
                    payload: {
                        id: animationId,
                        workerId: workerId,
                    },
                });
            },
            play: function () {
                workerInstances[workerId].postMessage({
                    type: "play",
                    payload: {
                        id: animationId,
                        workerId: workerId,
                    },
                });
            },
            stop: function () {
                workerInstances[workerId].postMessage({
                    type: "stop",
                    payload: {
                        id: animationId,
                        workerId: workerId,
                    },
                });
            },
            setSpeed: function (value) {
                workerInstances[workerId].postMessage({
                    type: "setSpeed",
                    payload: {
                        id: animationId,
                        value: value,
                        workerId: workerId,
                    },
                });
            },
            setDirection: function (value) {
                workerInstances[workerId].postMessage({
                    type: "setDirection",
                    payload: {
                        id: animationId,
                        value: value,
                        workerId: workerId,
                    },
                });
            },
            setLoop: function (value) {
                workerInstances[workerId].postMessage({
                    type: "setLoop",
                    payload: {
                        id: animationId,
                        value: value,
                        workerId: workerId,
                    },
                });
            },
            goToAndStop: function (value, isFrame) {
                workerInstances[workerId].postMessage({
                    type: "goToAndStop",
                    payload: {
                        id: animationId,
                        value: value,
                        isFrame: isFrame,
                        workerId: workerId,
                    },
                });
            },
            goToAndPlay: function (value, isFrame) {
                workerInstances[workerId].postMessage({
                    type: "goToAndPlay",
                    payload: {
                        id: animationId,
                        value: value,
                        isFrame: isFrame,
                        workerId: workerId,
                    },
                });
            },
            playSegments: function (arr, forceFlag) {
                workerInstances[workerId].postMessage({
                    type: "playSegments",
                    payload: {
                        id: animationId,
                        arr: arr,
                        forceFlag: forceFlag,
                        workerId: workerId,
                    },
                });
            },
            setSubframe: function (value) {
                workerInstances[workerId].postMessage({
                    type: "setSubframe",
                    payload: {
                        id: animationId,
                        value: value,
                        workerId: workerId,
                    },
                });
            },
            addEventListener: function (eventName, callback) {
                if (!animation._loaded) {
                    animation.pendingCallbacks.push({
                        eventName: eventName,
                        callback: callback,
                    });
                } else {
                    eventsIdCounter += 1;
                    var callbackId = "callback_" + eventsIdCounter;
                    animation.callbacks[callbackId] = {
                        eventName: eventName,
                        callback: callback,
                    };
                    workerInstances[workerId].postMessage({
                        type: "addEventListener",
                        payload: {
                            id: animationId,
                            callbackId: callbackId,
                            eventName: eventName,
                            workerId: workerId,
                        },
                    });
                }
            },
            removeEventListener: function (eventName, callback) {
                Object.keys(animation.callbacks).forEach(function (key) {
                    if (
                        animation.callbacks[key].eventName === eventName &&
                        (animation.callbacks[key].callback === callback ||
                            !callback)
                    ) {
                        delete animation.callbacks[key];
                        workerInstances[workerId].postMessage({
                            type: "removeEventListener",
                            payload: {
                                id: animationId,
                                callbackId: key,
                                eventName: eventName,
                                workerId: workerId,
                            },
                        });
                    }
                });
            },
            destroy: function () {
                if (animation.status === "init") {
                    animation.status = "destroyable";
                } else {
                    animation.status = "destroyed";
                    animations[animationId] = null;
                    if (animation.container) {
                        animation.container.innerHTML = "";
                    }
                    workerInstances[workerId].postMessage({
                        type: "destroy",
                        payload: {
                            id: animationId,
                            workerId: workerId,
                        },
                    });
                }
            },
            resize: function (width, height) {
                var devicePixelRatio = window.devicePixelRatio || 1;
                workerInstances[workerId].postMessage({
                    type: "resize",
                    payload: {
                        id: animationId,
                        // Till Worker thread knows nothing about container, we've to pass it here
                        width:
                            width ||
                            (animation.container
                                ? animation.container.offsetWidth *
                                  devicePixelRatio
                                : 0),
                        height:
                            height ||
                            (animation.container
                                ? animation.container.offsetHeight *
                                  devicePixelRatio
                                : 0),
                        workerId: workerId,
                    },
                });
            },
            updateDocumentData: function (path, documentData, index) {
                workerInstances[workerId].postMessage({
                    type: "updateDocumentData",
                    payload: {
                        id: animationId,
                        path: path,
                        documentData: documentData,
                        index: index,
                        workerId: workerId,
                    },
                });
            },
        };
        animation.animInstance = animInstance;
        resolveAnimationData(params).then(function (animationParams) {
            if (animation.status === "destroyable") {
                animation.animInstance.destroy();
                return;
            }
            animation.status = "loaded";
            var transferedObjects = [];
            if (animationParams.container) {
                animation.container = animationParams.container;
                delete animationParams.container;
            }
            if (animationParams.renderer === "canvas") {
                var canvas = animationParams.rendererSettings.canvas;

                // If no custom canvas was passed
                if (!canvas) {
                    var devicePixelRatio = window.devicePixelRatio || 1;
                    canvas = document.createElement("canvas");
                    animation.container.appendChild(canvas);
                    canvas.width =
                        (animation.container
                            ? animation.container.offsetWidth
                            : animationParams.animationData.w) *
                        devicePixelRatio;
                    canvas.height =
                        (animation.container
                            ? animation.container.offsetHeight
                            : animationParams.animationData.h) *
                        devicePixelRatio;
                    canvas.style.width = "100%";
                    canvas.style.height = "100%";
                }

                // Transfer control to offscreen if it's not already
                var transferCanvas = canvas;
                if (typeof OffscreenCanvas === "undefined") {
                    animation.canvas = canvas;
                    animation.instructionsHandler =
                        createInstructionsHandler(canvas);
                } else {
                    if (!(canvas instanceof OffscreenCanvas)) {
                        transferCanvas = canvas.transferControlToOffscreen();
                        animationParams.rendererSettings.canvas =
                            transferCanvas;
                    }
                    transferedObjects.push(transferCanvas);
                }
            }
            animations[workerId][animationId] = animation;
            workerInstances[workerId].postMessage(
                {
                    type: "load",
                    payload: {
                        params: animationParams,
                        id: animationId,
                        workerId: workerId,
                    },
                },
                transferedObjects
            );
        });
        return animInstance;
    }

    var lottiejs = {
        loadAnimation: loadAnimation,
    };
    return lottiejs;
})();
