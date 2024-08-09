// yep... you've probably never seen a style.js file before.
// trust me, though - after a while using RSS, you'll never want to make a style.css file again.

// Apply styles & set up auto-update.
RSS.initialize();

RSS.setProps({
    evenBG: "black",
    oddBG: "grey",
});

// static ruleset
RSS.select("h1").ruleset({
    fontFamily: "cursive", // "font-family" also works.
});

// dynamic ruleset
RSS.select("h1").ruleset((node, index, props) => {
    return {
        color: node.dataset.color || "white", // use data-color of element, or white.
        backgroundColor: (index % 2 == 0)?(props["evenBG"]):(props["oddBG"]), // alternate colors
    };
});

// hover state
RSS.select("h1", "hover").ruleset((node, index, props) => {
    return {
        color: "green",
    };
});
RSS.select("button", "hover").ruleset({
    color: "blue",
});

// focus state
RSS.select("button", "focus").ruleset((node, index, props) => {
    return {
        color: "green",
    };
});

// you can stylize multiple states simultaneously
RSS.select("li", ["before", "after"]).ruleset({
    content: "'--'", // need additional quotes around CSS string
    color: "blue",
});

// scrollbars!
RSS.select("body").ruleset({
    overflow: "scroll"
});
RSS.select("body", ":-webkit-scrollbar").ruleset({ // add an extra : since it's a pseudo
    width: "10px",
    height: "10px",
    backgroundColor: "aliceblue",
});
RSS.select("body", ":-webkit-scrollbar-thumb").ruleset({
    backgroundColor: "grey",
});
RSS.select("body", ":-webkit-scrollbar-thumb:hover").ruleset({
    backgroundColor: "darkblue",
});

// responsive design
RSS.select("#resizable").ruleset(() => {
    let backgroundColor = "black";
    let color = `hsl(${window.innerWidth / 2}deg, 100%, 50%)`;
    return { backgroundColor, color }; // shorthand properties are helpful
});

RSS.select("#resizable", "after").ruleset(() => {
    let content = `"Window width: ${window.innerWidth} pixels"`;
    return { content };
});