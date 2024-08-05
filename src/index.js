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
                    style[key] = dict[key];
                }
            }
            for (let key in style) {
                node.style[key] = style[key];
            }
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
            let styleInitial = {};
            let style = {};
            
            for (let set of this.ruleSets) {
                let dict = set.hook(node, i, props);
                for (let key in dict) {
                    styleInitial[key] = node.style[key] + "";
                    style[key] = dict[key];
                }
            }

            if (this.states.includes("hover")) {
                node.addEventListener("mouseenter", () => {
                    for (let key in style) {
                        node.style[key] = style[key];
                    }
                });
                node.addEventListener("mouseleave", () => {
                    for (let key in styleInitial) {
                        node.style[key] = styleInitial[key];
                    }
                });
            }

            if (this.states.includes("normal")) {
                // dunno what the point of this is, but I suppose someone might want it.
                for (let key in style) {
                    node.style[key] = style[key];
                }
            }

            if (this.states.includes("focus")) {
                node.addEventListener("focus", () => {
                    for (let key in style) {
                        node.style[key] = style[key];
                    }
                });
                node.addEventListener("blur", () => {
                    for (let key in styleInitial) {
                        node.style[key] = styleInitial[key];
                    }
                });
            }
        }
    }
}

class RSS {
    static selectors = [];
    static _props = {};

    static sayHello(par) {
        console.log("hello", par);
    }

    static update() {
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
        RSS.update();
    
        let observer = new MutationObserver(() => {
            RSS.update();
        });
        observer.observe(document.body, { childList: true, subtree: true, });
        // https://stackoverflow.com/questions/3219758/detect-changes-in-the-dom
        // need fallback

    }
}

export default RSS;