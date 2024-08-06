import c2d from "./camelToDash";

class RuleSet {
    hook = (node, index, props) => { return {}; };

    constructor(hook) {
        this.hook = hook;
    }
}

class Selector {
    elements = [];
    ruleSets = [];
    query = "";

    constructor(query) {
        this.query = query;
    }

    ruleset(hook) {
        let _hook = hook;
        if (typeof(hook) == "object") _hook = () => { return hook };

        let set = new RuleSet(_hook);
        this.ruleSets.push(set);

        RSS.update();
    }

    render(props) {
        let all = document.querySelectorAll(this.query);
        for (let i = 0; i < all.length; i++) {
            let node = all[i];

            let style = {};
    
            for (let set of this.ruleSets) {
                let dict = set.hook(node, i, props);
                for (let key in dict) {
                    style[c2d(key)] = dict[key];
                }
            }

            let sheet = RSS._getStyleElement();
            let nodeId = "";
            if (node.dataset["rssId"]) nodeId = node.dataset["rssId"];
            else nodeId = Math.random().toFixed(4).replace("0.", "");
            let rulesetStr = `[data-rssId="${nodeId}"],[data-rss-id="${nodeId}"]{`;

            for (let key in style) {
                rulesetStr += key + ":" + style[key] + ";";
            }
            rulesetStr += "}";

            sheet.innerHTML += rulesetStr;
            node.dataset["rssId"] = nodeId;
        }
    }
}

class StateSelector extends Selector {
    states = [];

    /**
     * Create new selector, with state properties.
     * @param {string} query Query selector. Same as document.querySelector
     * @param {string[] | string} states The state or list of states. Can be hover,
     */
    constructor(query, states) {
        super(query);
        if (typeof(states) == "string") this.states = [ states ];
        else this.states = states;
    }

    render(props) {
        let all = document.querySelectorAll(this.query);
        for (let i = 0; i < all.length; i++) {
            let node = all[i];
            let style = {};
            
            for (let set of this.ruleSets) {
                let dict = set.hook(node, i, props);
                for (let key in dict) {
                    style[key] = dict[key];
                }
            }
            let sheet = RSS._getStyleElement();
            let nodeId = "";
            if (node.dataset["rssId"]) nodeId = node.dataset["rssId"];
            else nodeId = Math.random().toFixed(4).replace("0.", "");

            let rulesetStr = "";
            // create the actual css selector
            for (let state of this.states) {
                rulesetStr += `[data-rssId="${nodeId}"]:${state},[data-rss-id="${nodeId}"]:${state}`;
                rulesetStr += ",";
            }
            // remove last comma
            rulesetStr = rulesetStr.substring(0, rulesetStr.lastIndexOf(","));

            rulesetStr += "{";
            for (let key in style) {
                rulesetStr += key + ":" + style[key] + ";";
            }
            rulesetStr += "}";

            sheet.innerHTML += rulesetStr;
            node.dataset["rssId"] = nodeId;

        }
    }
}

class RSS {
    static selectors = [];
    static _props = {};
    static _initialized = false;

    static sayHello(par) {
        console.log("hello", par);
    }

    static update() {
        if (!this._initialized) return; // if style.js included in <head>, need to wait for window to load.
        let styleElement = this._getStyleElement();
        styleElement.innerHTML = "";
        for (let selector of this.selectors) {
            selector.render(this._props);
        }
    }

    static select(query, state) {
        let selector;
        if (!state) {
            selector = new Selector(query);
        }
        else {
            selector = new StateSelector(query, state);
        }
        this.selectors.push(selector);
        return selector;
    }

    static getProps() {
        return this._props;
    }

    static setProps(value) {
        for (let key in value) {
            this._props[key] = value[key];
        }
        this.update();
    }

    static initialize() {
        if (this._initialized) return; // don't need to initialize multiple times
        this._initialized = true;

        RSS.update();
    
        let observer = new MutationObserver(() => {
            RSS.update();
        });
        observer.observe(document.body, { childList: true, subtree: true, });
        // https://stackoverflow.com/questions/3219758/detect-changes-in-the-dom
        // need fallback

    }

    /**
     * Create/get the actual CSS stylesheet
     * @returns {HTMLStyleElement} the style element (id #rssHead)
     */
    static _getStyleElement() {
        if (!this._initialized) return false;
        let styleElement = document.querySelector("style#rssHead");
        if (!styleElement) {
            styleElement = document.createElement("style");
            styleElement.id = "rssHead";
            document.head.appendChild(styleElement);
        }
        return styleElement;
    }
}

export default RSS;