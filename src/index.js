class RuleSet {
    hook = () => { return {}; };

    constructor(hook) {
        this.hook = hook;
    }
}

class Selector {
    elements = [];
    ruleSets = [];
    query = "";

    constructor(query, state) {
        this.query = query;
    }

    ruleset(hook) {
        let set = new RuleSet(hook);
        this.ruleSets.push(set);

        this.render();
    }

    render() {
        let style = {};

        for (let set of this.ruleSets) {
            let dict = set.hook();
            for (let key in dict) {
                style[key] = dict[key];
            }
        }

        for (let elem of document.querySelectorAll(this.query)) {
            for (let key in style) {
                elem.style[key] = style[key];
            }
        }
    }
}

class RSS {
    static selectors = [];

    static sayHello(par) {
        console.log("hello", par);
    }

    static update() {
        for (let selector of this.selectors) {
            selector.render();
        }
    }

    static select(query, state) {
        let selector = new Selector(query, state);
        this.selectors.push(selector);
        return selector;
    }
}

export default RSS;