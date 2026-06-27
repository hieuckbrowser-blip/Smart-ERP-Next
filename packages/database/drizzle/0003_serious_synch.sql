CREATE TABLE IF NOT EXISTS "refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" text NOT NULL,
	"user_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"revoked" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "category_id" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "products" ADD CONSTRAINT "products_category_id_product_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."product_categories"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_category_id_idx" ON "products" USING btree ("category_id");