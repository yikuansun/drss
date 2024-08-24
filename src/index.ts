import c2d from "./camelToDash";
import { StyleDictionary, StyleHook } from "./types";

class RuleSet {
  hook: StyleHook = (node, index, props) => {
    return {};
  };

  /**
   * Create a static or dynamic ruleset
   * @param hook Dictionary defining style rules, or a function which returns it.
   */
  constructor(hook: StyleHook) {
    this.hook = hook;
  }
}

class Selector {
  elements: HTMLElement[] = [];
  ruleSets: RuleSet[] = [];
  query: string = "";

  /**
   * Create a new selector.
   * @param query Query selector. Same as document.querySelector
   */
  constructor(query: string) {
    this.query = query;
  }

  /**
   * Add a static or dynamic ruleset.
   * @param hook Dictionary defining style rules, or a function which returns it.
   * @return the updated selector
   */
  ruleset(hook: StyleHook | object): Selector {
    let _hook: StyleHook;

    // if hook is an object, convert it into a function which returns that object
    if (typeof hook === "object") {
      _hook = () => hook as StyleDictionary;
    } else {
      _hook = hook;
    }

    // create new RuleSet object and add it to Selector.ruleSets
    const set = new RuleSet(_hook);
    this.ruleSets.push(set);

    if (DRSS._initialized) this.render(DRSS._props);

    return this;
  }

  /**
   * Update the style in the actual document.
   * @param props Global properties defined by DRSS.setProps
   */
  render(props: { [key: string]: string }) {
    const all = document.querySelectorAll(this.query);
    for (let i = 0; i < all.length; i++) {
      const node = all[i] as HTMLElement;

      // element's complete style ruleset, as a dictionary
      const style: StyleDictionary = {};

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
      const nodeId = node.dataset["drssid"] ?? DRSS.getNextId().toString();

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
  states: string[] = [];

  /**
   * Create new selector, with state properties.
   * @param query Query selector. Same as document.querySelector
   * @param states The state or list of states. Can be hover,
   */
  constructor(query: string, states: string[] | string) {
    super(query);
    if (typeof states === "string") this.states = [states];
    else this.states = states;
  }

  render(props: { [key: string]: string }) {
    // basically the same stuff as Selector.render
    const all = document.querySelectorAll(this.query);
    for (let i = 0; i < all.length; i++) {
      const node = all[i] as HTMLElement;
      const style: StyleDictionary = {};

      for (const set of this.ruleSets) {
        const dict = set.hook(node, i, props);
        for (const key in dict) {
          style[c2d(key)] = dict[key];
        }
      }
      const sheet = DRSS._getStyleElement();
      const nodeId = node.dataset["drssid"] ?? DRSS.getNextId().toString();

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
  static selectors: Selector[] = [];
  static _props: { [key: string]: any } = {};
  static _initialized = false;
  static _nextId = 0;

  /**
   * Update all styles in the document
   * @returns {void}
   */
  static update() {
    if (!this._initialized) return; // if style.js included in <head>, need to wait for window to load.
    const styleElement = this._getStyleElement();
    // reset <style> element
    styleElement.innerHTML = "";
    // render every Selector
    for (const selector of this.selectors) {
      selector.render(this._props);
    }
  }

  /**
   * Select elements to add rules to.
   * @param query Selector query. See https://www.w3schools.com/cssref/css_selectors.php
   * @param state Optional element state, such as hover or focus.
   * @returns {Selector} selector that you can call .ruleset() on.
   */
  static select(
    query: string,
    state: string | string[] | undefined = undefined
  ): Selector {
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
  static getProps(): { [key: string]: any } {
    return this._props;
  }

  /**
   * Update global properties
   * @param value { key1: value1, key2: value2, }
   */
  static setProps(value: { [key: string]: any }) {
    for (const key in value) {
      this._props[key] = value[key];
    }
    this.update();
  }

  /**
   * Set up styles, update in document, and enable auto-update
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
  static _getStyleElement(): HTMLStyleElement {
    let styleElement = document.querySelector(
      "style#drssHead"
    ) as HTMLStyleElement | null;
    if (!styleElement) {
      styleElement = document.createElement("style");
      styleElement.id = "drssHead";
      document.head.appendChild(styleElement);
    }
    return styleElement;
  }

  /**
   * Get a unique value for drss-id
   * @returns {number} lowest available id
   */
  static getNextId(): number {
    this._nextId++;
    return this._nextId - 1;
  }
}
