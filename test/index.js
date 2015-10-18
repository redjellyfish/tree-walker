var expect = require("chai").expect;
var TreeWalker = require("../index.js");
var cheerio = require("cheerio");

var tree = {
    children: [{
            id: "a",
            result: "ABORT",
            children: [{
                    id: "a1",
                    children: [],
                    result: "SKIPSIBLINGS"
                }, {
                    id: "a2",
                    result: "SKIPCHILDREN",
                    children: [{
                            id: "a2A",
                            children: []
                        }]
                }]
        }, {
            id: "b"
        }
    ]
};

var tree2 = {
    children: [{
            id: "a",
            result: "SKIPSIBLINGS",
            children: [{
                    id: "a1",
                    children: [{
                            id: "a1A"
                        }],
                    result: "ABORT",
                }, {
                    id: "a2",
                    children: [{
                            id: "a2A",
                            children: []
                        }]
                }]
        }, {
            id: "b",
            result: "SKIPCHILDREN",
            children: [{
                    id: "b1"
                }]
        }
    ]
};


function getTreeWalker(enter, leave, tree, complete) {
    enter = enter || function (node, next) { next(); };
    leave = leave || function (node, next) { next(); };
    
    var walker = new TreeWalker(function (node, next) {
        this.state += ("+" + node.id);
        enter(node, next);
    }, function (node, next) {
        this.state += ("-" + node.id);
        leave(node, next);
    });
    walker.state = "";
    
    return walker.walk(tree).then(function () {
        complete(this.state);
    });
}

describe("TreeWalker", function () {
    
    it("can walk the tree", function () {
        return getTreeWalker(null, null, tree, function (state) {
            expect(state).to.equal("+a+a1-a1+a2+a2A-a2A-a2-a+b-b");
        });    });
    
    it("can walk a different tree", function () {
        return getTreeWalker(null, null, tree2, function (state) {
            expect(state).to.equal("+a+a1+a1A-a1A-a1+a2+a2A-a2A-a2-a+b+b1-b1-b");
        });    });
    
    it("can walk the tree with default enter", function () {
        var walker = new TreeWalker(null, function (node, next) {
            this.state += ("-" + node.id);
            next();
        });
        walker.state = "";
        
        return walker.walk(tree).then(function () {
            expect(this.state).to.equal("-a1-a2A-a2-a-b");
        });
    });
    
    it("can walk the tree with default leave", function () {
        var walker = new TreeWalker(function (node, next) {
            this.state += ("+" + node.id);
            next();
        });
        walker.state = "";
        
        return walker.walk(tree).then(function () {
            expect(this.state).to.equal("+a+a1+a2+a2A+b");
        });
    });
    
    it("can propogate errors", function () {
        var walker = new TreeWalker(null, function (node, next) {
            throw "this should error";
        });
        walker.state = "";
        
        return walker.walk(tree).then(function () {
            assert.fail("this should have errored");
        }).catch(function (err) {
            expect(err).to.equal("this should error");
        });
    });
    
    it("can be aborted on enter", function () {
        return getTreeWalker(function (node, next) {
            if (node.result === "ABORT") {
                next(TreeWalker[node.result]);
            } else {
                next();
            }
        }, null, tree, function (state) {
            expect(state).to.equal("+a");
        });
    });
    
    it("can be aborted on leave", function () {
        return getTreeWalker(null, function (node, next) {
            if (node.result === "ABORT") {
                next(TreeWalker[node.result]);
            } else {
                next();
            }
        }, tree, function (state) {
            expect(state).to.equal("+a+a1-a1+a2+a2A-a2A-a2-a");
        });
    });
    
    it("can be aborted on enter from nested", function () {
        return getTreeWalker(function (node, next) {
            if (node.result === "ABORT") {
                next(TreeWalker[node.result]);
            } else {
                next();
            }
        }, null, tree2, function (state) {
            expect(state).to.equal("+a+a1");
        });
    });
    
    it("can be aborted on leave from nested", function () {
        return getTreeWalker(null, function (node, next) {
            if (node.result === "ABORT") {
                next(TreeWalker[node.result]);
            } else {
                next();
            }
        }, tree2, function (state) {
            expect(state).to.equal("+a+a1+a1A-a1A-a1");
        });
    });
    
    it("can skip children test1", function () {
        return getTreeWalker(function (node, next) {
            if (node.result === "SKIPCHILDREN") {
                next(TreeWalker[node.result]);
            } else {
                next();
            }
        }, null, tree, function (state) {
            expect(state).to.equal("+a+a1-a1+a2-a2-a+b-b");
        });
    });
    
    it("can skip children test2", function () {
        return getTreeWalker(function (node, next) {
            if (node.result === "SKIPCHILDREN") {
                next(TreeWalker[node.result]);
            } else {
                next();
            }
        }, null, tree2, function (state) {
            expect(state).to.equal("+a+a1+a1A-a1A-a1+a2+a2A-a2A-a2-a+b-b");
        });
    });
    
    it("can skip siblings on enter test1", function () {
        return getTreeWalker(function (node, next) {
            if (node.result === "SKIPSIBLINGS") {
                next(TreeWalker[node.result]);
            } else {
                next();
            }
        }, null, tree, function (state) {
            expect(state).to.equal("+a+a1-a1-a+b-b");
        });
    });
    
    it("can skip siblings on enter test2", function () {
        return getTreeWalker(function (node, next) {
            if (node.result === "SKIPSIBLINGS") {
                next(TreeWalker[node.result]);
            } else {
                next();
            }
        }, null, tree2, function (state) {
            expect(state).to.equal("+a+a1+a1A-a1A-a1+a2+a2A-a2A-a2-a");
        });
    });
    
    it("can skip siblings on leave test1", function () {
        return getTreeWalker(null, function (node, next) {
            if (node.result === "SKIPSIBLINGS") {
                next(TreeWalker[node.result]);
            } else {
                next();
            }
        }, tree, function (state) {
            expect(state).to.equal("+a+a1-a1-a+b-b");
        });
    });
    
    it("can skip siblings on leave test2", function () {
        return getTreeWalker(null, function (node, next) {
            if (node.result === "SKIPSIBLINGS") {
                next(TreeWalker[node.result]);
            } else {
                next();
            }
        }, tree2, function (state) {
            expect(state).to.equal("+a+a1+a1A-a1A-a1+a2+a2A-a2A-a2-a");
        });
    });
    
    it("works with cheerio dom", function () {
        var $ = cheerio.load("<div><ul><li>1</li><li>2</li><li>3</li></ul></div><p>hello<img src=''/></p>");
        
        var walker = new TreeWalker(function (node, next) {
            if (node.type === "text") {
                this.state += ("{" + node.data + "}");
            } else {
                this.state += ("<" + node.tagName + ">");
            }
            next();
        }, function (node, next) {
            if (node.type === "text") {
                this.state += ("{/" + node.data + "}");
            } else {
                this.state += ("</" + node.tagName + ">");
            }
            next();
        });
        walker.state = "";
        
        return walker.walk($.root()[0]).then(function () {
            expect(this.state).to.equal("<div><ul><li>{1}{/1}</li><li>{2}{/2}</li><li>{3}{/3}</li></ul></div><p>{hello}{/hello}<img></img></p>");
        });
    });
});