"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "CategoryController", {
    enumerable: true,
    get: function() {
        return CategoryController;
    }
});
const _common = require("@nestjs/common");
const _categoryservice = require("./category.service");
const _createcategorydto = require("./dto/create-category.dto");
const _updatecategorydto = require("./dto/update-category.dto");
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
let CategoryController = class CategoryController {
    create(user, createCategoryDto) {
        return this.categoryService.create(user.tenant_id, createCategoryDto);
    }
    findAll(user, page, limit) {
        return this.categoryService.findAll(user.tenant_id, {
            page: page ? parseInt(page) : undefined,
            limit: limit ? parseInt(limit) : undefined
        });
    }
    findOne(user, id) {
        return this.categoryService.findOne(user.tenant_id, +id);
    }
    update(user, id, updateCategoryDto) {
        return this.categoryService.update(user.tenant_id, +id, updateCategoryDto);
    }
    remove(user, id) {
        return this.categoryService.remove(user.tenant_id, +id);
    }
    constructor(categoryService){
        this.categoryService = categoryService;
    }
};
_ts_decorate([
    (0, _common.Post)(),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        typeof _createcategorydto.CreateCategoryDto === "undefined" ? Object : _createcategorydto.CreateCategoryDto
    ]),
    _ts_metadata("design:returntype", void 0)
], CategoryController.prototype, "create", null);
_ts_decorate([
    (0, _common.Get)(),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_param(1, (0, _common.Query)('page')),
    _ts_param(2, (0, _common.Query)('limit')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], CategoryController.prototype, "findAll", null);
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
], CategoryController.prototype, "findOne", null);
_ts_decorate([
    (0, _common.Patch)(':id'),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_param(2, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String,
        typeof _updatecategorydto.UpdateCategoryDto === "undefined" ? Object : _updatecategorydto.UpdateCategoryDto
    ]),
    _ts_metadata("design:returntype", void 0)
], CategoryController.prototype, "update", null);
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
], CategoryController.prototype, "remove", null);
CategoryController = _ts_decorate([
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard),
    (0, _common.Controller)('categories'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _categoryservice.CategoryService === "undefined" ? Object : _categoryservice.CategoryService
    ])
], CategoryController);

//# sourceMappingURL=category.controller.js.map