"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPrismaClientClass = getPrismaClientClass;
const runtime = __importStar(require("@prisma/client/runtime/client"));
const config = {
    "previewFeatures": [],
    "clientVersion": "7.8.0",
    "engineVersion": "3c6e192761c0362d496ed980de936e2f3cebcd3a",
    "activeProvider": "mysql",
    "inlineSchema": "// This is your Prisma schema file,\n// learn more about it in the docs: https://pris.ly/d/prisma-schema\n\n// Get a free hosted Postgres database in seconds: `npx create-db`\n\ngenerator client {\n  provider = \"prisma-client\"\n  output   = \"../generated/prisma\"\n}\n\ndatasource db {\n  provider = \"mysql\"\n}\n\nmodel Category {\n  id          Int      @id @default(autoincrement())\n  tenant_id   Int\n  name        String\n  description String?  @db.Text\n  created_at  DateTime @default(now())\n  updated_at  DateTime @updatedAt\n\n  products Product[]\n\n  @@index([tenant_id])\n  @@map(\"categories\")\n}\n\nmodel Product {\n  id             Int      @id @default(autoincrement())\n  tenant_id      Int\n  category_id    Int?\n  name           String\n  sku            String?  @db.VarChar(100)\n  barcode        String?  @db.VarChar(100)\n  price          Decimal  @db.Decimal(10, 2)\n  cost_price     Decimal? @db.Decimal(10, 2)\n  stock_quantity Int      @default(0)\n  is_active      Boolean  @default(true)\n  created_at     DateTime @default(now())\n  updated_at     DateTime @updatedAt\n\n  category Category? @relation(fields: [category_id], references: [id], onDelete: SetNull)\n\n  @@index([tenant_id])\n  @@index([sku])\n  @@map(\"products\")\n}\n",
    "runtimeDataModel": {
        "models": {},
        "enums": {},
        "types": {}
    },
    "parameterizationSchema": {
        "strings": [],
        "graph": ""
    }
};
config.runtimeDataModel = JSON.parse("{\"models\":{\"Category\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"tenant_id\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"name\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"description\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"created_at\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updated_at\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"products\",\"kind\":\"object\",\"type\":\"Product\",\"relationName\":\"CategoryToProduct\"}],\"dbName\":\"categories\"},\"Product\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"tenant_id\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"category_id\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"name\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"sku\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"barcode\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"price\",\"kind\":\"scalar\",\"type\":\"Decimal\"},{\"name\":\"cost_price\",\"kind\":\"scalar\",\"type\":\"Decimal\"},{\"name\":\"stock_quantity\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"is_active\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"created_at\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updated_at\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"category\",\"kind\":\"object\",\"type\":\"Category\",\"relationName\":\"CategoryToProduct\"}],\"dbName\":\"products\"}},\"enums\":{},\"types\":{}}");
config.parameterizationSchema = {
    strings: JSON.parse("[\"where\",\"orderBy\",\"cursor\",\"category\",\"products\",\"_count\",\"Category.findUnique\",\"Category.findUniqueOrThrow\",\"Category.findFirst\",\"Category.findFirstOrThrow\",\"Category.findMany\",\"data\",\"Category.createOne\",\"Category.createMany\",\"Category.updateOne\",\"Category.updateMany\",\"create\",\"update\",\"Category.upsertOne\",\"Category.deleteOne\",\"Category.deleteMany\",\"having\",\"_avg\",\"_sum\",\"_min\",\"_max\",\"Category.groupBy\",\"Category.aggregate\",\"Product.findUnique\",\"Product.findUniqueOrThrow\",\"Product.findFirst\",\"Product.findFirstOrThrow\",\"Product.findMany\",\"Product.createOne\",\"Product.createMany\",\"Product.updateOne\",\"Product.updateMany\",\"Product.upsertOne\",\"Product.deleteOne\",\"Product.deleteMany\",\"Product.groupBy\",\"Product.aggregate\",\"AND\",\"OR\",\"NOT\",\"id\",\"tenant_id\",\"category_id\",\"name\",\"sku\",\"barcode\",\"price\",\"cost_price\",\"stock_quantity\",\"is_active\",\"created_at\",\"updated_at\",\"equals\",\"in\",\"notIn\",\"lt\",\"lte\",\"gt\",\"gte\",\"not\",\"contains\",\"startsWith\",\"endsWith\",\"search\",\"description\",\"every\",\"some\",\"none\",\"is\",\"isNot\",\"connectOrCreate\",\"upsert\",\"createMany\",\"set\",\"disconnect\",\"delete\",\"connect\",\"updateMany\",\"deleteMany\",\"_relevance\",\"increment\",\"decrement\",\"multiply\",\"divide\"]"),
    graph: "hgESHAoEAABTACAqAABOADArAAAHABAsAABOADAtAgAAAAEuAgBPACEwAQBQACE3QABSACE4QABSACFFAQBRACEBAAAAAQAgEAMAAFkAICoAAFQAMCsAAAMAECwAAFQAMC0CAE8AIS4CAE8AIS8CAFUAITABAFAAITEBAFEAITIBAFEAITMQAFYAITQQAFcAITUCAE8AITYgAFgAITdAAFIAIThAAFIAIQYDAAB_ACAvAABaACAxAABaACAyAABaACA0AABaACBUAACAAQAgEAMAAFkAICoAAFQAMCsAAAMAECwAAFQAMC0CAAAAAS4CAE8AIS8CAFUAITABAFAAITEBAFEAITIBAFEAITMQAFYAITQQAFcAITUCAE8AITYgAFgAITdAAFIAIThAAFIAIQMAAAADACABAAAEADACAAAFACAKBAAAUwAgKgAATgAwKwAABwAQLAAATgAwLQIATwAhLgIATwAhMAEAUAAhN0AAUgAhOEAAUgAhRQEAUQAhAQAAAAcAIAEAAAADACABAAAAAQAgAwQAAH0AIEUAAFoAIFQAAH4AIAMAAAAHACABAAALADACAAABACADAAAABwAgAQAACwAwAgAAAQAgAwAAAAcAIAEAAAsAMAIAAAEAIAcEAAB8ACAtAgAAAAEuAgAAAAEwAQAAAAE3QAAAAAE4QAAAAAFFAQAAAAEBCwAADwAgBi0CAAAAAS4CAAAAATABAAAAATdAAAAAAThAAAAAAUUBAAAAAQELAAARADAHBAAAbwAgLQIAYAAhLgIAYAAhMAEAYQAhN0AAZgAhOEAAZgAhRQEAYgAhAgAAAAEAIAsAABMAIAYtAgBgACEuAgBgACEwAQBhACE3QABmACE4QABmACFFAQBiACECAAAABwAgCwAAFQAgAwAAAAEAIBAAAA8AIBEAABMAIAEAAAABACABAAAABwAgBgUAAGoAIBYAAGsAIBcAAG4AIBgAAG0AIBkAAGwAIEUAAFoAIAkqAABNADArAAAbABAsAABNADAtAgAzACEuAgAzACEwAQA1ACE3QAA6ACE4QAA6ACFFAQA2ACEDAAAABwAgAQAAGgAwFQAAGwAgAwAAAAcAIAEAAAsAMAIAAAEAIAEAAAAFACABAAAABQAgAwAAAAMAIAEAAAQAMAIAAAUAIAMAAAADACABAAAEADACAAAFACADAAAAAwAgAQAABAAwAgAABQAgDQMAAGkAIC0CAAAAAS4CAAAAAS8CAAAAATABAAAAATEBAAAAATIBAAAAATMQAAAAATQQAAAAATUCAAAAATYgAAAAATdAAAAAAThAAAAAAQELAAAjACAMLQIAAAABLgIAAAABLwIAAAABMAEAAAABMQEAAAABMgEAAAABMxAAAAABNBAAAAABNQIAAAABNiAAAAABN0AAAAABOEAAAAABAQsAACUAMA0DAABoACAtAgBgACEuAgBgACEvAgBnACEwAQBhACExAQBiACEyAQBiACEzEABjACE0EABkACE1AgBgACE2IABlACE3QABmACE4QABmACECAAAABQAgCwAAJwAgDC0CAGAAIS4CAGAAIS8CAGcAITABAGEAITEBAGIAITIBAGIAITMQAGMAITQQAGQAITUCAGAAITYgAGUAITdAAGYAIThAAGYAIQIAAAADACALAAApACADAAAABQAgEAAAIwAgEQAAJwAgAQAAAAUAIAEAAAADACAJBQAAWwAgFgAAXAAgFwAAXwAgGAAAXgAgGQAAXQAgLwAAWgAgMQAAWgAgMgAAWgAgNAAAWgAgDyoAADIAMCsAAC8AECwAADIAMC0CADMAIS4CADMAIS8CADQAITABADUAITEBADYAITIBADYAITMQADcAITQQADgAITUCADMAITYgADkAITdAADoAIThAADoAIQMAAAADACABAAAuADAVAAAvACADAAAAAwAgAQAABAAwAgAABQAgDyoAADIAMCsAAC8AECwAADIAMC0CADMAIS4CADMAIS8CADQAITABADUAITEBADYAITIBADYAITMQADcAITQQADgAITUCADMAITYgADkAITdAADoAIThAADoAIQ0FAAA8ACAWAABMACAXAAA8ACAYAAA8ACAZAAA8ACA5AgAAAAE6AgAAAAQ7AgAAAAQ8AgAAAAE9AgAAAAE-AgAAAAE_AgAAAAFAAgBLACENBQAAQQAgFgAASgAgFwAAQQAgGAAAQQAgGQAAQQAgOQIAAAABOgIAAAAFOwIAAAAFPAIAAAABPQIAAAABPgIAAAABPwIAAAABQAIASQAhDwUAADwAIBgAAEgAIBkAAEgAIDkBAAAAAToBAAAABDsBAAAABDwBAAAAAT0BAAAAAT4BAAAAAT8BAAAAAUABAEcAIUEBAAAAAUIBAAAAAUMBAAAAAUQBAAAAAQ8FAABBACAYAABGACAZAABGACA5AQAAAAE6AQAAAAU7AQAAAAU8AQAAAAE9AQAAAAE-AQAAAAE_AQAAAAFAAQBFACFBAQAAAAFCAQAAAAFDAQAAAAFEAQAAAAENBQAAPAAgFgAARAAgFwAARAAgGAAARAAgGQAARAAgORAAAAABOhAAAAAEOxAAAAAEPBAAAAABPRAAAAABPhAAAAABPxAAAAABQBAAQwAhDQUAAEEAIBYAAEIAIBcAAEIAIBgAAEIAIBkAAEIAIDkQAAAAAToQAAAABTsQAAAABTwQAAAAAT0QAAAAAT4QAAAAAT8QAAAAAUAQAEAAIQUFAAA8ACAYAAA_ACAZAAA_ACA5IAAAAAFAIAA-ACELBQAAPAAgGAAAPQAgGQAAPQAgOUAAAAABOkAAAAAEO0AAAAAEPEAAAAABPUAAAAABPkAAAAABP0AAAAABQEAAOwAhCwUAADwAIBgAAD0AIBkAAD0AIDlAAAAAATpAAAAABDtAAAAABDxAAAAAAT1AAAAAAT5AAAAAAT9AAAAAAUBAADsAIQg5AgAAAAE6AgAAAAQ7AgAAAAQ8AgAAAAE9AgAAAAE-AgAAAAE_AgAAAAFAAgA8ACEIOUAAAAABOkAAAAAEO0AAAAAEPEAAAAABPUAAAAABPkAAAAABP0AAAAABQEAAPQAhBQUAADwAIBgAAD8AIBkAAD8AIDkgAAAAAUAgAD4AIQI5IAAAAAFAIAA_ACENBQAAQQAgFgAAQgAgFwAAQgAgGAAAQgAgGQAAQgAgORAAAAABOhAAAAAFOxAAAAAFPBAAAAABPRAAAAABPhAAAAABPxAAAAABQBAAQAAhCDkCAAAAAToCAAAABTsCAAAABTwCAAAAAT0CAAAAAT4CAAAAAT8CAAAAAUACAEEAIQg5EAAAAAE6EAAAAAU7EAAAAAU8EAAAAAE9EAAAAAE-EAAAAAE_EAAAAAFAEABCACENBQAAPAAgFgAARAAgFwAARAAgGAAARAAgGQAARAAgORAAAAABOhAAAAAEOxAAAAAEPBAAAAABPRAAAAABPhAAAAABPxAAAAABQBAAQwAhCDkQAAAAAToQAAAABDsQAAAABDwQAAAAAT0QAAAAAT4QAAAAAT8QAAAAAUAQAEQAIQ8FAABBACAYAABGACAZAABGACA5AQAAAAE6AQAAAAU7AQAAAAU8AQAAAAE9AQAAAAE-AQAAAAE_AQAAAAFAAQBFACFBAQAAAAFCAQAAAAFDAQAAAAFEAQAAAAEMOQEAAAABOgEAAAAFOwEAAAAFPAEAAAABPQEAAAABPgEAAAABPwEAAAABQAEARgAhQQEAAAABQgEAAAABQwEAAAABRAEAAAABDwUAADwAIBgAAEgAIBkAAEgAIDkBAAAAAToBAAAABDsBAAAABDwBAAAAAT0BAAAAAT4BAAAAAT8BAAAAAUABAEcAIUEBAAAAAUIBAAAAAUMBAAAAAUQBAAAAAQw5AQAAAAE6AQAAAAQ7AQAAAAQ8AQAAAAE9AQAAAAE-AQAAAAE_AQAAAAFAAQBIACFBAQAAAAFCAQAAAAFDAQAAAAFEAQAAAAENBQAAQQAgFgAASgAgFwAAQQAgGAAAQQAgGQAAQQAgOQIAAAABOgIAAAAFOwIAAAAFPAIAAAABPQIAAAABPgIAAAABPwIAAAABQAIASQAhCDkIAAAAAToIAAAABTsIAAAABTwIAAAAAT0IAAAAAT4IAAAAAT8IAAAAAUAIAEoAIQ0FAAA8ACAWAABMACAXAAA8ACAYAAA8ACAZAAA8ACA5AgAAAAE6AgAAAAQ7AgAAAAQ8AgAAAAE9AgAAAAE-AgAAAAE_AgAAAAFAAgBLACEIOQgAAAABOggAAAAEOwgAAAAEPAgAAAABPQgAAAABPggAAAABPwgAAAABQAgATAAhCSoAAE0AMCsAABsAECwAAE0AMC0CADMAIS4CADMAITABADUAITdAADoAIThAADoAIUUBADYAIQoEAABTACAqAABOADArAAAHABAsAABOADAtAgBPACEuAgBPACEwAQBQACE3QABSACE4QABSACFFAQBRACEIOQIAAAABOgIAAAAEOwIAAAAEPAIAAAABPQIAAAABPgIAAAABPwIAAAABQAIAPAAhDDkBAAAAAToBAAAABDsBAAAABDwBAAAAAT0BAAAAAT4BAAAAAT8BAAAAAUABAEgAIUEBAAAAAUIBAAAAAUMBAAAAAUQBAAAAAQw5AQAAAAE6AQAAAAU7AQAAAAU8AQAAAAE9AQAAAAE-AQAAAAE_AQAAAAFAAQBGACFBAQAAAAFCAQAAAAFDAQAAAAFEAQAAAAEIOUAAAAABOkAAAAAEO0AAAAAEPEAAAAABPUAAAAABPkAAAAABP0AAAAABQEAAPQAhA0YAAAMAIEcAAAMAIEgAAAMAIBADAABZACAqAABUADArAAADABAsAABUADAtAgBPACEuAgBPACEvAgBVACEwAQBQACExAQBRACEyAQBRACEzEABWACE0EABXACE1AgBPACE2IABYACE3QABSACE4QABSACEIOQIAAAABOgIAAAAFOwIAAAAFPAIAAAABPQIAAAABPgIAAAABPwIAAAABQAIAQQAhCDkQAAAAAToQAAAABDsQAAAABDwQAAAAAT0QAAAAAT4QAAAAAT8QAAAAAUAQAEQAIQg5EAAAAAE6EAAAAAU7EAAAAAU8EAAAAAE9EAAAAAE-EAAAAAE_EAAAAAFAEABCACECOSAAAAABQCAAPwAhDAQAAFMAICoAAE4AMCsAAAcAECwAAE4AMC0CAE8AIS4CAE8AITABAFAAITdAAFIAIThAAFIAIUUBAFEAIUkAAAcAIEoAAAcAIAAAAAAAAAVOAgAAAAFVAgAAAAFWAgAAAAFXAgAAAAFYAgAAAAEBTgEAAAABAU4BAAAAAQVOEAAAAAFVEAAAAAFWEAAAAAFXEAAAAAFYEAAAAAEFThAAAAABVRAAAAABVhAAAAABVxAAAAABWBAAAAABAU4gAAAAAQFOQAAAAAEFTgIAAAABVQIAAAABVgIAAAABVwIAAAABWAIAAAABBxAAAIIBACARAACFAQAgSwAAgwEAIEwAAIQBACBPAAAHACBQAAAHACBRAAABACADEAAAggEAIEsAAIMBACBRAAABACAAAAAAAAsQAABwADARAAB1ADBLAABxADBMAAByADBNAABzACBOAAB0ADBPAAB0ADBQAAB0ADBRAAB0ADBSAAB2ADBTAAB3ADALLQIAAAABLgIAAAABMAEAAAABMQEAAAABMgEAAAABMxAAAAABNBAAAAABNQIAAAABNiAAAAABN0AAAAABOEAAAAABAgAAAAUAIBAAAHsAIAMAAAAFACAQAAB7ACARAAB6ACABCwAAgQEAMBADAABZACAqAABUADArAAADABAsAABUADAtAgAAAAEuAgBPACEvAgBVACEwAQBQACExAQBRACEyAQBRACEzEABWACE0EABXACE1AgBPACE2IABYACE3QABSACE4QABSACECAAAABQAgCwAAegAgAgAAAHgAIAsAAHkAIA8qAAB3ADArAAB4ABAsAAB3ADAtAgBPACEuAgBPACEvAgBVACEwAQBQACExAQBRACEyAQBRACEzEABWACE0EABXACE1AgBPACE2IABYACE3QABSACE4QABSACEPKgAAdwAwKwAAeAAQLAAAdwAwLQIATwAhLgIATwAhLwIAVQAhMAEAUAAhMQEAUQAhMgEAUQAhMxAAVgAhNBAAVwAhNQIATwAhNiAAWAAhN0AAUgAhOEAAUgAhCy0CAGAAIS4CAGAAITABAGEAITEBAGIAITIBAGIAITMQAGMAITQQAGQAITUCAGAAITYgAGUAITdAAGYAIThAAGYAIQstAgBgACEuAgBgACEwAQBhACExAQBiACEyAQBiACEzEABjACE0EABkACE1AgBgACE2IABlACE3QABmACE4QABmACELLQIAAAABLgIAAAABMAEAAAABMQEAAAABMgEAAAABMxAAAAABNBAAAAABNQIAAAABNiAAAAABN0AAAAABOEAAAAABBBAAAHAAMEsAAHEAME0AAHMAIFEAAHQAMAABRAEAAAABAwQAAH0AIEUAAFoAIFQAAH4AIAFEAQAAAAELLQIAAAABLgIAAAABMAEAAAABMQEAAAABMgEAAAABMxAAAAABNBAAAAABNQIAAAABNiAAAAABN0AAAAABOEAAAAABBi0CAAAAAS4CAAAAATABAAAAATdAAAAAAThAAAAAAUUBAAAAAQIAAAABACAQAACCAQAgAwAAAAcAIBAAAIIBACARAACGAQAgCAAAAAcAIAsAAIYBACAtAgBgACEuAgBgACEwAQBhACE3QABmACE4QABmACFFAQBiACEGLQIAYAAhLgIAYAAhMAEAYQAhN0AAZgAhOEAAZgAhRQEAYgAhAgQGAgUAAwEDCAEBBAkAAAUFAAYWAAcXAAgYAAkZAAoAAAAAAAUFAAYWAAcXAAgYAAkZAAoFBQANFgAOFwAPGAAQGQARAAAAAAAFBQANFgAOFwAPGAAQGQARBgIBBwoBCAwBCQ0BCg4BDBABDRIEDhQBDxYEEhcBExgBFBkEGhwFGx0LHB4CHR8CHiACHyECICICISQCIiYEIygCJCoEJSsCJiwCJy0EKDAMKTES"
};
async function decodeBase64AsWasm(wasmBase64) {
    const { Buffer } = await import('node:buffer');
    const wasmArray = Buffer.from(wasmBase64, 'base64');
    return new WebAssembly.Module(wasmArray);
}
config.compilerWasm = {
    getRuntime: async () => await import("@prisma/client/runtime/query_compiler_fast_bg.mysql.mjs"),
    getQueryCompilerWasmModule: async () => {
        const { wasm } = await import("@prisma/client/runtime/query_compiler_fast_bg.mysql.wasm-base64.mjs");
        return await decodeBase64AsWasm(wasm);
    },
    importName: "./query_compiler_fast_bg.js"
};
function getPrismaClientClass() {
    return runtime.getPrismaClient(config);
}
//# sourceMappingURL=class.js.map