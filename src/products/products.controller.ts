import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Param,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateProductRequest } from './dto/create-product.request';
import { CurrentUser } from '../auth/current-user.decorator';
import { TokenPayload } from '../auth/token-payload.interface';
import { ProductsService } from './products.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { PRODUCT_IMAGES } from './product-images';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async CreateProduct(
    @Body() body: CreateProductRequest,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.productsService.createProduct(body, user.userId);
  }

  @Post(':productId/image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: (req: Express.Request, file: Express.Multer.File, cb) => {
          const uploadPath = PRODUCT_IMAGES;
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (
          req: Express.Request & { params?: { productId?: string } },
          file: Express.Multer.File,
          cb,
        ) => {
          const id = req.params?.productId ?? Date.now().toString();
          cb(null, `${id}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  uploadProductImage(
    @Param('productId') productId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return { message: 'ok' };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getProducts(@Query('status') status?: string) {
    return this.productsService.getProducts(status);
  }

  @Get(':productId')
  @UseGuards(JwtAuthGuard)
  async getProduct(@Param('productId') productId: number) {
    return await this.productsService.getProduct(productId);
  }
}
