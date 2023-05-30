import {open} from "lmdb";
import {nothing} from "./index.js";

const rootDB = open("test.db"),
    db = rootDB.openDB("test",{useVersions:true});
db.clearSync();

test("putSync", () => { // https://github.com/kriszyp/lmdb-js/issues/235
   const result = db.transactionSync(() => {
       const result = db.putSync(1,1),
           value = db.get(1);
       expect(typeof result).toBe("boolean");
       expect(value).toBe(1);
   })
})