"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _core = require("@nestjs/core");
const _appmodule = require("./app.module");
BigInt.prototype.toJSON = function() {
    return Number(this);
};
async function bootstrap() {
    const app = await _core.NestFactory.create(_appmodule.AppModule);
    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

//# sourceMappingURL=main.js.map