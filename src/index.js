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
   */
  ruleset(hook) {
    let _hook = hook;
    // if hook is an object, convert it into a function which returns that object
    if (typeof hook === "object")
      _hook = () => {
        return hook;
      };

    // create new RuleSet object and add it to Selector.ruleSets
    let set = new RuleSet(_hook);
    this.ruleSets.push(set);

    // auto-update document
    DRSS.update();
  }

  /**
   * Update the style in the actual document.
   * @param {{}} props Global properties defined by DRSS.setProps
   */
  render(props) {
    let all = document.querySelectorAll(this.query);
    for (let i = 0; i < all.length; i++) {
      let node = all[i];

      // element's complete style ruleset, as a dictionary
      let style = {};

      for (let set of this.ruleSets) {
        let dict = set.hook(node, i, props);
        // merge dict into style
        for (let key in dict) {
          // convert camelcasing to dashes, ex.: backgroundColor => background-color
          style[c2d(key)] = dict[key];
        }
      }

      let sheet = DRSS._getStyleElement();
      // set node id: either existing drss-id, or the next available number
      let nodeId = "";
      if (node.dataset["drssId"]) nodeId = node.dataset["drssId"];
      else nodeId = DRSS.getNextId();

      // convert style object to a css string
      let rulesetStr = `[data-drssId="${nodeId}"],[data-drss-id="${nodeId}"]{`;

      for (let key in style) {
        rulesetStr += key + ":" + style[key] + ";";
      }
      rulesetStr += "}";

      sheet.innerHTML += rulesetStr;
      node.dataset["drssId"] = nodeId;
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
      let sheet = DRSS._getStyleElement();
      let nodeId = "";
      if (node.dataset["drssId"]) nodeId = node.dataset["drssId"];
      else nodeId = DRSS.getNextId();

      let rulesetStr = "";
      // create the actual css selector
      for (let state of this.states) {
        rulesetStr += `[data-drssId="${nodeId}"]:${state},[data-drss-id="${nodeId}"]:${state}`;
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
      node.dataset["drssId"] = nodeId;
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
    for (let selector of this.selectors) {
      selector.render(this._props);
    }
  }

  /**
   * Select elements to add rules to.
   * @param {string} query Selector query. See https://www.w3schools.com/cssref/css_selectors.php
   * @param {string | string[]} state Element state, such as hover or focus.
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
    for (let key in value) {
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

      // initial rendering
      DRSS.update();

      // update whenever DOM updated (new element created, etc.)
      let observer = new MutationObserver(() => {
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
