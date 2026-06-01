import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() createProductDto: CreateProductDto) {
    return this.productService.create(user.tenant_id, createProductDto);
  }

  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.productService.findAll(user.tenant_id, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      search,
      categoryId: categoryId ? parseInt(categoryId) : undefined,
    });
  }

  @Get('search-index')
  getSearchIndex(@CurrentUser() user: any) {
    return this.productService.getSearchIndex(user.tenant_id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.productService.findOne(user.tenant_id, +id);
  }

  @Patch(':id')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productService.update(user.tenant_id, +id, updateProductDto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.productService.remove(user.tenant_id, +id);
  }
}
