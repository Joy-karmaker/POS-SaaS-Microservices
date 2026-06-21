"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ProductController", {
    enumerable: true,
    get: function() {
        return ProductController;
    }
});
const _common = require("@nestjs/common");
const _productservice = require("./product.service");
const _createproductdto = require("./dto/create-product.dto");
const _updateproductdto = require("./dto/update-product.dto");
const _jwtauthguard = require("../auth/jwt-auth.guard");
const _currentuserdecorator = require("../auth/current-user.decorator");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
function _ts_param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}
let ProductController = class ProductController {
    create(user, createProductDto) {
        return this.productService.create(user.tenant_id, createProductDto);
    }
    findAll(user, page, limit, search, categoryId) {
        return this.productService.findAll(user.tenant_id, {
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 10,
            search,
            categoryId: categoryId ? parseInt(categoryId) : undefined
        });
    }
    getSearchIndex(user) {
        return this.productService.getSearchIndex(user.tenant_id);
    }
    findOne(user, id) {
        return this.productService.findOne(user.tenant_id, +id);
    }
    update(user, id, updateProductDto) {
        return this.productService.update(user.tenant_id, +id, updateProductDto);
    }
    remove(user, id) {
        return this.productService.remove(user.tenant_id, +id);
    }
    constructor(productService){
        this.productService = productService;
    }
};
_ts_decorate([
    (0, _common.Post)(),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        typeof _createproductdto.CreateProductDto === "undefined" ? Object : _createproductdto.CreateProductDto
    ]),
    _ts_metadata("design:returntype", void 0)
], ProductController.prototype, "create", null);
_ts_decorate([
    (0, _common.Get)(),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_param(1, (0, _common.Query)('page')),
    _ts_param(2, (0, _common.Query)('limit')),
    _ts_param(3, (0, _common.Query)('search')),
    _ts_param(4, (0, _common.Query)('categoryId')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String,
        String,
        String,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], ProductController.prototype, "findAll", null);
_ts_decorate([
    (0, _common.Get)('search-index'),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], ProductController.prototype, "getSearchIndex", null);
_ts_decorate([
    (0, _common.Get)(':id'),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], ProductController.prototype, "findOne", null);
_ts_decorate([
    (0, _common.Patch)(':id'),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_param(2, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String,
        typeof _updateproductdto.UpdateProductDto === "undefined" ? Object : _updateproductdto.UpdateProductDto
    ]),
    _ts_metadata("design:returntype", void 0)
], ProductController.prototype, "update", null);
_ts_decorate([
    (0, _common.Delete)(':id'),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], ProductController.prototype, "remove", null);
ProductController = _ts_decorate([
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard),
    (0, _common.Controller)('products'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _productservice.ProductService === "undefined" ? Object : _productservice.ProductService
    ])
], ProductController);

//# sourceMappingURL=product.controller.js.map