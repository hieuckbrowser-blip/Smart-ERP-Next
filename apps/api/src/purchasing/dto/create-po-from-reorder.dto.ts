import { IsArray, IsOptional, IsUUID, ValidateNested, IsInt, IsPositive, IsDateString, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePoFromReorderItemDto {
  @IsUUID()
  productId: string;

  @IsInt()
  @IsPositive()
  quantity: number;
}

export class CreatePoFromReorderDto {
  @IsUUID()
  supplierId: string;

  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @IsOptional()
  @IsDateString()
  expectedDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePoFromReorderItemDto)
  items: CreatePoFromReorderItemDto[];
}