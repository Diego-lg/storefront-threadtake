export interface Billboard {
  id: string;
  label: string;
  imageUrl: string;
}

export interface Category {
  id: string;
  name: string;
  billboard: Billboard;
}

export interface Product {
  id: string;
  category: Category;
  name: string;
  price: string;
  isFeatured: boolean;
  size: Size;
  color: Color;
  images: Image[];
}

export interface Image {
  id: string;
  url: string;
}
export interface Size {
  id: string;
  name: string;
  value: string;
}

// Define UserRole enum locally as Prisma client is not in this project
export enum UserRole {
  ADMIN = "ADMIN",
  USER = "USER",
}

export interface Color {
  id: string;
  name: string;
  value: string;
}
