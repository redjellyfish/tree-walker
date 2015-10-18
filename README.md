# tree-walker
Generic recursive tree walker

##Usage
```js
    var walker = new TreeWalker(function (node, next) {
        console.log("Enter " + node.id);
        next(TreeWalker.CONTINUE);
    }, function (node, next) {
        console.log("Leave" + node.id);
        next(TreeWalker.ABORT); //Only the first node in the tree
    });

    return walker.walk(tree).then(function () {
        console.log("Done");
    });
```

The `TreeWalker` constructor accepts 3 arguments:

 - enterNode: `function(node, next)` 
	 - `node:` The node that is being visited
	 - `next:` `function(visitresult)`: Callback that should be invoked to move onto the next node. You may provide an optional `visitresult`.
 - leaveNode: `function(node, next)`
	 - `node:` The node that is being visited
	 - `next:` `function(visitresult)`: Callback that should be invoked to move onto the next node. You may provide an optional `visitresult`.
 - getChildren: `function(node)`
	 - `node:` The node to obtain the children of.

##Visit results
`enterNode` and `leaveNode` can both return a result to the caller, the following values are possible:
####`TreeWalker.ABORT` 
Applicable to both `enterNode` and `leaveNode`, it will abort the walk of the tree from the current position
####`TreeWalker.CONTINUE`
Applicable to both `enterNode` and `leaveNode`the walk of the tree will be continued, this is equivalent to returning nothing.
####`TreeWalker.SKIPCHILDREN` 
Applicable only to `enterNode`. it will signal the walker to skip the children of the current node.
####`TreeWalker.SKIPSIBLINGS` 
Applicable to both `enterNode` and `leaveNode`, it signal the walker to skip the siblings of the current node.
