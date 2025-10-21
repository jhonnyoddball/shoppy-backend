import { Injectable, NotFoundException } from '@nestjs/common';
import { promises as fs } from 'fs';
import { CreateProductRequest } from './dto/create-product.request';
import { PrismaService } from '../prisma/prisma.service';
import { join } from 'path';
import { PRODUCT_IMAGES } from './product-images';
import { Prisma } from '@prisma/client/wasm';
import { ProductsGateway } from './products.gateway';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly productsGateway: ProductsGateway,
  ) {}

  async createProduct(data: CreateProductRequest, userId: number) {
    const product = await this.prismaService.product.create({
      data: {
        ...data,
        description: data.description ?? '',
        userId,
      },
    });
    this.productsGateway.handleProductUpdated();
    return product;
  }

  async getProducts(status?: string) {
    const args: Prisma.ProductFindManyArgs = {};
    if (status === 'available') {
      args.where = { sold: false } as unknown as Prisma.ProductWhereInput;
    }
    const products = await this.prismaService.product.findMany(args);
    return Promise.all(
      products.map(async (product) => ({
        ...product,
        imageExists: await this.imageExists(product.id),
      })),
    );
  }

  async getProduct(productId: number) {
    try {
      const product = await this.prismaService.product.findFirstOrThrow({
        where: { id: Number(productId) },
      });
      console.log(product);
      return {
        ...product,
        imageExists: await this.imageExists(product.id),
      };
    } catch (error) {
      console.log(error);
      throw new NotFoundException('Product not found with ID ' + productId);
    }
  }

  async update(
    productId: number,
    data: Partial<CreateProductRequest> & { sold?: boolean },
  ) {
    const updatedProduct = await this.prismaService.product.update({
      where: { id: Number(productId) },
      data: {
        ...data,
      },
    });
    this.productsGateway.handleProductUpdated();
    return updatedProduct;
  }

  private async imageExists(productId: number) {
    try {
      await fs.access(
        join(`${PRODUCT_IMAGES}/${productId}.jpg`),
        fs.constants.F_OK,
      );
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }
}
