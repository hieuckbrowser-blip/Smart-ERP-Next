import { IsString, IsUUID, IsNumber, Min, IsArray, IsOptional, IsIn } from "class-validator";
export class ApprovalRequestDto {
  @IsString()
  @IsIn(["invoice", "payment", "order"])
  documentType!: string;
  @IsUUID(4)
  documentId!: string;
  @IsNumber()
  @Min(0)
  documentAmount!: number;
}
