import {open} from "lmdb";

const benchmark = await import("./node_modules/benchmark/benchmark.js"),
    Benchmark = benchmark.default,
    suite = new Benchmark.Suite;

const rootDB = open("test.db"),
    db = rootDB.openDB("test",{cache:true,useVersions:true});
db.clearSync();

const loadTest = async (count) => {
    while(count--) {
        await db.put(1,1);
        if(db.cache.has(1)) {
            const v1 = db.get(1);
            db.cache.delete(1);
            const v2 = db.get(1);
            if(v1!==1 || v2!==1) {
                console.log(new Error("Outside suite cache has, clear cache, get: Value is not 1"));
            }
            // expect cache to be reloaded after get, this test suite fails and prints error
            // this issue has not been reported to lmdb-js yet
            if(!db.cache.has(1)) {
                console.log(new Error("Outside suite cache has, clear cache, get: Cache does not have key 1"));
            }
        }
    }
}
await loadTest(10)


await db.put(2,2);
suite.add("2: cache has, clear cache, get",async () => {
    if(db.cache.has(2)) {
        const v1 = db.get(2);
        db.cache.delete(2);
        const v2 = db.get(2);
        // this test suite is ok and error does not print
        if(v1!==2 || v2!==2) { //
            console.log(new Error("2: Inside suite cache has, clear cache, get: Value is not 2"));
        }
        // looking for key in cache afte rget will fail, just like loadTest above
    }
})
suite.add("3: put, cache has, clear cache, get",async () => {
    // if you place break point here, you will find all test invocations wait, cache is only tested after all runs, promise not resolving properly?
    // probably related to but not identical to https://github.com/kriszyp/lmdb-js/issues/237
    await db.put(3,3);
    await db.committed;
    if(db.cache.has(3)) {  // this only succeeds the first time the test is run
        const v1 = db.get(3);
        db.cache.delete(3);
        const v3 = db.get(3);
        if(v1!==3 || v3!==3) {
            console.log(new Error("Inside suite put, cache has, clear cache, get: Value is not 3"));
        }
    } else { // this executes the second and nth time the test is run
        console.log(new Error("3: Inside suite put, cache has, clear cache, get: Cache does not have key 3"));
    }
})

suite .on('cycle', function(event) {
        console.log(String(event.target));
    })
    .run({ maxTime:5 });
