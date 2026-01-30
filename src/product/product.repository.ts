import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, DeleteResult, Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { Product } from './product.entity';

@Injectable()
export class ProductRepository {
  private readonly productRepo: Repository<Product>;

  constructor(@InjectDataSource() dataSource: DataSource) {
    this.productRepo = dataSource.getRepository(Product);
  }

  async getProducts(): Promise<Product[]> {
    return await this.productRepo.find({ order: { created_at: 'DESC' } });
  }

  async findById(id: string): Promise<Product | null> {
    return await this.productRepo.findOne({ where: { id } });
  }

  async createProduct(createProductDto: CreateProductDto): Promise<Product> {
    const product = this.productRepo.create(createProductDto);
    return await this.productRepo.save(product);
  }

  async deleteById(id: string): Promise<DeleteResult> {
    return await this.productRepo.delete({ id });
  }
}
