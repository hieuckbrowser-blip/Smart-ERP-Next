import { IsString, IsOptional, IsNumber, Min, IsEmail } from 'class-validator';

export class UpdateEmployeeDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  position?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  salary?: number;
}
