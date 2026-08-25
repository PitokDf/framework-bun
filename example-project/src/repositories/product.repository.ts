import { BaseRepository } from "buntok";
import { db } from "../db";
import type { Product } from "../db/schemas/product";

export class ProductRepository extends BaseRepository<Product> {
  constructor() {
    super(db, "product");
  }
}