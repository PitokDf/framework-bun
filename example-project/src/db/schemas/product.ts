import { Entity, Column, PrimaryKey } from "buntok";

@Entity("product")
export class Product {
  @PrimaryKey()
  id: string = crypto.randomUUID();

  @Column({ type: "varchar", length: 255, nullable: true })
  name?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  email?: string;

  @Column({ type: "timestamp" })
  createdAt: Date = new Date();

  @Column({ type: "timestamp" })
  updatedAt: Date = new Date();
}

export type NewProduct = Omit<Product, "id" | "createdAt" | "updatedAt">;