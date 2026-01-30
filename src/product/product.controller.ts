import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { Product } from './product.entity';
import { ProductService } from './product.service';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  getProducts(): Promise<Product[]> {
    return this.productService.getProducts();
  }

  @Get('/:id')
  getProductById(@Param('id') id: string): Promise<Product> {
    return this.productService.getProductById(id);
  }

  @Post()
  createProduct(@Body() createProductDto: CreateProductDto): Promise<Product> {
    return this.productService.createProduct(createProductDto);
  }

  @Delete('/:id')
  deleteProduct(@Param('id') id: string): Promise<void> {
    return this.productService.deleteProduct(id);
  }
}
