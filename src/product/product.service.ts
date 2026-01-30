import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { Product } from './product.entity';
import { ProductRepository } from './product.repository';

@Injectable()
export class ProductService {
  constructor(private readonly productRepository: ProductRepository) {}

  async getProducts(): Promise<Product[]> {
    return await this.productRepository.getProducts();
  }

  async getProductById(id: string): Promise<Product> {
    const found = await this.productRepository.findById(id);
    if (!found) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }
    return found;
  }

  async createProduct(createProductDto: CreateProductDto): Promise<Product> {
    return await this.productRepository.createProduct(createProductDto);
  }

  async deleteProduct(id: string): Promise<void> {
    const result = await this.productRepository.deleteById(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }
  }
}
