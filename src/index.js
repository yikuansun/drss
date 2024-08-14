import c2d from "./camelToDash";

class RuleSet {
  hook = (node, index, props) => {
    return {};
  };

  /**
   * Create a static or dynamic ruleset
   * @param {(node: HTMLElement, index: number, props: object) => {}} hook Dictionary defining style rules, or a function which returns it.
   */
  constructor(hook) {
    this.hook = hook;
  }
}

class Selector {
  elements = [];
  ruleSets = [];
  query = "";

  /**
   * Create a new selector.
   * @param {string} query Query selector. Same as document.querySelector
   */
  constructor(query) {
    this.query = query;
  }

  /**
   * Add a static or dynamic ruleset.
   * @param {((node: HTMLElement, index: number, props: object) => void) | {}} hook Dictionary defining style rules, or a function which returns it.
   * @return the updated selector
   */
  ruleset(hook) {
    let _hook = hook;
    // if hook is an object, convert it into a function which returns that object
    if (typeof hook === "object")
      _hook = () => {
        return hook;
      };

    // create new RuleSet object and add it to Selector.ruleSets
    const set = new RuleSet(_hook);
    this.ruleSets.push(set);

    if (DRSS._initialized) this.render(DRSS._props);

    return this;
  }

  /**
   * Update the style in the actual document.
   * @param {{}} props Global properties defined by DRSS.setProps
   */
  render(props) {
    const all = document.querySelectorAll(this.query);
    for (let i = 0; i < all.length; i++) {
      const node = all[i];

      // element's complete style ruleset, as a dictionary
      const style = {};

      for (const set of this.ruleSets) {
        const dict = set.hook(node, i, props);
        // merge dict into style
        for (const key in dict) {
          // convert camelcasing to dashes, ex.: backgroundColor => background-color
          style[c2d(key)] = dict[key];
        }
      }

      const sheet = DRSS._getStyleElement();
      // set node id: either existing drss-id, or the next available number
      let nodeId = "";
      if (node.dataset["drssid"]) nodeId = node.dataset["drssid"];
      else nodeId = DRSS.getNextId();

      // convert style object to a css string
      let rulesetStr = `[data-drssid="${nodeId}"]{`;

      for (const key in style) {
        rulesetStr += key + ":" + style[key] + ";";
      }
      rulesetStr += "}";

      sheet.innerHTML += rulesetStr;
      node.dataset["drssid"] = nodeId;
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
    if (typeof states === "string") this.states = [states];
    else this.states = states;
  }

  render(props) {
    // basically the same stuff as Selector.render
    const all = document.querySelectorAll(this.query);
    for (let i = 0; i < all.length; i++) {
      const node = all[i];
      const style = {};

      for (const set of this.ruleSets) {
        const dict = set.hook(node, i, props);
        for (const key in dict) {
          style[c2d(key)] = dict[key];
        }
      }
      const sheet = DRSS._getStyleElement();
      let nodeId = "";
      if (node.dataset["drssid"]) nodeId = node.dataset["drssid"];
      else nodeId = DRSS.getNextId();

      let rulesetStr = "";
      // create the actual css selector
      for (const state of this.states) {
        rulesetStr += `[data-drssid="${nodeId}"]:${state},`;
      }
      // remove last comma
      rulesetStr = rulesetStr.substring(0, rulesetStr.lastIndexOf(","));

      rulesetStr += "{";
      for (const key in style) {
        rulesetStr += key + ":" + style[key] + ";";
      }
      rulesetStr += "}";

      // need to create @media rule for :printing state (it's not a real state lol)
      if (this.states.includes("printing")) {
        let printingRulesetStr = `@media print{[data-drssid="${nodeId}"]{`;
        for (let key in style) {
          printingRulesetStr += key + ":" + style[key] + ";";
        }
        printingRulesetStr += "}}";
        rulesetStr += printingRulesetStr;
      }

      sheet.innerHTML += rulesetStr;
      node.dataset["drssid"] = nodeId;
    }
  }
}

/**
 * Dynamic Reactive StyleSheets.
 */
export default class DRSS {
  static selectors = [];
  static _props = {};
  static _initialized = false;
  static _nextId = 0;

  /**
   * Update all styles in the document
   * @returns {void}
   */
  static update() {
    if (!this._initialized) return; // if style.js included in <head>, need to wait for window to load.
    let styleElement = this._getStyleElement();
    // reset <style> element
    styleElement.innerHTML = "";
    // render every Selector
    for (const selector of this.selectors) {
      selector.render(this._props);
    }
  }

  /**
   * Select elements to add rules to.
   * @param {string} query Selector query. See https://www.w3schools.com/cssref/css_selectors.php
   * @param {string | string[]} state Optional element state, such as hover or focus.
   * @returns {Selector} selector that you can call .ruleset() on.
   */
  static select(query, state = undefined) {
    const selector = state
      ? new StateSelector(query, state)
      : new Selector(query);
    this.selectors.push(selector);
    return selector;
  }

  /**
   * Extract the global properties created using DRSS.setProps
   * @returns {{}} props
   */
  static getProps() {
    return this._props;
  }

  /**
   * Update global properties
   * @param {{}} value { key1: value1, key2: value2, }
   */
  static setProps(value) {
    for (const key in value) {
      this._props[key] = value[key];
    }
    this.update();
  }

  /**
   * Set up styles, update in document, and enable auto-update
   * @returns {void}
   */
  static initialize() {
    // don't need to initialize multiple times
    if (!this._initialized) {
      this._initialized = true;

      // initial rendering - in case initialize is called after document/ruleset load
      this.update();

      // Update whenever DOM updated (new element created, etc.)
      const observer = new MutationObserver(() => {
        DRSS.update();
      });
      observer.observe(document.body, { childList: true, subtree: true });
      // https://stackoverflow.com/questions/3219758/detect-changes-in-the-dom
      // need fallback

      // responsive design
      window.addEventListener("resize", () => {
        DRSS.update();
      });
    }
  }

  /**
   * Create/get the actual CSS stylesheet
   * @returns {HTMLStyleElement} the style element (id #drssHead)
   */
  static _getStyleElement() {
    if (this._initialized) {
      let styleElement = document.querySelector("style#drssHead");
      if (!styleElement) {
        styleElement = document.createElement("style");
        styleElement.id = "drssHead";
        document.head.appendChild(styleElement);
      }
      return styleElement;
    }
  }

  /**
   * Get a unique value for drss-id
   * @returns {number} lowest available id
   */
  static getNextId() {
    this._nextId++;
    return this._nextId - 1;
  }
}
