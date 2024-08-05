# Reactive StyleSheets
Purpose: to make dynamic styling much, much easier.

CSS alone is a static language and can be almost painful to use when creating dynamic webapps. With RSS, you can use JS to make styles automatically adapt to an element's properties or even external variables.

## Getting started

### Installation
npm and cdn (tba)

### Creating a stylesheet
First, initialize RSS:
```js
window.addEventListener("load", RSS.initialize);
```
This will apply the styles & auto-updating once the document has loaded.
If you know the window has already loaded, you can simply call `RSS.initialize()`.

Now, you can stylize an element using `select` and `ruleset`:
```js
RSS.select("h1").ruleset({
    color: "green",
    backgroundColor: "black", // "background-color" also works
});
```
`select` uses the same query system as `document.querySelector`.
Here, we've passed an object into `ruleset`: thus, the style is static.
However, if we use a function, we can make the style reactive:
```js
RSS.select("h1").ruleset((node, index, props) => {
    return {
        color: node.dataset.color || "white", // use data-color of element, or white.
        backgroundColor: (index % 2 == 0)?"black":"grey", // alternate colors
    };
});
```
`node` is the element itself and `index` is its order in the document. We'll talk more about `props` later.

### State selectors
You can pass an extra `state` argument into `RSS.select` to create focus or hover effects.
```js
// hover state
RSS.select("h1", "hover").ruleset((node, index, props) => {
    return {
        color: "green",
    };
});

// focus state
RSS.select("button", "focus").ruleset((node, index, props) => {
    return {
        color: "green",
    };
});
```
You can also apply multiple states simultaneously with an array:
```js
RSS.select("button", ["focus", "hover"]).ruleset({
    color: "green",
});
```
__*Note: still in beta, state selectors are known to be imperfect.*__

### Props
You can pass variables into the `props` argument by using `RSS.setProps`:
```js
RSS.setProps({
    evenBG: "black",
    oddBG: "grey",
});
```
Calling `setProps` retains old props (unless you override them). For example, if I now call `RSS.setProps({ evenBG: "red" });`, `oddBG` will stay as `"grey"`.

You can get props with `RSS.getProps()`.

### Manual updating
Styles will automatically update when props are changed, when the DOM is updated, and when new rulesets are added. If styles are not updating for some reason, simply call `RSS.update()`.

## Demo
See [test/demo.html](./test/demo.html).

## Contributing
Yes please. I could use some help.

## Challenges
Focus & hover state can break when used together, when DOM updates, etc.

Pseudo-elements cannot be selected.

Need fallback