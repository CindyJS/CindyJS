var requires = {};

function includefunction(name, modifs, codebuilder) { //includes functions and does DFS on all required functions.
    //console.log("Runnining includefunction with args" + JSON.stringify([name,codebuilder]));
    // we can assume we have a DAG
    if (codebuilder.mark('includedfunctions', name)) return;

    for (let i in requires[name]) {
        let f = requires[name][i];
        includefunction(f, modifs, codebuilder);
    }
    codebuilder.add('includedfunctions', name, () => cgl_resources[name]); //load name.glsl...
}

function useincludefunction(name) {
    //includefunction(name);
    //return usefunction(name);
    return (args, modifs, codebuilder) => { //runs includefunction(name) whenever useincludefunction(name) is called with some arguments
        includefunction(name, modifs, codebuilder);
        return (usefunction(name))(args);
    };
}
