var Promise = require("native-or-bluebird");

function TreeWalker(enterNode, leaveNode, getChildren) {
    //Setup default config here
    this.state = null;
    this.enterNode = enterNode || function (node, next) { next(); };
    this.leaveNode = leaveNode || function (node, next) { next(); };
    this.getChildren = getChildren || function (node) {
        return node.children || [];
    };
}

TreeWalker.ABORT = -1;
TreeWalker.SKIPCHILDREN = -2;
TreeWalker.SKIPSIBLINGS = -3;
TreeWalker.CONTINUE = 0;

TreeWalker.prototype.walk = function (root, complete) {
    var self = this;
    
    var promise = new Promise(function (resolve, reject) {
        //Find and process all children for this node
        var children = self.getChildren(root) || [];
        
        processArray(children, function (node) {
            return new Promise(function (resolveChild, rejectChild) {
                //Fire the enter callback
                self.enterNode(node, function (res) {
                    if (res === TreeWalker.ABORT) {
                        //If we are aborting then trigger resolve with the flag
                        resolve(res);
                    } else if (res === TreeWalker.SKIPCHILDREN) {
                        //If we are skipping children then we need to leave this node
                        doLeave.call(self, node, resolve, resolveChild);
                    } else {
                        var forceSkip = res === TreeWalker.SKIPSIBLINGS;
                        
                        //Else we need to walk the children of this node
                        self.walk(node).then(function (res) {
                            if (res === TreeWalker.ABORT) {
                                //Abort, propogate the flag
                                resolve(res);
                            } else {
                                //Else leave the node
                                doLeave.call(self, node, resolve, resolveChild, forceSkip);
                            }
                        }).catch(function (err) {
                            reject(err);
                        });
                    }
                });
            });
        }).then(function () {
            resolve();
        }).catch(function (err) {
            reject(err);
        });
    });
    
    //If we have a callback as the second argument then trigger that for backwards compatibility
    if (complete) {
        promise.then(function () {
            complete.call(self);
        });
    }
    return promise.bind(self);
};

function processArray(arr, visit, index) {
    //Process each item in the array
    index = index || 0;
    return new Promise(function (resolve, reject) {
        if (index < arr.length) {
            //Call the visit callback with the current element
            visit(arr[index]).then(function (res) {
                if (res === TreeWalker.SKIPSIBLINGS) {
                    //If we are skipping siblings then just resolve this processArray
                    resolve();
                } else {
                    //Else move onto the next item in the array
                    resolve(processArray(arr, visit, index + 1));
                }
            }).catch(function (err) {
                reject(err);
            });
        } else {
            //No items left to process
            resolve();
        }
    });
}

function doLeave(node, resolve, resolveChild, forceSkip) {
    this.leaveNode(node, function (res) {
        //If we are aborting then we need to resolve the walk, else resolve the visit
        if (res === TreeWalker.ABORT) {
            resolve(res);
        } else {
            resolveChild(forceSkip ? TreeWalker.SKIPSIBLINGS : res);
        }
    });
}

module.exports = TreeWalker;