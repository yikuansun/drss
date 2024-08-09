// yep... you've probably never seen a style.js file before.
// trust me, though - after a while using DRSS, you'll never want to make a style.css file again.

// Apply styles & set up auto-update.
DRSS.initialize();

DRSS.setProps({
    evenBG: "black",
    oddBG: "grey",
});

// static ruleset
DRSS.select("h1").ruleset({
    fontFamily: "cursive", // "font-family" also works.
});

// dynamic ruleset
DRSS.select("h1").ruleset((node, index, props) => {
    return {
        color: node.dataset.color || "white", // use data-color of element, or white.
        backgroundColor: (index % 2 == 0)?(props["evenBG"]):(props["oddBG"]), // alternate colors
    };
});

// hover state
DRSS.select("h1", "hover").ruleset((node, index, props) => {
    return {
        color: "green",
    };
});
DRSS.select("button", "hover").ruleset({
    color: "blue",
});

// focus state
DRSS.select("button", "focus").ruleset((node, index, props) => {
    return {
        color: "green",
    };
});

// you can stylize multiple states simultaneously
DRSS.select("li", ["before", "after"]).ruleset({
    content: "'--'", // need additional quotes around CSS string
    color: "blue",
});

// scrollbars!
DRSS.select("body").ruleset({
    overflow: "scroll"
});
DRSS.select("body", ":-webkit-scrollbar").ruleset({ // add an extra : since it's a pseudo
    width: "10px",
    height: "10px",
    backgroundColor: "aliceblue",
});
DRSS.select("body", ":-webkit-scrollbar-thumb").ruleset({
    backgroundColor: "grey",
});
DRSS.select("body", ":-webkit-scrollbar-thumb:hover").ruleset({
    backgroundColor: "darkblue",
});

// responsive design
DRSS.select("#resizable").ruleset(() => {
    let backgroundColor = "black";
    let color = `hsl(${window.innerWidth / 2}deg, 100%, 50%)`;
    return { backgroundColor, color }; // shorthand properties are helpful
});

DRSS.select("#resizable", "after").ruleset(() => {
    let content = `"Window width: ${window.innerWidth} pixels"`;
    return { content };
});