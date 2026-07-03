-- CreateTable
CREATE TABLE "product_types" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "specFields" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "product_specs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "product_specs_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Page" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "metaTitle" TEXT,
    "metaDesc" TEXT,
    "targetKeyword" TEXT,
    "templateSlug" TEXT NOT NULL DEFAULT 'default',
    "locale" TEXT NOT NULL DEFAULT 'en',
    "translationGroupId" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Page" ("content", "createdAt", "id", "metaDesc", "metaTitle", "published", "slug", "title", "updatedAt") SELECT "content", "createdAt", "id", "metaDesc", "metaTitle", "published", "slug", "title", "updatedAt" FROM "Page";
DROP TABLE "Page";
ALTER TABLE "new_Page" RENAME TO "Page";
CREATE UNIQUE INDEX "Page_slug_key" ON "Page"("slug");
CREATE TABLE "new_Post" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "legacyId" INTEGER,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "excerpt" TEXT NOT NULL DEFAULT '',
    "metaTitle" TEXT,
    "metaDesc" TEXT,
    "image" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "translationGroupId" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Post" ("content", "createdAt", "excerpt", "id", "image", "legacyId", "metaDesc", "metaTitle", "published", "slug", "title", "updatedAt") SELECT "content", "createdAt", "excerpt", "id", "image", "legacyId", "metaDesc", "metaTitle", "published", "slug", "title", "updatedAt" FROM "Post";
DROP TABLE "Post";
ALTER TABLE "new_Post" RENAME TO "Post";
CREATE UNIQUE INDEX "Post_slug_key" ON "Post"("slug");
CREATE TABLE "new_Product" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "legacyId" INTEGER,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "image" TEXT,
    "shape" TEXT,
    "diameter" TEXT,
    "height" TEXT,
    "width" TEXT,
    "length" TEXT,
    "depth" TEXT,
    "volume" TEXT,
    "weight" TEXT,
    "tinplate" TEXT,
    "sku" TEXT,
    "application" TEXT,
    "keywords" TEXT,
    "video" TEXT,
    "supplierId" INTEGER,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "translationGroupId" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "typeId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "product_types" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("application", "createdAt", "depth", "description", "diameter", "height", "id", "image", "keywords", "legacyId", "length", "published", "shape", "sku", "slug", "supplierId", "tinplate", "title", "updatedAt", "video", "volume", "weight", "width") SELECT "application", "createdAt", "depth", "description", "diameter", "height", "id", "image", "keywords", "legacyId", "length", "published", "shape", "sku", "slug", "supplierId", "tinplate", "title", "updatedAt", "video", "volume", "weight", "width" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");
CREATE TABLE "new_categories" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "image" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "translationGroupId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_categories" ("createdAt", "description", "id", "image", "name", "slug", "sortOrder", "updatedAt") SELECT "createdAt", "description", "id", "image", "name", "slug", "sortOrder", "updatedAt" FROM "categories";
DROP TABLE "categories";
ALTER TABLE "new_categories" RENAME TO "categories";
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "product_types_slug_key" ON "product_types"("slug");

-- CreateIndex
CREATE INDEX "product_specs_productId_idx" ON "product_specs"("productId");
