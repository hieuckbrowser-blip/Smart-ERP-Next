import { IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReportTemplateDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsString()
  querySql: string;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  parameters?: Record<string, any>;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  outputSchema?: Record<string, any>;
}

export class RunReportDto {
  @ApiProperty()
  @IsString()
  templateId: string;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  parameters?: Record<string, any>;
}
