export interface Product {
  item_code: string;
  item_name: string;
  item_group: string;
  brand_name: string | null;
  description: string;
  standard_rate: number;
  image: string | null;
  unit_label: string;
  is_featured: boolean;
  freshness_category:
    | 'Produce'
    | 'Dairy'
    | 'Bakery'
    | 'Frozen'
    | 'Packaged'
    | 'None';
  search_keywords: string;
  in_stock: boolean;
  stock_qty: number;
  images: ProductImage[];
  nutritional_info: NutritionalInfo | null;
  sort_order: number;
}

export interface ProductImage {
  image_url: string;
  alt_text: string;
}

export interface NutritionalInfo {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
}

export interface ProductVariant {
  item_code: string;
  unit_label: string;
  rate: number;
  in_stock: boolean;
  stock_qty: number;
}

export interface ProductDetail extends Product {
  variants: ProductVariant[];
  related_items: Product[];
  web_long_description: string;
}

export interface Category {
  name: string;
  label: string;
  image: string | null;
  item_count: number;
}

export interface Banner {
  title: string;
  image: string;
  image_mobile: string | null;
  link_type: 'Category' | 'Product' | 'URL' | 'Offer';
  link_value: string;
  display_order: number;
}

export interface HomepageData {
  banners: Banner[];
  categories: Category[];
  featured_items: Product[];
  trending_items: Product[];
  fresh_arrivals: Product[];
}
